package handlers

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"path"
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
			Genre       string `json:"genre"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request"})
			return
		}
		col, err := db.CreateCollection(database, body.Name, body.Description, body.Color, body.Icon, body.ImageURL, body.Genre)
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

		// icon_ プレフィックスで動画・サムネイルと区別する
		filename := fmt.Sprintf("icon_%s%s", uuid.NewString(), ext)
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
			Genre       string `json:"genre"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request"})
			return
		}
		if err := db.UpdateCollection(database, id, body.Name, body.Description, body.Color, body.Icon, body.ImageURL, body.Genre); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_update_collection"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"updated": true})
	}
}

func DeleteCollection(database *sql.DB, store storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		// コレクション情報（アイコン画像 URL）を取得
		col, err := db.GetCollectionByID(database, id)
		if err != nil && err != db.ErrCollectionNotFound {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_collection"})
			return
		}

		// コレクション内の全ファイルを取得
		files, err := db.ListFilesByCollection(database, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_list_files"})
			return
		}

		// 各ファイル（動画 + サムネイル）をストレージから削除
		for _, file := range files {
			if err := store.Delete(c.Request.Context(), file.FileName); err != nil {
				log.Printf("[WARN] delete video failed: %s, %v", file.FileName, err)
			}
			if file.ThumbnailName != "" {
				if err := store.Delete(c.Request.Context(), file.ThumbnailName); err != nil {
					log.Printf("[WARN] delete thumbnail failed: %s, %v", file.ThumbnailName, err)
				}
			}
		}

		// コレクションアイコン画像を削除（image_url はフル URL なので末尾のファイル名を抽出）
		if iconName := fileNameFromURL(col.ImageURL); iconName != "" {
			if err := store.Delete(c.Request.Context(), iconName); err != nil {
				log.Printf("[WARN] delete collection icon failed: %s, %v", iconName, err)
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

// fileNameFromURL は image_url ("http://.../v1/files/icon_xxx.png") から
// 末尾のファイル名を抽出する。URL でない場合はそのまま basename を返す。
func fileNameFromURL(raw string) string {
	if raw == "" {
		return ""
	}
	// クエリ・フラグメントを除去
	if i := strings.IndexAny(raw, "?#"); i >= 0 {
		raw = raw[:i]
	}
	base := path.Base(raw)
	if decoded, err := url.PathUnescape(base); err == nil {
		base = decoded
	}
	if base == "." || base == "/" {
		return ""
	}
	return base
}
