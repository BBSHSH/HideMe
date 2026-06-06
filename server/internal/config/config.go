package config

import (
	"os"

	"gopkg.in/yaml.v2"
)

type Config struct {
	Server struct {
		Port int    `yaml:"port"`
		Host string `yaml:"host"`
	} `yaml:"server"`

	Public struct {
		URL string `yaml:"url"`
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
			URL string `yaml:"url"`
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
	if data, err := os.ReadFile(path); err == nil {
		if err := yaml.Unmarshal(data, Global); err != nil {
			return err
		}
	}

	// 環境変数で上書き
	if url := os.Getenv("PUBLIC_URL"); url != "" {
		Global.Public.URL = url
	}
	if clientID := os.Getenv("DISCORD_CLIENT_ID"); clientID != "" {
		Global.Discord.ClientID = clientID
	}
	if clientSecret := os.Getenv("DISCORD_CLIENT_SECRET"); clientSecret != "" {
		Global.Discord.ClientSecret = clientSecret
	}

	return nil
}
