package main

import (
	"context"
	"flag"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/gorilla/websocket"
	"tailscale.com/tsnet"
)

type TsnetProxy struct {
	tsnetServer    *tsnet.Server
	httpClient     *http.Client
	wsUpgrader     websocket.Upgrader
	serverHostname string
	localPort      int

	wsConns     map[string]*websocket.Conn
	wsConnMutex sync.RWMutex

	serverWS      *websocket.Conn
	serverWSMutex sync.Mutex
}

func NewTsnetProxy(hostname, serverHostname string, localPort int) *TsnetProxy {
	return &TsnetProxy{
		tsnetServer: &tsnet.Server{
			Hostname: hostname,
			Dir:      "./tsnet-state",
		},
		serverHostname: serverHostname,
		localPort:      localPort,

		wsConns: make(map[string]*websocket.Conn),
		wsUpgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
	}
}

func (p *TsnetProxy) Start() error {
	status, err := p.tsnetServer.Up(context.Background())
	if err != nil {
		return fmt.Errorf("tsnet起動エラー: %v", err)
	}
	log.Printf("tsnet 起動: %s (%s)\n", p.tsnetServer.Hostname, status.TailscaleIPs[0])

	p.httpClient = &http.Client{
		Transport: &http.Transport{
			DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
				return p.tsnetServer.Dial(ctx, network, addr)
			},
		},
		Timeout: 30 * time.Second,
	}

	mux := http.NewServeMux()

	// ヘルスチェック（フロント用）
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// ヘルスチェック（API互換）
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// API リクエスト
	mux.HandleFunc("/api/", p.handleAPIProxy)

	// WebSocket
	mux.HandleFunc("/ws", p.handleWebSocket)

	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", p.localPort),
		Handler: mux,
	}

	log.Printf("プロキシ起動: http://localhost:%d\n", p.localPort)
	return server.ListenAndServe()
}

func (p *TsnetProxy) handleAPIProxy(w http.ResponseWriter, r *http.Request) {
	targetURL := fmt.Sprintf("http://%s:8080%s", p.serverHostname, r.URL.String())

	req, err := http.NewRequest(r.Method, targetURL, r.Body)
	if err != nil {
		http.Error(w, "リクエスト作成エラー", http.StatusInternalServerError)
		return
	}

	for k, v := range r.Header {
		for _, vv := range v {
			req.Header.Add(k, vv)
		}
	}

	resp, err := p.httpClient.Do(req)
	if err != nil {
		http.Error(w, "サーバー接続エラー", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	for k, v := range resp.Header {
		for _, vv := range v {
			w.Header().Add(k, vv)
		}
	}

	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

func (p *TsnetProxy) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	userName := r.URL.Query().Get("userName")

	if userID == "" {
		http.Error(w, "userId必要", http.StatusBadRequest)
		return
	}

	conn, err := p.wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WSアップグレードエラー:", err)
		return
	}

	p.wsConnMutex.Lock()
	p.wsConns[userID] = conn
	p.wsConnMutex.Unlock()

	defer func() {
		p.wsConnMutex.Lock()
		delete(p.wsConns, userID)
		p.wsConnMutex.Unlock()
		conn.Close()
	}()

	if err := p.connectToServer(userID, userName); err != nil {
		log.Println("サーバーWS接続エラー:", err)
		return
	}

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}

		p.serverWSMutex.Lock()
		if p.serverWS != nil {
			p.serverWS.WriteMessage(websocket.TextMessage, msg)
		}
		p.serverWSMutex.Unlock()
	}
}

func (p *TsnetProxy) connectToServer(userID, userName string) error {
	p.serverWSMutex.Lock()
	defer p.serverWSMutex.Unlock()

	if p.serverWS != nil {
		if p.serverWS.WriteMessage(websocket.PingMessage, nil) == nil {
			return nil
		}
		p.serverWS.Close()
		p.serverWS = nil
	}

	wsDialer := websocket.Dialer{
		NetDialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
			return p.tsnetServer.Dial(ctx, network, addr)
		},
	}

	wsURL := fmt.Sprintf("ws://%s:8080/ws?userId=%s&userName=%s", p.serverHostname, userID, userName)
	conn, _, err := wsDialer.Dial(wsURL, nil)
	if err != nil {
		return err
	}

	p.serverWS = conn

	go p.forwardFromServer(userID)

	return nil
}

func (p *TsnetProxy) forwardFromServer(userID string) {
	for {
		p.serverWSMutex.Lock()
		ws := p.serverWS
		p.serverWSMutex.Unlock()

		if ws == nil {
			return
		}

		_, msg, err := ws.ReadMessage()
		if err != nil {
			p.serverWSMutex.Lock()
			p.serverWS.Close()
			p.serverWS = nil
			p.serverWSMutex.Unlock()
			return
		}

		p.wsConnMutex.RLock()
		if c, ok := p.wsConns[userID]; ok {
			c.WriteMessage(websocket.TextMessage, msg)
		}
		p.wsConnMutex.RUnlock()
	}
}

func (p *TsnetProxy) Close() {
	p.serverWSMutex.Lock()
	if p.serverWS != nil {
		p.serverWS.Close()
	}
	p.serverWSMutex.Unlock()

	p.wsConnMutex.Lock()
	for _, c := range p.wsConns {
		c.Close()
	}
	p.wsConnMutex.Unlock()

	if p.tsnetServer != nil {
		p.tsnetServer.Close()
	}
}

func main() {
	hostname := flag.String("hostname", "chat-client", "tsnetホスト名")
	serverHostname := flag.String("server", "chat-server", "サーバーホスト名")
	localPort := flag.Int("port", 9000, "プロキシポート")
	flag.Parse()

	proxy := NewTsnetProxy(*hostname, *serverHostname, *localPort)

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sig
		proxy.Close()
		os.Exit(0)
	}()

	if err := proxy.Start(); err != nil {
		log.Fatal(err)
	}
}
