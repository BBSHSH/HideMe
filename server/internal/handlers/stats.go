package handlers

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/BBSHSH/HideMe/server/internal/storage"
	"github.com/gin-gonic/gin"
)

type StatsResponse struct {
	TotalFiles      int    `json:"total_files"`
	TotalSizeB      int64  `json:"total_size_bytes"`
	StorageTotalB   uint64 `json:"storage_total_bytes,omitempty"`
	StorageUsedB    uint64 `json:"storage_used_bytes,omitempty"`
	StorageFreeB    uint64 `json:"storage_free_bytes,omitempty"`
}

func GetStats(_ *sql.DB, store storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 実際のストレージ内のファイルを数える（DBではなく実体ベース）
		items, err := store.List(c.Request.Context())
		if err != nil {
			log.Printf("[STATS] store.List error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_stats"})
			return
		}

		var totalFiles int
		var totalSize int64
		for _, it := range items {
			totalFiles++
			totalSize += it.Size
		}

		resp := StatsResponse{
			TotalFiles: totalFiles,
			TotalSizeB: totalSize,
		}

		// NASStorage の場合は StatVFS でディスク合計容量を取得
		// 使用量は HideMe のアップロードフォルダ内のファイルのみ（disk.UsedBytes は NAS 全体なので使わない）
		if nas, ok := store.(*storage.NASStorage); ok {
			if disk, err := nas.DiskStat(c.Request.Context()); err == nil {
				resp.StorageTotalB = disk.TotalBytes
				resp.StorageUsedB  = uint64(totalSize) // HideMe フォルダ内のみ
				resp.StorageFreeB  = disk.FreeBytes
			} else {
				log.Printf("[STATS] DiskStat error (non-fatal): %v", err)
			}
		}

		c.JSON(http.StatusOK, resp)
	}
}
