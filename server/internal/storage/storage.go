package storage

import (
	"context"
	"errors"
	"io"
	"time"
)

var (
	ErrNotFound     = errors.New("file not found")
	ErrFileTooLarge = errors.New("file too large")
)

type FileItem struct {
	Name     string
	Size     int64
	Modified time.Time
}

type Storage interface {
	List(ctx context.Context) ([]FileItem, error)
	Upload(ctx context.Context, name string, data io.Reader, size int64) (FileItem, error)
	Open(ctx context.Context, name string) (io.ReadCloser, FileItem, error)
	Delete(ctx context.Context, name string) error
}
