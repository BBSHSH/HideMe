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
)

// GET /v1/users  全ユーザー一覧（DM 相手選択用）
func ListUsers(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		users, err := db.ListAllUsers(database)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": users})
	}
}

// GET /v1/dm/conversations  自分の DM 一覧
func ListDMConversations(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		cl := getClaims(c)
		if cl == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		convs, err := db.ListConversations(database, cl.UserID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": convs})
	}
}

// POST /v1/dm/conversations  DM 開始（または既存を返す）
func OpenDMConversation(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		cl := getClaims(c)
		if cl == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		var body struct {
			TargetID     string `json:"target_id" binding:"required"`
			TargetName   string `json:"target_name"`
			TargetAvatar string `json:"target_avatar"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request"})
			return
		}
		conv, err := db.GetOrCreateConversation(database,
			cl.UserID, cl.Username, cl.AvatarURL,
			body.TargetID, body.TargetName, body.TargetAvatar)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed"})
			return
		}
		c.JSON(http.StatusOK, conv)
	}
}

// GET /v1/dm/conversations/:id/messages
func ListDMMessages(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		convID := c.Param("id")
		limit := 50
		if l, err := strconv.Atoi(c.Query("limit")); err == nil && l > 0 {
			limit = l
		}
		msgs, err := db.ListDMMessages(database, convID, limit)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": msgs})
	}
}

// POST /v1/dm/conversations/:id/messages
func PostDMMessage(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		convID := c.Param("id")
		cl := getClaims(c)
		if cl == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		var body struct {
			Content string `json:"content" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "content_required"})
			return
		}
		msg, err := db.CreateDMMessage(database, convID, cl.UserID, cl.Username, cl.AvatarURL, body.Content)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed"})
			return
		}
		// WebSocket でリアルタイム配信
		chat.Global.Broadcast(chat.WSMessage{
			Type:      "dm",
			ChannelID: convID,
			Data:      msg,
		})
		c.JSON(http.StatusCreated, msg)
	}
}

// getClaims は gin.Context から Claims を取り出すヘルパー
func getClaims(c *gin.Context) *auth.Claims {
	v, _ := c.Get(middleware.ClaimsKey)
	cl, _ := v.(*auth.Claims)
	return cl
}
