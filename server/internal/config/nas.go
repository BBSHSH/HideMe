package config

import (
	"errors"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
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

type Config struct {
	NAS NASConfig `yaml:"nas"`
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

	applyDefaults(&cfg.NAS)

	if cfg.NAS.Password == "" {
		cfg.NAS.Password = os.Getenv("NAS_PASSWORD")
	}

	if cfg.NAS.Host == "" || cfg.NAS.Username == "" || cfg.NAS.UploadDir == "" {
		return Config{}, errors.New("nas config missing required fields")
	}

	return cfg, nil
}

func applyDefaults(nas *NASConfig) {
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
		nas.MaxFileSize = 104857600
	}
	if nas.ChunkSize == 0 {
		nas.ChunkSize = 1048576
	}
	if nas.TempDir == "" {
		nas.TempDir = "HideMe/tmp"
	}
}
