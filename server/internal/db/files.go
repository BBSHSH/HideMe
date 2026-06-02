package db

import (
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
)

type CollectionFile struct {
	ID           string    `json:"id"`
	CollectionID string    `json:"collection_id"`
	FileName     string    `json:"file_name"`
	FileSize     int64     `json:"file_size"`
	UploadedBy   string    `json:"uploaded_by"`
	UploadedAt   time.Time `json:"uploaded_at"`
}

var ErrFileNotFound = errors.New("file not found")

func AddFileToCollection(db *sql.DB, collectionID, fileName string, fileSize int64, uploadedBy string) (CollectionFile, error) {
	id := uuid.NewString()
	_, err := db.Exec(
		`INSERT INTO collection_files (id, collection_id, file_name, file_size, uploaded_by) VALUES (?, ?, ?, ?, ?)`,
		id, collectionID, fileName, fileSize, uploadedBy,
	)
	if err != nil {
		return CollectionFile{}, err
	}
	return GetFileByID(db, id)
}

func GetFileByID(db *sql.DB, id string) (CollectionFile, error) {
	var f CollectionFile
	err := db.QueryRow(
		`SELECT id, collection_id, file_name, file_size, uploaded_by, uploaded_at FROM collection_files WHERE id = ?`, id,
	).Scan(&f.ID, &f.CollectionID, &f.FileName, &f.FileSize, &f.UploadedBy, &f.UploadedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return CollectionFile{}, ErrFileNotFound
	}
	return f, err
}

func ListFilesByCollection(db *sql.DB, collectionID string) ([]CollectionFile, error) {
	rows, err := db.Query(
		`SELECT id, collection_id, file_name, file_size, uploaded_by, uploaded_at FROM collection_files WHERE collection_id = ? ORDER BY uploaded_at DESC`,
		collectionID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []CollectionFile
	for rows.Next() {
		var f CollectionFile
		if err := rows.Scan(&f.ID, &f.CollectionID, &f.FileName, &f.FileSize, &f.UploadedBy, &f.UploadedAt); err != nil {
			return nil, err
		}
		files = append(files, f)
	}
	return files, rows.Err()
}

func ListRecentFiles(db *sql.DB, limit int) ([]CollectionFile, error) {
	rows, err := db.Query(
		`SELECT id, collection_id, file_name, file_size, uploaded_by, uploaded_at FROM collection_files ORDER BY uploaded_at DESC LIMIT ?`,
		limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []CollectionFile
	for rows.Next() {
		var f CollectionFile
		if err := rows.Scan(&f.ID, &f.CollectionID, &f.FileName, &f.FileSize, &f.UploadedBy, &f.UploadedAt); err != nil {
			return nil, err
		}
		files = append(files, f)
	}
	return files, rows.Err()
}

func DeleteFileFromCollection(db *sql.DB, id string) error {
	_, err := db.Exec(`DELETE FROM collection_files WHERE id = ?`, id)
	return err
}
