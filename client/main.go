package main

import (
	"embed"
	"log"
	"net/http"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app := NewApp()

	// 動画サーバー起動
	go func() {
		mux := http.NewServeMux()
		mux.HandleFunc("/video", app.videoHandler)
		http.ListenAndServe(":8082", mux)
	}()

	err := wails.Run(&options.App{
		Title:  "動画編集 - Video Editor",
		Width:  1200,
		Height: 800,
		AssetServer: &assetserver.Options{
			Assets:  assets, // ← embed.FS を指定
			Handler: nil,    // 基本は nil で OK
		},
		OnStartup:  app.startup,
		OnShutdown: app.shutdown,
		Bind:       []interface{}{app},
	})

	if err != nil {
		log.Fatal(err)
	}
}
