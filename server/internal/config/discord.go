package config

import "os"

type DiscordConfig struct {
	ClientID       string
	ClientSecret   string
	RedirectURI    string
	GuildID        string // DISCORD_GUILD_ID または DISCORD_SERVER_ID
	RequiredRoleID string
	BotToken       string // DISCORD_BOT_TOKEN: Guild メンバー確認に使用
	FrontendURL    string
}

func LoadDiscord() DiscordConfig {
	// DISCORD_GUILD_ID と DISCORD_SERVER_ID の両方に対応
	guildID := os.Getenv("DISCORD_GUILD_ID")
	if guildID == "" {
		guildID = os.Getenv("DISCORD_SERVER_ID")
	}

	return DiscordConfig{
		ClientID:       os.Getenv("DISCORD_CLIENT_ID"),
		ClientSecret:   os.Getenv("DISCORD_CLIENT_SECRET"),
		RedirectURI:    getEnvOrDefault("DISCORD_REDIRECT_URI", "http://localhost:8080/v1/auth/discord/callback"),
		GuildID:        guildID,
		RequiredRoleID: os.Getenv("DISCORD_REQUIRED_ROLE_ID"),
		BotToken:       os.Getenv("DISCORD_BOT_TOKEN"),
		FrontendURL:    getEnvOrDefault("FRONTEND_URL", "http://localhost:5173"),
	}
}

func (d *DiscordConfig) IsConfigured() bool {
	return d.ClientID != "" && d.ClientSecret != ""
}

func getEnvOrDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
