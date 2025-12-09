package app

import (
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

// ChatApp はチャットアプリケーションのメインクラス
type ChatApp struct {
	ctx        context.Context
	wsConn     *websocket.Conn
	userID     string
	userName   string
	tsnetURL   string
	httpClient *http.Client
}

// User ユーザー情報
type User struct {
	ID       string    `json:"id"`
	Name     string    `json:"name"`
	Avatar   string    `json:"avatar"`
	Status   string    `json:"status"`
	LastSeen time.Time `json:"lastSeen"`
}

// Message メッセージ情報
type Message struct {
	ID        string    `json:"id"`
	FromID    string    `json:"fromId"`
	ToID      string    `json:"toId"`
	Content   string    `json:"content"`
	Type      string    `json:"type"`
	Timestamp time.Time `json:"timestamp"`
	Read      bool      `json:"read"`
}

// WSMessage WebSocket経由のメッセージ
type WSMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// NewChatApp ChatAppの新規作成
func NewChatApp() *ChatApp {
	return &ChatApp{
		tsnetURL: "http://localhost:9000",
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// Startup アプリケーション起動時の初期化
func (c *ChatApp) Startup(ctx context.Context) {
	c.ctx = ctx
}

// CheckConnection tsnetプロキシへの接続確認
func (c *ChatApp) CheckConnection() error {
	resp, err := c.httpClient.Get(c.tsnetURL + "/health")
	if err != nil {
		return fmt.Errorf("tsnetプロキシに接続できません (localhost:9000): %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("tsnetプロキシが正常に応答しません:  status %d", resp.StatusCode)
	}

	return nil
}

// SetUserName ユーザー名を設定（ローカルのみ、サーバー登録なし）
func (c *ChatApp) SetUserName(name string) error {
	// まずtsnetプロキシへの接続を確認
	if err := c.CheckConnection(); err != nil {
		return err
	}

	// ローカルでユーザー情報を設定
	c.userID = uuid.New().String()
	c.userName = name

	return nil
}

// ConnectWebSocket WebSocket接続
func (c *ChatApp) ConnectWebSocket() error {
	// ユーザー名をクエリパラメータに含める
	wsURL := fmt.Sprintf("ws://localhost:9000/ws?userId=%s&userName=%s", c.userID, c.userName)

	dialer := websocket.Dialer{
		HandshakeTimeout: 10 * time.Second,
	}

	conn, _, err := dialer.Dial(wsURL, nil)
	if err != nil {
		return fmt.Errorf("WebSocket接続エラー: %v", err)
	}

	c.wsConn = conn

	go c.keepAlive()
	go c.receiveMessages()

	return nil
}

// keepAlive コネクション維持用のPing送信
func (c *ChatApp) keepAlive() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if c.wsConn == nil {
				return
			}
			if err := c.wsConn.WriteMessage(websocket.PingMessage, nil); err != nil {
				fmt.Printf("Ping送信エラー: %v\n", err)
				return
			}
		}
	}
}

// receiveMessages WebSocketからのメッセージ受信
func (c *ChatApp) receiveMessages() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("receiveMessages panic: %v\n", r)
		}
	}()

	for {
		if c.wsConn == nil {
			return
		}

		var wsMsg WSMessage
		err := c.wsConn.ReadJSON(&wsMsg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				fmt.Printf("WebSocket read error: %v\n", err)
			}
			c.reconnect()
			return
		}

		c.emitEvent(wsMsg.Type, wsMsg.Payload)
	}
}

// emitEvent フロントエンドにイベントを送信
func (c *ChatApp) emitEvent(eventType string, payload interface{}) {
	if c.ctx == nil {
		return
	}
	runtime.EventsEmit(c.ctx, eventType, payload)
}

// reconnect 再接続処理
func (c *ChatApp) reconnect() {
	for i := 0; i < 5; i++ {
		time.Sleep(time.Duration(i+1) * 2 * time.Second)
		fmt.Printf("再接続試行 %d/5.. .\n", i+1)

		if err := c.ConnectWebSocket(); err == nil {
			fmt.Println("再接続成功")
			return
		}
	}
	fmt.Println("再接続失敗")
	c.emitEvent("connection_lost", nil)
}

// SendMessage メッセージ送信
func (c *ChatApp) SendMessage(toID, content string) error {
	if c.wsConn == nil {
		return fmt.Errorf("WebSocketが接続されていません")
	}

	msg := Message{
		FromID:  c.userID,
		ToID:    toID,
		Content: content,
		Type:    "text",
	}

	wsMsg := WSMessage{
		Type:    "message",
		Payload: msg,
	}

	if err := c.wsConn.WriteJSON(wsMsg); err != nil {
		return fmt.Errorf("メッセージ送信エラー: %v", err)
	}

	return nil
}

// MarkAsRead 既読を送信
func (c *ChatApp) MarkAsRead(messageID, otherID string) error {
	if c.wsConn == nil {
		return fmt.Errorf("WebSocketが接続されていません")
	}

	receipt := map[string]string{
		"messageId": messageID,
		"otherId":   otherID,
		"userId":    c.userID,
	}

	wsMsg := WSMessage{
		Type:    "read",
		Payload: receipt,
	}

	if err := c.wsConn.WriteJSON(wsMsg); err != nil {
		return fmt.Errorf("既読送信エラー: %v", err)
	}

	return nil
}

// GetUsers ユーザー一覧取得
func (c *ChatApp) GetUsers() ([]User, error) {
	resp, err := c.httpClient.Get(c.tsnetURL + "/api/users")
	if err != nil {
		return nil, fmt.Errorf("ユーザー取得エラー: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("ユーザー取得失敗 (status %d): %s", resp.StatusCode, string(body))
	}

	var users []User
	if err := json.NewDecoder(resp.Body).Decode(&users); err != nil {
		return nil, fmt.Errorf("ユーザーデコードエラー: %v", err)
	}

	// 自分自身を除外
	filteredUsers := make([]User, 0)
	for _, user := range users {
		if user.ID != c.userID {
			filteredUsers = append(filteredUsers, user)
		}
	}

	return filteredUsers, nil
}

// GetMessages メッセージ履歴取得
func (c *ChatApp) GetMessages(otherUserID string) ([]Message, error) {
	url := fmt.Sprintf("%s/api/messages? userId=%s&otherUserId=%s", c.tsnetURL, c.userID, otherUserID)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("メッセージ取得エラー: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("メッセージ取得失敗 (status %d): %s", resp.StatusCode, string(body))
	}

	body, _ := io.ReadAll(resp.Body)

	var messages []Message
	if len(body) > 0 && string(body) != "null" {
		if err := json.Unmarshal(body, &messages); err != nil {
			return nil, fmt.Errorf("メッセージデコードエラー: %v", err)
		}
	}

	if messages == nil {
		messages = []Message{}
	}

	return messages, nil
}

// GetUserID 現在のユーザーIDを取得
func (c *ChatApp) GetUserID() string {
	return c.userID
}

// GetUserName 現在のユーザー名を取得
func (c *ChatApp) GetUserName() string {
	return c.userName
}

// Disconnect 切断処理
func (c *ChatApp) Disconnect() {
	if c.wsConn != nil {
		wsMsg := WSMessage{
			Type: "disconnect",
			Payload: map[string]string{
				"userId": c.userID,
			},
		}
		c.wsConn.WriteJSON(wsMsg)
		c.wsConn.Close()
		c.wsConn = nil
	}
}

// Shutdown アプリケーション終了時の処理
func (c *ChatApp) Shutdown(ctx context.Context) {
	c.Disconnect()
}
