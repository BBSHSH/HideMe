package handlers

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/BBSHSH/HideMe/server/internal/storage"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// StoreSelector は storage_type 文字列から適切なストアを返す関数型
type StoreSelector func(storageType string) storage.Storage

type FileItem struct {
	Name     string    `json:"name"`
	Size     int64     `json:"size"`
	Modified time.Time `json:"modified"`
}

func ListFiles(store storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		items, err := store.List(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_list_files"})
			return
		}
		response := make([]FileItem, 0, len(items))
		for _, item := range items {
			response = append(response, FileItem{Name: item.Name, Size: item.Size, Modified: item.Modified})
		}
		c.JSON(http.StatusOK, gin.H{"items": response})
	}
}

type RecentFileItem struct {
	ID             string `json:"id"`
	CollectionID   string `json:"collection_id"`
	CollectionName string `json:"collection_name"`
	FileName       string `json:"file_name"`
	FileSize       int64  `json:"file_size"`
	ThumbnailName  string `json:"thumbnail_name"`
	UploadedBy     string `json:"uploaded_by"`
	UploaderName   string `json:"uploader_name"`
	UploaderAvatar string `json:"uploader_avatar"`
	UploadedAt     string `json:"uploaded_at"`
}

func ListAllFiles(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// file_name ごとに最新の1件だけ取得（重複排除）
		// collection_id が NULL / 空のレコードはコレクションに属さない孤立レコードのため除外
		rows, err := database.Query(`
			SELECT cf.id, cf.collection_id, COALESCE(col.name,'') AS collection_name,
			       cf.file_name, cf.file_size,
			       COALESCE(cf.thumbnail_name,''),
			       COALESCE(cf.uploaded_by,''),
			       COALESCE(u.username, du.username, '') AS uploader_name,
			       COALESCE(
			           CASE WHEN du.discord_id != '' AND du.avatar != ''
			                THEN 'https://cdn.discordapp.com/avatars/' || du.discord_id || '/' || du.avatar || '.png'
			                ELSE '' END, '') AS uploader_avatar,
			       cf.uploaded_at
			FROM collection_files cf
			LEFT JOIN collections     col ON col.id  = cf.collection_id
			LEFT JOIN users            u  ON u.id   = cf.uploaded_by
			LEFT JOIN discord_users   du  ON du.id  = cf.uploaded_by
			WHERE cf.collection_id IS NOT NULL AND cf.collection_id != ''
			ORDER BY cf.uploaded_at DESC LIMIT 100
		`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_list_files"})
			return
		}
		defer rows.Close()

		var files []RecentFileItem
		for rows.Next() {
			var f RecentFileItem
			if err := rows.Scan(&f.ID, &f.CollectionID, &f.CollectionName,
				&f.FileName, &f.FileSize, &f.ThumbnailName,
				&f.UploadedBy, &f.UploaderName, &f.UploaderAvatar,
				&f.UploadedAt); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_scan_files"})
				return
			}
			files = append(files, f)
		}
		if files == nil {
			files = []RecentFileItem{}
		}
		c.JSON(http.StatusOK, gin.H{"items": files})
	}
}

func UploadFile(store storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "file_required"})
			return
		}
		src, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_open_file"})
			return
		}
		defer src.Close()

		// folder 指定があればサブフォルダに保存（例: "icons"）
		// アイコンは一意名にして衝突を防ぐ
		folder := c.PostForm("folder")
		uploadName := file.Filename
		if folder != "" {
			ext := filepath.Ext(file.Filename)
			uploadName = folder + "/" + uuid.NewString() + ext
		}

		_, err = store.Upload(c.Request.Context(), uploadName, src, file.Size)
		if err != nil {
			if errors.Is(err, storage.ErrFileTooLarge) {
				c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "file_too_large"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_save_file"})
			return
		}

		// uploadName にはすでに folder/ プレフィックスが含まれる
		c.JSON(http.StatusCreated, gin.H{"file_name": uploadName, "file_size": file.Size, "uploaded": true})
	}
}

func DownloadFile(database *sql.DB, storeFor StoreSelector) gin.HandlerFunc {
	return func(c *gin.Context) {
		// *name は先頭に "/" が付く
		name := strings.TrimPrefix(c.Param("name"), "/")

		// DB でファイルのストレージ種別を確認
		storageType := "nas"
		if rows, err := database.Query(
			`SELECT COALESCE(storage_type,'nas') FROM collection_files WHERE file_name = ? LIMIT 1`, name,
		); err == nil {
			if rows.Next() {
				_ = rows.Scan(&storageType)
			}
			rows.Close()
		}

		// CORS ヘッダー
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Range")
		c.Header("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges")
		c.Header("Accept-Ranges", "bytes")

		// ─── ローカル: gin の c.File() で Range / シーク / ETag に完全対応 ───
		if ls, ok := storeFor("local").(*storage.LocalStorage); ok && storageType == "local" {
			path := ls.FilePath(name)
			// Content-Type を明示的に設定（拡張子が正しく解決されない環境対策）
			c.Header("Content-Type", videoMimeType(name))
			c.File(path) // Range・ETag・304 を gin が全処理
			return
		}

		// ─── NAS: ストリーミング（local フォールバックあり） ───
		store := storeFor(storageType)
		reader, item, err := store.Open(c.Request.Context(), name)
		if err != nil {
			// NAS に見つからない場合は local も試みる
			if errors.Is(err, storage.ErrNotFound) {
				if ls, ok := storeFor("local").(*storage.LocalStorage); ok {
					path := ls.FilePath(name)
					c.Header("Content-Type", videoMimeType(name))
					c.File(path)
					return
				}
				c.JSON(http.StatusNotFound, gin.H{"error": "file_not_found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_open_file"})
			return
		}
		defer reader.Close()

		mt := videoMimeType(item.Name)
		if mt == "video/mp4" || mt == "video/webm" {
			c.Header("Content-Type", mt)
		} else {
			c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, item.Name))
		}
		c.DataFromReader(http.StatusOK, item.Size, mt, reader, nil)
	}
}

func videoMimeType(name string) string {
	lower := strings.ToLower(name)
	switch {
	case strings.HasSuffix(lower, ".mp4"):
		return "video/mp4"
	case strings.HasSuffix(lower, ".webm"):
		return "video/webm"
	case strings.HasSuffix(lower, ".mov"):
		return "video/quicktime"
	case strings.HasSuffix(lower, ".mkv"):
		return "video/x-matroska"
	case strings.HasSuffix(lower, ".jpg"), strings.HasSuffix(lower, ".jpeg"):
		return "image/jpeg"
	case strings.HasSuffix(lower, ".png"):
		return "image/png"
	default:
		return "application/octet-stream"
	}
}
