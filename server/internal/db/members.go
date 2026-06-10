package db

import (
	"database/sql"
	"time"
)

type Member struct {
	ID          string     `json:"id"`
	Username    string     `json:"username"`
	Avatar      string     `json:"avatar"`
	Role        string     `json:"role"`
	AuthMethod  string     `json:"auth_method"` // "password" | "discord"
	LastSeenAt  *time.Time `json:"last_seen_at"`
}

func UpdateLastSeen(db *sql.DB, userID string) {
	now := time.Now().UTC()
	_, _ = db.Exec(`UPDATE users SET last_seen_at = ? WHERE id = ?`, now, userID)
	_, _ = db.Exec(`UPDATE discord_users SET last_seen_at = ? WHERE id = ?`, now, userID)
}

func ListMembers(db *sql.DB) ([]Member, error) {
	rows, err := db.Query(`
		SELECT id, COALESCE(username,''), '', role, 'password', last_seen_at
		FROM users WHERE COALESCE(username,'') != ''
		UNION ALL
		SELECT id,
		       COALESCE(username,''),
		       CASE WHEN COALESCE(discord_id,'') != '' AND COALESCE(avatar,'') != ''
		            THEN 'https://cdn.discordapp.com/avatars/' || discord_id || '/' || avatar || '.png'
		            ELSE '' END,
		       role, 'discord', last_seen_at
		FROM discord_users WHERE COALESCE(username,'') != ''
		ORDER BY last_seen_at DESC NULLS LAST
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members []Member
	for rows.Next() {
		var m Member
		var lastSeen sql.NullTime
		if err := rows.Scan(&m.ID, &m.Username, &m.Avatar, &m.Role, &m.AuthMethod, &lastSeen); err != nil {
			continue
		}
		if lastSeen.Valid {
			m.LastSeenAt = &lastSeen.Time
		}
		members = append(members, m)
	}
	if members == nil {
		members = []Member{}
	}
	return members, rows.Err()
}
