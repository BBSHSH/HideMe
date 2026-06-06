package db

import (
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
)

var ErrDMNotFound = errors.New("dm not found")

type DMConversation struct {
	ID           string    `json:"id"`
	User1ID      string    `json:"user1_id"`
	User2ID      string    `json:"user2_id"`
	User1Name    string    `json:"user1_name"`
	User2Name    string    `json:"user2_name"`
	User1Avatar  string    `json:"user1_avatar"`
	User2Avatar  string    `json:"user2_avatar"`
	CreatedAt    time.Time `json:"created_at"`
	LastMessage  string    `json:"last_message,omitempty"`
	LastAt       string    `json:"last_at,omitempty"`
}

type DMMessage struct {
	ID             string    `json:"id"`
	ConversationID string    `json:"conversation_id"`
	SenderID       string    `json:"sender_id"`
	SenderName     string    `json:"sender_name"`
	SenderAvatar   string    `json:"sender_avatar"`
	Content        string    `json:"content"`
	CreatedAt      time.Time `json:"created_at"`
}

// GetOrCreateConversation は2ユーザー間の DM を取得または作成する
func GetOrCreateConversation(db *sql.DB,
	user1ID, user1Name, user1Avatar,
	user2ID, user2Name, user2Avatar string,
) (DMConversation, error) {
	// 小さい ID を user1 に統一（重複防止）
	id1, n1, a1 := user1ID, user1Name, user1Avatar
	id2, n2, a2 := user2ID, user2Name, user2Avatar
	if id1 > id2 {
		id1, n1, a1, id2, n2, a2 = id2, n2, a2, id1, n1, a1
	}

	var c DMConversation
	err := db.QueryRow(
		`SELECT id,user1_id,user2_id,user1_name,user2_name,user1_avatar,user2_avatar,created_at
		 FROM dm_conversations WHERE user1_id=? AND user2_id=?`, id1, id2).
		Scan(&c.ID, &c.User1ID, &c.User2ID,
			&c.User1Name, &c.User2Name,
			&c.User1Avatar, &c.User2Avatar, &c.CreatedAt)
	if err == nil {
		return c, nil
	}

	// 作成
	c.ID = uuid.NewString()
	_, err = db.Exec(
		`INSERT INTO dm_conversations
		 (id,user1_id,user2_id,user1_name,user2_name,user1_avatar,user2_avatar)
		 VALUES (?,?,?,?,?,?,?)`,
		c.ID, id1, id2, n1, n2, a1, a2)
	if err != nil {
		return DMConversation{}, err
	}
	c.User1ID, c.User2ID = id1, id2
	c.User1Name, c.User2Name = n1, n2
	c.User1Avatar, c.User2Avatar = a1, a2
	return c, nil
}

// ListConversations はユーザーの DM 一覧（最新メッセージ付き）を返す
func ListConversations(db *sql.DB, userID string) ([]DMConversation, error) {
	rows, err := db.Query(`
		SELECT c.id, c.user1_id, c.user2_id,
		       c.user1_name, c.user2_name,
		       c.user1_avatar, c.user2_avatar, c.created_at,
		       COALESCE(m.content,''), COALESCE(m.created_at,'')
		FROM dm_conversations c
		LEFT JOIN dm_messages m ON m.id = (
			SELECT id FROM dm_messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1
		)
		WHERE c.user1_id=? OR c.user2_id=?
		ORDER BY COALESCE(m.created_at, c.created_at) DESC`, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var convs []DMConversation
	for rows.Next() {
		var c DMConversation
		if err := rows.Scan(
			&c.ID, &c.User1ID, &c.User2ID,
			&c.User1Name, &c.User2Name,
			&c.User1Avatar, &c.User2Avatar, &c.CreatedAt,
			&c.LastMessage, &c.LastAt,
		); err != nil {
			return nil, err
		}
		convs = append(convs, c)
	}
	if convs == nil {
		convs = []DMConversation{}
	}
	return convs, nil
}

// ListDMMessages は DM 履歴を返す
func ListDMMessages(db *sql.DB, convID string, limit int) ([]DMMessage, error) {
	rows, err := db.Query(
		`SELECT id,conversation_id,sender_id,sender_name,COALESCE(sender_avatar,''),content,created_at
		 FROM dm_messages WHERE conversation_id=?
		 ORDER BY created_at DESC LIMIT ?`, convID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var msgs []DMMessage
	for rows.Next() {
		var m DMMessage
		if err := rows.Scan(&m.ID, &m.ConversationID,
			&m.SenderID, &m.SenderName, &m.SenderAvatar,
			&m.Content, &m.CreatedAt); err != nil {
			return nil, err
		}
		msgs = append(msgs, m)
	}
	// 古い順に返す
	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}
	if msgs == nil {
		msgs = []DMMessage{}
	}
	return msgs, nil
}

// CreateDMMessage はDMメッセージを保存する
func CreateDMMessage(db *sql.DB, convID, senderID, senderName, senderAvatar, content string) (DMMessage, error) {
	id := uuid.NewString()
	_, err := db.Exec(
		`INSERT INTO dm_messages (id,conversation_id,sender_id,sender_name,sender_avatar,content)
		 VALUES (?,?,?,?,?,?)`,
		id, convID, senderID, senderName, senderAvatar, content)
	if err != nil {
		return DMMessage{}, err
	}
	var m DMMessage
	err = db.QueryRow(
		`SELECT id,conversation_id,sender_id,sender_name,COALESCE(sender_avatar,''),content,created_at
		 FROM dm_messages WHERE id=?`, id).
		Scan(&m.ID, &m.ConversationID,
			&m.SenderID, &m.SenderName, &m.SenderAvatar,
			&m.Content, &m.CreatedAt)
	return m, err
}

// ListUsers は全ユーザー（パスワード・Discord 両方）を返す
func ListAllUsers(db *sql.DB) ([]map[string]string, error) {
	result := []map[string]string{}
	// 通常ユーザー
	rows, err := db.Query(`SELECT id, username, '' as avatar FROM users ORDER BY username`)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var id, name, avatar string
		rows.Scan(&id, &name, &avatar)
		result = append(result, map[string]string{"id": id, "username": name, "avatar": avatar})
	}
	rows.Close()
	// Discord ユーザー
	rows2, err := db.Query(`
		SELECT id, username,
		       CASE WHEN discord_id != '' AND avatar != ''
		            THEN 'https://cdn.discordapp.com/avatars/' || discord_id || '/' || avatar || '.png'
		            ELSE '' END
		FROM discord_users ORDER BY username`)
	if err != nil {
		return nil, err
	}
	for rows2.Next() {
		var id, name, avatar string
		rows2.Scan(&id, &name, &avatar)
		result = append(result, map[string]string{"id": id, "username": name, "avatar": avatar})
	}
	rows2.Close()
	return result, nil
}
