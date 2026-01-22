package server

import (
	"net/http"
	"strings"
)

// allowedOrigins 許可するオリジンのリスト
var allowedOrigins = []string{
	"http://localhost",
	"http://wails.localhost",
	"http://127.0.0.1",
}

// corsMiddleware CORSヘッダーを設定するミドルウェア
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		
		// 許可するオリジンのチェック
		if isAllowedOrigin(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Max-Age", "86400")
		}

		// Preflightリクエスト（OPTIONS）の処理
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// isAllowedOrigin オリジンが許可されているかチェック
func isAllowedOrigin(origin string) bool {
	if origin == "" {
		return false
	}

	// プロトコルとホスト部分を分離
	// 例: "http://localhost:3000" -> "http://localhost"
	for _, allowed := range allowedOrigins {
		// 完全一致（ポートなし）
		if origin == allowed {
			return true
		}
		// ポート付きの場合は、ホスト部分が一致し、その後にコロンが続くことを確認
		if strings.HasPrefix(origin, allowed+":") {
			return true
		}
	}

	return false
}
