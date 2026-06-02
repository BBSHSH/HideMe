package handlers

import (
	"database/sql"
	"errors"
	"log"
	"net/http"

	"github.com/BBSHSH/HideMe/server/internal/auth"
	"github.com/BBSHSH/HideMe/server/internal/db"
	"github.com/BBSHSH/HideMe/server/internal/middleware"
	"github.com/BBSHSH/HideMe/server/internal/storage"
	"github.com/gin-gonic/gin"
)

func ListCollectionFiles(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		collectionID := c.Param("id")
		files, err := db.ListFilesByCollection(database, collectionID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_list_files"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": files})
	}
}

func UploadToCollection(store storage.Storage, database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		collectionID := c.Param("id")
		log.Printf("[DEBUG] UploadToCollection: collectionID=%s", collectionID)

		// コレクション存在確認
		if _, err := db.GetCollectionByID(database, collectionID); err != nil {
			if errors.Is(err, db.ErrCollectionNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "collection_not_found"})
				return
			}
			log.Printf("[ERROR] GetCollectionByID: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_collection"})
			return
		}

		file, err := c.FormFile("file")
		if err != nil {
			log.Printf("[ERROR] FormFile: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "file_required"})
			return
		}

		src, err := file.Open()
		if err != nil {
			log.Printf("[ERROR] file.Open: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_open_file"})
			return
		}
		defer src.Close()

		// NASにアップロード
		item, err := store.Upload(c.Request.Context(), file.Filename, src, file.Size)
		if err != nil {
			if errors.Is(err, storage.ErrFileTooLarge) {
				c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "file_too_large"})
				return
			}
			log.Printf("[ERROR] store.Upload: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_save_file"})
			return
		}

		// ユーザーIDを取得（認証ミドルウェアから）
		claims, ok := c.Get(middleware.ClaimsKey)
		userID := ""
		if ok && claims != nil {
			userID = claims.(*auth.Claims).UserID
		}
		log.Printf("[DEBUG] userID=%s, fileName=%s, fileSize=%d", userID, item.Name, item.Size)

		// DBに記録
		cf, err := db.AddFileToCollection(database, collectionID, item.Name, item.Size, userID)
		if err != nil {
			log.Printf("[ERROR] AddFileToCollection: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_record_file"})
			return
		}

		log.Printf("[DEBUG] AddFileToCollection success: id=%s", cf.ID)
		c.JSON(http.StatusOK, cf)
	}
}
func DeleteCollectionFile(store storage.Storage, database *sql.DB) gin.HandlerFunc {
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

		// DBから削除
		if err := db.DeleteFileFromCollection(database, fileID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_delete_file"})
			return
		}

		// NASからも削除
		if err := store.Delete(c.Request.Context(), cf.FileName); err != nil && !errors.Is(err, storage.ErrNotFound) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_delete_from_nas"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"deleted": true})
	}
}
