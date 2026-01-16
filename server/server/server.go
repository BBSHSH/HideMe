package server

import (
	"context"
	"fmt"
	"hidemeserver/models"
	"hidemeserver/tsnet"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type ChatServer struct {
	tsnet       *tsnet.TsnetManager
	users       map[string]*models.User
	usersMutex  sync.RWMutex
	messages    map[string][]models.Message
	msgMutex    sync.RWMutex
	wsClients   map[string]*websocket.Conn
	wsClientsMu sync.RWMutex
	upgrader    websocket.Upgrader
}

func NewChatServer(hostname string) *ChatServer {
	return &ChatServer{
		tsnet:     tsnet.NewTsnetManager(),
		users:     make(map[string]*models.User),
		messages:  make(map[string][]models.Message),
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

func (s *ChatServer) Start(ctx context.Context, hostname string) error {
	// tsnet起動
	if err := s.tsnet.Start(ctx, hostname); err != nil {
		return fmt.Errorf("tsnet起動エラー: %v", err)
	}

	// HTTPサーバー設定
	mux := s.setupRoutes()

	listener, err := s.tsnet.Listen("tcp", ":8080")
	if err != nil {
		return fmt.Errorf("リスナー作成エラー: %v", err)
	}

	log.Println("チャットサーバー起動中 (tsnet経由でポート8080)")
	return http.Serve(listener, mux)
}

func (s *ChatServer) setupRoutes() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/users", s.handleGetUsers)
	mux.HandleFunc("/api/messages", s.handleMessages)
	mux.HandleFunc("/ws", s.handleWebSocket)
	mux.HandleFunc("/health", s.handleHealth)
	return mux
}

func (s *ChatServer) Close() {
	s.wsClientsMu.Lock()
	for _, conn := range s.wsClients {
		conn.Close()
	}
	s.wsClientsMu.Unlock()

	if s.tsnet != nil {
		s.tsnet.Stop()
	}
}

// ヘルパー関数
func (s *ChatServer) getConversationID(userID1, userID2 string) string {
	if userID1 < userID2 {
		return userID1 + ":" + userID2
	}
	return userID2 + ":" + userID1
}
