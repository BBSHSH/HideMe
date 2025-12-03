package app

import (
	"log"
	"net/http"

	"tailscale.com/tsnet"
)

type TsnetManager struct {
	server *tsnet.Server
}

func NewTsnetManager() *TsnetManager {
	return &TsnetManager{}
}

// サーバーを開始
func (t *TsnetManager) StartServer(hostname string) error {
	t.server = &tsnet.Server{
		Hostname: hostname,
		Dir:      "./tsnet-server-state",
	}

	if err := t.server.Start(); err != nil {
		return err
	}

	ln, err := t.server.Listen("tcp", ":8080")
	if err != nil {
		return err
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello from tsnet server!"))
	})

	go func() {
		if err := http.Serve(ln, mux); err != nil {
			log.Println("Server error:", err)
		}
	}()

	return nil
}

// サーバー停止
func (t *TsnetManager) StopServer() error {
	if t.server != nil {
		return t.server.Close()
	}
	return nil
}

// ステータス取得
func (t *TsnetManager) GetStatus() string {
	if t.server != nil {
		return "Running"
	}
	return "Stopped"
}
