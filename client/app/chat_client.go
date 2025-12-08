package app

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type ChatApp struct {
	ctx       context.Context
	wsConn    *websocket.Conn
	userID    string
	userName  string
	serverURL string
}

type User struct {
	ID       string    `json:"id"`
	Name     string    `json:"name"`
	Avatar   string    `json:"avatar"`
	Status   string    `json:"status"`
	LastSeen time.Time `json:"lastSeen"`
}

type Message struct {
	ID        string    `json:"id"`
	FromID    string    `json:"fromId"`
	ToID      string    `json:"toId"`
	Content   string    `json:"content"`
	Type      string    `json:"type"`
	Timestamp time.Time `json:"timestamp"`
	Read      bool      `json:"read"`
}

type WSMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

func NewChatApp() *ChatApp {
	return &ChatApp{
		serverURL: "http://localhost:8080",
	}
}

func (c *ChatApp) Startup(ctx context.Context) {
	c.ctx = ctx
}

// RegisterUser registers the user with the server
func (c *ChatApp) RegisterUser(name string) error {
	c.userID = uuid.New().String()
	c.userName = name

	user := User{
		ID:     c.userID,
		Name:   name,
		Status: "online",
	}

	data, _ := json.Marshal(user)
	resp, err := http.Post(c.serverURL+"/api/users/register", "application/json", bytes.NewBuffer(data))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return nil
}

// ConnectWebSocket connects to the WebSocket server
func (c *ChatApp) ConnectWebSocket() error {
	wsURL := fmt.Sprintf("ws://localhost:8080/ws?userId=%s", c.userID)

	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		return err
	}

	c.wsConn = conn

	// メッセージ受信ループ
	go c.receiveMessages()

	return nil
}

// receiveMessages receives messages from WebSocket
func (c *ChatApp) receiveMessages() {
	for {
		var wsMsg WSMessage
		err := c.wsConn.ReadJSON(&wsMsg)
		if err != nil {
			fmt.Printf("WebSocket read error: %v\n", err)
			break
		}

		// フロントエンドにイベントを送信
		runtime.EventsEmit(c.ctx, wsMsg.Type, wsMsg.Payload)
	}
}

// SendMessage sends a message to another user
func (c *ChatApp) SendMessage(toID, content string) error {
	msg := Message{
		ToID:    toID,
		Content: content,
		Type:    "text",
	}

	wsMsg := WSMessage{
		Type:    "message",
		Payload: msg,
	}

	return c.wsConn.WriteJSON(wsMsg)
}

// GetUsers gets all users from the server
func (c *ChatApp) GetUsers() ([]User, error) {
	resp, err := http.Get(c.serverURL + "/api/users")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var users []User
	if err := json.NewDecoder(resp.Body).Decode(&users); err != nil {
		return nil, err
	}

	return users, nil
}

// GetMessages gets messages with another user
func (c *ChatApp) GetMessages(otherUserID string) ([]Message, error) {
	url := fmt.Sprintf("%s/api/messages?userId=%s&otherUserId=%s", c.serverURL, c.userID, otherUserID)

	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var messages []Message
	if len(body) > 0 && string(body) != "null" {
		if err := json.Unmarshal(body, &messages); err != nil {
			return nil, err
		}
	}

	return messages, nil
}

// Disconnect disconnects from the server
func (c *ChatApp) Disconnect() {
	if c.wsConn != nil {
		c.wsConn.Close()
	}
}
