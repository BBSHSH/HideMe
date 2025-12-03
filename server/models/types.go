package models

import (
	"time"

	"github.com/gorilla/websocket"
)

// User represents a connected user
type User struct {
	ID       string          `json:"id"`
	Name     string          `json:"name"`
	Avatar   string          `json:"avatar"`
	Status   string          `json:"status"` // online, offline, busy
	Conn     *websocket.Conn `json:"-"`
	LastSeen time.Time       `json:"lastSeen"`
}

// Message represents a chat message
type Message struct {
	ID        string    `json:"id"`
	FromID    string    `json:"fromId"`
	ToID      string    `json:"toId"`
	Content   string    `json:"content"`
	Type      string    `json:"type"` // text, image, file, call
	Timestamp time.Time `json:"timestamp"`
	Read      bool      `json:"read"`
}

// ChatRoom represents a conversation
type ChatRoom struct {
	ID           string    `json:"id"`
	Participants []string  `json:"participants"`
	LastMessage  *Message  `json:"lastMessage"`
	CreatedAt    time.Time `json:"createdAt"`
}

// CallOffer represents a WebRTC call offer
type CallOffer struct {
	FromID string `json:"fromId"`
	ToID   string `json:"toId"`
	SDP    string `json:"sdp"`
	Type   string `json:"type"` // offer, answer, ice-candidate
}

// WSMessage represents a WebSocket message
type WSMessage struct {
	Type    string      `json:"type"` // message, call-offer, call-answer, user-status
	Payload interface{} `json:"payload"`
}
