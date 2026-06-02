package db

import (
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite"
)

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

		CREATE TABLE IF NOT EXISTS collections (
			id          TEXT PRIMARY KEY,
			name        TEXT NOT NULL,
			description TEXT,
			color       TEXT,
			icon        TEXT,
			image_url   TEXT
		);

		CREATE TABLE IF NOT EXISTS collection_files (
			id            TEXT PRIMARY KEY,
			collection_id TEXT REFERENCES collections(id) ON DELETE CASCADE,
			file_name     TEXT NOT NULL,
			file_size     INTEGER,
			uploaded_by   TEXT REFERENCES users(id),
			uploaded_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
	`)
	return err
}
