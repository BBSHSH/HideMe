package handlers

import (
	"net/http"

	"github.com/BBSHSH/HideMe/server/internal/config"
	"github.com/gin-gonic/gin"
)

// GetUploadConfig はフロントエンドにアップロード設定を返す
func GetUploadConfig(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		uploadURL := ""
		if cfg.Upload.UseDirectURL && cfg.Upload.DirectURL != "" {
			uploadURL = cfg.Upload.DirectURL
		}

		c.JSON(http.StatusOK, gin.H{
			"use_direct_url": cfg.Upload.UseDirectURL,
			"upload_url":     uploadURL, // 空なら通常の相対パスを使う
		})
	}
}
