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

	if userName == "" {
		userName = "Unknown"
	}

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
	avatar := "?"
	runes := []rune(userName)
	if len(runes) > 0 {
		avatar = string(runes[0])
	}

	s.usersMutex.Lock()
	s.users[userID] = &models.User{
		ID:       userID,
		Name:     userName,
		Avatar:   avatar,
		Status:   "online",
		LastSeen: time.Now(),
	}
	s.usersMutex.Unlock()

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

	conversationID := s.getConversationID(fromUserID, msgData.ToID)
	s.msgMutex.Lock()
	s.messages[conversationID] = append(s.messages[conversationID], msg)
	s.msgMutex.Unlock()

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

	conversationID := s.getConversationID(receipt.UserID, receipt.OtherID)
	s.msgMutex.Lock()
	for i := range s.messages[conversationID] {
		if s.messages[conversationID][i].ID == receipt.MessageID {
			s.messages[conversationID][i].Read = true
			break
		}
	}
	s.msgMutex.Unlock()

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
	s.usersMutex.Lock()
	if user, ok := s.users[userID]; ok {
		user.Status = status
		user.LastSeen = time.Now()
	}
	s.usersMutex.Unlock()

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
