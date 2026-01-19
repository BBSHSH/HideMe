package server

import (
	"context"
	"fmt"
	"hidemeserver/repository"
	"hidemeserver/tsnet"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type ChatServer struct {
	tsnet       *tsnet.TsnetManager
	db          *repository.Database
	userRepo    *repository.UserRepository
	messageRepo *repository.MessageRepository
	auditRepo   *repository.AuditRepository
	wsClients   map[string]*websocket.Conn
	wsClientsMu sync.RWMutex
	upgrader    websocket.Upgrader
}

func NewChatServer(hostname, dbDSN string) (*ChatServer, error) {
	// データベース初期化
	db, err := repository.NewDatabase(dbDSN)
	if err != nil {
		return nil, fmt.Errorf("データベース初期化エラー: %v", err)
	}

	return &ChatServer{
		tsnet:       tsnet.NewTsnetManager(),
		db:          db,
		userRepo:    repository.NewUserRepository(db),
		messageRepo: repository.NewMessageRepository(db),
		auditRepo:   repository.NewAuditRepository(db),
		wsClients:   make(map[string]*websocket.Conn),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
		},
	}, nil
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
	mux.HandleFunc("/api/unread", s.handleUnreadCount)
	mux.HandleFunc("/api/gdpr/export", s.handleGDPRExport)
	mux.HandleFunc("/api/gdpr/delete", s.handleGDPRDelete)
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

	if s.db != nil {
		s.db.Close()
	}

	if s.tsnet != nil {
		s.tsnet.Stop()
	}
}
