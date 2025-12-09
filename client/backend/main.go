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

// TsnetProxy tsnetとローカルHTTPサーバー間のプロキシ
type TsnetProxy struct {
	tsnetServer    *tsnet.Server
	httpClient     *http.Client
	wsUpgrader     websocket.Upgrader
	serverHostname string
	localPort      int

	// WebSocket接続管理
	wsConns     map[string]*websocket.Conn
	wsConnMutex sync.RWMutex

	// サーバーへのWebSocket接続
	serverWS      *websocket.Conn
	serverWSMutex sync.Mutex
}

// NewTsnetProxy TsnetProxyの新規作成
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
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	}
}

// Start プロキシサーバーを起動
func (p *TsnetProxy) Start() error {
	// tsnetサーバーを起動
	status, err := p.tsnetServer.Up(context.Background())
	if err != nil {
		return fmt.Errorf("tsnet起動エラー: %v", err)
	}
	log.Printf("Tsnet起動完了: %s (%s)\n", p.tsnetServer.Hostname, status.TailscaleIPs[0])

	// tsnet用HTTPクライアントを作成
	p.httpClient = &http.Client{
		Transport: &http.Transport{
			DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
				return p.tsnetServer.Dial(ctx, network, addr)
			},
		},
		Timeout: 30 * time.Second,
	}

	// ローカルHTTPサーバーを起動
	mux := http.NewServeMux()

	// API プロキシエンドポイント
	mux.HandleFunc("/api/", p.handleAPIProxy)

	// WebSocket プロキシエンドポイント
	mux.HandleFunc("/ws", p.handleWebSocket)

	// ヘルスチェック
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", p.localPort),
		Handler: mux,
	}

	log.Printf("ローカルプロキシサーバー起動: http://localhost:%d\n", p.localPort)

	return server.ListenAndServe()
}

// handleAPIProxy APIリクエストをtsnet経由でサーバーに転送
func (p *TsnetProxy) handleAPIProxy(w http.ResponseWriter, r *http.Request) {
	// スペースなしでURLを構築
	targetURL := fmt.Sprintf("http://%s:8080%s", p.serverHostname, r.URL.String())

	req, err := http.NewRequest(r.Method, targetURL, r.Body)
	if err != nil {
		http.Error(w, "リクエスト作成エラー", http.StatusInternalServerError)
		return
	}

	// ヘッダーをコピー
	for key, values := range r.Header {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}

	// リクエストを送信
	resp, err := p.httpClient.Do(req)
	if err != nil {
		log.Printf("API転送エラー: %v\n", err)
		http.Error(w, "サーバー接続エラー", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// レスポンスヘッダーをコピー
	for key, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}

	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

// handleWebSocket WebSocket接続をプロキシ
func (p *TsnetProxy) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	userName := r.URL.Query().Get("userName")
	if userID == "" {
		http.Error(w, "userIdが必要です", http.StatusBadRequest)
		return
	}

	// ローカルクライアントからのWebSocket接続をアップグレード
	conn, err := p.wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocketアップグレードエラー: %v\n", err)
		return
	}

	// 接続を保存
	p.wsConnMutex.Lock()
	p.wsConns[userID] = conn
	p.wsConnMutex.Unlock()

	defer func() {
		p.wsConnMutex.Lock()
		delete(p.wsConns, userID)
		p.wsConnMutex.Unlock()
		conn.Close()
	}()

	// サーバーへのWebSocket接続を確立
	if err := p.connectToServer(userID, userName); err != nil {
		log.Printf("サーバー接続エラー: %v\n", err)
		return
	}

	// クライアントからのメッセージをサーバーに転送
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket読み取りエラー: %v\n", err)
			}
			break
		}

		// サーバーに転送
		p.serverWSMutex.Lock()
		if p.serverWS != nil {
			err = p.serverWS.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				log.Printf("サーバーへの転送エラー: %v\n", err)
			}
		}
		p.serverWSMutex.Unlock()
	}
}

// connectToServer サーバーへの WebSocket接続を確立
func (p *TsnetProxy) connectToServer(userID, userName string) error {
	p.serverWSMutex.Lock()
	defer p.serverWSMutex.Unlock()

	// 既存接続があっても死んでたら再接続する
	if p.serverWS != nil {
		if p.serverWS.WriteMessage(websocket.PingMessage, nil) == nil {
			return nil // 生きてる → 再利用
		}

		// 死んでたら閉じて nil にする
		p.serverWS.Close()
		p.serverWS = nil
	}

	// tsnet経由でダイアル
	wsDialer := websocket.Dialer{
		NetDialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
			return p.tsnetServer.Dial(ctx, network, addr)
		},
		HandshakeTimeout: 10 * time.Second,
	}

	// スペースなしでURLを構築
	wsURL := fmt.Sprintf("ws://%s:8080/ws?userId=%s&userName=%s", p.serverHostname, userID, userName)
	log.Printf("サーバーに接続中: %s\n", wsURL)

	conn, _, err := wsDialer.Dial(wsURL, nil)
	if err != nil {
		return fmt.Errorf("サーバーWebSocket接続エラー: %v", err)
	}

	p.serverWS = conn
	log.Printf("サーバーWebSocket接続成功\n")

	// サーバーからのメッセージをクライアントに転送
	go p.forwardFromServer(userID)

	return nil
}

// forwardFromServer サーバーからのメッセージをクライアントに転送
func (p *TsnetProxy) forwardFromServer(userID string) {
	for {
		p.serverWSMutex.Lock()
		serverWS := p.serverWS
		p.serverWSMutex.Unlock()

		if serverWS == nil {
			return
		}

		_, message, err := serverWS.ReadMessage()
		if err != nil {
			log.Printf("サーバーからの読み取りエラー: %v\n", err)

			p.serverWSMutex.Lock()
			if p.serverWS != nil {
				p.serverWS.Close()
				p.serverWS = nil
			}
			p.serverWSMutex.Unlock()

			// 自動再接続
			go func() {
				time.Sleep(2 * time.Second)
				if err := p.connectToServer(userID, ""); err != nil {
					log.Printf("サーバー再接続失敗: %v", err)
				}
			}()
			return
		}

		// メッセージをパースして宛先を確認
		var wsMsg struct {
			Type    string          `json:"type"`
			Payload json.RawMessage `json:"payload"`
		}
		if err := json.Unmarshal(message, &wsMsg); err != nil {
			continue
		}

		// 該当するクライアントに転送
		p.wsConnMutex.RLock()
		if clientConn, ok := p.wsConns[userID]; ok {
			clientConn.WriteMessage(websocket.TextMessage, message)
		}
		p.wsConnMutex.RUnlock()
	}
}

// Close プロキシを終了
func (p *TsnetProxy) Close() {
	p.serverWSMutex.Lock()
	if p.serverWS != nil {
		p.serverWS.Close()
	}
	p.serverWSMutex.Unlock()

	p.wsConnMutex.Lock()
	for _, conn := range p.wsConns {
		conn.Close()
	}
	p.wsConnMutex.Unlock()

	if p.tsnetServer != nil {
		p.tsnetServer.Close()
	}
}

func main() {
	hostname := flag.String("hostname", "chat-client", "tsnetホスト名")
	serverHostname := flag.String("server", "chat-server", "チャットサーバーのホスト名")
	localPort := flag.Int("port", 9000, "ローカルプロキシのポート")
	flag.Parse()

	proxy := NewTsnetProxy(*hostname, *serverHostname, *localPort)

	// シグナルハンドリング
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("シャットダウン中...")
		proxy.Close()
		os.Exit(0)
	}()

	if err := proxy.Start(); err != nil {
		log.Fatalf("プロキシ起動エラー: %v", err)
	}
}
