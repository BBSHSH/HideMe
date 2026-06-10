package db

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

type ActivityEvent struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"`   // "login" | "upload"
	UserID    string    `json:"user_id"`
	Username  string    `json:"username"`
	Avatar    string    `json:"avatar"`
	Detail    string    `json:"detail"` // upload: ファイル名, login: ""
	CreatedAt time.Time `json:"created_at"`
}

func LogActivity(db *sql.DB, eventType, userID, username, avatar, detail string) {
	_, _ = db.Exec(
		`INSERT INTO activity_log (id, type, user_id, username, avatar, detail) VALUES (?,?,?,?,?,?)`,
		uuid.NewString(), eventType, userID, username, avatar, detail,
	)
}

func ListActivity(db *sql.DB, limit int) ([]ActivityEvent, error) {
	rows, err := db.Query(`
		SELECT id, type, user_id, username, COALESCE(avatar,''), COALESCE(detail,''), created_at
		FROM activity_log
		ORDER BY created_at DESC
		LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []ActivityEvent
	for rows.Next() {
		var e ActivityEvent
		if err := rows.Scan(&e.ID, &e.Type, &e.UserID, &e.Username, &e.Avatar, &e.Detail, &e.CreatedAt); err != nil {
			continue
		}
		events = append(events, e)
	}
	if events == nil {
		events = []ActivityEvent{}
	}
	return events, rows.Err()
}
