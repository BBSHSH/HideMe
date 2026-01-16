package server

import (
	"encoding/json"
	"hidemeserver/models"
	"net/http"
)

func (s *ChatServer) handleGetUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	s.usersMutex.RLock()
	users := make([]*models.User, 0, len(s.users))
	for _, user := range s.users {
		users = append(users, user)
	}
	s.usersMutex.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func (s *ChatServer) handleMessages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.URL.Query().Get("userId")
	otherUserID := r.URL.Query().Get("otherUserId")

	if userID == "" || otherUserID == "" {
		http.Error(w, "userId and otherUserId required", http.StatusBadRequest)
		return
	}

	conversationID := s.getConversationID(userID, otherUserID)

	s.msgMutex.RLock()
	msgs := s.messages[conversationID]
	s.msgMutex.RUnlock()

	if msgs == nil {
		msgs = []models.Message{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(msgs)
}

func (s *ChatServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}
