package repository

import (
	"database/sql"
	"fmt"
	"log"

	_ "modernc.org/sqlite"
)

type Database struct {
	db *sql.DB
}

func NewDatabase(dbPath string) (*Database, error) {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("DB接続エラー: %v", err)
	}

	// SQLiteの最適化設定
	db.Exec("PRAGMA foreign_keys = ON")
	db.Exec("PRAGMA journal_mode = WAL")
	db.Exec("PRAGMA synchronous = NORMAL")
	db.Exec("PRAGMA cache_size = 10000")
	db.Exec("PRAGMA temp_store = MEMORY")

	db.SetMaxOpenConns(1) // SQLiteは1接続推奨

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("DBピングエラー: %v", err)
	}

	database := &Database{db: db}

	if err := database.createTables(); err != nil {
		return nil, fmt.Errorf("テーブル作成エラー: %v", err)
	}

	log.Println("データベース初期化完了")
	return database, nil
}

func (d *Database) createTables() error {
	queries := []string{
		// ユーザーテーブル
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			avatar TEXT NOT NULL,
			status TEXT NOT NULL,
			last_seen DATETIME NOT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,

		// メッセージテーブル
		`CREATE TABLE IF NOT EXISTS messages (
			id TEXT PRIMARY KEY,
			from_id TEXT NOT NULL,
			to_id TEXT NOT NULL,
			content TEXT NOT NULL,
			type TEXT NOT NULL DEFAULT 'text',
			timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			read_status BOOLEAN NOT NULL DEFAULT 0,
			deleted_at DATETIME,
			FOREIGN KEY (from_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (to_id) REFERENCES users(id) ON DELETE CASCADE
		)`,

		// 監査ログテーブル（GDPR対応）
		`CREATE TABLE IF NOT EXISTS audit_logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id TEXT,
			action TEXT NOT NULL,
			resource_type TEXT,
			resource_id TEXT,
			ip_address TEXT,
			user_agent TEXT,
			timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			metadata TEXT
		)`,

		// 削除リクエストテーブル（GDPR対応）
		`CREATE TABLE IF NOT EXISTS deletion_requests (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id TEXT NOT NULL,
			requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			processed_at DATETIME,
			status TEXT NOT NULL DEFAULT 'pending'
		)`,

		// インデックス
		`CREATE INDEX IF NOT EXISTS idx_messages_conversation 
		 ON messages(from_id, to_id, timestamp)`,

		`CREATE INDEX IF NOT EXISTS idx_messages_unread 
		 ON messages(to_id, read_status, deleted_at)`,

		`CREATE INDEX IF NOT EXISTS idx_messages_timestamp 
		 ON messages(timestamp DESC)`,

		`CREATE INDEX IF NOT EXISTS idx_audit_logs_user 
		 ON audit_logs(user_id, timestamp)`,

		`CREATE INDEX IF NOT EXISTS idx_users_status 
		 ON users(status)`,

		// トリガー: updated_at自動更新
		`CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
		 AFTER UPDATE ON users
		 BEGIN
			UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
		 END`,
	}

	for _, query := range queries {
		if _, err := d.db.Exec(query); err != nil {
			return err
		}
	}

	return nil
}

func (d *Database) Close() error {
	if d.db != nil {
		return d.db.Close()
	}
	return nil
}

func (d *Database) DB() *sql.DB {
	return d.db
}
