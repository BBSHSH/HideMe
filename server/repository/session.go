package repository

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"hidemeserver/models"
	"time"
)

type SessionRepository struct {
	db *sql.DB
}

func NewSessionRepository(database *Database) *SessionRepository {
	return &SessionRepository{
		db: database.DB(),
	}
}

// GenerateToken ランダムなトークンを生成
func (r *SessionRepository) GenerateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// Create セッションを作成
func (r *SessionRepository) Create(userID string) (*models.Session, error) {
	token, err := r.GenerateToken()
	if err != nil {
		return nil, err
	}

	expiresAt := time.Now().Add(30 * 24 * time.Hour) // 30日間有効

	query := `
		INSERT INTO sessions (token, user_id, expires_at)
		VALUES (?, ?, ?)
	`

	_, err = r.db.Exec(query, token, userID, expiresAt)
	if err != nil {
		return nil, err
	}

	return &models.Session{
		Token:     token,
		UserID:    userID,
		CreatedAt: time.Now(),
		ExpiresAt: expiresAt,
	}, nil
}

// GetByToken トークンでセッションを取得
func (r *SessionRepository) GetByToken(token string) (*models.Session, error) {
	query := `
		SELECT token, user_id, created_at, expires_at
		FROM sessions
		WHERE token = ? AND expires_at > CURRENT_TIMESTAMP
	`

	session := &models.Session{}
	err := r.db.QueryRow(query, token).Scan(
		&session.Token,
		&session.UserID,
		&session.CreatedAt,
		&session.ExpiresAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return session, nil
}

// Delete セッションを削除
func (r *SessionRepository) Delete(token string) error {
	query := `DELETE FROM sessions WHERE token = ?`
	_, err := r.db.Exec(query, token)
	return err
}

// DeleteByUserID ユーザーの全セッションを削除
func (r *SessionRepository) DeleteByUserID(userID string) error {
	query := `DELETE FROM sessions WHERE user_id = ?`
	_, err := r.db.Exec(query, userID)
	return err
}

// CleanupExpired 期限切れセッションを削除
func (r *SessionRepository) CleanupExpired() error {
	query := `DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP`
	_, err := r.db.Exec(query)
	return err
}
