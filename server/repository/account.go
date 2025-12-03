package repository

import (
	"database/sql"
	"hidemeserver/models"

	"golang.org/x/crypto/bcrypt"
)

type AccountRepository struct {
	db *sql.DB
}

func NewAccountRepository(database *Database) *AccountRepository {
	return &AccountRepository{
		db: database.DB(),
	}
}

// Create アカウントを作成
func (r *AccountRepository) Create(account *models.Account, password string) error {
	// パスワードをハッシュ化
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO accounts (id, username, password_hash, display_name, avatar)
		VALUES (?, ?, ?, ?, ?)
	`

	_, err = r.db.Exec(query,
		account.ID,
		account.Username,
		string(hashedPassword),
		account.DisplayName,
		account.Avatar,
	)

	return err
}

// GetByUsername ユーザー名でアカウントを取得
func (r *AccountRepository) GetByUsername(username string) (*models.Account, error) {
	query := `
		SELECT id, username, password_hash, display_name, avatar, created_at, updated_at, last_login
		FROM accounts WHERE username = ?
	`

	account := &models.Account{}
	var lastLogin sql.NullTime

	err := r.db.QueryRow(query, username).Scan(
		&account.ID,
		&account.Username,
		&account.PasswordHash,
		&account.DisplayName,
		&account.Avatar,
		&account.CreatedAt,
		&account.UpdatedAt,
		&lastLogin,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	if lastLogin.Valid {
		account.LastLogin = &lastLogin.Time
	}

	return account, nil
}

// GetByID IDでアカウントを取得
func (r *AccountRepository) GetByID(id string) (*models.Account, error) {
	query := `
		SELECT id, username, password_hash, display_name, avatar, created_at, updated_at, last_login
		FROM accounts WHERE id = ?
	`

	account := &models.Account{}
	var lastLogin sql.NullTime

	err := r.db.QueryRow(query, id).Scan(
		&account.ID,
		&account.Username,
		&account.PasswordHash,
		&account.DisplayName,
		&account.Avatar,
		&account.CreatedAt,
		&account.UpdatedAt,
		&lastLogin,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	if lastLogin.Valid {
		account.LastLogin = &lastLogin.Time
	}

	return account, nil
}

// VerifyPassword パスワードを検証
func (r *AccountRepository) VerifyPassword(account *models.Account, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(account.PasswordHash), []byte(password))
	return err == nil
}

// UpdateLastLogin 最終ログイン時刻を更新
func (r *AccountRepository) UpdateLastLogin(userID string) error {
	query := `UPDATE accounts SET last_login = CURRENT_TIMESTAMP WHERE id = ?`
	_, err := r.db.Exec(query, userID)
	return err
}

// UsernameExists ユーザー名が既に存在するか確認
func (r *AccountRepository) UsernameExists(username string) (bool, error) {
	query := `SELECT COUNT(*) FROM accounts WHERE username = ?`
	var count int
	err := r.db.QueryRow(query, username).Scan(&count)
	return count > 0, err
}
