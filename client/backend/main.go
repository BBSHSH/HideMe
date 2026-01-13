package main

import (
	"context"
	"encoding/json"
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

/* =========================
   Health Status
========================= */

type HealthStatus struct {
	Local     bool      `json:"local"`
	Tsnet     bool      `json:"tsnet"`
	Server    bool      `json:"server"`
	CheckedAt time.Time `json:"checkedAt"`
}

/* =========================
   Proxy Struct
========================= */

type TsnetProxy struct {
	tsnetServer *tsnet.Server
	httpClient  *http.Client

	serverHostname string
	localPort      int

	health      HealthStatus
	healthMutex sync.RWMutex

	wsUpgrader websocket.Upgrader

	wsConns     map[string]*websocket.Conn
	wsConnMutex sync.RWMutex

	serverWS      *websocket.Conn
	serverWSMutex sync.Mutex
}

/* =========================
   Constructor
========================= */

func NewTsnetProxy(hostname, serverHostname string, localPort int) *TsnetProxy {
	return &TsnetProxy{
		tsnetServer: &tsnet.Server{
			Hostname: hostname,
			Dir:      "./tsnet-state",
		},
		serverHostname: serverHostname,
		localPort:      localPort,
		wsConns:        make(map[string]*websocket.Conn),
		wsUpgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
	}
}

/* =========================
   Start
========================= */

func (p *TsnetProxy) Start() error {
	// ローカルHTTPは起動する
	p.updateHealth(func(h *HealthStatus) {
		h.Local = true
	})

	// tsnet起動
	status, err := p.tsnetServer.Up(context.Background())
	if err != nil {
		return fmt.Errorf("tsnet起動エラー: %w", err)
	}
	log.Printf("tsnet 起動: %s (%s)", p.tsnetServer.Hostname, status.TailscaleIPs[0])

	p.updateHealth(func(h *HealthStatus) {
		h.Tsnet = true
	})

	// tsnet経由HTTPクライアント
	p.httpClient = &http.Client{
		Transport: &http.Transport{
			DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
				return p.tsnetServer.Dial(ctx, network, addr)
			},
		},
		Timeout: 3 * time.Second,
	}

	// 🔴 tsnetサーバー疎通監視
	go p.startServerHealthCheck()

	mux := http.NewServeMux()
	mux.HandleFunc("/health", p.handleHealth)
	mux.HandleFunc("/api/health", p.handleHealth)
	mux.HandleFunc("/api/", p.handleAPIProxy)
	mux.HandleFunc("/ws", p.handleWebSocket)

	log.Printf("ローカルプロキシ起動: http://localhost:%d", p.localPort)
	return http.ListenAndServe(fmt.Sprintf(":%d", p.localPort), mux)
}

/* =========================
   Health
========================= */

func (p *TsnetProxy) handleHealth(w http.ResponseWriter, _ *http.Request) {
	p.healthMutex.RLock()
	defer p.healthMutex.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p.health)
}

func (p *TsnetProxy) startServerHealthCheck() {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		ok := p.checkServer()
		p.updateHealth(func(h *HealthStatus) {
			h.Server = ok
			h.CheckedAt = time.Now()
		})
	}
}

func (p *TsnetProxy) checkServer() bool {
	url := fmt.Sprintf("http://%s:8080/health", p.serverHostname)
	resp, err := p.httpClient.Get(url)
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}

/* =========================
   API Proxy
========================= */

func (p *TsnetProxy) handleAPIProxy(w http.ResponseWriter, r *http.Request) {
	targetURL := fmt.Sprintf("http://%s:8080%s", p.serverHostname, r.URL.String())

	req, err := http.NewRequest(r.Method, targetURL, r.Body)
	if err != nil {
		http.Error(w, "request error", http.StatusInternalServerError)
		return
	}
	req.Header = r.Header.Clone()

	resp, err := p.httpClient.Do(req)
	if err != nil {
		http.Error(w, "tsnet server unreachable", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	for k, v := range resp.Header {
		w.Header()[k] = v
	}
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

/* =========================
   WebSocket
========================= */

func (p *TsnetProxy) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	userName := r.URL.Query().Get("userName")

	if userID == "" {
		http.Error(w, "userId required", http.StatusBadRequest)
		return
	}

	conn, err := p.wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
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
		log.Println("server ws error:", err)
		return
	}

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			return
		}
		p.serverWSMutex.Lock()
		if p.serverWS != nil {
			p.serverWS.WriteMessage(websocket.TextMessage, msg)
		}
		p.serverWSMutex.Unlock()
	}
}

func (p *TsnetProxy) connectToServer(userID, userName string) error {
	wsDialer := websocket.Dialer{
		NetDialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
			return p.tsnetServer.Dial(ctx, network, addr)
		},
	}

	wsURL := fmt.Sprintf(
		"ws://%s:8080/ws?userId=%s&userName=%s",
		p.serverHostname, userID, userName,
	)

	conn, _, err := wsDialer.Dial(wsURL, nil)
	if err != nil {
		return err
	}

	p.serverWSMutex.Lock()
	p.serverWS = conn
	p.serverWSMutex.Unlock()

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
			return
		}

		p.wsConnMutex.RLock()
		if c, ok := p.wsConns[userID]; ok {
			c.WriteMessage(websocket.TextMessage, msg)
		}
		p.wsConnMutex.RUnlock()
	}
}

/* =========================
   Helpers
========================= */

func (p *TsnetProxy) updateHealth(fn func(*HealthStatus)) {
	p.healthMutex.Lock()
	defer p.healthMutex.Unlock()
	fn(&p.health)
}

/* =========================
   main
========================= */

func main() {
	hostname := flag.String("hostname", "chat-client", "tsnet hostname")
	server := flag.String("server", "chat-server", "server hostname")
	port := flag.Int("port", 9000, "local port")
	flag.Parse()

	proxy := NewTsnetProxy(*hostname, *server, *port)

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sig
		proxy.tsnetServer.Close()
		os.Exit(0)
	}()

	log.Fatal(proxy.Start())
}
