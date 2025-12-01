package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net"
	"sync"

	"tailscale.com/tsnet"
)

type Server struct {
	ts       *tsnet.Server
	clients  map[string]net.Conn
	clientMu sync.RWMutex
}

func NewServer(hostname string) (*Server, error) {
	ts := &tsnet.Server{
		Hostname: hostname,
		Dir:      "./tsnet-server-state", // state 保存先
		Logf:     log.Printf,
	}

	return &Server{
		ts:      ts,
		clients: make(map[string]net.Conn),
	}, nil
}

func (s *Server) Start(ctx context.Context, port string) error {
	// tsnet を起動（state がなければブラウザログインURLがログに出る）
	status, err := s.ts.Up(ctx)
	if err != nil {
		return fmt.Errorf("failed to bring up tsnet: %w", err)
	}

	log.Printf("Server started with Tailscale IPs: %v", status.TailscaleIPs)

	// TCPリスナーを作成
	ln, err := s.ts.Listen("tcp", ":"+port)
	if err != nil {
		return fmt.Errorf("failed to listen: %w", err)
	}
	defer ln.Close()

	log.Printf("Listening on port %s", port)

	for {
		conn, err := ln.Accept()
		if err != nil {
			log.Printf("Accept error: %v", err)
			continue
		}

		go s.handleClient(conn)
	}
}

func (s *Server) handleClient(conn net.Conn) {
	defer conn.Close()

	clientID := conn.RemoteAddr().String()
	log.Printf("New client connected: %s", clientID)

	s.clientMu.Lock()
	s.clients[clientID] = conn
	s.clientMu.Unlock()

	defer func() {
		s.clientMu.Lock()
		delete(s.clients, clientID)
		s.clientMu.Unlock()
		log.Printf("Client disconnected: %s", clientID)
	}()

	buf := make([]byte, 4096)
	for {
		n, err := conn.Read(buf)
		if err != nil {
			if err != io.EOF {
				log.Printf("Read error from %s: %v", clientID, err)
			}
			return
		}

		message := buf[:n]
		log.Printf("Received from %s: %s", clientID, string(message))

		s.broadcast(clientID, message)
	}
}

func (s *Server) broadcast(senderID string, message []byte) {
	s.clientMu.RLock()
	defer s.clientMu.RUnlock()

	for id, conn := range s.clients {
		if id != senderID {
			if _, err := conn.Write(message); err != nil {
				log.Printf("Failed to send to %s: %v", id, err)
			}
		}
	}
}

func main() {
	server, err := NewServer("my-relay-server")
	if err != nil {
		log.Fatalf("Failed to create server: %v", err)
	}

	ctx := context.Background()
	if err := server.Start(ctx, "8080"); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
