package main

import (
	"context"
	"embed"
	"log"
	"net/http"
	"time"

	"client/app"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

// ConnectionMonitor は接続状態を監視する構造体
type ConnectionMonitor struct {
	ctx           context.Context
	chatApp       *app.ChatApp
	checkInterval time.Duration
	serverURL     string
}

func NewConnectionMonitor(chatApp *app.ChatApp) *ConnectionMonitor {
	return &ConnectionMonitor{
		chatApp:       chatApp,
		checkInterval: 1 * time.Second,
		serverURL:     "http://localhost:9000",
	}
}

// Start は接続監視を開始
func (cm *ConnectionMonitor) Start(ctx context.Context) {
	cm.ctx = ctx

	log.Println("接続監視を開始します")

	go func() {
		time.Sleep(1 * time.Second)
		cm.checkConnection()
	}()

	ticker := time.NewTicker(cm.checkInterval)
	go func() {
		for {
			select {
			case <-ticker.C:
				cm.checkConnection()
			case <-ctx.Done():
				ticker.Stop()
				log.Println("接続監視を停止します")
				return
			}
		}
	}()
}

// checkConnection は接続状態を確認
func (cm *ConnectionMonitor) checkConnection() {
	client := &http.Client{Timeout: 2 * time.Second}

	// 正しいヘルスチェックURL
	healthURL := cm.serverURL + "/health"
	log.Printf("[接続確認] %s にリクエスト送信", healthURL)

	resp, err := client.Get(healthURL)
	if err != nil {
		log.Printf("[接続確認] ✗ エラー: %v", err)
		runtime.EventsEmit(cm.ctx, "connection_status", "disconnected")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		log.Printf("[接続確認] ✓ OK (%d)", resp.StatusCode)
		runtime.EventsEmit(cm.ctx, "connection_status", "connected")
		return
	}

	log.Printf("[接続確認] ✗ ステータスエラー (%d)", resp.StatusCode)
	runtime.EventsEmit(cm.ctx, "connection_status", "error")
}

// 手動確認
func (cm *ConnectionMonitor) GetConnectionStatus() string {
	client := &http.Client{Timeout: 2 * time.Second}
	healthURL := cm.serverURL + "/health"

	resp, err := client.Get(healthURL)
	if err != nil {
		return "disconnected"
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		return "connected"
	}
	return "error"
}

func (cm *ConnectionMonitor) CheckNow() string {
	status := cm.GetConnectionStatus()
	runtime.EventsEmit(cm.ctx, "connection_status", status)
	return status
}

func main() {
	videoEditor := app.NewVideoEditorApp()
	chatApp := app.NewChatApp()
	connectionMonitor := NewConnectionMonitor(chatApp)

	go func() {
		http.HandleFunc("/video", videoEditor.VideoHandler)
		log.Println("Video server starting on :8082")
		if err := http.ListenAndServe(":8082", nil); err != nil {
			log.Fatal(err)
		}
	}()

	err := wails.Run(&options.App{
		Title:  "HideMe!",
		Width:  1000,
		Height: 600,

		AssetServer: &assetserver.Options{
			Assets: assets,
		},

		OnStartup: func(ctx context.Context) {
			videoEditor.Startup(ctx)
			chatApp.Startup(ctx)
			connectionMonitor.Start(ctx)
		},

		OnShutdown: func(ctx context.Context) {
			videoEditor.Shutdown(ctx)
			chatApp.Disconnect()
		},

		Bind: []interface{}{
			videoEditor,
			chatApp,
			connectionMonitor,
		},

		Windows: &windows.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
		},
	})

	if err != nil {
		log.Fatal(err)
	}
}
