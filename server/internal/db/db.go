package db

import (
	"database/sql"
	"fmt"
	"strings"

	_ "modernc.org/sqlite"
)

func isDuplicateColumn(err error) bool {
	return err != nil && strings.Contains(err.Error(), "duplicate column name")
}

func Open(path string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	if err := migrate(db); err != nil {
		return nil, fmt.Errorf("migrate: %w", err)
	}
	return db, nil
}

func migrate(db *sql.DB) error {
	// ① まずテーブルを全部作る（新規DB・既存DB 両対応）
	_, err := db.Exec(`
		PRAGMA journal_mode=WAL;
		PRAGMA foreign_keys=ON;

		CREATE TABLE IF NOT EXISTS users (
			id         TEXT PRIMARY KEY,
			username   TEXT NOT NULL UNIQUE,
			password   TEXT NOT NULL,
			role       TEXT NOT NULL DEFAULT 'member',
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS discord_users (
			id            TEXT PRIMARY KEY,
			discord_id    TEXT NOT NULL UNIQUE,
			username      TEXT NOT NULL,
			avatar        TEXT,
			access_token  TEXT,
			refresh_token TEXT,
			role          TEXT NOT NULL DEFAULT 'member',
			created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			last_login_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS auth_settings (
			id                    INTEGER PRIMARY KEY DEFAULT 1,
			normal_login_enabled  INTEGER NOT NULL DEFAULT 1,
			discord_login_enabled INTEGER NOT NULL DEFAULT 0
		);

		INSERT OR IGNORE INTO auth_settings (id, normal_login_enabled, discord_login_enabled)
		VALUES (1, 1, 0);

		CREATE TABLE IF NOT EXISTS collections (
			id          TEXT PRIMARY KEY,
			name        TEXT NOT NULL,
			description TEXT,
			color       TEXT,
			icon        TEXT,
			image_url   TEXT
		);

		CREATE TABLE IF NOT EXISTS dm_conversations (
			id       TEXT PRIMARY KEY,
			user1_id TEXT NOT NULL,
			user2_id TEXT NOT NULL,
			user1_name   TEXT NOT NULL DEFAULT '',
			user2_name   TEXT NOT NULL DEFAULT '',
			user1_avatar TEXT NOT NULL DEFAULT '',
			user2_avatar TEXT NOT NULL DEFAULT '',
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(user1_id, user2_id)
		);

		CREATE TABLE IF NOT EXISTS dm_messages (
			id              TEXT PRIMARY KEY,
			conversation_id TEXT NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
			sender_id       TEXT NOT NULL,
			sender_name     TEXT NOT NULL,
			sender_avatar   TEXT NOT NULL DEFAULT '',
			content         TEXT NOT NULL,
			created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS chat_channels (
			id          TEXT PRIMARY KEY,
			name        TEXT NOT NULL,
			description TEXT DEFAULT '',
			type        TEXT NOT NULL DEFAULT 'text',
			position    INTEGER DEFAULT 0,
			created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS chat_messages (
			id         TEXT PRIMARY KEY,
			channel_id TEXT NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
			user_id    TEXT NOT NULL,
			username   TEXT NOT NULL,
			avatar     TEXT DEFAULT '',
			content    TEXT NOT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			edited_at  DATETIME
		);

		CREATE TABLE IF NOT EXISTS app_settings (
			key   TEXT PRIMARY KEY,
			value TEXT NOT NULL DEFAULT ''
		);

		CREATE TABLE IF NOT EXISTS collection_files (
			id             TEXT PRIMARY KEY,
			collection_id  TEXT REFERENCES collections(id) ON DELETE CASCADE,
			file_name      TEXT NOT NULL,
			file_size      INTEGER,
			thumbnail_name TEXT,
			storage_type   TEXT NOT NULL DEFAULT 'nas',
			uploaded_by    TEXT,
			uploaded_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS activity_log (
			id         TEXT PRIMARY KEY,
			type       TEXT NOT NULL,
			user_id    TEXT NOT NULL,
			username   TEXT NOT NULL,
			avatar     TEXT NOT NULL DEFAULT '',
			detail     TEXT NOT NULL DEFAULT '',
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		return err
	}

	// ② 列追加マイグレーション（冪等）
	for _, ddl := range []string{
		`ALTER TABLE collection_files ADD COLUMN thumbnail_name TEXT`,
		`ALTER TABLE collection_files ADD COLUMN storage_type TEXT NOT NULL DEFAULT 'nas'`,
		`ALTER TABLE chat_channels ADD COLUMN type TEXT NOT NULL DEFAULT 'text'`,
		`ALTER TABLE collection_files ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE collection_files ADD COLUMN display_name TEXT`,
		`ALTER TABLE collections ADD COLUMN genre TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE users ADD COLUMN last_seen_at DATETIME`,
		`ALTER TABLE discord_users ADD COLUMN last_seen_at DATETIME`,
	} {
		if _, err := db.Exec(ddl); err != nil {
			if !isDuplicateColumn(err) {
				return fmt.Errorf("alter table: %w", err)
			}
		}
	}

	// ③ uploaded_by の外部キー制約を除去する
	//    旧スキーマは uploaded_by TEXT REFERENCES users(id) だったが、
	//    Discord ユーザーは discord_users テーブルにあるため INSERT 時に
	//    FOREIGN KEY constraint failed になる。
	//    SQLite は制約の DROP ができないのでテーブルを作り直す。
	if err := dropUploadedByFKIfNeeded(db); err != nil {
		return fmt.Errorf("drop uploaded_by fk: %w", err)
	}

	return nil
}

// dropUploadedByFKIfNeeded は collection_files.uploaded_by に
// REFERENCES users(id) 制約が残っている場合だけテーブルを再作成する。
func dropUploadedByFKIfNeeded(db *sql.DB) error {
	// PRAGMA foreign_key_list でチェック
	rows, err := db.Query(`PRAGMA foreign_key_list(collection_files)`)
	if err != nil {
		return err
	}
	defer rows.Close()

	needsFix := false
	for rows.Next() {
		var id, seq int
		var table, from, to, onUpdate, onDelete, match string
		if err := rows.Scan(&id, &seq, &table, &from, &to, &onUpdate, &onDelete, &match); err != nil {
			return err
		}
		// uploaded_by → users(id) の外部キーが残っている場合
		if from == "uploaded_by" && table == "users" {
			needsFix = true
			break
		}
	}
	rows.Close()

	if !needsFix {
		return nil
	}

	// テーブルを作り直す（データは保持）
	_, err = db.Exec(`
		PRAGMA foreign_keys=OFF;

		CREATE TABLE IF NOT EXISTS collection_files_new (
			id             TEXT PRIMARY KEY,
			collection_id  TEXT REFERENCES collections(id) ON DELETE CASCADE,
			file_name      TEXT NOT NULL,
			file_size      INTEGER,
			thumbnail_name TEXT,
			uploaded_by    TEXT,
			uploaded_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);

		INSERT INTO collection_files_new
			(id, collection_id, file_name, file_size, thumbnail_name, uploaded_by, uploaded_at)
		SELECT
			id,
			collection_id,
			file_name,
			file_size,
			COALESCE(thumbnail_name, ''),
			COALESCE(uploaded_by, ''),
			uploaded_at
		FROM collection_files;

		DROP TABLE collection_files;
		ALTER TABLE collection_files_new RENAME TO collection_files;

		PRAGMA foreign_keys=ON;
	`)
	return err
}
