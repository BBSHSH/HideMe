package handlers

import (
	"database/sql"
	"net/http"

	"github.com/BBSHSH/HideMe/server/internal/storage"
	"github.com/gin-gonic/gin"
)

type StatsResponse struct {
	TotalFiles int   `json:"total_files"`
	TotalSizeB int64 `json:"total_size_bytes"`
}

func GetStats(_ *sql.DB, store storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 実際のストレージ内のファイルを数える（DBではなく実体ベース）
		items, err := store.List(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_stats"})
			return
		}

		// トップレベルのすべてのファイルをカウント
		// （サムネイル・アイコンは thumbnails/ icons/ サブフォルダに保存されているため自動除外）
		var totalFiles int
		var totalSize int64
		for _, it := range items {
			totalFiles++
			totalSize += it.Size
		}

		c.JSON(http.StatusOK, StatsResponse{
			TotalFiles: totalFiles,
			TotalSizeB: totalSize,
		})
	}
}
