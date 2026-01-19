package main

import (
	"context"
	"flag"
	"hidemeserver/server"
	"log"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	hostname := flag.String("hostname", "chat-server", "tsnetホスト名")
	dbDSN := flag.String("db", "user:password@tcp(localhost:3306)/chatdb?parseTime=true&loc=Local", "MySQL DSN")
	flag.Parse()

	chatServer, err := server.NewChatServer(*hostname, *dbDSN)
	if err != nil {
		log.Fatalf("サーバー初期化エラー: %v", err)
	}

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("シャットダウン中...")
		chatServer.Close()
		os.Exit(0)
	}()

	if err := chatServer.Start(context.Background(), *hostname); err != nil {
		log.Fatalf("サーバー起動エラー: %v", err)
	}
}
