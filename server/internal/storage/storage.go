package storage

import (
	"context"
	"errors"
	"io"
	"path"
	"strings"
	"time"
)

// CleanSubPath はサブフォルダを許可しつつディレクトリトラバーサル(..)を防ぐ。
// 例: "thumbnails/x.jpg" → "thumbnails/x.jpg", "../etc" → "etc"
func CleanSubPath(name string) string {
	slashed := strings.ReplaceAll(name, "\\", "/")
	clean := path.Clean("/" + slashed) // 先頭に / を付けて .. を無効化
	return strings.TrimPrefix(clean, "/")
}

var (
	ErrNotFound     = errors.New("file not found")
	ErrFileTooLarge = errors.New("file too large")
)

type FileItem struct {
	Name     string
	Size     int64
	Modified time.Time
}

// ProgressFunc は転送済みバイト数と総バイト数を受け取るコールバック
type ProgressFunc func(loaded, total int64)

type Storage interface {
	List(ctx context.Context) ([]FileItem, error)
	Upload(ctx context.Context, name string, data io.Reader, size int64) (FileItem, error)
	UploadWithProgress(ctx context.Context, name string, data io.Reader, size int64, onProgress ProgressFunc) (FileItem, error)
	Open(ctx context.Context, name string) (io.ReadCloser, FileItem, error)
	Delete(ctx context.Context, name string) error
}

// progressReader は読み込み進捗を報告する
type progressReader struct {
	r          io.Reader
	total      int64
	loaded     int64
	onProgress ProgressFunc
}

func (pr *progressReader) Read(p []byte) (int, error) {
	n, err := pr.r.Read(p)
	if n > 0 {
		pr.loaded += int64(n)
		pr.onProgress(pr.loaded, pr.total)
	}
	return n, err
}
