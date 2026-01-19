package repository

import (
	"database/sql"
	"hidemeserver/models"
	"time"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(database *Database) *UserRepository {
	return &UserRepository{
		db: database.DB(),
	}
}

func (r *UserRepository) CreateOrUpdate(user *models.User) error {
	query := `
		INSERT INTO users (id, name, avatar, status, last_seen)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			name = excluded.name,
			avatar = excluded.avatar,
			status = excluded.status,
			last_seen = excluded.last_seen
	`

	_, err := r.db.Exec(query,
		user.ID,
		user.Name,
		user.Avatar,
		user.Status,
		user.LastSeen,
	)

	return err
}

func (r *UserRepository) GetByID(id string) (*models.User, error) {
	query := `SELECT id, name, avatar, status, last_seen FROM users WHERE id = ?`

	user := &models.User{}
	err := r.db.QueryRow(query, id).Scan(
		&user.ID,
		&user.Name,
		&user.Avatar,
		&user.Status,
		&user.LastSeen,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (r *UserRepository) GetAll() ([]*models.User, error) {
	query := `SELECT id, name, avatar, status, last_seen FROM users ORDER BY name`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(
			&user.ID,
			&user.Name,
			&user.Avatar,
			&user.Status,
			&user.LastSeen,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, rows.Err()
}

func (r *UserRepository) UpdateStatus(userID, status string) error {
	query := `UPDATE users SET status = ?, last_seen = ? WHERE id = ?`
	_, err := r.db.Exec(query, status, time.Now(), userID)
	return err
}

func (r *UserRepository) Delete(userID string) error {
	query := `DELETE FROM users WHERE id = ?`
	_, err := r.db.Exec(query, userID)
	return err
}

func (r *UserRepository) GetOnlineUsers() ([]*models.User, error) {
	query := `
		SELECT id, name, avatar, status, last_seen 
		FROM users 
		WHERE status = 'online'
		ORDER BY name
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(
			&user.ID,
			&user.Name,
			&user.Avatar,
			&user.Status,
			&user.LastSeen,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, rows.Err()
}
