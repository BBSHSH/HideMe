package middleware

import (
	"database/sql"
	"sync"
	"time"

	"github.com/BBSHSH/HideMe/server/internal/auth"
	"github.com/BBSHSH/HideMe/server/internal/db"
	"github.com/gin-gonic/gin"
)

var (
	lastSeenCache   = map[string]time.Time{}
	lastSeenCacheMu sync.Mutex
	lastSeenTTL     = 5 * time.Minute
)

// UpdateLastSeen は認証済みリクエストのたびに last_seen_at を更新する（5分クールダウン）
func UpdateLastSeen(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		v, exists := c.Get(ClaimsKey)
		if !exists || v == nil {
			return
		}
		cl, ok := v.(*auth.Claims)
		if !ok || cl.UserID == "" {
			return
		}

		lastSeenCacheMu.Lock()
		last, hit := lastSeenCache[cl.UserID]
		if !hit || time.Since(last) >= lastSeenTTL {
			lastSeenCache[cl.UserID] = time.Now()
			lastSeenCacheMu.Unlock()
			go db.UpdateLastSeen(database, cl.UserID)
		} else {
			lastSeenCacheMu.Unlock()
		}
	}
}
