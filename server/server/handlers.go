package server

import (
	"encoding/json"
	"fmt"
	"hidemeserver/models"
	"log"
	"net/http"
)

func (s *ChatServer) handleGetUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	users, err := s.userRepo.GetAll()
	if err != nil {
		log.Printf("ユーザー取得エラー: %v\n", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if users == nil {
		users = []*models.User{}
	}

	// 監査ログ
	s.auditRepo.Log("system", "list_users", "users", "", r.RemoteAddr, r.UserAgent(), nil)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func (s *ChatServer) handleMessages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.URL.Query().Get("userId")
	otherUserID := r.URL.Query().Get("otherUserId")

	if userID == "" || otherUserID == "" {
		http.Error(w, "userId and otherUserId required", http.StatusBadRequest)
		return
	}

	limit := 0
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		fmt.Sscanf(limitStr, "%d", &limit)
	}

	msgs, err := s.messageRepo.GetConversation(userID, otherUserID, limit)
	if err != nil {
		log.Printf("メッセージ取得エラー: %v\n", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if msgs == nil {
		msgs = []models.Message{}
	}

	// 監査ログ
	s.auditRepo.Log(userID, "get_messages", "messages", otherUserID, r.RemoteAddr, r.UserAgent(), nil)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(msgs)
}

func (s *ChatServer) handleUnreadCount(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.URL.Query().Get("userId")
	if userID == "" {
		http.Error(w, "userId required", http.StatusBadRequest)
		return
	}

	count, err := s.messageRepo.GetUnreadCount(userID)
	if err != nil {
		log.Printf("未読数取得エラー: %v\n", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{
		"unreadCount": count,
	})
}

// GDPR: データエクスポート
func (s *ChatServer) handleGDPRExport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.URL.Query().Get("userId")
	if userID == "" {
		http.Error(w, "userId required", http.StatusBadRequest)
		return
	}

	// ユーザー情報取得
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		log.Printf("ユーザー取得エラー: %v\n", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if user == nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// 監査ログ取得
	logs, err := s.auditRepo.GetUserLogs(userID, 1000)
	if err != nil {
		log.Printf("監査ログ取得エラー: %v\n", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// 監査ログ記録
	s.auditRepo.Log(userID, "gdpr_export", "user_data", userID, r.RemoteAddr, r.UserAgent(), nil)

	response := map[string]interface{}{
		"user":        user,
		"audit_logs":  logs,
		"exported_at": "now",
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=user_data_%s.json", userID))
	json.NewEncoder(w).Encode(response)
}

// GDPR: 削除リクエスト
func (s *ChatServer) handleGDPRDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		UserID string `json:"userId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.UserID == "" {
		http.Error(w, "userId required", http.StatusBadRequest)
		return
	}

	// 監査ログ記録（削除前に記録）
	s.auditRepo.Log(req.UserID, "gdpr_delete_request", "user", req.UserID, r.RemoteAddr, r.UserAgent(), nil)

	// メッセージ削除
	if err := s.messageRepo.HardDeleteByUser(req.UserID); err != nil {
		log.Printf("メッセージ削除エラー: %v\n", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// ユーザー削除
	if err := s.userRepo.Delete(req.UserID); err != nil {
		log.Printf("ユーザー削除エラー: %v\n", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// WebSocket接続も切断
	s.wsClientsMu.Lock()
	if conn, exists := s.wsClients[req.UserID]; exists {
		conn.Close()
		delete(s.wsClients, req.UserID)
	}
	s.wsClientsMu.Unlock()

	log.Printf("GDPR削除完了: %s\n", req.UserID)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "deleted",
		"user_id": req.UserID,
		"message": "All user data has been permanently deleted",
	})
}

func (s *ChatServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	// DB接続チェック
	if err := s.db.DB().Ping(); err != nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		w.Write([]byte("Database connection failed"))
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}
