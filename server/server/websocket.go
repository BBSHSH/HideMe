package server

import (
	"encoding/json"
	"hidemeserver/models"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

func (s *ChatServer) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	userName := r.URL.Query().Get("userName")

	if userID == "" {
		http.Error(w, "userId required", http.StatusBadRequest)
		return
	}

	// アカウント情報を取得して表示名を使用
	account, err := s.accountRepo.GetByID(userID)
	if err != nil {
		log.Printf("アカウント取得エラー: %v\n", err)
		http.Error(w, "Failed to get account", http.StatusInternalServerError)
		return
	}
	if account == nil {
		http.Error(w, "Account not found", http.StatusNotFound)
		return
	}

	// アカウントの表示名を使用
	userName = account.DisplayName

	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocketアップグレードエラー: %v\n", err)
		return
	}

	// ユーザー登録
	s.registerUser(userID, userName, conn)

	defer s.cleanupConnection(userID, userName, conn)

	// Ping/Pong設定
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(120 * time.Second))
		return nil
	})

	go s.pingClient(userID, conn)

	// メッセージ受信ループ
	s.messageLoop(userID, conn)
}

func (s *ChatServer) registerUser(userID, userName string, conn *websocket.Conn) {
	// アカウント情報から最新のアバターを取得
	avatar := "?"
	account, err := s.accountRepo.GetByID(userID)
	if err == nil && account != nil {
		avatar = account.Avatar
	} else {
		// フォールバック: 名前の最初の文字を使用
		runes := []rune(userName)
		if len(runes) > 0 {
			avatar = string(runes[0])
		}
	}

	user := &models.User{
		ID:       userID,
		Name:     userName,
		Avatar:   avatar,
		Status:   "online",
		LastSeen: time.Now(),
	}

	// DBに保存
	if err := s.userRepo.CreateOrUpdate(user); err != nil {
		log.Printf("ユーザー保存エラー: %v\n", err)
	}

	s.wsClientsMu.Lock()
	s.wsClients[userID] = conn
	s.wsClientsMu.Unlock()

	log.Printf("WebSocket接続: %s (%s)\n", userName, userID)
	s.broadcastUserStatus(userID, "online")
}

func (s *ChatServer) cleanupConnection(userID, userName string, conn *websocket.Conn) {
	s.wsClientsMu.Lock()
	delete(s.wsClients, userID)
	s.wsClientsMu.Unlock()

	conn.Close()
	s.updateUserStatus(userID, "offline")
	log.Printf("WebSocket切断: %s (%s)\n", userName, userID)
}

func (s *ChatServer) messageLoop(userID string, conn *websocket.Conn) {
	for {
		conn.SetReadDeadline(time.Now().Add(120 * time.Second))

		_, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket読み取りエラー: %v\n", err)
			}
			break
		}

		var wsMsg models.WSMessage
		if err := json.Unmarshal(message, &wsMsg); err != nil {
			log.Printf("JSONパースエラー: %v\n", err)
			continue
		}

		s.handleWSMessage(userID, wsMsg)
	}
}

func (s *ChatServer) pingClient(userID string, conn *websocket.Conn) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.wsClientsMu.RLock()
			_, exists := s.wsClients[userID]
			s.wsClientsMu.RUnlock()

			if !exists {
				return
			}

			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Printf("Ping送信エラー (%s): %v\n", userID, err)
				return
			}
		}
	}
}

func (s *ChatServer) handleWSMessage(fromUserID string, wsMsg models.WSMessage) {
	switch wsMsg.Type {
	case "message":
		s.handleChatMessage(fromUserID, wsMsg.Payload)
	case "read":
		s.handleReadReceipt(wsMsg.Payload)
	case "disconnect":
		s.updateUserStatus(fromUserID, "offline")
	case "ping":
		// クライアントからのpingは無視
	}
}

func (s *ChatServer) handleChatMessage(fromUserID string, payload json.RawMessage) {
	var msgData struct {
		FromID  string `json:"fromId"`
		ToID    string `json:"toId"`
		Content string `json:"content"`
		Type    string `json:"type"`
	}

	if err := json.Unmarshal(payload, &msgData); err != nil {
		log.Printf("メッセージパースエラー: %v\n", err)
		return
	}

	msg := models.Message{
		ID:        uuid.New().String(),
		FromID:    fromUserID,
		ToID:      msgData.ToID,
		Content:   msgData.Content,
		Type:      msgData.Type,
		Timestamp: time.Now(),
		Read:      false,
	}

	// DBに保存
	if err := s.messageRepo.Create(&msg); err != nil {
		log.Printf("メッセージ保存エラー: %v\n", err)
		return
	}

	log.Printf("メッセージ: %s -> %s: %s\n", fromUserID, msgData.ToID, msgData.Content)

	s.sendToUser(fromUserID, "message_sent", msg)
	s.sendToUser(msgData.ToID, "new_message", msg)
}

func (s *ChatServer) handleReadReceipt(payload json.RawMessage) {
	var receipt struct {
		MessageID string `json:"messageId"`
		OtherID   string `json:"otherId"`
		UserID    string `json:"userId"`
	}

	if err := json.Unmarshal(payload, &receipt); err != nil {
		log.Printf("既読パースエラー: %v\n", err)
		return
	}

	// DBで既読更新
	if err := s.messageRepo.MarkAsRead(receipt.MessageID); err != nil {
		log.Printf("既読更新エラー: %v\n", err)
		return
	}

	s.sendToUser(receipt.OtherID, "message_read", map[string]string{
		"messageId": receipt.MessageID,
	})
}

func (s *ChatServer) sendToUser(userID, msgType string, payload interface{}) {
	s.wsClientsMu.RLock()
	conn, ok := s.wsClients[userID]
	s.wsClientsMu.RUnlock()

	if !ok {
		return
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return
	}

	wsMsg := struct {
		Type    string          `json:"type"`
		Payload json.RawMessage `json:"payload"`
	}{
		Type:    msgType,
		Payload: payloadBytes,
	}

	conn.WriteJSON(wsMsg)
}

func (s *ChatServer) updateUserStatus(userID, status string) {
	if err := s.userRepo.UpdateStatus(userID, status); err != nil {
		log.Printf("ステータス更新エラー: %v\n", err)
	}

	s.broadcastUserStatus(userID, status)
}

func (s *ChatServer) broadcastUserStatus(userID, status string) {
	s.wsClientsMu.RLock()
	defer s.wsClientsMu.RUnlock()

	statusMsg := map[string]string{
		"userId": userID,
		"status": status,
	}

	for id, conn := range s.wsClients {
		if id != userID {
			payloadBytes, _ := json.Marshal(statusMsg)
			wsMsg := struct {
				Type    string          `json:"type"`
				Payload json.RawMessage `json:"payload"`
			}{
				Type:    "user_status",
				Payload: payloadBytes,
			}
			conn.WriteJSON(wsMsg)
		}
	}
}
