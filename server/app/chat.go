package app

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type ChatServer struct {
	clients   map[*websocket.Conn]string
	broadcast chan ChatMessage
	mutex     sync.Mutex
}

type ChatMessage struct {
	From    string `json:"from"`
	Message string `json:"message"`
}

func NewChatServer() *ChatServer {
	return &ChatServer{
		clients:   make(map[*websocket.Conn]string),
		broadcast: make(chan ChatMessage),
	}
}

func (c *ChatServer) HandleWS(w http.ResponseWriter, r *http.Request) {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket Upgrade error:", err)
		return
	}

	c.mutex.Lock()
	c.clients[conn] = ""
	c.mutex.Unlock()

	go func() {
		defer func() {
			c.mutex.Lock()
			delete(c.clients, conn)
			c.mutex.Unlock()
			conn.Close()
		}()

		for {
			var msg ChatMessage
			if err := conn.ReadJSON(&msg); err != nil {
				log.Println("ReadJSON error:", err)
				break
			}
			c.broadcast <- msg
		}
	}()
}

func (c *ChatServer) StartBroadcast() {
	go func() {
		for msg := range c.broadcast {
			c.mutex.Lock()
			for client := range c.clients {
				if err := client.WriteJSON(msg); err != nil {
					log.Println("WriteJSON error:", err)
					client.Close()
					delete(c.clients, client)
				}
			}
			c.mutex.Unlock()
		}
	}()
}
