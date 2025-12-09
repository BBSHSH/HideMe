package main

import (
	"context"
	"embed"
	"log"
	"net/http"

	"client/app"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	videoEditor := app.NewVideoEditorApp()
	chatApp := app.NewChatApp()

	// 動画サーバー（placeholder）
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
		},
		OnShutdown: func(ctx context.Context) {
			videoEditor.Shutdown(ctx)
			chatApp.Disconnect()
		},
		Bind: []interface{}{
			videoEditor,
			chatApp,
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
