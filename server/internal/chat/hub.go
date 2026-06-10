package chat

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

type WSMessage struct {
	Type      string      `json:"type"`
	ChannelID string      `json:"channel_id,omitempty"`
	TargetID  string      `json:"target_id,omitempty"`
	SenderID  string      `json:"sender_id,omitempty"`
	Data      interface{} `json:"data"`
}

type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	send   chan []byte
	UserID string
	mu     sync.Mutex
}

type VoiceParticipant struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Avatar   string `json:"avatar"`
	Muted    bool   `json:"muted"`
}

type Hub struct {
	clients    map[*Client]bool
	byUserID   map[string][]*Client
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	voiceRooms map[string]map[string]VoiceParticipant
	voiceMu    sync.RWMutex
	mu         sync.RWMutex
}

var Global = NewHub()

func NewHub() *Hub {
	h := &Hub{
		clients:    make(map[*Client]bool),
		byUserID:   make(map[string][]*Client),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		voiceRooms: make(map[string]map[string]VoiceParticipant),
	}
	go h.run()
	return h
}

func (h *Hub) run() {
	for {
		select {
		case c := <-h.register:
			h.mu.Lock()
			h.clients[c] = true
			h.byUserID[c.UserID] = append(h.byUserID[c.UserID], c)
			h.mu.Unlock()
		case c := <-h.unregister:
			h.mu.Lock()
			if h.clients[c] {
				delete(h.clients, c)
				close(c.send)
				list := h.byUserID[c.UserID]
				var newList []*Client
				for _, cl := range list {
					if cl != c {
						newList = append(newList, cl)
					}
				}
				if len(newList) == 0 {
					delete(h.byUserID, c.UserID)
				} else {
					h.byUserID[c.UserID] = newList
				}
			}
			h.mu.Unlock()
		case msg := <-h.broadcast:
			h.mu.RLock()
			for c := range h.clients {
				select {
				case c.send <- msg:
				default:
					close(c.send)
					delete(h.clients, c)
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) Broadcast(msg WSMessage) {
	b, _ := json.Marshal(msg)
	h.broadcast <- b
}

func (h *Hub) SendTo(targetUserID string, msg WSMessage) {
	b, _ := json.Marshal(msg)
	h.mu.RLock()
	clients := h.byUserID[targetUserID]
	h.mu.RUnlock()
	for _, c := range clients {
		select {
		case c.send <- b:
		default:
		}
	}
}

func (h *Hub) VoiceJoin(channelID string, p VoiceParticipant) {
	h.voiceMu.Lock()
	if h.voiceRooms[channelID] == nil {
		h.voiceRooms[channelID] = make(map[string]VoiceParticipant)
	}
	h.voiceRooms[channelID][p.UserID] = p
	h.voiceMu.Unlock()
	h.broadcastVoiceState(channelID)
}

func (h *Hub) VoiceLeave(channelID, userID string) {
	h.voiceMu.Lock()
	if room, ok := h.voiceRooms[channelID]; ok {
		delete(room, userID)
		if len(room) == 0 {
			delete(h.voiceRooms, channelID)
		}
	}
	h.voiceMu.Unlock()
	h.broadcastVoiceState(channelID)
}

func (h *Hub) GetVoiceParticipants(channelID string) []VoiceParticipant {
	h.voiceMu.RLock()
	defer h.voiceMu.RUnlock()
	var list []VoiceParticipant
	for _, p := range h.voiceRooms[channelID] {
		list = append(list, p)
	}
	return list
}

func (h *Hub) GetAllVoiceRooms() map[string][]VoiceParticipant {
	h.voiceMu.RLock()
	defer h.voiceMu.RUnlock()
	result := make(map[string][]VoiceParticipant)
	for ch, room := range h.voiceRooms {
		var list []VoiceParticipant
		for _, p := range room {
			list = append(list, p)
		}
		result[ch] = list
	}
	return result
}

func (h *Hub) broadcastVoiceState(channelID string) {
	h.Broadcast(WSMessage{
		Type:      "voice_state",
		ChannelID: channelID,
		Data:      h.GetVoiceParticipants(channelID),
	})
}

func (h *Hub) IsOnline(userID string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.byUserID[userID]) > 0
}

func (h *Hub) ServeClient(conn *websocket.Conn, userID string, onConnect, onDisconnect func()) {
	c := &Client{hub: h, conn: conn, send: make(chan []byte, 256), UserID: userID}
	h.register <- c
	h.Broadcast(WSMessage{Type: "member_online", Data: map[string]string{"user_id": userID}})
	if onConnect != nil {
		onConnect()
	}
	go c.writePump()
	c.readPump()
	h.Broadcast(WSMessage{Type: "member_offline", Data: map[string]string{"user_id": userID}})
	if onDisconnect != nil {
		onDisconnect()
	}
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	for {
		_, raw, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[WS] read error: %v", err)
			}
			break
		}
		var msg WSMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			continue
		}
		msg.SenderID = c.UserID
		switch msg.Type {
		case "webrtc_offer", "webrtc_answer", "webrtc_ice",
			"call_invite", "call_accept", "call_reject", "call_end":
			if msg.TargetID != "" {
				c.hub.SendTo(msg.TargetID, msg)
			}
		}
	}
}

func (c *Client) writePump() {
	defer c.conn.Close()
	for msg := range c.send {
		c.mu.Lock()
		err := c.conn.WriteMessage(websocket.TextMessage, msg)
		c.mu.Unlock()
		if err != nil {
			return
		}
	}
}
