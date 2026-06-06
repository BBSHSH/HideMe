package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

func CORS() gin.HandlerFunc {
	allowedEnv := os.Getenv("CORS_ORIGINS")
	if allowedEnv == "" {
		allowedEnv = "http://localhost:5173"
	}

	allowed := make([]string, 0)
	for _, origin := range strings.Split(allowedEnv, ",") {
		trimmed := strings.TrimSpace(origin)
		if trimmed != "" {
			allowed = append(allowed, trimmed)
		}
	}

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		allowOrigin := ""

		if len(allowed) == 1 && allowed[0] == "*" {
			allowOrigin = "*"
		} else if origin != "" {
			for _, a := range allowed {
				if a == origin {
					allowOrigin = origin
					break
				}
			}
		}

		if allowOrigin != "" {
			c.Header("Access-Control-Allow-Origin", allowOrigin)
			if allowOrigin != "*" {
				c.Header("Access-Control-Allow-Credentials", "true")
			}
			c.Header("Vary", "Origin")
		}

		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Upload-ID")
		c.Header("Access-Control-Expose-Headers", "Content-Length, Content-Range")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
