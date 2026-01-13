package main

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
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

var assets embed.FS

type HealthStatus struct {
	Local  bool `json:"local"`
	Tsnet  bool `json:"tsnet"`
	Server bool `json:"server"`
}

type ConnectionMonitor struct {
	ctx           context.Context
	checkInterval time.Duration
}

func NewConnectionMonitor() *ConnectionMonitor {
	return &ConnectionMonitor{
		checkInterval: 1 * time.Second,
	}
}

func (cm *ConnectionMonitor) Start(ctx context.Context) {
	cm.ctx = ctx
	log.Println("接続監視開始")

	ticker := time.NewTicker(cm.checkInterval)
	go func() {
		for {
			select {
			case <-ticker.C:
				cm.checkConnection()
			case <-ctx.Done():
				ticker.Stop()
				return
			}
		}
	}()
}

func (cm *ConnectionMonitor) checkConnection() {
	// ローカル proxy
	if err := cm.checkLocal(); err != nil {
		runtime.EventsEmit(cm.ctx, "connection_status", "local_disconnected")
		return
	}

	// tsnet サーバー疎通
	if err := cm.checkTsnetServer(); err != nil {
		runtime.EventsEmit(cm.ctx, "connection_status", "tsnet_disconnected")
		return
	}

	runtime.EventsEmit(cm.ctx, "connection_status", "connected")
}

func (cm *ConnectionMonitor) checkLocal() error {
	client := &http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get("http://localhost:9000/health")
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("local status %d", resp.StatusCode)
	}
	return nil
}

func (cm *ConnectionMonitor) checkTsnetServer() error {
	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get("http://localhost:9000/api/health")
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("api health status %d", resp.StatusCode)
	}

	var health HealthStatus
	if err := json.NewDecoder(resp.Body).Decode(&health); err != nil {
		return err
	}

	if !health.Server {
		return fmt.Errorf("tsnet server unreachable")
	}

	return nil
}

func main() {
	videoEditor := app.NewVideoEditorApp()
	chatApp := app.NewChatApp()
	connectionMonitor := NewConnectionMonitor()

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
