package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/BBSHSH/HideMe/server/internal/auth"
	"github.com/BBSHSH/HideMe/server/internal/progress"
	"github.com/BBSHSH/HideMe/server/internal/service"
	"github.com/BBSHSH/HideMe/server/internal/storage"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var wsUpgrader = websocket.Upgrader{
	CheckOrigin:     func(r *http.Request) bool { return true },
	ReadBufferSize:  4 * 1024 * 1024,
	WriteBufferSize: 1024,
}

type wsMsg struct {
	Type         string  `json:"type"`
	UploadID     string  `json:"upload_id"`
	FileName     string  `json:"file_name"`
	FileSize     int64   `json:"file_size"`
	CollectionID string  `json:"collection_id"`
	TrimStart    float64 `json:"trim_start"`
	TrimEnd      float64 `json:"trim_end"`
	Volume       int     `json:"volume"`
	Resolution   string  `json:"resolution"`
	FPS          int     `json:"fps"`
}

// WSUpload receives a file over WebSocket and processes it.
// GET /v1/ws-upload
func WSUpload(store storage.Storage, database *sql.DB, storageType string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := c.Query("token")
		if tokenStr == "" {
			tokenStr = strings.TrimPrefix(c.GetHeader("Authorization"), "Bearer ")
		}
		claims, err := auth.ParseToken(tokenStr)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		userID := claims.UserID

		conn, err := wsUpgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Printf("[WS] upgrade error: %v", err)
			return
		}
		defer conn.Close()

		conn.SetReadLimit(2 * 1024 * 1024)

		_, metaBytes, err := conn.ReadMessage()
		if err != nil {
			log.Printf("[WS] read meta error: %v", err)
			return
		}

		var meta wsMsg
		if err := json.Unmarshal(metaBytes, &meta); err != nil || meta.Type != "meta" {
			conn.WriteMessage(websocket.TextMessage, []byte(`{"error":"invalid_meta"}`))
			return
		}

		log.Printf("[WS] upload start: %s (%d bytes) upload_id=%s", meta.FileName, meta.FileSize, meta.UploadID)

		sendProgress := func(phase, msg string, percent float64) {
			data, _ := json.Marshal(map[string]interface{}{
				"type":    "progress",
				"phase":   phase,
				"percent": percent,
				"message": msg,
			})
			conn.WriteMessage(websocket.TextMessage, data)
		}

		sendProgress("receiving", "", 0)

		tmpPath := filepath.Join(os.TempDir(), "hideme_ws_"+meta.UploadID+filepath.Ext(meta.FileName))
		defer os.Remove(tmpPath)

		tmpFile, err := os.Create(tmpPath)
		if err != nil {
			conn.WriteMessage(websocket.TextMessage, []byte(`{"error":"failed_to_create_tmp"}`))
			return
		}

		var received int64
		for received < meta.FileSize {
			_, data, err := conn.ReadMessage()
			if err != nil {
				log.Printf("[WS] read data error: %v", err)
				tmpFile.Close()
				return
			}

			if _, err := tmpFile.Write(data); err != nil {
				log.Printf("[WS] write error: %v", err)
				tmpFile.Close()
				return
			}

			received += int64(len(data))
			pct := float64(received) / float64(meta.FileSize) * 100
			sendProgress("receiving", "", pct)
		}
		tmpFile.Close()

		log.Printf("[WS] received %d bytes for %s", received, meta.FileName)
		sendProgress("received", "", 100)

		uploadID := meta.UploadID
		collectionID := meta.CollectionID

		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseFFmpeg, Percent: 0})

		conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"processing"}`))

		go func() {
			if service.IsVideoFilename(meta.FileName) {
				vol := meta.Volume
				if vol == 0 {
					vol = 100
				}
				res := meta.Resolution
				if res == "" {
					res = "720p"
				}
				fps := meta.FPS
				if fps == 0 {
					fps = 30
				}
				service.ProcessVideoBackground(store, database, storageType, uploadID, collectionID, userID, meta.FileName, tmpPath, meta.TrimStart, meta.TrimEnd, vol, res, fps)
			} else {
				service.UploadNonVideoBackground(store, database, storageType, uploadID, collectionID, userID, meta.FileName, tmpPath)
			}
		}()

		conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"accepted","upload_id":"`+uploadID+`"}`))
	}
}
