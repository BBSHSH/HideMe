package handlers

import (
	"bufio"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"mime/multipart"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/BBSHSH/HideMe/server/internal/auth"
	"github.com/BBSHSH/HideMe/server/internal/db"
	"github.com/BBSHSH/HideMe/server/internal/middleware"
	"github.com/BBSHSH/HideMe/server/internal/progress"
	"github.com/BBSHSH/HideMe/server/internal/storage"
	"github.com/gin-gonic/gin"
)

func ffmpegPath() string {
	if p := os.Getenv("FFMPEG_PATH"); p != "" {
		return p
	}
	return "ffmpeg"
}

func resolutionHeight(s string) int {
	switch s {
	case "1080p":
		return 1080
	case "480p":
		return 480
	case "240p":
		return 240
	default:
		return 720
	}
}

// crfForHeight は H.264 の CRF 値を返す (0=最高品質, 51=最高圧縮)
func crfForHeight(height int) int {
	switch {
	case height >= 1080:
		return 20
	case height >= 720:
		return 22
	case height >= 480:
		return 24
	default:
		return 26
	}
}

func getVideoDuration(path string) (float64, error) {
	ffprobePath := strings.Replace(ffmpegPath(), "ffmpeg", "ffprobe", 1)
	out, err := exec.Command(ffprobePath,
		"-v", "error",
		"-show_entries", "format=duration",
		"-of", "default=noprint_wrappers=1:nokey=1",
		path,
	).Output()
	if err != nil {
		return 0, err
	}
	return strconv.ParseFloat(strings.TrimSpace(string(out)), 64)
}

var reOutTime = regexp.MustCompile(`out_time_ms=(\d+)`)

func runFFmpeg(args []string, totalSec float64, onProgress func(float64)) error {
	allArgs := append([]string{"-progress", "pipe:2", "-nostats"}, args...)
	cmd := exec.Command(ffmpegPath(), allArgs...)
	cmd.Stdout = io.Discard

	stderr, err := cmd.StderrPipe()
	if err != nil {
		return err
	}
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("ffmpeg start: %w", err)
	}

	scanner := bufio.NewScanner(stderr)
	for scanner.Scan() {
		line := scanner.Text()
		if m := reOutTime.FindStringSubmatch(line); len(m) == 2 {
			ms, _ := strconv.ParseFloat(m[1], 64)
			if totalSec > 0 && onProgress != nil {
				pct := math.Min((ms/1e6)/totalSec*100, 99)
				onProgress(pct)
			}
		}
	}

	return cmd.Wait()
}

// buildFFmpegArgs — H.265 (libx265) エンコード引数
// アスペクト比保持: scale=-2:N で幅を偶数に自動調整
func buildFFmpegArgs(input, output string, trimStart, trimEnd float64, volume, height, fps int) []string {
	args := []string{"-y"}

	// -ss を -i の前に置くことでキーフレームへの高速シーク
	if trimStart > 0.01 {
		args = append(args, "-ss", fmt.Sprintf("%.3f", trimStart))
	}
	args = append(args, "-i", input)
	if trimEnd > 0.01 && trimEnd > trimStart {
		args = append(args, "-t", fmt.Sprintf("%.3f", trimEnd-trimStart))
	}

	args = append(args,
		"-vf", fmt.Sprintf("scale=-2:%d", height),
		"-r", strconv.Itoa(fps),
		"-af", fmt.Sprintf("volume=%.2f", float64(volume)/100.0),
		"-c:v", "libx264",
		"-crf", strconv.Itoa(crfForHeight(height)),
		"-preset", "fast",
		"-profile:v", "high",
		"-avoid_negative_ts", "make_zero",
		"-movflags", "+faststart",
		"-c:a", "aac",
		"-b:a", "128k",
		output,
	)
	return args
}

// SSEUploadProgress — アップロード進捗を SSE でストリーミング
func SSEUploadProgress() gin.HandlerFunc {
	return func(c *gin.Context) {
		uploadID := c.Param("uploadId")
		ch := progress.Global.Register(uploadID)
		defer progress.Global.Close(uploadID)

		c.Header("Content-Type", "text/event-stream")
		c.Header("Cache-Control", "no-cache")
		c.Header("Connection", "keep-alive")
		c.Header("X-Accel-Buffering", "no")

		notify := c.Request.Context().Done()
		for {
			select {
			case <-notify:
				return
			case ev, ok := <-ch:
				if !ok {
					return
				}
				data, _ := json.Marshal(ev)
				fmt.Fprintf(c.Writer, "data: %s\n\n", data)
				c.Writer.Flush()
				if ev.Phase == progress.PhaseDone || ev.Phase == progress.PhaseError {
					return
				}
			case <-time.After(25 * time.Second):
				fmt.Fprint(c.Writer, ": ping\n\n")
				c.Writer.Flush()
			}
		}
	}
}

func ListCollectionFiles(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		collectionID := c.Param("id")
		files, err := db.ListFilesByCollectionWithUploader(database, collectionID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_list_files"})
			return
		}
		if files == nil {
			files = []db.CollectionFileWithUploader{}
		}
		c.JSON(http.StatusOK, gin.H{"items": files})
	}
}

// isVideoFilename はファイル名が動画拡張子かどうかを判定する
func isVideoFilename(name string) bool {
	lower := strings.ToLower(name)
	for _, ext := range []string{".mp4", ".webm", ".mov", ".mkv", ".avi", ".flv", ".wmv"} {
		if strings.HasSuffix(lower, ext) {
			return true
		}
	}
	return false
}

// uploadNonVideo は非動画ファイルをエンコードせずそのままストレージに保存する
func uploadNonVideo(c *gin.Context, store storage.Storage, database *sql.DB, collectionID, storageType, userID string, file *multipart.FileHeader) {
	uploadID := c.GetHeader("X-Upload-ID")

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_open_file"})
		return
	}
	defer src.Close()

	// NAS 転送開始を SSE で通知
	if uploadID != "" {
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseNAS, Percent: 0})
	}

	item, err := store.Upload(c.Request.Context(), file.Filename, src, file.Size)
	if err != nil {
		if errors.Is(err, storage.ErrFileTooLarge) {
			if uploadID != "" {
				progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "file_too_large"})
			}
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "file_too_large"})
			return
		}
		log.Printf("[UPLOAD] non-video upload error: %v", err)
		if uploadID != "" {
			progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "nas_failed"})
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_save_file"})
		return
	}

	// サムネイル処理
	thumbnailName := ""
	if thumb, err := c.FormFile("thumbnail"); err == nil {
		if ts, err := thumb.Open(); err == nil {
			defer ts.Close()
			thumbPath := "thumbnails/" + filepath.Base(thumb.Filename)
			if _, err := store.Upload(c.Request.Context(), thumbPath, ts, thumb.Size); err == nil {
				thumbnailName = thumbPath
			}
		}
	}

	cf, err := db.AddFileToCollection(database, collectionID, item.Name, thumbnailName, storageType, item.Size, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_record_file"})
		return
	}

	// NAS 転送完了 + done を SSE で通知
	if uploadID != "" {
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseNAS, Percent: 100})
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseDone, FileID: cf.ID})
	}

	c.JSON(http.StatusCreated, cf)
}

func UploadToCollection(store storage.Storage, database *sql.DB, storageType string) gin.HandlerFunc {
	return func(c *gin.Context) {
		collectionID := c.Param("id")
		uploadID := c.GetHeader("X-Upload-ID")

		if _, err := db.GetCollectionByID(database, collectionID); err != nil {
			if errors.Is(err, db.ErrCollectionNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "collection_not_found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_collection"})
			return
		}

		claims, ok := c.Get(middleware.ClaimsKey)
		userID := ""
		if ok && claims != nil {
			userID = claims.(*auth.Claims).UserID
		}

		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "file_required"})
			return
		}

		// 非動画ファイルは ffmpeg をスキップして直接保存
		if !isVideoFilename(file.Filename) {
			uploadNonVideo(c, store, database, collectionID, storageType, userID, file)
			return
		}

		// エンコード設定
		trimStart, _ := strconv.ParseFloat(c.PostForm("trim_start"), 64)
		trimEnd, _ := strconv.ParseFloat(c.PostForm("trim_end"), 64)
		volumeVal, _ := strconv.Atoi(c.PostForm("volume"))
		if volumeVal == 0 {
			volumeVal = 100
		}
		resolution := c.PostForm("resolution")
		if resolution == "" {
			resolution = "720p"
		}
		fpsVal, _ := strconv.Atoi(c.PostForm("fps"))
		if fpsVal == 0 {
			fpsVal = 30
		}

		// サムネイル — thumbnails/ フォルダに保存（統計から除外される）
		thumbnailName := ""
		if thumb, err := c.FormFile("thumbnail"); err == nil {
			if src, err := thumb.Open(); err == nil {
				defer src.Close()
				thumbStorePath := "thumbnails/" + filepath.Base(thumb.Filename)
				if _, err := store.Upload(c.Request.Context(), thumbStorePath, src, thumb.Size); err == nil {
					thumbnailName = thumbStorePath // パスをそのまま保存
				} else {
					log.Printf("[UPLOAD] thumbnail upload failed: %v", err)
				}
			}
		}

		// 一時ファイルに保存
		tmpDir := os.TempDir()
		tmpIn := filepath.Join(tmpDir, "hideme_in_"+uploadID+filepath.Ext(file.Filename))
		defer os.Remove(tmpIn)

		src, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_open_file"})
			return
		}
		defer src.Close()

		dst, err := os.Create(tmpIn)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_create_tmp"})
			return
		}
		if _, err = io.Copy(dst, src); err != nil {
			dst.Close()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_save_tmp"})
			return
		}
		dst.Close()

		// ffmpeg で AV1 エンコード
		tmpOut := filepath.Join(tmpDir, "hideme_out_"+uploadID+".mp4")
		defer os.Remove(tmpOut)

		totalSec, _ := getVideoDuration(tmpIn)
		if trimEnd > 0.01 && trimEnd > trimStart {
			totalSec = trimEnd - trimStart
		}

		height := resolutionHeight(resolution)
		ffArgs := buildFFmpegArgs(tmpIn, tmpOut, trimStart, trimEnd, volumeVal, height, fpsVal)
		log.Printf("[FFMPEG] start: %s -> AV1 %s crf=%d", file.Filename, resolution, crfForHeight(height))

		if err := runFFmpeg(ffArgs, totalSec, func(pct float64) {
			if uploadID != "" {
				progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseFFmpeg, Percent: pct})
			}
		}); err != nil {
			log.Printf("[FFMPEG] error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "encoding_failed", "detail": err.Error()})
			if uploadID != "" {
				progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "encoding_failed"})
			}
			return
		}

		if uploadID != "" {
			progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseFFmpeg, Percent: 100})
		}

		outFile, err := os.Open(tmpOut)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_open_output"})
			return
		}
		defer outFile.Close()

		outInfo, _ := outFile.Stat()
		outFileName := strings.TrimSuffix(file.Filename, filepath.Ext(file.Filename)) + ".mp4"

		item, err := store.UploadWithProgress(
			c.Request.Context(),
			outFileName,
			outFile,
			outInfo.Size(),
			func(loaded, total int64) {
				if uploadID != "" && total > 0 {
					progress.Global.Send(uploadID, progress.Event{
						Phase:   progress.PhaseNAS,
						Percent: math.Min(float64(loaded)/float64(total)*100, 99),
					})
				}
			},
		)
		if err != nil {
			if errors.Is(err, storage.ErrFileTooLarge) {
				c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "file_too_large"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_save_file"})
			}
			if uploadID != "" {
				progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "nas_failed"})
			}
			return
		}

		cf, err := db.AddFileToCollection(database, collectionID, item.Name, thumbnailName, storageType, item.Size, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_record_file"})
			return
		}

		if uploadID != "" {
			progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseDone, FileID: cf.ID})
		}

		log.Printf("[UPLOAD] done: id=%s size=%dMB->%dMB", cf.ID, file.Size/1024/1024, outInfo.Size()/1024/1024)
		c.JSON(http.StatusOK, cf)
	}
}

// processVideoFromPath は指定パスの動画ファイルをエンコードしてストレージに保存する（チャンクアップロード用）
func processVideoFromPath(c *gin.Context, store storage.Storage, database *sql.DB, storageType, uploadID, fileName, inputPath string, trimStart, trimEnd float64, volumeVal int, resolution string, fpsVal int) {
	collectionID := c.Param("id")

	claims, _ := c.Get(middleware.ClaimsKey)
	userID := ""
	if claims != nil {
		userID = claims.(*auth.Claims).UserID
	}

	tmpOut := filepath.Join(os.TempDir(), "hideme_out_"+uploadID+".mp4")
	defer os.Remove(tmpOut)

	totalSec, _ := getVideoDuration(inputPath)
	if trimEnd > 0.01 && trimEnd > trimStart {
		totalSec = trimEnd - trimStart
	}

	height := resolutionHeight(resolution)
	ffArgs := buildFFmpegArgs(inputPath, tmpOut, trimStart, trimEnd, volumeVal, height, fpsVal)
	log.Printf("[FFMPEG/CHUNK] start: %s -> %s crf=%d", fileName, resolution, crfForHeight(height))

	if err := runFFmpeg(ffArgs, totalSec, func(pct float64) {
		if uploadID != "" {
			progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseFFmpeg, Percent: pct})
		}
	}); err != nil {
		log.Printf("[FFMPEG/CHUNK] error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "encoding_failed", "detail": err.Error()})
		if uploadID != "" {
			progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "encoding_failed"})
		}
		return
	}

	if uploadID != "" {
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseFFmpeg, Percent: 100})
	}

	outFile, err := os.Open(tmpOut)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_open_output"})
		return
	}
	defer outFile.Close()

	outInfo, _ := outFile.Stat()
	outFileName := strings.TrimSuffix(fileName, filepath.Ext(fileName)) + ".mp4"

	item, err := store.UploadWithProgress(
		c.Request.Context(),
		outFileName,
		outFile,
		outInfo.Size(),
		func(loaded, total int64) {
			if uploadID != "" && total > 0 {
				progress.Global.Send(uploadID, progress.Event{
					Phase:   progress.PhaseNAS,
					Percent: math.Min(float64(loaded)/float64(total)*100, 99),
				})
			}
		},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_save_file"})
		if uploadID != "" {
			progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "nas_failed"})
		}
		return
	}

	cf, err := db.AddFileToCollection(database, collectionID, item.Name, "", storageType, item.Size, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_record_file"})
		return
	}

	if uploadID != "" {
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseDone, FileID: cf.ID})
	}

	log.Printf("[UPLOAD/CHUNK] done: id=%s size=%dMB", cf.ID, outInfo.Size()/1024/1024)
	c.JSON(http.StatusOK, cf)
}

// uploadNonVideoFromReader は io.Reader から非動画ファイルをアップロードする（チャンクアップロード用）
func uploadNonVideoFromReader(c *gin.Context, store storage.Storage, database *sql.DB, collectionID, storageType, uploadID string, fh *multipart.FileHeader, r io.Reader) {
	claims, _ := c.Get(middleware.ClaimsKey)
	userID := ""
	if claims != nil {
		userID = claims.(*auth.Claims).UserID
	}

	if uploadID != "" {
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseNAS, Percent: 0})
	}

	item, err := store.Upload(c.Request.Context(), fh.Filename, r, fh.Size)
	if err != nil {
		log.Printf("[UPLOAD/CHUNK] non-video error: %v", err)
		if uploadID != "" {
			progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "nas_failed"})
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_save_file"})
		return
	}

	cf, err := db.AddFileToCollection(database, collectionID, item.Name, "", storageType, item.Size, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_record_file"})
		return
	}

	if uploadID != "" {
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseNAS, Percent: 100})
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseDone, FileID: cf.ID})
	}

	c.JSON(http.StatusCreated, cf)
}

func DeleteCollectionFile(database *sql.DB, storeFor StoreSelector) gin.HandlerFunc {
	return func(c *gin.Context) {
		fileID := c.Param("fileID")

		cf, err := db.GetFileByID(database, fileID)
		if err != nil {
			if errors.Is(err, db.ErrFileNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "file_not_found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_file"})
			return
		}

		// アップロード者本人 または admin のみ削除可能
		// uploaded_by が空のレコード（旧データ）は admin のみ削除可能
		claims, ok := c.Get(middleware.ClaimsKey)
		if !ok || claims == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		cl := claims.(*auth.Claims)
		if cl.Role != "admin" {
			if cf.UploadedBy == "" || cl.UserID != cf.UploadedBy {
				c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
				return
			}
		}

		if err := db.DeleteFileFromCollection(database, fileID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_delete_file"})
			return
		}

		// ファイルに記録されたストレージで削除
		store := storeFor(cf.StorageType)
		if err := store.Delete(c.Request.Context(), cf.FileName); err != nil && !errors.Is(err, storage.ErrNotFound) {
			log.Printf("[WARN] delete file (%s): %v", cf.StorageType, err)
		}
		if cf.ThumbnailName != "" {
			if err := store.Delete(c.Request.Context(), cf.ThumbnailName); err != nil && !errors.Is(err, storage.ErrNotFound) {
				log.Printf("[WARN] delete thumbnail (%s): %v", cf.StorageType, err)
			}
		}

		c.JSON(http.StatusOK, gin.H{"deleted": true})
	}
}
