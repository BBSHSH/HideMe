package handlers

import (
	"context"
	"database/sql"
	"io"
	"log"
	"net/http"
	"path"
	"sync"

	"github.com/BBSHSH/HideMe/server/internal/storage"
	"github.com/gin-gonic/gin"
)

type migrateStatus struct {
	Status  string `json:"status"`  // idle / running / done / error
	Total   int    `json:"total"`
	Done    int    `json:"done"`
	Current string `json:"current"`
	Errors  int    `json:"errors"`
	ErrMsg  string `json:"error,omitempty"`
}

var (
	migrateMu    sync.Mutex
	migrateState = &migrateStatus{Status: "idle"}
)

// GetMigrateStatus は現在の移植状況を返す
func GetMigrateStatus() gin.HandlerFunc {
	return func(c *gin.Context) {
		migrateMu.Lock()
		s := *migrateState
		migrateMu.Unlock()
		c.JSON(http.StatusOK, s)
	}
}

// StartMigration は NAS → Local の全ファイル移植を開始する
func StartMigration(nasStore, localStore storage.Storage, database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		migrateMu.Lock()
		if migrateState.Status == "running" {
			migrateMu.Unlock()
			c.JSON(http.StatusConflict, gin.H{"error": "migration already running"})
			return
		}
		migrateState = &migrateStatus{Status: "running"}
		migrateMu.Unlock()

		go runMigration(nasStore, localStore, database)
		c.JSON(http.StatusAccepted, gin.H{"message": "migration started"})
	}
}

func runMigration(nas, local storage.Storage, database *sql.DB) {
	ctx := context.Background()

	// ── 1. 移植対象ファイルを収集 ──────────────────────────────
	type fileEntry struct {
		nasName string
		fileID  string // "" = not a collection_file (e.g. icon)
	}

	var files []fileEntry

	// collection_files: file_name と thumbnail_name（storage_type = 'nas' のもの）
	rows, err := database.Query(`
		SELECT id, file_name, COALESCE(thumbnail_name,'')
		FROM collection_files
		WHERE COALESCE(storage_type,'nas') = 'nas'
	`)
	if err != nil {
		setMigrateError("DB query failed: " + err.Error())
		return
	}
	type cfRow struct {
		id, fileName, thumbnailName string
	}
	var cfRows []cfRow
	for rows.Next() {
		var r cfRow
		if err := rows.Scan(&r.id, &r.fileName, &r.thumbnailName); err == nil {
			cfRows = append(cfRows, r)
		}
	}
	rows.Close()

	seen := map[string]bool{}
	for _, r := range cfRows {
		if r.fileName != "" && !seen[r.fileName] {
			seen[r.fileName] = true
			files = append(files, fileEntry{nasName: r.fileName, fileID: r.id})
		}
		if r.thumbnailName != "" && !seen[r.thumbnailName] {
			seen[r.thumbnailName] = true
			files = append(files, fileEntry{nasName: r.thumbnailName})
		}
	}

	// collections: icon ファイル（image_url の basename が icon_ で始まるもの）
	iconRows, err := database.Query(`SELECT COALESCE(image_url,'') FROM collections WHERE image_url != ''`)
	if err == nil {
		for iconRows.Next() {
			var raw string
			if err := iconRows.Scan(&raw); err == nil {
				name := path.Base(raw)
				if name != "" && name != "." && !seen[name] {
					seen[name] = true
					files = append(files, fileEntry{nasName: name})
				}
			}
		}
		iconRows.Close()
	}

	total := len(files)
	setMigrateProgress(total, 0, "", 0)

	if total == 0 {
		migrateMu.Lock()
		migrateState = &migrateStatus{Status: "done", Total: 0, Done: 0}
		migrateMu.Unlock()
		return
	}

	// ── 2. ファイルを1件ずつ移植 ──────────────────────────────
	done := 0
	errCount := 0

	for _, f := range files {
		setMigrateProgress(total, done, f.nasName, errCount)

		if err := copyFile(ctx, nas, local, f.nasName); err != nil {
			log.Printf("[migrate] WARN copy %s: %v", f.nasName, err)
			errCount++
			done++
			continue
		}

		// collection_file の本体なら storage_type を更新
		if f.fileID != "" {
			_, _ = database.Exec(
				`UPDATE collection_files SET storage_type = 'local' WHERE id = ?`,
				f.fileID,
			)
		}

		done++
	}

	// ── 3. 完了 ──────────────────────────────────────────────
	migrateMu.Lock()
	migrateState = &migrateStatus{
		Status: "done",
		Total:  total,
		Done:   done,
		Errors: errCount,
	}
	migrateMu.Unlock()
	log.Printf("[migrate] done: %d/%d files (errors: %d)", done, total, errCount)
}

func copyFile(ctx context.Context, src, dst storage.Storage, name string) error {
	rc, item, err := src.Open(ctx, name)
	if err != nil {
		return err
	}
	defer rc.Close()

	// サブフォルダを含むパスのまま保存（thumbnails/xxx.jpg など）
	_, err = dst.Upload(ctx, name, rc.(io.Reader), item.Size)
	return err
}

func setMigrateProgress(total, done int, current string, errors int) {
	migrateMu.Lock()
	migrateState.Total = total
	migrateState.Done = done
	migrateState.Current = current
	migrateState.Errors = errors
	migrateMu.Unlock()
}

func setMigrateError(msg string) {
	migrateMu.Lock()
	migrateState.Status = "error"
	migrateState.ErrMsg = msg
	migrateMu.Unlock()
}
