package handlers

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"server/models"

	"github.com/gorilla/websocket"
)

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true // 本番環境では適切に設定
		},
	}

	users      = make(map[string]*models.User)
	usersMutex sync.RWMutex
)

// RegisterUser registers a new user
func RegisterUser(w http.ResponseWriter, r *http.Request) {
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user.Status = "online"
	user.LastSeen = time.Now()

	usersMutex.Lock()
	users[user.ID] = &user
	usersMutex.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// GetUsers returns all users
func GetUsers(w http.ResponseWriter, r *http.Request) {
	usersMutex.RLock()
	defer usersMutex.RUnlock()

	userList := make([]*models.User, 0, len(users))
	for _, user := range users {
		userList = append(userList, user)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userList)
}

// UpdateUserStatus updates user status
func UpdateUserStatus(userID, status string) {
	usersMutex.Lock()
	defer usersMutex.Unlock()

	if user, exists := users[userID]; exists {
		user.Status = status
		user.LastSeen = time.Now()
	}
}

// GetUser returns a user by ID
func GetUser(userID string) (*models.User, bool) {
	usersMutex.RLock()
	defer usersMutex.RUnlock()

	user, exists := users[userID]
	return user, exists
}

// RemoveUser removes a user
func RemoveUser(userID string) {
	usersMutex.Lock()
	defer usersMutex.Unlock()

	delete(users, userID)
}
