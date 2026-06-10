package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/BBSHSH/HideMe/server/internal/auth"
	"github.com/BBSHSH/HideMe/server/internal/chat"
	"github.com/BBSHSH/HideMe/server/internal/db"
	"github.com/BBSHSH/HideMe/server/internal/middleware"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// GET /v1/chat/channels
func ListChannels(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		channels, err := db.ListChannels(database)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed"})
			return
		}
		// 音声チャンネルの参加者情報を付加
		voiceRooms := chat.Global.GetAllVoiceRooms()
		type ChannelWithVoice struct {
			db.Channel
			VoiceParticipants []chat.VoiceParticipant `json:"voice_participants"`
		}
		result := make([]ChannelWithVoice, len(channels))
		for i, ch := range channels {
			ps := voiceRooms[ch.ID]
			if ps == nil {
				ps = []chat.VoiceParticipant{}
			}
			result[i] = ChannelWithVoice{Channel: ch, VoiceParticipants: ps}
		}
		c.JSON(http.StatusOK, gin.H{"items": result})
	}
}

// POST /v1/chat/channels  (admin only)
func CreateChannel(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Name        string `json:"name" binding:"required"`
			Description string `json:"description"`
			Type        string `json:"type"` // "text" | "voice"
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request"})
			return
		}
		ch, err := db.CreateChannel(database, body.Name, body.Description, body.Type)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed"})
			return
		}
		chat.Global.Broadcast(chat.WSMessage{Type: "channel_created", Data: ch})
		c.JSON(http.StatusCreated, ch)
	}
}

// DELETE /v1/chat/channels/:id  (admin)
func DeleteChannel(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := db.DeleteChannel(database, id); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed"})
			return
		}
		chat.Global.Broadcast(chat.WSMessage{Type: "channel_deleted", ChannelID: id})
		c.JSON(http.StatusOK, gin.H{"deleted": true})
	}
}

// GET /v1/chat/channels/:id/messages?limit=50
func ListMessages(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		channelID := c.Param("id")
		limit := 50
		if l, err := strconv.Atoi(c.Query("limit")); err == nil && l > 0 && l <= 200 {
			limit = l
		}
		msgs, err := db.ListMessages(database, channelID, limit)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": msgs})
	}
}

// POST /v1/chat/channels/:id/messages
func PostMessage(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		channelID := c.Param("id")
		var body struct {
			Content string `json:"content" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil || body.Content == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "content_required"})
			return
		}
		claimsVal, _ := c.Get(middleware.ClaimsKey)
		cl, _ := claimsVal.(*auth.Claims)
		userID, username, avatar := "", "Anonymous", ""
		if cl != nil {
			userID = cl.UserID
			username = cl.Username
			avatar = cl.AvatarURL
		}
		msg, err := db.CreateMessage(database, channelID, userID, username, avatar, body.Content)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed"})
			return
		}
		chat.Global.Broadcast(chat.WSMessage{Type: "message", ChannelID: channelID, Data: msg})
		c.JSON(http.StatusCreated, msg)
	}
}

// DELETE /v1/chat/messages/:id
func DeleteMessage(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		msgID := c.Param("id")
		msg, err := db.GetMessageByID(database, msgID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "not_found"})
			return
		}
		claimsVal, _ := c.Get(middleware.ClaimsKey)
		cl, _ := claimsVal.(*auth.Claims)
		if cl == nil || (cl.Role != "admin" && cl.UserID != msg.UserID) {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		db.DeleteMessage(database, msgID)
		chat.Global.Broadcast(chat.WSMessage{
			Type: "delete", ChannelID: msg.ChannelID,
			Data: gin.H{"id": msgID},
		})
		c.JSON(http.StatusOK, gin.H{"deleted": true})
	}
}

// POST /v1/chat/channels/:id/voice/join
func VoiceJoin() gin.HandlerFunc {
	return func(c *gin.Context) {
		channelID := c.Param("id")
		cl := getClaims(c)
		if cl == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		chat.Global.VoiceJoin(channelID, chat.VoiceParticipant{
			UserID:   cl.UserID,
			Username: cl.Username,
			Avatar:   cl.AvatarURL,
		})
		c.JSON(http.StatusOK, gin.H{"joined": true})
	}
}

// POST /v1/chat/channels/:id/voice/leave
func VoiceLeave() gin.HandlerFunc {
	return func(c *gin.Context) {
		channelID := c.Param("id")
		cl := getClaims(c)
		if cl == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		chat.Global.VoiceLeave(channelID, cl.UserID)
		c.JSON(http.StatusOK, gin.H{"left": true})
	}
}

// GET /v1/chat/ws — JWT を ?token= で受け取ってユーザー識別
func ChatWebSocket(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// token クエリパラメータで認証
		userID := "anonymous"
		if token := c.Query("token"); token != "" {
			if claims, err := auth.ParseToken(token); err == nil {
				userID = claims.UserID
			}
		}
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			return
		}
		uid := userID
		chat.Global.ServeClient(conn, uid,
			func() { db.UpdateLastSeen(database, uid) },
			func() { db.UpdateLastSeen(database, uid) },
		)
	}
}
