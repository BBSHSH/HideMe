package server

import (
	"encoding/json"
	"hidemeserver/models"
	"log"
	"net/http"
	"strings"

	"github.com/google/uuid"
)

// handleRegister アカウント登録
func (s *ChatServer) handleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Username    string `json:"username"`
		Password    string `json:"password"`
		DisplayName string `json:"displayName"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// バリデーション
	if req.Username == "" || req.Password == "" || req.DisplayName == "" {
		http.Error(w, "All fields are required", http.StatusBadRequest)
		return
	}

	if len(req.Username) < 3 || len(req.Username) > 20 {
		http.Error(w, "Username must be 3-20 characters", http.StatusBadRequest)
		return
	}

	if len(req.Password) < 6 {
		http.Error(w, "Password must be at least 6 characters", http.StatusBadRequest)
		return
	}

	// ユーザー名の重複チェック
	exists, err := s.accountRepo.UsernameExists(req.Username)
	if err != nil {
		log.Printf("ユーザー名チェックエラー: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if exists {
		http.Error(w, "Username already exists", http.StatusConflict)
		return
	}

	// アバター生成
	avatar := "?"
	runes := []rune(req.DisplayName)
	if len(runes) > 0 {
		avatar = string(runes[0])
	}

	// アカウント作成
	account := &models.Account{
		ID:          uuid.New().String(),
		Username:    req.Username,
		DisplayName: req.DisplayName,
		Avatar:      avatar,
	}

	if err := s.accountRepo.Create(account, req.Password); err != nil {
		log.Printf("アカウント作成エラー: %v", err)
		http.Error(w, "Failed to create account", http.StatusInternalServerError)
		return
	}

	// 監査ログ
	s.auditRepo.Log(account.ID, "register", "account", account.ID, r.RemoteAddr, r.UserAgent(), nil)

	log.Printf("新規アカウント作成: %s (%s)", req.Username, account.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"user": map[string]string{
			"id":          account.ID,
			"username":    account.Username,
			"displayName": account.DisplayName,
			"avatar":      account.Avatar,
		},
	})
}

// handleLogin ログイン
func (s *ChatServer) handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// アカウント取得
	account, err := s.accountRepo.GetByUsername(req.Username)
	if err != nil {
		log.Printf("アカウント取得エラー: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if account == nil {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	// パスワード検証
	if !s.accountRepo.VerifyPassword(account, req.Password) {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	// セッション作成
	session, err := s.sessionRepo.Create(account.ID)
	if err != nil {
		log.Printf("セッション作成エラー: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// 最終ログイン時刻を更新
	s.accountRepo.UpdateLastLogin(account.ID)

	// 監査ログ
	s.auditRepo.Log(account.ID, "login", "session", session.Token, r.RemoteAddr, r.UserAgent(), nil)

	log.Printf("ログイン成功: %s (%s)", account.Username, account.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"token":  session.Token,
		"user": map[string]string{
			"id":          account.ID,
			"username":    account.Username,
			"displayName": account.DisplayName,
			"avatar":      account.Avatar,
		},
	})
}

// handleLogout ログアウト
func (s *ChatServer) handleLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	token := s.extractToken(r)
	if token == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// セッション削除
	if err := s.sessionRepo.Delete(token); err != nil {
		log.Printf("セッション削除エラー: %v", err)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
	})
}

// handleVerify トークン検証
func (s *ChatServer) handleVerify(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	token := s.extractToken(r)
	if token == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// セッション取得
	session, err := s.sessionRepo.GetByToken(token)
	if err != nil {
		log.Printf("セッション取得エラー: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if session == nil {
		http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
		return
	}

	// アカウント情報取得
	account, err := s.accountRepo.GetByID(session.UserID)
	if err != nil {
		log.Printf("アカウント取得エラー: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if account == nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"valid": true,
		"user": map[string]string{
			"id":          account.ID,
			"username":    account.Username,
			"displayName": account.DisplayName,
			"avatar":      account.Avatar,
		},
	})
}

// extractToken リクエストからトークンを抽出
func (s *ChatServer) extractToken(r *http.Request) string {
	// Authorizationヘッダーから取得
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}

	// クエリパラメータから取得
	return r.URL.Query().Get("token")
}

// requireAuth 認証が必要なハンドラーをラップ
func (s *ChatServer) requireAuth(handler func(w http.ResponseWriter, r *http.Request, userID string)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := s.extractToken(r)
		if token == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		session, err := s.sessionRepo.GetByToken(token)
		if err != nil || session == nil {
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		handler(w, r, session.UserID)
	}
}
