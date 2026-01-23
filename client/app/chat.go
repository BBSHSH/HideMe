package app

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type ChatApp struct {
	ctx        context.Context
	wsConn     *websocket.Conn
	userID     string
	userName   string
	tsnetURL   string
	httpClient *http.Client
}

type User struct {
	ID       string    `json:"id"`
	Name     string    `json:"name"`
	Avatar   string    `json:"avatar"`
	Status   string    `json:"status"`
	LastSeen time.Time `json:"lastSeen"`
}

type Group struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Avatar      string    `json:"avatar"`
	Members     []string  `json:"members"`
	CreatedBy   string    `json:"createdBy"`
	CreatedAt   time.Time `json:"createdAt"`
	Description string    `json:"description"`
}

type Message struct {
	ID        string    `json:"id"`
	FromID    string    `json:"fromId"`
	ToID      string    `json:"toId"`
	GroupID   string    `json:"groupId,omitempty"`
	Content   string    `json:"content"`
	Type      string    `json:"type"`
	Timestamp time.Time `json:"timestamp"`
	Read      bool      `json:"read"`
}

type Call struct {
	ID            string                 `json:"id"`
	CallerID      string                 `json:"callerId"`
	CalleeID      string                 `json:"calleeId"`
	GroupID       string                 `json:"groupId,omitempty"`
	Type          string                 `json:"type"`
	Status        string                 `json:"status"`
	StartTime     time.Time              `json:"startTime"`
	Participants  []string               `json:"participants"`
	SignalingData map[string]interface{} `json:"signalingData,omitempty"`
}

type WSMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

func NewChatApp() *ChatApp {
	return &ChatApp{
		tsnetURL: "http://localhost:9000",
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *ChatApp) Startup(ctx context.Context) {
	c.ctx = ctx
}

func (c *ChatApp) CheckConnection() error {
	resp, err := c.httpClient.Get(c.tsnetURL + "/health")
	if err != nil {
		return fmt.Errorf("tsnetプロキシに接続できません (localhost:9000): %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("tsnetプロキシが正常に応答しません: status %d", resp.StatusCode)
	}

	return nil
}

func (c *ChatApp) SetUserName(name string, userID string) error {
	if err := c.CheckConnection(); err != nil {
		return err
	}

	if userID == "" {
		return fmt.Errorf("ログインが必要です: userIDが指定されていません")
	}

	c.userID = userID
	c.userName = name

	return nil
}

func (c *ChatApp) ConnectWebSocket() error {
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

func (c *ChatApp) emitEvent(eventType string, payload interface{}) {
	if c.ctx == nil {
		return
	}
	runtime.EventsEmit(c.ctx, eventType, payload)
}

func (c *ChatApp) reconnect() {
	for i := 0; i < 5; i++ {
		time.Sleep(time.Duration(i+1) * 2 * time.Second)
		fmt.Printf("再接続試行 %d/5...\n", i+1)

		if err := c.ConnectWebSocket(); err == nil {
			fmt.Println("再接続成功")
			return
		}
	}
	fmt.Println("再接続失敗")
	c.emitEvent("connection_lost", nil)
}

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

func (c *ChatApp) SendGroupMessage(groupID, content string) error {
	if c.wsConn == nil {
		return fmt.Errorf("WebSocketが接続されていません")
	}

	msg := map[string]string{
		"fromId":  c.userID,
		"groupId": groupID,
		"content": content,
		"type":    "text",
	}

	wsMsg := WSMessage{
		Type:    "group_message",
		Payload: msg,
	}

	if err := c.wsConn.WriteJSON(wsMsg); err != nil {
		return fmt.Errorf("グループメッセージ送信エラー: %v", err)
	}

	return nil
}

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

func (c *ChatApp) InitiateCall(calleeID, callType string) error {
	if c.wsConn == nil {
		return fmt.Errorf("WebSocketが接続されていません")
	}

	callData := map[string]string{
		"calleeId": calleeID,
		"type":     callType,
	}

	wsMsg := WSMessage{
		Type:    "call_initiate",
		Payload: callData,
	}

	if err := c.wsConn.WriteJSON(wsMsg); err != nil {
		return fmt.Errorf("通話開始エラー: %v", err)
	}

	return nil
}

func (c *ChatApp) AnswerCall(callID string) error {
	if c.wsConn == nil {
		return fmt.Errorf("WebSocketが接続されていません")
	}

	wsMsg := WSMessage{
		Type:    "call_answer",
		Payload: map[string]string{"callId": callID},
	}

	if err := c.wsConn.WriteJSON(wsMsg); err != nil {
		return fmt.Errorf("通話応答エラー: %v", err)
	}

	return nil
}

func (c *ChatApp) RejectCall(callID string) error {
	if c.wsConn == nil {
		return fmt.Errorf("WebSocketが接続されていません")
	}

	wsMsg := WSMessage{
		Type:    "call_reject",
		Payload: map[string]string{"callId": callID},
	}

	if err := c.wsConn.WriteJSON(wsMsg); err != nil {
		return fmt.Errorf("通話拒否エラー: %v", err)
	}

	return nil
}

func (c *ChatApp) EndCall(callID string) error {
	if c.wsConn == nil {
		return fmt.Errorf("WebSocketが接続されていません")
	}

	wsMsg := WSMessage{
		Type:    "call_end",
		Payload: map[string]string{"callId": callID},
	}

	if err := c.wsConn.WriteJSON(wsMsg); err != nil {
		return fmt.Errorf("通話終了エラー: %v", err)
	}

	return nil
}

func (c *ChatApp) SendWebRTCSignal(callID, toID string, signal map[string]interface{}) error {
	if c.wsConn == nil {
		return fmt.Errorf("WebSocketが接続されていません")
	}

	wsMsg := WSMessage{
		Type: "webrtc_signal",
		Payload: map[string]interface{}{
			"callId": callID,
			"toId":   toID,
			"signal": signal,
		},
	}

	if err := c.wsConn.WriteJSON(wsMsg); err != nil {
		return fmt.Errorf("WebRTCシグナル送信エラー: %v", err)
	}

	return nil
}

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

	filteredUsers := make([]User, 0)
	for _, user := range users {
		if user.ID != c.userID {
			filteredUsers = append(filteredUsers, user)
		}
	}

	return filteredUsers, nil
}

func (c *ChatApp) GetGroups() ([]Group, error) {
	url := fmt.Sprintf("%s/api/groups?userId=%s", c.tsnetURL, c.userID)
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("グループ取得エラー: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("グループ取得失敗")
	}

	var groups []Group
	if err := json.NewDecoder(resp.Body).Decode(&groups); err != nil {
		return nil, fmt.Errorf("グループデコードエラー: %v", err)
	}

	return groups, nil
}

func (c *ChatApp) CreateGroup(name, description string, members []string) (*Group, error) {
	reqBody := map[string]interface{}{
		"name":        name,
		"description": description,
		"members":     append(members, c.userID),
		"createdBy":   c.userID,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Post(c.tsnetURL+"/api/groups/create", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("グループ作成エラー: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("グループ作成失敗")
	}

	var group Group
	if err := json.NewDecoder(resp.Body).Decode(&group); err != nil {
		return nil, err
	}

	return &group, nil
}

func (c *ChatApp) GetMessages(otherUserID string) ([]Message, error) {
	url := fmt.Sprintf("%s/api/messages?userId=%s&otherUserId=%s", c.tsnetURL, c.userID, otherUserID)

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

func (c *ChatApp) GetGroupMessages(groupID string) ([]Message, error) {
	url := fmt.Sprintf("%s/api/groups/messages?groupId=%s", c.tsnetURL, groupID)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("グループメッセージ取得エラー: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("グループメッセージ取得失敗")
	}

	body, _ := io.ReadAll(resp.Body)

	var messages []Message
	if len(body) > 0 && string(body) != "null" {
		if err := json.Unmarshal(body, &messages); err != nil {
			return nil, err
		}
	}

	if messages == nil {
		messages = []Message{}
	}

	return messages, nil
}

func (c *ChatApp) GetUserID() string {
	return c.userID
}

func (c *ChatApp) GetUserName() string {
	return c.userName
}

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

func (c *ChatApp) Shutdown(ctx context.Context) {
	c.Disconnect()
}
