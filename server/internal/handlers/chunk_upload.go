package handlers

import (
	"database/sql"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"

	"github.com/BBSHSH/HideMe/server/internal/auth"
	"github.com/BBSHSH/HideMe/server/internal/chat"
	"github.com/BBSHSH/HideMe/server/internal/db"
	"github.com/BBSHSH/HideMe/server/internal/middleware"
	"github.com/BBSHSH/HideMe/server/internal/service"
	"github.com/BBSHSH/HideMe/server/internal/storage"
	"github.com/gin-gonic/gin"
)

func chunkTmpDir(uploadID string) string {
	return filepath.Join(os.TempDir(), "hideme_chunk_"+uploadID)
}

// UploadChunk receives a single chunk and writes it to a temp directory.
// POST /v1/collections/:id/chunk
func UploadChunk() gin.HandlerFunc {
	return func(c *gin.Context) {
		uploadID := c.GetHeader("X-Upload-ID")
		chunkIndexStr := c.GetHeader("X-Chunk-Index")
		totalChunksStr := c.GetHeader("X-Total-Chunks")
		fileNameRaw := c.GetHeader("X-File-Name")
		fileName, _ := url.QueryUnescape(fileNameRaw)

		if uploadID == "" || chunkIndexStr == "" || totalChunksStr == "" || fileName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing_headers"})
			return
		}

		chunkIndex, err := strconv.Atoi(chunkIndexStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_chunk_index"})
			return
		}

		dir := chunkTmpDir(uploadID)
		if err := os.MkdirAll(dir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_create_tmp_dir"})
			return
		}

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

// MergeAndUpload merges all chunks and processes/uploads the resulting file.
// POST /v1/collections/:id/merge
func MergeAndUpload(store storage.Storage, database *sql.DB, storageType string) gin.HandlerFunc {
	return func(c *gin.Context) {
		uploadID := c.GetHeader("X-Upload-ID")
		totalChunksStr := c.GetHeader("X-Total-Chunks")
		fileNameRaw := c.GetHeader("X-File-Name")
		fileName, _ := url.QueryUnescape(fileNameRaw)

		if uploadID == "" || totalChunksStr == "" || fileName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing_headers"})
			return
		}

		totalChunks, err := strconv.Atoi(totalChunksStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_total_chunks"})
			return
		}

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

		claims, _ := c.Get(middleware.ClaimsKey)
		userID := ""
		uploaderName := ""
		uploaderAvatar := ""
		if claims != nil {
			cl := claims.(*auth.Claims)
			userID = cl.UserID
			uploaderName = cl.Username
			uploaderAvatar = cl.AvatarURL
			if cl.Role == "admin" {
				if overrideID := c.GetHeader("X-Uploaded-By"); overrideID != "" {
					userID = overrideID
				}
			}
		}

		c.JSON(http.StatusAccepted, gin.H{"status": "processing", "upload_id": uploadID})

		skipEncode := c.GetHeader("X-Skip-Encode") == "true"

		go func() {
			defer os.RemoveAll(dir)
			defer os.Remove(mergedPath)

			if service.IsVideoFilename(fileName) && !skipEncode {
				service.ProcessVideoBackground(store, database, storageType, uploadID, collectionID, userID, fileName, mergedPath, trimStart, trimEnd, volumeVal, resolution, fpsVal)
			} else {
				service.UploadNonVideoBackground(store, database, storageType, uploadID, collectionID, userID, fileName, mergedPath)
			}
			uid, uname, uavatar := userID, uploaderName, uploaderAvatar
			db.LogActivity(database, "upload", uid, uname, uavatar, fileName)
			chat.Global.Broadcast(chat.WSMessage{Type: "activity", Data: map[string]string{
				"type": "upload", "user_id": uid, "username": uname, "avatar": uavatar, "detail": fileName,
			}})
		}()
	}
}
