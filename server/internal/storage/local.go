package storage

import (
	"context"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/BBSHSH/HideMe/server/internal/config"
)

// LocalStorage はサーバー本体のファイルシステムに保存するストレージ実装
type LocalStorage struct {
	cfg config.LocalConfig
}

func NewLocalStorage(cfg config.LocalConfig) *LocalStorage {
	return &LocalStorage{cfg: cfg}
}

func (s *LocalStorage) uploadDir() string {
	return filepath.Clean(s.cfg.UploadDir)
}

func (s *LocalStorage) ensureDir() error {
	return os.MkdirAll(s.uploadDir(), 0755)
}

func (s *LocalStorage) filePath(name string) string {
	sub := CleanSubPath(name)
	return filepath.Join(s.uploadDir(), filepath.FromSlash(sub))
}

// FilePath はファイルの絶対パスを返す（Range 対応サーブ用）
func (s *LocalStorage) FilePath(name string) string {
	return s.filePath(name)
}

func (s *LocalStorage) List(_ context.Context) ([]FileItem, error) {
	if err := s.ensureDir(); err != nil {
		return nil, err
	}

	entries, err := os.ReadDir(s.uploadDir())
	if err != nil {
		return nil, err
	}

	items := make([]FileItem, 0, len(entries))
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		info, err := e.Info()
		if err != nil {
			continue
		}
		items = append(items, FileItem{
			Name:     info.Name(),
			Size:     info.Size(),
			Modified: info.ModTime().UTC(),
		})
	}
	return items, nil
}

func (s *LocalStorage) Upload(ctx context.Context, name string, data io.Reader, size int64) (FileItem, error) {
	return s.UploadWithProgress(ctx, name, data, size, nil)
}

func (s *LocalStorage) UploadWithProgress(_ context.Context, name string, data io.Reader, size int64, onProgress ProgressFunc) (FileItem, error) {
	if s.cfg.MaxFileSize > 0 && size > s.cfg.MaxFileSize {
		return FileItem{}, ErrFileTooLarge
	}

	if err := s.ensureDir(); err != nil {
		return FileItem{}, err
	}

	dst := s.filePath(name)
	// サブフォルダ (thumbnails/ icons/) を作成
	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return FileItem{}, err
	}
	f, err := os.Create(dst)
	if err != nil {
		return FileItem{}, err
	}
	defer f.Close()

	var reader io.Reader = data
	if onProgress != nil && size > 0 {
		reader = &progressReader{r: data, total: size, onProgress: onProgress}
	}

	if _, err := io.Copy(f, reader); err != nil {
		return FileItem{}, err
	}

	info, err := f.Stat()
	if err != nil {
		return FileItem{}, err
	}

	return FileItem{
		Name:     info.Name(),
		Size:     info.Size(),
		Modified: info.ModTime().UTC(),
	}, nil
}

func (s *LocalStorage) Open(_ context.Context, name string) (io.ReadCloser, FileItem, error) {
	dst := s.filePath(name)
	f, err := os.Open(dst)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, FileItem{}, ErrNotFound
		}
		return nil, FileItem{}, err
	}

	info, err := f.Stat()
	if err != nil {
		f.Close()
		return nil, FileItem{}, err
	}

	return f, FileItem{
		Name:     info.Name(),
		Size:     info.Size(),
		Modified: info.ModTime().UTC(),
	}, nil
}

func (s *LocalStorage) Delete(_ context.Context, name string) error {
	err := os.Remove(s.filePath(name))
	if err != nil {
		if os.IsNotExist(err) {
			return ErrNotFound
		}
		return err
	}
	return nil
}

// ServeURL はローカルファイルの配信 URL を返す（API 経由）
func (s *LocalStorage) ServeURL(name string) string {
	return "/v1/files/" + name
}

// LastModified はファイルの最終更新時刻を返す
func (s *LocalStorage) LastModified(name string) (time.Time, error) {
	info, err := os.Stat(s.filePath(name))
	if err != nil {
		return time.Time{}, err
	}
	return info.ModTime(), nil
}
