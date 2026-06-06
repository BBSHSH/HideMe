package config

import (
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

// StorageType はファイルの保存先を表す
type StorageType string

const (
	StorageNAS   StorageType = "nas"
	StorageLocal StorageType = "local"
)

type NASConfig struct {
	Host           string `yaml:"host"`
	Port           int    `yaml:"port"`
	Username       string `yaml:"username"`
	Password       string `yaml:"password"`
	PrivateKeyPath string `yaml:"private_key_path"`
	UploadDir      string `yaml:"upload_dir"`
	TempDir        string `yaml:"temp_dir"`
	Timeout        int    `yaml:"timeout"`
	MaxRetries     int    `yaml:"max_retries"`
	RetryDelay     int    `yaml:"retry_delay"`
	MaxFileSize    int64  `yaml:"max_file_size"`
	ChunkSize      int    `yaml:"chunk_size"`
}

// LocalConfig はサーバー本体のローカルストレージ設定
type LocalConfig struct {
	UploadDir   string `yaml:"upload_dir"`   // 保存ディレクトリ (例: ./uploads)
	MaxFileSize int64  `yaml:"max_file_size"` // 0 = 無制限
}

type Config struct {
	// storage_type: "nas" または "local" (デフォルト: "nas")
	StorageType StorageType `yaml:"storage_type"`
	NAS         NASConfig   `yaml:"nas"`
	Local       LocalConfig `yaml:"local"`
}

func Load(path string) (Config, error) {
	raw, err := os.ReadFile(filepath.Clean(path))
	if err != nil {
		return Config{}, err
	}

	var cfg Config
	if err := yaml.Unmarshal(raw, &cfg); err != nil {
		return Config{}, err
	}

	// storage_type のデフォルト
	if cfg.StorageType == "" {
		cfg.StorageType = StorageNAS
	}

	applyNASDefaults(&cfg.NAS)
	applyLocalDefaults(&cfg.Local)

	// NAS 設定のパスワードは環境変数からも取得
	if cfg.NAS.Password == "" {
		cfg.NAS.Password = os.Getenv("NAS_PASSWORD")
	}

	// NAS モードのときのみ NAS 必須フィールドを検証
	if cfg.StorageType == StorageNAS {
		if cfg.NAS.Host == "" || cfg.NAS.Username == "" || cfg.NAS.UploadDir == "" {
			return Config{}, errorf("nas config: host / username / upload_dir are required when storage_type is 'nas'")
		}
	}

	return cfg, nil
}

func errorf(msg string) error {
	return &configError{msg}
}

type configError struct{ msg string }

func (e *configError) Error() string { return e.msg }

func applyNASDefaults(nas *NASConfig) {
	if nas.Port == 0 {
		nas.Port = 22
	}
	if nas.Timeout == 0 {
		nas.Timeout = 30
	}
	if nas.MaxRetries == 0 {
		nas.MaxRetries = 3
	}
	if nas.RetryDelay == 0 {
		nas.RetryDelay = 5
	}
	if nas.MaxFileSize == 0 {
		nas.MaxFileSize = 104857600 // 100 MB
	}
	if nas.ChunkSize == 0 {
		nas.ChunkSize = 1048576 // 1 MB
	}
	if nas.TempDir == "" {
		nas.TempDir = "HideMe/tmp"
	}
}

func applyLocalDefaults(local *LocalConfig) {
	if local.UploadDir == "" {
		local.UploadDir = "./uploads"
	}
}
