package db

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

type Channel struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Type        string    `json:"type"` // "text" | "voice"
	Position    int       `json:"position"`
	CreatedAt   time.Time `json:"created_at"`
}

type Message struct {
	ID        string     `json:"id"`
	ChannelID string     `json:"channel_id"`
	UserID    string     `json:"user_id"`
	Username  string     `json:"username"`
	Avatar    string     `json:"avatar"`
	Content   string     `json:"content"`
	CreatedAt time.Time  `json:"created_at"`
	EditedAt  *time.Time `json:"edited_at,omitempty"`
}

// ─── Channels ─────────────────────────────────────────────────

func ListChannels(db *sql.DB) ([]Channel, error) {
	rows, err := db.Query(
		`SELECT id, name, COALESCE(description,''), COALESCE(type,'text'), position, created_at
		 FROM chat_channels ORDER BY position, created_at`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ch []Channel
	for rows.Next() {
		var c Channel
		if err := rows.Scan(&c.ID, &c.Name, &c.Description, &c.Type, &c.Position, &c.CreatedAt); err != nil {
			return nil, err
		}
		ch = append(ch, c)
	}
	if ch == nil {
		ch = []Channel{}
	}
	return ch, nil
}

func CreateChannel(db *sql.DB, name, description, chanType string) (Channel, error) {
	if chanType == "" {
		chanType = "text"
	}
	id := uuid.NewString()
	var pos int
	db.QueryRow(`SELECT COALESCE(MAX(position),0)+1 FROM chat_channels`).Scan(&pos)
	_, err := db.Exec(
		`INSERT INTO chat_channels (id,name,description,type,position) VALUES (?,?,?,?,?)`,
		id, name, description, chanType, pos)
	if err != nil {
		return Channel{}, err
	}
	var c Channel
	err = db.QueryRow(
		`SELECT id,name,COALESCE(description,''),COALESCE(type,'text'),position,created_at FROM chat_channels WHERE id=?`, id).
		Scan(&c.ID, &c.Name, &c.Description, &c.Type, &c.Position, &c.CreatedAt)
	return c, err
}

func DeleteChannel(db *sql.DB, id string) error {
	_, err := db.Exec(`DELETE FROM chat_channels WHERE id=?`, id)
	return err
}

// ─── Messages ─────────────────────────────────────────────────

func ListMessages(db *sql.DB, channelID string, limit int) ([]Message, error) {
	rows, err := db.Query(
		`SELECT id,channel_id,user_id,username,COALESCE(avatar,''),content,created_at,edited_at
		 FROM chat_messages WHERE channel_id=?
		 ORDER BY created_at DESC LIMIT ?`, channelID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var msgs []Message
	for rows.Next() {
		var m Message
		if err := rows.Scan(&m.ID, &m.ChannelID, &m.UserID, &m.Username, &m.Avatar,
			&m.Content, &m.CreatedAt, &m.EditedAt); err != nil {
			return nil, err
		}
		msgs = append(msgs, m)
	}
	// 古い順に返す
	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}
	if msgs == nil {
		msgs = []Message{}
	}
	return msgs, nil
}

func CreateMessage(db *sql.DB, channelID, userID, username, avatar, content string) (Message, error) {
	id := uuid.NewString()
	_, err := db.Exec(
		`INSERT INTO chat_messages (id,channel_id,user_id,username,avatar,content) VALUES (?,?,?,?,?,?)`,
		id, channelID, userID, username, avatar, content)
	if err != nil {
		return Message{}, err
	}
	var m Message
	err = db.QueryRow(
		`SELECT id,channel_id,user_id,username,COALESCE(avatar,''),content,created_at,edited_at
		 FROM chat_messages WHERE id=?`, id).
		Scan(&m.ID, &m.ChannelID, &m.UserID, &m.Username, &m.Avatar,
			&m.Content, &m.CreatedAt, &m.EditedAt)
	return m, err
}

func DeleteMessage(db *sql.DB, id string) error {
	_, err := db.Exec(`DELETE FROM chat_messages WHERE id=?`, id)
	return err
}

func GetMessageByID(db *sql.DB, id string) (Message, error) {
	var m Message
	err := db.QueryRow(
		`SELECT id,channel_id,user_id,username,COALESCE(avatar,''),content,created_at,edited_at
		 FROM chat_messages WHERE id=?`, id).
		Scan(&m.ID, &m.ChannelID, &m.UserID, &m.Username, &m.Avatar,
			&m.Content, &m.CreatedAt, &m.EditedAt)
	return m, err
}
