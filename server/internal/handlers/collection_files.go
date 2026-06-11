package handlers

import (
	"context"
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
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/BBSHSH/HideMe/server/internal/auth"
	"github.com/BBSHSH/HideMe/server/internal/db"
	"github.com/BBSHSH/HideMe/server/internal/middleware"
	"github.com/BBSHSH/HideMe/server/internal/progress"
	"github.com/BBSHSH/HideMe/server/internal/service"
	"github.com/BBSHSH/HideMe/server/internal/storage"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// SSEUploadProgress streams upload progress via Server-Sent Events.
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

// PollUploadProgress returns upload progress for polling clients.
// GET /v1/upload-status/:uploadId
func PollUploadProgress() gin.HandlerFunc {
	return func(c *gin.Context) {
		uploadID := c.Param("uploadId")
		ev, ok := progress.Global.Latest(uploadID)
		if !ok {
			c.JSON(http.StatusOK, gin.H{"phase": "waiting"})
			return
		}
		if ev.Phase == progress.PhaseDone || ev.Phase == progress.PhaseError {
			progress.Global.CleanLatest(uploadID)
		}
		c.JSON(http.StatusOK, ev)
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

// uploadNonVideo saves a non-video file directly to storage without encoding.
func uploadNonVideo(c *gin.Context, store storage.Storage, database *sql.DB, collectionID, storageType, userID string, file *multipart.FileHeader) {
	uploadID := c.GetHeader("X-Upload-ID")

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_open_file"})
		return
	}
	defer src.Close()

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

		if !service.IsVideoFilename(file.Filename) {
			uploadNonVideo(c, store, database, collectionID, storageType, userID, file)
			return
		}

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

		tmpIn := filepath.Join(os.TempDir(), "hideme_in_"+uploadID+filepath.Ext(file.Filename))
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
			os.Remove(tmpIn)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_save_tmp"})
			return
		}
		dst.Close()

		c.JSON(http.StatusAccepted, gin.H{"upload_id": uploadID, "status": "processing"})

		go service.ProcessVideoBackground(store, database, storageType, uploadID, collectionID, userID, file.Filename, tmpIn, trimStart, trimEnd, volumeVal, resolution, fpsVal)
	}
}

// processVideoFromPath encodes a video from disk path and uploads it (used by chunk upload).
func processVideoFromPath(c *gin.Context, store storage.Storage, database *sql.DB, storageType, uploadID, fileName, inputPath string, trimStart, trimEnd float64, volumeVal int, resolution string, fpsVal int) {
	collectionID := c.Param("id")

	claims, _ := c.Get(middleware.ClaimsKey)
	userID := ""
	if claims != nil {
		userID = claims.(*auth.Claims).UserID
	}

	tmpOut := filepath.Join(os.TempDir(), "hideme_out_"+uploadID+".mp4")
	defer os.Remove(tmpOut)

	totalSec, _ := service.GetVideoDuration(inputPath)
	if trimEnd > 0.01 && trimEnd > trimStart {
		totalSec = trimEnd - trimStart
	}

	height := service.ResolutionHeight(resolution)
	ffArgs := service.BuildFFmpegArgs(inputPath, tmpOut, trimStart, trimEnd, volumeVal, height, fpsVal)
	log.Printf("[FFMPEG/CHUNK] start: %s -> %s crf=%d", fileName, resolution, service.CRFForHeight(height))

	if err := service.RunFFmpeg(ffArgs, totalSec, func(pct float64) {
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
		context.Background(),
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

// uploadNonVideoFromReader uploads a non-video from an io.Reader (used by chunk upload).
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

// PatchCollectionFile updates file metadata (display name, thumbnail, collection).
func PatchCollectionFile(database *sql.DB, storeFor StoreSelector, storageType string) gin.HandlerFunc {
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

		claims, ok := c.Get(middleware.ClaimsKey)
		if !ok || claims == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		cl := claims.(*auth.Claims)
		if cl.Role != "admin" && (cf.UploadedBy == "" || cl.UserID != cf.UploadedBy) {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}

		displayName := c.PostForm("display_name")
		newCollectionID := c.PostForm("collection_id")
		if newCollectionID == "" {
			newCollectionID = cf.CollectionID
		}
		thumbnailName := cf.ThumbnailName
		newUploadedBy := ""
		if cl.Role == "admin" {
			newUploadedBy = c.PostForm("uploaded_by")
		}

		if thumbFile, err := c.FormFile("thumbnail"); err == nil {
			ts, err := thumbFile.Open()
			if err == nil {
				defer ts.Close()
				store := storeFor(storageType)
				thumbPath := "thumbnails/" + uuid.NewString() + filepath.Ext(thumbFile.Filename)
				if _, err := store.Upload(c.Request.Context(), thumbPath, ts, thumbFile.Size); err == nil {
					if cf.ThumbnailName != "" {
						_ = store.Delete(c.Request.Context(), cf.ThumbnailName)
					}
					thumbnailName = thumbPath
				}
			}
		}

		if err := db.UpdateCollectionFile(database, fileID, displayName, thumbnailName, newCollectionID, newUploadedBy); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_update"})
			return
		}
		go service.BroadcastActivity(database, "edit", cl.UserID, cl.Username, cl.AvatarURL, cf.FileName)
		c.JSON(http.StatusOK, gin.H{"updated": true})
	}
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

		claims, ok := c.Get(middleware.ClaimsKey)
		if !ok || claims == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		cl := claims.(*auth.Claims)
		log.Printf("[DELETE] fileID=%s role=%s userID=%s uploadedBy=%s", fileID, cl.Role, cl.UserID, cf.UploadedBy)
		if cl.Role != "admin" {
			if cf.UploadedBy == "" || cl.UserID != cf.UploadedBy {
				c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
				return
			}
		}

		if err := db.DeleteFileFromCollection(database, fileID); err != nil {
			log.Printf("[ERROR] DeleteCollectionFile db: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_delete_file"})
			return
		}
		go service.BroadcastActivity(database, "delete", cl.UserID, cl.Username, cl.AvatarURL, cf.FileName)

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
