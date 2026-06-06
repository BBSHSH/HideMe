package handlers

import (
	"database/sql"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

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
		defer os.RemoveAll(dir)

		mergedPath := filepath.Join(os.TempDir(), "hideme_merged_"+uploadID+filepath.Ext(fileName))
		defer os.Remove(mergedPath)

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

		// 結合したファイルを multipart.FileHeader に偽装して UploadToCollection の処理を流用
		mergedFile, err := os.Open(mergedPath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_open_merged"})
			return
		}
		defer mergedFile.Close()

		info, _ := mergedFile.Stat()

		// 既存の uploadVideo/uploadNonVideo を直接呼ぶため FileHeader を模倣
		fh := &multipart.FileHeader{
			Filename: fileName,
			Size:     info.Size(),
		}
		// FormFile の代わりに直接処理する
		// UploadToCollection と同じロジックを fh + mergedFile で実行
		c.Set("_chunk_file_path", mergedPath)
		c.Set("_chunk_file_header", fh)

		// コンテキストを直接使って処理を呼び出す
		uploadToCollectionWithFile(c, store, database, storageType, fh, mergedFile)
	}
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
