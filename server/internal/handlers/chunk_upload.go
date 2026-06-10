package handlers

import (
	"context"
	"database/sql"
	"fmt"
	"io"
	"log"
	"math"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/BBSHSH/HideMe/server/internal/auth"
	"github.com/BBSHSH/HideMe/server/internal/db"
	"github.com/BBSHSH/HideMe/server/internal/middleware"
	"github.com/BBSHSH/HideMe/server/internal/progress"
	"github.com/BBSHSH/HideMe/server/internal/storage"
	"github.com/gin-gonic/gin"
)

// チャンクの一時保存ディレクトリ
func chunkTmpDir(uploadID string) string {
	return filepath.Join(os.TempDir(), "hideme_chunk_"+uploadID)
}

// UploadChunk はチャンクを受信して一時ファイルに保存する
// POST /v1/collections/:id/chunk
// Header: X-Upload-ID, X-Chunk-Index, X-Total-Chunks, X-File-Name
func UploadChunk() gin.HandlerFunc {
	return func(c *gin.Context) {
		uploadID := c.GetHeader("X-Upload-ID")
		chunkIndexStr := c.GetHeader("X-Chunk-Index")
		totalChunksStr := c.GetHeader("X-Total-Chunks")
		fileName := c.GetHeader("X-File-Name")

		if uploadID == "" || chunkIndexStr == "" || totalChunksStr == "" || fileName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing_headers"})
			return
		}

		chunkIndex, err := strconv.Atoi(chunkIndexStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_chunk_index"})
			return
		}

		// チャンク保存ディレクトリ作成
		dir := chunkTmpDir(uploadID)
		if err := os.MkdirAll(dir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_create_tmp_dir"})
			return
		}

		// チャンクデータを保存
		chunkPath := filepath.Join(dir, fmt.Sprintf("chunk_%05d", chunkIndex))
		f, err := os.Create(chunkPath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_create_chunk"})
			return
		}
		defer f.Close()

		if _, err := io.Copy(f, c.Request.Body); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_write_chunk"})
			return
		}

		log.Printf("[CHUNK] received chunk %d/%s for %s (%s)", chunkIndex+1, totalChunksStr, fileName, uploadID)
		c.JSON(http.StatusOK, gin.H{"chunk": chunkIndex, "received": true})
	}
}

// MergeAndUpload はチャンクを結合して通常のアップロード処理に渡す
// POST /v1/collections/:id/merge
func MergeAndUpload(store storage.Storage, database *sql.DB, storageType string) gin.HandlerFunc {
	return func(c *gin.Context) {
		uploadID := c.GetHeader("X-Upload-ID")
		totalChunksStr := c.GetHeader("X-Total-Chunks")
		fileName := c.GetHeader("X-File-Name")

		if uploadID == "" || totalChunksStr == "" || fileName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing_headers"})
			return
		}

		totalChunks, err := strconv.Atoi(totalChunksStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_total_chunks"})
			return
		}

		// チャンクを結合して一時ファイルに書き出す
		dir := chunkTmpDir(uploadID)

		mergedPath := filepath.Join(os.TempDir(), "hideme_merged_"+uploadID+filepath.Ext(fileName))

		out, err := os.Create(mergedPath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_create_merged"})
			return
		}

		for i := 0; i < totalChunks; i++ {
			chunkPath := filepath.Join(dir, fmt.Sprintf("chunk_%05d", i))
			chunk, err := os.Open(chunkPath)
			if err != nil {
				out.Close()
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("chunk_%d_missing", i)})
				return
			}
			if _, err := io.Copy(out, chunk); err != nil {
				chunk.Close()
				out.Close()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_merge_chunks"})
				return
			}
			chunk.Close()
		}
		out.Close()

		log.Printf("[CHUNK] merged %d chunks → %s", totalChunks, fileName)

		// パラメータをコピーしてゴルーチンに渡す
		collectionID := c.Param("id")
		trimStart, _ := strconv.ParseFloat(c.GetHeader("X-Trim-Start"), 64)
		trimEnd, _ := strconv.ParseFloat(c.GetHeader("X-Trim-End"), 64)
		volumeVal, _ := strconv.Atoi(c.GetHeader("X-Volume"))
		if volumeVal == 0 {
			volumeVal = 100
		}
		resolution := c.GetHeader("X-Resolution")
		if resolution == "" {
			resolution = "720p"
		}
		fpsVal, _ := strconv.Atoi(c.GetHeader("X-FPS"))
		if fpsVal == 0 {
			fpsVal = 30
		}

		// 認証情報を取得
		claims, _ := c.Get(middleware.ClaimsKey)
		userID := ""
		if claims != nil {
			userID = claims.(*auth.Claims).UserID
		}

		// 即座に 202 Accepted を返してバックグラウンドで処理
		c.JSON(http.StatusAccepted, gin.H{"status": "processing", "upload_id": uploadID})

		// クライアント側でエンコード済みの場合はFFmpegをスキップ
		skipEncode := c.GetHeader("X-Skip-Encode") == "true"

		// バックグラウンドでエンコード・NAS転送
		go func() {
			defer os.RemoveAll(dir)
			defer os.Remove(mergedPath)

			if isVideoFilename(fileName) && !skipEncode {
				processVideoBackground(store, database, storageType, uploadID, collectionID, userID, fileName, mergedPath, trimStart, trimEnd, volumeVal, resolution, fpsVal)
			} else {
				uploadNonVideoBackground(store, database, storageType, uploadID, collectionID, userID, fileName, mergedPath)
			}
		}()
	}
}

// processVideoBackground はバックグラウンドで動画エンコード・NAS転送を行う
func processVideoBackground(store storage.Storage, database *sql.DB, storageType, uploadID, collectionID, userID, fileName, inputPath string, trimStart, trimEnd float64, volumeVal int, resolution string, fpsVal int) {
	tmpOut := filepath.Join(os.TempDir(), "hideme_out_"+uploadID+".mp4")
	defer os.Remove(tmpOut)

	totalSec, _ := getVideoDuration(inputPath)
	if trimEnd > 0.01 && trimEnd > trimStart {
		totalSec = trimEnd - trimStart
	}

	height := resolutionHeight(resolution)
	ffArgs := buildFFmpegArgs(inputPath, tmpOut, trimStart, trimEnd, volumeVal, height, fpsVal)
	log.Printf("[FFMPEG/BG] start: %s -> %s", fileName, resolution)

	if err := runFFmpeg(ffArgs, totalSec, func(pct float64) {
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseFFmpeg, Percent: pct})
	}); err != nil {
		log.Printf("[FFMPEG/BG] error: %v", err)
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "encoding_failed"})
		return
	}
	progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseFFmpeg, Percent: 100})

	outFile, err := os.Open(tmpOut)
	if err != nil {
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "failed_to_open_output"})
		return
	}
	defer outFile.Close()

	outInfo, _ := outFile.Stat()
	outFileName := strings.TrimSuffix(fileName, filepath.Ext(fileName)) + ".mp4"

	item, err := store.UploadWithProgress(
		context.Background(),
		outFileName,
		outFile,
		outInfo.Size(),
		func(loaded, total int64) {
			if total > 0 {
				progress.Global.Send(uploadID, progress.Event{
					Phase:   progress.PhaseNAS,
					Percent: math.Min(float64(loaded)/float64(total)*100, 99),
				})
			}
		},
	)
	if err != nil {
		log.Printf("[NAS/BG] error: %v", err)
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "nas_failed"})
		return
	}

	cf, err := db.AddFileToCollection(database, collectionID, item.Name, "", storageType, item.Size, userID)
	if err != nil {
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "db_failed"})
		return
	}

	progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseDone, FileID: cf.ID})
	log.Printf("[UPLOAD/BG] done: id=%s size=%dMB", cf.ID, outInfo.Size()/1024/1024)
}

// uploadNonVideoBackground はバックグラウンドで非動画ファイルをNASに転送する
func uploadNonVideoBackground(store storage.Storage, database *sql.DB, storageType, uploadID, collectionID, userID, fileName, filePath string) {
	progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseNAS, Percent: 0})

	f, err := os.Open(filePath)
	if err != nil {
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "failed_to_open_file"})
		return
	}
	defer f.Close()

	info, _ := f.Stat()
	item, err := store.Upload(context.Background(), fileName, f, info.Size())
	if err != nil {
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "nas_failed"})
		return
	}

	cf, err := db.AddFileToCollection(database, collectionID, item.Name, "", storageType, item.Size, userID)
	if err != nil {
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "db_failed"})
		return
	}

	progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseDone, FileID: cf.ID})
}

// uploadToCollectionWithFile は既に開いているファイルを使ってアップロード処理を行う
func uploadToCollectionWithFile(c *gin.Context, store storage.Storage, database *sql.DB, storageType string, fh *multipart.FileHeader, r io.Reader) {
	collectionID := c.Param("id")

	// FormFile の代わりに直接セット
	c.Request.Form = map[string][]string{
		"trim_start": {c.GetHeader("X-Trim-Start")},
		"trim_end":   {c.GetHeader("X-Trim-End")},
		"volume":     {c.GetHeader("X-Volume")},
		"resolution": {c.GetHeader("X-Resolution")},
		"fps":        {c.GetHeader("X-FPS")},
	}
	_ = collectionID

	// multipart.FileHeader の Open をオーバーライドできないため
	// 一時ファイルパスを gin コンテキスト経由で渡し、
	// UploadToCollection ハンドラが読み取れるようにする
	// 実際には uploadNonVideo / encodeVideo を直接呼ぶ
	if isVideoFilename(fh.Filename) {
		uploadID := c.GetHeader("X-Upload-ID")
		trimStart, _ := strconv.ParseFloat(c.GetHeader("X-Trim-Start"), 64)
		trimEnd, _ := strconv.ParseFloat(c.GetHeader("X-Trim-End"), 64)
		volumeVal, _ := strconv.Atoi(c.GetHeader("X-Volume"))
		if volumeVal == 0 {
			volumeVal = 100
		}
		resolution := c.GetHeader("X-Resolution")
		if resolution == "" {
			resolution = "720p"
		}
		fpsVal, _ := strconv.Atoi(c.GetHeader("X-FPS"))
		if fpsVal == 0 {
			fpsVal = 30
		}

		// 入力ファイルパス（マージ済み）
		tmpIn, _ := c.Get("_chunk_file_path")
		tmpInStr := tmpIn.(string)

		processVideoFromPath(c, store, database, storageType, uploadID, fh.Filename, tmpInStr, trimStart, trimEnd, volumeVal, resolution, fpsVal)
	} else {
		uploadID := c.GetHeader("X-Upload-ID")
		uploadNonVideoFromReader(c, store, database, c.Param("id"), storageType, uploadID, fh, r)
	}
}
