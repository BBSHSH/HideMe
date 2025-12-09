package main

import (
	"hidemeserver/app"
	"log"
	"net/http"
)

func main() {
	tsnetMgr := app.NewTsnetManager()
	if err := tsnetMgr.StartServer("hide-me-chat"); err != nil {
		log.Fatal(err)
	}
	defer tsnetMgr.StopServer()

	chat := app.NewChatServer()
	chat.StartBroadcast()

	// WebSocketハンドラ
	http.HandleFunc("/ws", chat.HandleWS)

	// tsnet のリスナーを使う
	ln, err := tsnetMgr.Server().Listen("tcp", ":8080")
	if err != nil {
		log.Fatal(err)
	}

	log.Println("Chat server running on tsnet at :8080")
	if err := http.Serve(ln, nil); err != nil {
		log.Fatal(err)
	}
}
