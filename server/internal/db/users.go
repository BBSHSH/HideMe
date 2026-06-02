package db

import (
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID        string
	Username  string
	Password  string
	Role      string
	CreatedAt time.Time
}

var ErrUserNotFound = errors.New("user not found")
var ErrUsernameTaken = errors.New("username already taken")

func CreateUser(db *sql.DB, username, hashedPassword, role string) (User, error) {
	id := uuid.NewString()
	_, err := db.Exec(
		`INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)`,
		id, username, hashedPassword, role,
	)
	if err != nil {
		return User{}, err
	}
	return GetUserByID(db, id)
}

func GetUserByID(db *sql.DB, id string) (User, error) {
	var u User
	err := db.QueryRow(
		`SELECT id, username, password, role, created_at FROM users WHERE id = ?`, id,
	).Scan(&u.ID, &u.Username, &u.Password, &u.Role, &u.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return User{}, ErrUserNotFound
	}
	return u, err
}

func GetUserByUsername(db *sql.DB, username string) (User, error) {
	var u User
	err := db.QueryRow(
		`SELECT id, username, password, role, created_at FROM users WHERE username = ?`, username,
	).Scan(&u.ID, &u.Username, &u.Password, &u.Role, &u.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return User{}, ErrUserNotFound
	}
	return u, err
}
