package db

import (
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
)

type CollectionFile struct {
	ID            string    `json:"id"`
	CollectionID  string    `json:"collection_id"`
	FileName      string    `json:"file_name"`
	FileSize      int64     `json:"file_size"`
	ThumbnailName string    `json:"thumbnail_name"`
	StorageType   string    `json:"storage_type"` // "nas" or "local"
	UploadedBy    string    `json:"uploaded_by"`
	UploadedAt    time.Time `json:"uploaded_at"`
}

// CollectionFileWithUploader はアップロード者情報を含む拡張型（API レスポンス用）
type CollectionFileWithUploader struct {
	ID             string    `json:"id"`
	CollectionID   string    `json:"collection_id"`
	FileName       string    `json:"file_name"`
	DisplayName    string    `json:"display_name"`
	FileSize       int64     `json:"file_size"`
	ThumbnailName  string    `json:"thumbnail_name"`
	StorageType    string    `json:"storage_type"` // "nas" or "local"
	UploadedBy     string    `json:"uploaded_by"`
	UploaderName   string    `json:"uploader_name"`
	UploaderAvatar string    `json:"uploader_avatar"`
	UploadedAt     time.Time `json:"uploaded_at"`
	ViewCount      int64     `json:"view_count"`
}

var ErrFileNotFound = errors.New("file not found")

func AddFileToCollection(db *sql.DB, collectionID, fileName, thumbnailName, storageType string, fileSize int64, uploadedBy string) (CollectionFile, error) {
	if storageType == "" {
		storageType = "nas"
	}
	id := uuid.NewString()
	_, err := db.Exec(
		`INSERT INTO collection_files (id, collection_id, file_name, file_size, thumbnail_name, storage_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		id, collectionID, fileName, fileSize, thumbnailName, storageType, uploadedBy,
	)
	if err != nil {
		return CollectionFile{}, err
	}
	return GetFileByID(db, id)
}

func GetFileByID(db *sql.DB, id string) (CollectionFile, error) {
	var f CollectionFile
	err := db.QueryRow(
		`SELECT id, collection_id, file_name, file_size,
		        COALESCE(thumbnail_name,''), COALESCE(storage_type,'nas'), COALESCE(uploaded_by,''), uploaded_at
		 FROM collection_files WHERE id = ?`, id,
	).Scan(&f.ID, &f.CollectionID, &f.FileName, &f.FileSize, &f.ThumbnailName, &f.StorageType, &f.UploadedBy, &f.UploadedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return CollectionFile{}, ErrFileNotFound
	}
	return f, err
}

// ListFilesByCollectionWithUploader は JOIN でアップロード者情報を付加して返す
func ListFilesByCollectionWithUploader(db *sql.DB, collectionID string) ([]CollectionFileWithUploader, error) {
	rows, err := db.Query(`
		SELECT
			cf.id,
			cf.collection_id,
			cf.file_name,
			COALESCE(cf.display_name, '')    AS display_name,
			cf.file_size,
			COALESCE(cf.thumbnail_name, '')  AS thumbnail_name,
			COALESCE(cf.storage_type, 'nas') AS storage_type,
			COALESCE(cf.uploaded_by, '')     AS uploaded_by,
			cf.uploaded_at,
			COALESCE(u.username, du.username, 'Unknown') AS uploader_name,
			COALESCE(du.avatar, '')                      AS uploader_avatar,
			COALESCE(du.discord_id, '')                  AS discord_id,
			COALESCE(cf.view_count, 0)                   AS view_count
		FROM collection_files cf
		LEFT JOIN users         u  ON u.id  = cf.uploaded_by
		LEFT JOIN discord_users du ON du.id = cf.uploaded_by
		WHERE cf.collection_id = ?
		ORDER BY cf.uploaded_at DESC
	`, collectionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []CollectionFileWithUploader
	for rows.Next() {
		var f CollectionFileWithUploader
		var discordID string
		if err := rows.Scan(
			&f.ID, &f.CollectionID, &f.FileName, &f.DisplayName, &f.FileSize,
			&f.ThumbnailName, &f.StorageType, &f.UploadedBy, &f.UploadedAt,
			&f.UploaderName, &f.UploaderAvatar, &discordID, &f.ViewCount,
		); err != nil {
			return nil, err
		}
		// Discord アバター URL を組み立てる
		if discordID != "" && f.UploaderAvatar != "" {
			f.UploaderAvatar = "https://cdn.discordapp.com/avatars/" + discordID + "/" + f.UploaderAvatar + ".png"
		} else {
			f.UploaderAvatar = ""
		}
		files = append(files, f)
	}
	return files, rows.Err()
}

// IncrementViewCount は指定ファイルの視聴回数を1増やす
func IncrementViewCount(db *sql.DB, fileID string) error {
	_, err := db.Exec(`UPDATE collection_files SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?`, fileID)
	return err
}

func ListFilesByCollection(db *sql.DB, collectionID string) ([]CollectionFile, error) {
	rows, err := db.Query(
		`SELECT id, collection_id, file_name, file_size, COALESCE(thumbnail_name,''), uploaded_by, uploaded_at
		 FROM collection_files WHERE collection_id = ? ORDER BY uploaded_at DESC`,
		collectionID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []CollectionFile
	for rows.Next() {
		var f CollectionFile
		if err := rows.Scan(&f.ID, &f.CollectionID, &f.FileName, &f.FileSize, &f.ThumbnailName, &f.UploadedBy, &f.UploadedAt); err != nil {
			return nil, err
		}
		files = append(files, f)
	}
	return files, rows.Err()
}

func ListRecentFiles(db *sql.DB, limit int) ([]CollectionFile, error) {
	rows, err := db.Query(
		`SELECT id, collection_id, file_name, file_size, COALESCE(thumbnail_name,''), uploaded_by, uploaded_at
		 FROM collection_files ORDER BY uploaded_at DESC LIMIT ?`,
		limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []CollectionFile
	for rows.Next() {
		var f CollectionFile
		if err := rows.Scan(&f.ID, &f.CollectionID, &f.FileName, &f.FileSize, &f.ThumbnailName, &f.UploadedBy, &f.UploadedAt); err != nil {
			return nil, err
		}
		files = append(files, f)
	}
	return files, rows.Err()
}

func UpdateCollectionFile(db *sql.DB, fileID, displayName, thumbnailName, collectionID, uploadedBy string) error {
	if uploadedBy != "" {
		_, err := db.Exec(
			`UPDATE collection_files SET display_name = ?, thumbnail_name = ?, collection_id = ?, uploaded_by = ? WHERE id = ?`,
			displayName, thumbnailName, collectionID, uploadedBy, fileID,
		)
		return err
	}
	_, err := db.Exec(
		`UPDATE collection_files SET display_name = ?, thumbnail_name = ?, collection_id = ? WHERE id = ?`,
		displayName, thumbnailName, collectionID, fileID,
	)
	return err
}

func DeleteFileFromCollection(db *sql.DB, id string) error {
	_, err := db.Exec(`DELETE FROM collection_files WHERE id = ?`, id)
	return err
}

// RecentFileItem is a denormalized view joining collection_files with collections and users.
type RecentFileItem struct {
	ID             string `json:"id"`
	CollectionID   string `json:"collection_id"`
	CollectionName string `json:"collection_name"`
	FileName       string `json:"file_name"`
	DisplayName    string `json:"display_name"`
	FileSize       int64  `json:"file_size"`
	ThumbnailName  string `json:"thumbnail_name"`
	UploadedBy     string `json:"uploaded_by"`
	UploaderName   string `json:"uploader_name"`
	UploaderAvatar string `json:"uploader_avatar"`
	UploadedAt     string `json:"uploaded_at"`
	ViewCount      int64  `json:"view_count"`
}

// ListAllFilesJoin returns recent collection files with uploader info (JOIN across users/discord_users).
func ListAllFilesJoin(db *sql.DB) ([]RecentFileItem, error) {
	rows, err := db.Query(`
		SELECT cf.id, cf.collection_id, COALESCE(col.name,'') AS collection_name,
		       cf.file_name, COALESCE(cf.display_name,'') AS display_name, cf.file_size,
		       COALESCE(cf.thumbnail_name,''),
		       COALESCE(cf.uploaded_by,''),
		       COALESCE(u.username, du.username, '') AS uploader_name,
		       COALESCE(
		           CASE WHEN du.discord_id != '' AND du.avatar != ''
		                THEN 'https://cdn.discordapp.com/avatars/' || du.discord_id || '/' || du.avatar || '.png'
		                ELSE '' END, '') AS uploader_avatar,
		       cf.uploaded_at,
		       COALESCE(cf.view_count, 0) AS view_count
		FROM collection_files cf
		LEFT JOIN collections   col ON col.id = cf.collection_id
		LEFT JOIN users           u ON u.id   = cf.uploaded_by
		LEFT JOIN discord_users  du ON du.id  = cf.uploaded_by
		WHERE cf.collection_id IS NOT NULL AND cf.collection_id != ''
		ORDER BY cf.uploaded_at DESC LIMIT 100
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []RecentFileItem
	for rows.Next() {
		var f RecentFileItem
		if err := rows.Scan(&f.ID, &f.CollectionID, &f.CollectionName,
			&f.FileName, &f.DisplayName, &f.FileSize, &f.ThumbnailName,
			&f.UploadedBy, &f.UploaderName, &f.UploaderAvatar,
			&f.UploadedAt, &f.ViewCount); err != nil {
			return nil, err
		}
		files = append(files, f)
	}
	if files == nil {
		files = []RecentFileItem{}
	}
	return files, rows.Err()
}
