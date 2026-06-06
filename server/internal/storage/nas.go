package storage

import (
	"context"
	"fmt"
	"io"

	"github.com/hirochachacha/go-smb2"
)

// NASConfig は SMB/CIFS ストレージの設定
type NASConfig struct {
	Host     string
	User     string
	Password string
	Share    string
	Port     int
}

// NASStorage は NAS (SMB/CIFS) にファイルを保存するストレージ実装
type NASStorage struct {
	cfg NASConfig
}

func NewNASStorage(cfg NASConfig) *NASStorage {
	if cfg.Port == 0 {
		cfg.Port = 445
	}
	return &NASStorage{cfg: cfg}
}

func (s *NASStorage) connect(ctx context.Context) (*smb2.Session, *smb2.Share, error) {
	// TODO: 実装（go-smb2 API を確認してから）
	return nil, nil, fmt.Errorf("NAS/SMB storage not yet fully implemented")
}

// Upload はファイルをアップロード
func (s *NASStorage) Upload(ctx context.Context, name string, data io.Reader, size int64) (FileItem, error) {
	return s.UploadWithProgress(ctx, name, data, size, nil)
}

// UploadWithProgress は進捗付きアップロード
func (s *NASStorage) UploadWithProgress(ctx context.Context, name string, data io.Reader, size int64, onProgress ProgressFunc) (FileItem, error) {
	// TODO: 実装
	return FileItem{}, fmt.Errorf("NAS/SMB storage not yet fully implemented")
}

// Download はファイルをダウンロード
func (s *NASStorage) Download(ctx context.Context, name string) (io.ReadCloser, error) {
	// TODO: 実装
	return nil, fmt.Errorf("NAS/SMB storage not yet fully implemented")
}

// Open は Storage インターフェースの Open メソッド
func (s *NASStorage) Open(ctx context.Context, name string) (io.ReadCloser, FileItem, error) {
	// TODO: 実装
	return nil, FileItem{}, fmt.Errorf("NAS/SMB storage not yet fully implemented")
}

// Delete はファイルを削除
func (s *NASStorage) Delete(ctx context.Context, name string) error {
	// TODO: 実装
	return fmt.Errorf("NAS/SMB storage not yet fully implemented")
}

// List はファイル一覧を取得
func (s *NASStorage) List(ctx context.Context) ([]FileItem, error) {
	// TODO: 実装
	return nil, fmt.Errorf("NAS/SMB storage not yet fully implemented")
}

// Exists はファイルが存在するかチェック
func (s *NASStorage) Exists(ctx context.Context, name string) (bool, error) {
	// TODO: 実装
	return false, fmt.Errorf("NAS/SMB storage not yet fully implemented")
}

// FilePath はファイルの絶対パスを返す（LocalStorage のみ実装）
func (s *NASStorage) FilePath(name string) string {
	return ""
}
