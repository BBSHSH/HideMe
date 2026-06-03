package handlers

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/BBSHSH/HideMe/server/internal/db"
	"github.com/BBSHSH/HideMe/server/internal/storage"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func ListCollections(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		collections, err := db.ListCollections(database)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_list_collections"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": collections})
	}
}

func CreateCollection(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Name        string `json:"name"        binding:"required"`
			Description string `json:"description"`
			Color       string `json:"color"`
			Icon        string `json:"icon"`
			ImageURL    string `json:"image_url"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request"})
			return
		}
		col, err := db.CreateCollection(database, body.Name, body.Description, body.Color, body.Icon, body.ImageURL)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_create_collection"})
			return
		}
		c.JSON(http.StatusCreated, col)
	}
}

func UploadCollectionImage(store storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		file, err := c.FormFile("image")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "image_required"})
			return
		}

		ext := strings.ToLower(filepath.Ext(file.Filename))
		switch ext {
		case ".jpg", ".jpeg", ".png", ".webp", ".gif":
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported_format"})
			return
		}

		src, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_open_file"})
			return
		}
		defer src.Close()

		filename := fmt.Sprintf("collection-icons/%s%s", uuid.NewString(), ext)
		item, err := store.Upload(c.Request.Context(), filename, src, file.Size)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_upload_image"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"image_url": item.Name})
	}
}

func UpdateCollection(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var body struct {
			Name        string `json:"name"        binding:"required"`
			Description string `json:"description"`
			Color       string `json:"color"`
			Icon        string `json:"icon"`
			ImageURL    string `json:"image_url"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request"})
			return
		}
		if err := db.UpdateCollection(database, id, body.Name, body.Description, body.Color, body.Icon, body.ImageURL); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_update_collection"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"updated": true})
	}
}

func DeleteCollection(database *sql.DB, store storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		// コレクション内の全ファイルを取得
		files, err := db.ListFilesByCollection(database, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_list_files"})
			return
		}

		// NAS から各ファイルを削除
		for _, file := range files {
			if err := store.Delete(c.Request.Context(), file.FileName); err != nil {
				log.Printf("[WARN] Failed to delete file from NAS: %s, %v", file.FileName, err)
				// NAS 削除失敗は続行（DB は削除する）
			}
		}

		// DB から削除（ON DELETE CASCADE で collection_files も自動削除）
		if err := db.DeleteCollection(database, id); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_delete_collection"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"deleted": true})
	}
}
