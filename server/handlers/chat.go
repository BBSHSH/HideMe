package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"server/models"

	"github.com/google/uuid"
)

var (
	messages      = make(map[string][]*models.Message) // roomID -> messages
	messagesMutex sync.RWMutex
)

// HandleWebSocket handles WebSocket connections
func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	userID := r.URL.Query().Get("userId")
	if userID == "" {
		conn.Close()
		return
	}

	// ユーザーにWebSocket接続を設定
	usersMutex.Lock()
	if user, exists := users[userID]; exists {
		user.Conn = conn
		user.Status = "online"
	}
	usersMutex.Unlock()

	// 他のユーザーに通知
	broadcastUserStatus(userID, "online")

	// メッセージ受信ループ
	defer func() {
		UpdateUserStatus(userID, "offline")
		broadcastUserStatus(userID, "offline")
		conn.Close()
	}()

	for {
		var wsMsg models.WSMessage
		err := conn.ReadJSON(&wsMsg)
		if err != nil {
			log.Printf("Read error: %v", err)
			break
		}

		handleWSMessage(userID, &wsMsg)
	}
}

// handleWSMessage processes incoming WebSocket messages
func handleWSMessage(userID string, wsMsg *models.WSMessage) {
	switch wsMsg.Type {
	case "message":
		handleChatMessage(userID, wsMsg.Payload)
	case "call-offer":
		handleCallOffer(userID, wsMsg.Payload)
	case "call-answer":
		handleCallAnswer(userID, wsMsg.Payload)
	case "ice-candidate":
		handleICECandidate(userID, wsMsg.Payload)
	case "typing":
		handleTyping(userID, wsMsg.Payload)
	}
}

// handleChatMessage handles chat messages
func handleChatMessage(fromID string, payload interface{}) {
	data, _ := json.Marshal(payload)
	var msg models.Message
	json.Unmarshal(data, &msg)

	msg.ID = uuid.New().String()
	msg.FromID = fromID
	msg.Timestamp = time.Now()
	msg.Read = false

	// メッセージを保存
	roomID := getRoomID(msg.FromID, msg.ToID)
	messagesMutex.Lock()
	messages[roomID] = append(messages[roomID], &msg)
	messagesMutex.Unlock()

	// 受信者に送信
	sendToUser(msg.ToID, models.WSMessage{
		Type:    "message",
		Payload: msg,
	})

	log.Printf("Message from %s to %s: %s", msg.FromID, msg.ToID, msg.Content)
}

// GetMessages returns messages for a room
func GetMessages(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	otherID := r.URL.Query().Get("otherUserId")

	roomID := getRoomID(userID, otherID)

	messagesMutex.RLock()
	roomMessages := messages[roomID]
	messagesMutex.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(roomMessages)
}

// sendToUser sends a message to a specific user
func sendToUser(userID string, msg models.WSMessage) {
	usersMutex.RLock()
	user, exists := users[userID]
	usersMutex.RUnlock()

	if exists && user.Conn != nil {
		if err := user.Conn.WriteJSON(msg); err != nil {
			log.Printf("Error sending to user %s: %v", userID, err)
		}
	}
}

// broadcastUserStatus broadcasts user status change to all users
func broadcastUserStatus(userID, status string) {
	msg := models.WSMessage{
		Type: "user-status",
		Payload: map[string]string{
			"userId": userID,
			"status": status,
		},
	}

	usersMutex.RLock()
	defer usersMutex.RUnlock()

	for id, user := range users {
		if id != userID && user.Conn != nil {
			user.Conn.WriteJSON(msg)
		}
	}
}

// getRoomID generates a consistent room ID for two users
func getRoomID(user1, user2 string) string {
	if user1 < user2 {
		return user1 + "_" + user2
	}
	return user2 + "_" + user1
}

// handleTyping handles typing indicator
func handleTyping(fromID string, payload interface{}) {
	data, _ := json.Marshal(payload)
	var typingData map[string]string
	json.Unmarshal(data, &typingData)

	toID := typingData["toId"]
	sendToUser(toID, models.WSMessage{
		Type: "typing",
		Payload: map[string]string{
			"fromId": fromID,
		},
	})
}
