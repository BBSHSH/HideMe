package db

import (
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
)

type DiscordUser struct {
	ID           string
	DiscordID    string
	Username     string
	Avatar       string
	AccessToken  string
	RefreshToken string
	Role         string
	CreatedAt    time.Time
	LastLoginAt  time.Time
}

var ErrDiscordUserNotFound = errors.New("discord user not found")

// AvatarURL は Discord の CDN アバター URL を返す。
// avatar が空なら "" を返す。
func (u *DiscordUser) AvatarURL() string {
	if u.Avatar == "" {
		return ""
	}
	return "https://cdn.discordapp.com/avatars/" + u.DiscordID + "/" + u.Avatar + ".png"
}

// GetOrCreateDiscordUser はログイン時に Discord ユーザーを upsert する。
func GetOrCreateDiscordUser(db *sql.DB, discordID, username, avatar, accessToken, refreshToken string) (DiscordUser, error) {
	_, err := GetDiscordUserByDiscordID(db, discordID)
	if err == nil {
		// 既存ユーザー: トークンとアバターを更新
		now := time.Now().UTC()
		_, err = db.Exec(
			`UPDATE discord_users
			 SET username = ?, avatar = ?, access_token = ?, refresh_token = ?, last_login_at = ?
			 WHERE discord_id = ?`,
			username, avatar, accessToken, refreshToken, now, discordID,
		)
		if err != nil {
			return DiscordUser{}, err
		}
		return GetDiscordUserByDiscordID(db, discordID)
	}
	if !errors.Is(err, ErrDiscordUserNotFound) {
		return DiscordUser{}, err
	}

	// 新規作成
	id := uuid.NewString()
	_, err = db.Exec(
		`INSERT INTO discord_users (id, discord_id, username, avatar, access_token, refresh_token, role)
		 VALUES (?, ?, ?, ?, ?, ?, 'member')`,
		id, discordID, username, avatar, accessToken, refreshToken,
	)
	if err != nil {
		return DiscordUser{}, err
	}
	return GetDiscordUserByDiscordID(db, discordID)
}

func GetDiscordUserByDiscordID(db *sql.DB, discordID string) (DiscordUser, error) {
	var u DiscordUser
	err := db.QueryRow(
		`SELECT id, discord_id, username, avatar, access_token, refresh_token, role, created_at, last_login_at
		 FROM discord_users WHERE discord_id = ?`, discordID,
	).Scan(&u.ID, &u.DiscordID, &u.Username, &u.Avatar, &u.AccessToken, &u.RefreshToken, &u.Role, &u.CreatedAt, &u.LastLoginAt)
	if errors.Is(err, sql.ErrNoRows) {
		return DiscordUser{}, ErrDiscordUserNotFound
	}
	return u, err
}

func GetDiscordUserByID(db *sql.DB, id string) (DiscordUser, error) {
	var u DiscordUser
	err := db.QueryRow(
		`SELECT id, discord_id, username, avatar, access_token, refresh_token, role, created_at, last_login_at
		 FROM discord_users WHERE id = ?`, id,
	).Scan(&u.ID, &u.DiscordID, &u.Username, &u.Avatar, &u.AccessToken, &u.RefreshToken, &u.Role, &u.CreatedAt, &u.LastLoginAt)
	if errors.Is(err, sql.ErrNoRows) {
		return DiscordUser{}, ErrDiscordUserNotFound
	}
	return u, err
}
