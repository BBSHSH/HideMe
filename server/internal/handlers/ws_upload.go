package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/BBSHSH/HideMe/server/internal/auth"
	"github.com/BBSHSH/HideMe/server/internal/db"
	"github.com/BBSHSH/HideMe/server/internal/middleware"
	"github.com/BBSHSH/HideMe/server/internal/progress"
	"github.com/BBSHSH/HideMe/server/internal/storage"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var wsUpgrader = websocket.Upgrader{
	CheckOrigin:     func(r *http.Request) bool { return true },
	ReadBufferSize:  1024 * 1024,       // 1MB
	WriteBufferSize: 1024,
}

// wsMsg はクライアントから受信するメッセージ
type wsMsg struct {
	Type string `json:"type"`
	// type: "meta" のとき
	UploadID    string `json:"upload_id"`
	FileName    string `json:"file_name"`
	FileSize    int64  `json:"file_size"`
	CollectionID string `json:"collection_id"`
	TrimStart   float64 `json:"trim_start"`
	TrimEnd     float64 `json:"trim_end"`
	Volume      int    `json:"volume"`
	Resolution  string `json:"resolution"`
	FPS         int    `json:"fps"`
}

// WSUpload は WebSocket でファイルを受信してアップロードする
// GET /v1/ws-upload
func WSUpload(store storage.Storage, database *sql.DB, storageType string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// JWT 認証
		tokenStr := c.Query("token")
		if tokenStr == "" {
			tokenStr = c.GetHeader("Authorization")
			tokenStr = strings.TrimPrefix(tokenStr, "Bearer ")
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

		// 1. メタ情報を受信
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

		// 進捗通知ヘルパー
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

		// 2. ファイルデータを一時ファイルに書き込む
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

		// 3. バックグラウンドでエンコード・NAS転送
		// 進捗は WebSocket と progress tracker 両方に送る
		uploadID := meta.UploadID
		collectionID := meta.CollectionID

		// progress tracker に登録（ポーリング用）
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseFFmpeg, Percent: 0})

		conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"processing"}`))

		go func() {
			if isVideoFilename(meta.FileName) {
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
				processVideoBackground(store, database, storageType, uploadID, collectionID, userID, meta.FileName, tmpPath, meta.TrimStart, meta.TrimEnd, vol, res, fps)
			} else {
				uploadNonVideoBackground(store, database, storageType, uploadID, collectionID, userID, meta.FileName, tmpPath)
			}
		}()

		// 4. 完了を伝える（クライアントはポーリングで進捗を監視）
		conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"accepted","upload_id":"`+uploadID+`"}`))
	}
}

// resolutionToHeight は解像度文字列から高さを返す（chunk_upload.go と重複しないよう分離）
func resolutionToHeight(s string) int {
	switch s {
	case "1080p":
		return 1080
	case "480p":
		return 480
	case "240p":
		return 240
	default:
		return 720
	}
}

// getCollectionIDStr はコレクションIDを返す
func getCollectionIDStr(database *sql.DB, id string) (string, error) {
	_, err := db.GetCollectionByID(database, id)
	return id, err
}

// ParseToken は JWT トークンを検証して Claims を返す
// （auth パッケージに移譲）
func parseTokenForWS(tokenStr string) (*auth.Claims, error) {
	return auth.ParseToken(tokenStr)
}

// getUploaderID はミドルウェアの Claims から UserID を取得
func getUploaderID(c *gin.Context) string {
	claims, ok := c.Get(middleware.ClaimsKey)
	if !ok || claims == nil {
		return ""
	}
	return claims.(*auth.Claims).UserID
}

// intStr はint→stringの変換
func intStr(n int) string {
	return strconv.Itoa(n)
}
