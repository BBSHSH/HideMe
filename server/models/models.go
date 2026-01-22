package models

import (
	"encoding/json"
	"time"
)

// Account アカウント情報
type Account struct {
	ID           string     `json:"id"`
	Username     string     `json:"username"`
	PasswordHash string     `json:"-"`
	DisplayName  string     `json:"displayName"`
	Avatar       string     `json:"avatar"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	LastLogin    *time.Time `json:"lastLogin,omitempty"`
}

// User ユーザー情報（オンラインステータス用）
type User struct {
	ID       string    `json:"id"`
	Name     string    `json:"name"`
	Avatar   string    `json:"avatar"`
	Status   string    `json:"status"`
	LastSeen time.Time `json:"lastSeen"`
}

// Message メッセージ
type Message struct {
	ID        string    `json:"id"`
	FromID    string    `json:"fromId"`
	ToID      string    `json:"toId"`
	Content   string    `json:"content"`
	Type      string    `json:"type"`
	Timestamp time.Time `json:"timestamp"`
	Read      bool      `json:"read"`
}

// WSMessage WebSocketメッセージ
type WSMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

// Session セッション情報
type Session struct {
	Token     string    `json:"token"`
	UserID    string    `json:"userId"`
	CreatedAt time.Time `json:"createdAt"`
	ExpiresAt time.Time `json:"expiresAt"`
}
