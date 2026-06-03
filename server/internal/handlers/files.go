package handlers

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/BBSHSH/HideMe/server/internal/db"
	"github.com/BBSHSH/HideMe/server/internal/storage"
	"github.com/gin-gonic/gin"
)

type FileItem struct {
	Name     string    `json:"name"`
	Size     int64     `json:"size"`
	Modified time.Time `json:"modified"`
}

func ListFiles(store storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		items, err := store.List(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed_to_list_files",
			})
			return
		}

		response := make([]FileItem, 0, len(items))
		for _, item := range items {
			response = append(response, FileItem{
				Name:     item.Name,
				Size:     item.Size,
				Modified: item.Modified,
			})
		}

		c.JSON(http.StatusOK, gin.H{
			"items": response,
		})
	}
}

func ListAllFiles(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 全コレクションから全ファイルを取得（最新順）
		rows, err := database.Query(`
			SELECT id, collection_id, file_name, file_size, uploaded_by, uploaded_at 
			FROM collection_files 
			ORDER BY uploaded_at DESC 
			LIMIT 100
		`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_list_files"})
			return
		}
		defer rows.Close()

		var files []db.CollectionFile
		for rows.Next() {
			var f db.CollectionFile
			if err := rows.Scan(&f.ID, &f.CollectionID, &f.FileName, &f.FileSize, &f.UploadedBy, &f.UploadedAt); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_scan_files"})
				return
			}
			files = append(files, f)
		}

		c.JSON(http.StatusOK, gin.H{"items": files})
	}
}

func UploadFile(store storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "file_required",
			})
			return
		}

		src, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed_to_open_file",
			})
			return
		}
		defer src.Close()

		item, err := store.Upload(
			c.Request.Context(),
			file.Filename,
			src,
			file.Size,
		)

		if err != nil {
			if errors.Is(err, storage.ErrFileTooLarge) {
				c.JSON(http.StatusRequestEntityTooLarge, gin.H{
					"error": "file_too_large",
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed_to_save_file",
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"file_name": item.Name,
			"file_size": item.Size,
			"uploaded":  true,
		})
	}
}

func DownloadFile(store storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		reader, item, err := store.Open(c.Request.Context(), c.Param("name"))
		if err != nil {
			if errors.Is(err, storage.ErrNotFound) {
				c.JSON(http.StatusNotFound, gin.H{
					"error": "file_not_found",
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed_to_open_file",
			})
			return
		}
		defer reader.Close()

		c.Header(
			"Content-Disposition",
			fmt.Sprintf("attachment; filename=\"%s\"", item.Name),
		)

		c.DataFromReader(
			http.StatusOK,
			item.Size,
			"application/octet-stream",
			reader,
			nil,
		)
	}
}
