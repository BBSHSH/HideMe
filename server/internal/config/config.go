package config

import (
	"log"
	"os"

	"gopkg.in/yaml.v2"
)

type Config struct {
	Server struct {
		Port int    `yaml:"port"`
		Host string `yaml:"host"`
	} `yaml:"server"`

	Public struct {
		URL         string `yaml:"url"`          // API のベース URL（Discord OAuth redirect_uri に使用）
		FrontendURL string `yaml:"frontend_url"` // フロントエンドの URL（空なら URL と同じ。開発時は http://localhost:5173）
	} `yaml:"public"`

	Database struct {
		Path string `yaml:"path"`
	} `yaml:"database"`

	Storage struct {
		Type string `yaml:"type"` // "local" or "nas"
		Local struct {
			BaseDir string `yaml:"base_dir"`
		} `yaml:"local"`
		NAS struct {
			Host     string `yaml:"host"`
			User     string `yaml:"user"`
			Password string `yaml:"password"`
			Share    string `yaml:"share"`
			Port     int    `yaml:"port"`
		} `yaml:"nas"`
	} `yaml:"storage"`

	Discord struct {
		ClientID    string `yaml:"client_id"`
		ClientSecret string `yaml:"client_secret"`
		GuildID    string `yaml:"guild_id"`
		RequiredRole string `yaml:"required_role"`
	} `yaml:"discord"`

	Upload struct {
		// true にすると大きいファイルのアップロードを DirectURL に直接送信（Cloudflare 制限回避）
		UseDirectURL bool   `yaml:"use_direct_url"`
		DirectURL    string `yaml:"direct_url"` // 例: http://グローバルIP:8080
	} `yaml:"upload"`

	FFmpeg struct {
		Path string `yaml:"path"`
	} `yaml:"ffmpeg"`

	Logging struct {
		Level  string `yaml:"level"`
		Format string `yaml:"format"`
	} `yaml:"logging"`
}

var Global *Config

func Load(path string) error {
	// デフォルト値
	Global = &Config{
		Server: struct {
			Port int    `yaml:"port"`
			Host string `yaml:"host"`
		}{Port: 8080, Host: "0.0.0.0"},
		Database: struct {
			Path string `yaml:"path"`
		}{Path: "./hideme.db"},
		Storage: struct {
			Type string `yaml:"type"`
			Local struct {
				BaseDir string `yaml:"base_dir"`
			} `yaml:"local"`
			NAS struct {
				Host     string `yaml:"host"`
				User     string `yaml:"user"`
				Password string `yaml:"password"`
				Share    string `yaml:"share"`
				Port     int    `yaml:"port"`
			} `yaml:"nas"`
		}{Type: "local"},
		Public: struct {
			URL         string `yaml:"url"`
			FrontendURL string `yaml:"frontend_url"`
		}{URL: "http://localhost:8080"},
		FFmpeg: struct {
			Path string `yaml:"path"`
		}{Path: "ffmpeg"},
		Logging: struct {
			Level  string `yaml:"level"`
			Format string `yaml:"format"`
		}{Level: "info", Format: "text"},
	}

	// config.yaml が存在する場合は読み込む
	loaded := false
	if data, err := os.ReadFile(path); err == nil {
		if err := yaml.Unmarshal(data, Global); err != nil {
			return err
		}
		loaded = true
	}
	if loaded {
		log.Printf("[CONFIG] loaded from %s", path)
	} else {
		log.Printf("[CONFIG] %s not found, using defaults + env vars", path)
	}

	// 空の場合のデフォルト補完
	if Global.Storage.Type == "" {
		Global.Storage.Type = "local"
	}
	if Global.Storage.Local.BaseDir == "" {
		Global.Storage.Local.BaseDir = "./uploads"
	}
	if Global.Database.Path == "" {
		Global.Database.Path = "./hideme.db"
	}
	if Global.Server.Port == 0 {
		Global.Server.Port = 8080
	}
	// FrontendURL が未設定なら API の URL を使う（本番は同一オリジン）
	if Global.Public.FrontendURL == "" {
		Global.Public.FrontendURL = Global.Public.URL
	}

	// 環境変数で上書き
	if url := os.Getenv("PUBLIC_URL"); url != "" {
		Global.Public.URL = url
	}
	if furl := os.Getenv("FRONTEND_URL"); furl != "" {
		Global.Public.FrontendURL = furl
	}
	if clientID := os.Getenv("DISCORD_CLIENT_ID"); clientID != "" {
		Global.Discord.ClientID = clientID
	}
	if clientSecret := os.Getenv("DISCORD_CLIENT_SECRET"); clientSecret != "" {
		Global.Discord.ClientSecret = clientSecret
	}

	return nil
}
