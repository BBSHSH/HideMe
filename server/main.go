package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"tailscale.com/tsnet"
)

// ChatServer チャットサーバー
type ChatServer struct {
	tsnetServer *tsnet.Server
	users       map[string]*User
	usersMutex  sync.RWMutex
	messages    map[string][]Message
	msgMutex    sync.RWMutex
	wsClients   map[string]*websocket.Conn
	wsClientsMu sync.RWMutex
	upgrader    websocket.Upgrader
}

// User ユーザー情報
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

// NewChatServer サーバー作成
func NewChatServer(hostname string) *ChatServer {
	return &ChatServer{
		tsnetServer: &tsnet.Server{
			Hostname: hostname,
			Dir:      "./tsnet-server-state",
		},
		users:     make(map[string]*User),
		messages:  make(map[string][]Message),
		wsClients: make(map[string]*websocket.Conn),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
		},
	}
}

// Start サーバーを起動
func (s *ChatServer) Start() error {
	status, err := s.tsnetServer.Up(context.Background())
	if err != nil {
		return fmt.Errorf("tsnet起動エラー: %v", err)
	}
	log.Printf("Tsnetサーバー起動完了: %s (%s)\n", s.tsnetServer.Hostname, status.TailscaleIPs[0])

	mux := http.NewServeMux()
	mux.HandleFunc("/api/users", s.handleGetUsers)
	mux.HandleFunc("/api/messages", s.handleMessages)
	mux.HandleFunc("/ws", s.handleWebSocket)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	listener, err := s.tsnetServer.Listen("tcp", ":8080")
	if err != nil {
		return fmt.Errorf("リスナー作成エラー: %v", err)
	}

	log.Println("チャットサーバー起動中 (tsnet経由でポート8080)")

	return http.Serve(listener, mux)
}

// handleGetUsers ユーザー一覧取得
func (s *ChatServer) handleGetUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	s.usersMutex.RLock()
	users := make([]*User, 0, len(s.users))
	for _, user := range s.users {
		users = append(users, user)
	}
	s.usersMutex.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

// handleMessages メッセージ取得
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

	conversationID := s.getConversationID(userID, otherUserID)

	s.msgMutex.RLock()
	msgs := s.messages[conversationID]
	s.msgMutex.RUnlock()

	if msgs == nil {
		msgs = []Message{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(msgs)
}

// getConversationID 会話IDを生成
func (s *ChatServer) getConversationID(userID1, userID2 string) string {
	if userID1 < userID2 {
		return userID1 + ":" + userID2
	}
	return userID2 + ":" + userID1
}

// handleWebSocket WebSocket接続
func (s *ChatServer) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	userName := r.URL.Query().Get("userName")

	if userID == "" {
		http.Error(w, "userId required", http.StatusBadRequest)
		return
	}

	// userNameが空の場合のデフォルト値
	if userName == "" {
		userName = "Unknown"
	}

	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocketアップグレードエラー: %v\n", err)
		return
	}

	// アバター生成（空文字チェック）
	avatar := "?"
	runes := []rune(userName)
	if len(runes) > 0 {
		avatar = string(runes[0])
	}

	// ユーザーを登録
	s.usersMutex.Lock()
	s.users[userID] = &User{
		ID:       userID,
		Name:     userName,
		Avatar:   avatar,
		Status:   "online",
		LastSeen: time.Now(),
	}
	s.usersMutex.Unlock()

	// 接続を保存
	s.wsClientsMu.Lock()
	s.wsClients[userID] = conn
	s.wsClientsMu.Unlock()

	log.Printf("WebSocket接続: %s (%s)\n", userName, userID)

	// 他のユーザーに通知
	s.broadcastUserStatus(userID, "online")

	defer func() {
		s.wsClientsMu.Lock()
		delete(s.wsClients, userID)
		s.wsClientsMu.Unlock()
		conn.Close()
		s.updateUserStatus(userID, "offline")
		log.Printf("WebSocket切断: %s (%s)\n", userName, userID)
	}()

	// Ping/Pongでコネクション維持
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(120 * time.Second))
		return nil
	})

	// Pingを定期的に送信
	go s.pingClient(userID, conn)

	// メッセージ受信ループ
	for {
		conn.SetReadDeadline(time.Now().Add(120 * time.Second))

		_, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket読み取りエラー: %v\n", err)
			}
			break
		}

		var wsMsg WSMessage
		if err := json.Unmarshal(message, &wsMsg); err != nil {
			log.Printf("JSONパースエラー: %v\n", err)
			continue
		}

		s.handleWSMessage(userID, wsMsg)
	}
}

// pingClient クライアントにPingを送信してコネクションを維持
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

// handleWSMessage WebSocketメッセージを処理
func (s *ChatServer) handleWSMessage(fromUserID string, wsMsg WSMessage) {
	switch wsMsg.Type {
	case "message":
		s.handleChatMessage(fromUserID, wsMsg.Payload)
	case "read":
		s.handleReadReceipt(wsMsg.Payload)
	case "disconnect":
		s.updateUserStatus(fromUserID, "offline")
	case "ping":
		// クライアントからのpingは無視（pongは自動で送られる）
	}
}

// handleChatMessage チャットメッセージを処理
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

	msg := Message{
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

	log.Printf("メッセージ: %s -> %s:  %s\n", fromUserID, msgData.ToID, msgData.Content)

	s.sendToUser(fromUserID, "message_sent", msg)
	s.sendToUser(msgData.ToID, "new_message", msg)
}

// handleReadReceipt 既読通知を処理
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

// sendToUser 特定のユーザーにメッセージを送信
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

// updateUserStatus ユーザーステータスを更新
func (s *ChatServer) updateUserStatus(userID, status string) {
	s.usersMutex.Lock()
	if user, ok := s.users[userID]; ok {
		user.Status = status
		user.LastSeen = time.Now()
	}
	s.usersMutex.Unlock()

	s.broadcastUserStatus(userID, status)
}

// broadcastUserStatus 全ユーザーにステータス変更を通知
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

// Close サーバーを終了
func (s *ChatServer) Close() {
	s.wsClientsMu.Lock()
	for _, conn := range s.wsClients {
		conn.Close()
	}
	s.wsClientsMu.Unlock()

	if s.tsnetServer != nil {
		s.tsnetServer.Close()
	}
}

func main() {
	hostname := flag.String("hostname", "chat-server", "tsnetホスト名")
	flag.Parse()

	server := NewChatServer(*hostname)

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("シャットダウン中...")
		server.Close()
		os.Exit(0)
	}()

	if err := server.Start(); err != nil {
		log.Fatalf("サーバー起動エラー: %v", err)
	}
}
