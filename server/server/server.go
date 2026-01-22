package server

import (
	"context"
	"fmt"
	"hidemeserver/repository"
	"hidemeserver/tsnet"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type ChatServer struct {
	tsnet       *tsnet.TsnetManager
	db          *repository.Database
	accountRepo *repository.AccountRepository
	sessionRepo *repository.SessionRepository
	userRepo    *repository.UserRepository
	messageRepo *repository.MessageRepository
	auditRepo   *repository.AuditRepository
	wsClients   map[string]*websocket.Conn
	wsClientsMu sync.RWMutex
	upgrader    websocket.Upgrader
}

func NewChatServer(hostname, dbPath string) (*ChatServer, error) {
	db, err := repository.NewDatabase(dbPath)
	if err != nil {
		return nil, fmt.Errorf("データベース初期化エラー: %v", err)
	}

	server := &ChatServer{
		tsnet:       tsnet.NewTsnetManager(),
		db:          db,
		accountRepo: repository.NewAccountRepository(db),
		sessionRepo: repository.NewSessionRepository(db),
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
	}

	go server.cleanupExpiredSessions()

	return server, nil
}

func (s *ChatServer) Start(ctx context.Context, hostname string) error {
	if err := s.tsnet.Start(ctx, hostname); err != nil {
		return fmt.Errorf("tsnet起動エラー: %v", err)
	}

	mux := s.setupRoutes()
	
	// CORSミドルウェアを適用
	handler := corsMiddleware(mux)

	listener, err := s.tsnet.Listen("tcp", ":8080")
	if err != nil {
		return fmt.Errorf("リスナー作成エラー: %v", err)
	}

	log.Println("チャットサーバー起動中 (tsnet経由でポート8080)")
	return http.Serve(listener, handler)
}

func (s *ChatServer) setupRoutes() *http.ServeMux {
	mux := http.NewServeMux()

	// 認証系API
	mux.HandleFunc("/api/auth/register", s.handleRegister)
	mux.HandleFunc("/api/auth/login", s.handleLogin)
	mux.HandleFunc("/api/auth/logout", s.handleLogout)
	mux.HandleFunc("/api/auth/verify", s.handleVerify)

	// 既存API
	mux.HandleFunc("/api/users", s.handleGetUsers)
	mux.HandleFunc("/api/messages", s.handleMessages)
	mux.HandleFunc("/api/unread", s.handleUnreadCount)
	mux.HandleFunc("/api/gdpr/export", s.handleGDPRExport)
	mux.HandleFunc("/api/gdpr/delete", s.handleGDPRDelete)
	mux.HandleFunc("/ws", s.handleWebSocket)
	mux.HandleFunc("/health", s.handleHealth)

	return mux
}

func (s *ChatServer) cleanupExpiredSessions() {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		if err := s.sessionRepo.CleanupExpired(); err != nil {
			log.Printf("セッションクリーンアップエラー: %v", err)
		}
	}
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
