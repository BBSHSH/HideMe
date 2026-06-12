package middleware

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"github.com/BBSHSH/HideMe/server/internal/auth"
	"github.com/BBSHSH/HideMe/server/internal/db"
	"github.com/gin-gonic/gin"
)

const ClaimsKey = "claims"

func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		claims, err := auth.ParseToken(strings.TrimPrefix(header, "Bearer "))
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid_token"})
			return
		}
		c.Set(ClaimsKey, claims)
		c.Next()
	}
}

// CheckForceLogout は force_logout_before より前に発行されたトークンを拒否する。
// Bearer トークンがないリクエスト（未認証ルート）はそのまま通す。
func CheckForceLogout(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			c.Next()
			return
		}
		claims, err := auth.ParseToken(strings.TrimPrefix(header, "Bearer "))
		if err != nil {
			c.Next()
			return
		}
		val, _ := db.GetAppSetting(database, "force_logout_before")
		if val != "" {
			ts, _ := strconv.ParseInt(val, 10, 64)
			if ts > 0 && claims.IssuedAt != nil && claims.IssuedAt.Unix() < ts {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "force_logged_out"})
				return
			}
		}
		c.Next()
	}
}

func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, ok := c.Get(ClaimsKey)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		if claims.(*auth.Claims).Role != "admin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.Next()
	}
}
