package main

import (
	"io"
	"log"
	"time"

	"tailscale.com/tsnet"
)

func main() {
	clientNames := []string{"Client1", "Client2", "Client3"}

	for _, name := range clientNames {
		go func(clientName string) {
			client := &tsnet.Server{
				Hostname: clientName,
				Dir:      "./tsnet-" + clientName + "-state",
			}

			if err := client.Start(); err != nil {
				log.Println(clientName, "start error:", err)
				return
			}
			defer client.Close()

			// サーバーのTailscale IPを指定（例: 100.101.102.103）
			httpClient := client.HTTPClient()
			for {
				resp, err := httpClient.Get("http://100.101.102.103:8080")
				if err != nil {
					log.Println(clientName, "connection error:", err)
					time.Sleep(time.Second * 3)
					continue
				}

				body, _ := io.ReadAll(resp.Body)
				resp.Body.Close()
				log.Println(clientName, "received:", string(body))
				time.Sleep(time.Second * 5)
			}
		}(name)
	}

	select {}
}
