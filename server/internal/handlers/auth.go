package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/BBSHSH/HideMe/server/internal/auth"
	"github.com/BBSHSH/HideMe/server/internal/chat"
	"github.com/BBSHSH/HideMe/server/internal/db"
	"github.com/gin-gonic/gin"
)

func Register(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Username string `json:"username" binding:"required"`
			Password string `json:"password" binding:"required"`
			Role     string `json:"role"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request"})
			return
		}

		// ユーザーが1人でも存在する場合は登録不可（初回のみ許可）
		count, err := db.CountUsers(database)
		if err != nil || count > 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "registration_disabled"})
			return
		}

		role := "member"
		if body.Role == "admin" {
			role = "admin"
		}

		hashed, err := auth.HashPassword(body.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_hash_password"})
			return
		}

		user, err := db.CreateUser(database, body.Username, hashed, role)
		if err != nil {
			c.JSON(http.StatusConflict, gin.H{"error": "username_taken"})
			return
		}

		token, err := auth.GenerateToken(user.ID, user.Username, user.Role)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_generate_token"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"token":    token,
			"user_id":  user.ID,
			"username": user.Username,
			"role":     user.Role,
		})
	}
}

// ForceLogoutAll は全ユーザーのトークンを無効化し、WS で即時ログアウトを通知する。
func ForceLogoutAll(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ts := strconv.FormatInt(time.Now().Unix(), 10)
		if err := db.SetAppSetting(database, "force_logout_before", ts); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed"})
			return
		}
		chat.Global.Broadcast(chat.WSMessage{Type: "force_logout", Data: nil})
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

func Login(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Username string `json:"username" binding:"required"`
			Password string `json:"password" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request"})
			return
		}

		user, err := db.GetUserByUsername(database, body.Username)
		if err != nil {
			if errors.Is(err, db.ErrUserNotFound) {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_credentials"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_user"})
			return
		}

		if !auth.CheckPassword(body.Password, user.Password) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_credentials"})
			return
		}

		token, err := auth.GenerateToken(user.ID, user.Username, user.Role)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_generate_token"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"token":    token,
			"user_id":  user.ID,
			"username": user.Username,
			"role":     user.Role,
		})
	}
}
