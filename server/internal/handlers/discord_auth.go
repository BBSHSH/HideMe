package handlers

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/BBSHSH/HideMe/server/internal/auth"
	"github.com/BBSHSH/HideMe/server/internal/config"
	"github.com/BBSHSH/HideMe/server/internal/db"
	"github.com/gin-gonic/gin"
)

// stateStore は CSRF 防止用の state を一時保管する (本番では Redis 推奨)
var stateStore = struct {
	mu     sync.Mutex
	states map[string]time.Time
}{states: make(map[string]time.Time)}

func generateState() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func saveState(state string) {
	stateStore.mu.Lock()
	defer stateStore.mu.Unlock()
	// 古い state を掃除
	now := time.Now()
	for k, t := range stateStore.states {
		if now.Sub(t) > 10*time.Minute {
			delete(stateStore.states, k)
		}
	}
	stateStore.states[state] = now
}

func consumeState(state string) bool {
	stateStore.mu.Lock()
	defer stateStore.mu.Unlock()
	t, ok := stateStore.states[state]
	if !ok {
		return false
	}
	delete(stateStore.states, state)
	return time.Since(t) < 10*time.Minute
}

// DiscordOAuthRedirect は Discord の認証画面にリダイレクトする
func DiscordOAuthRedirect(cfg config.DiscordConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		state, err := generateState()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_generate_state"})
			return
		}
		saveState(state)

		params := url.Values{}
		params.Set("client_id", cfg.ClientID)
		params.Set("redirect_uri", cfg.RedirectURI)
		params.Set("response_type", "code")
		// guilds.members.read は Guild のメンバー情報（ロール含む）を取得するのに必要
		params.Set("scope", "identify guilds.members.read")
		params.Set("state", state)

		redirectURL := "https://discord.com/api/oauth2/authorize?" + params.Encode()
		c.Redirect(http.StatusFound, redirectURL)
	}
}

// DiscordOAuthCallback は Discord からのコールバックを処理する
func DiscordOAuthCallback(cfg config.DiscordConfig, database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		errParam := c.Query("error")
		if errParam != "" {
			redirectWithError(c, cfg.FrontendURL, "discord_denied")
			return
		}

		code := c.Query("code")
		state := c.Query("state")

		if code == "" || state == "" {
			redirectWithError(c, cfg.FrontendURL, "invalid_callback")
			return
		}

		if !consumeState(state) {
			redirectWithError(c, cfg.FrontendURL, "invalid_state")
			return
		}

		// 1. code → access token 交換
		tokenResp, err := exchangeCode(cfg, code)
		if err != nil {
			log.Printf("[DISCORD] exchangeCode error: %v", err)
			redirectWithError(c, cfg.FrontendURL, "token_exchange_failed")
			return
		}

		// 2. Discord ユーザー情報取得
		discordUser, err := fetchDiscordUser(tokenResp.AccessToken)
		if err != nil {
			log.Printf("[DISCORD] fetchDiscordUser error: %v", err)
			redirectWithError(c, cfg.FrontendURL, "user_fetch_failed")
			return
		}
		log.Printf("[DISCORD] User: %s (%s)", discordUser.Username, discordUser.ID)

		// 3. Guild メンバー確認 + ロール確認
		// GuildID が設定されている場合はサーバー参加を必須とする
		if cfg.GuildID != "" {
			member, err := checkGuildMember(cfg, discordUser.ID, tokenResp.AccessToken)
			if err != nil {
				log.Printf("[DISCORD] checkGuildMember error for user %s: %v", discordUser.ID, err)
				redirectWithError(c, cfg.FrontendURL, "not_guild_member")
				return
			}

			// RequiredRoleID が設定されている場合はロール保持を必須とする
			if cfg.RequiredRoleID != "" {
				hasRole := false
				for _, r := range member.Roles {
					if r == cfg.RequiredRoleID {
						hasRole = true
						break
					}
				}
				if !hasRole {
					log.Printf("[DISCORD] User %s (%s) is missing required role %s", discordUser.Username, discordUser.ID, cfg.RequiredRoleID)
					redirectWithError(c, cfg.FrontendURL, "missing_required_role")
					return
				}
				log.Printf("[DISCORD] User %s passed role check", discordUser.Username)
			}
		}

		// 4. DB に upsert
		avatarURL := discordUser.AvatarURL()
		dbUser, err := db.GetOrCreateDiscordUser(
			database,
			discordUser.ID,
			discordUser.Username,
			discordUser.Avatar,
			tokenResp.AccessToken,
			tokenResp.RefreshToken,
		)
		if err != nil {
			log.Printf("[DISCORD] GetOrCreateDiscordUser error: %v", err)
			redirectWithError(c, cfg.FrontendURL, "db_error")
			return
		}

		// 5. JWT 発行
		jwtToken, err := auth.GenerateDiscordToken(dbUser.ID, dbUser.Username, dbUser.Role, dbUser.DiscordID, avatarURL)
		if err != nil {
			log.Printf("[DISCORD] GenerateDiscordToken error: %v", err)
			redirectWithError(c, cfg.FrontendURL, "token_generation_failed")
			return
		}

		// 6. フロントエンドにリダイレクト (クエリパラメータでトークンを渡す)
		params := url.Values{}
		params.Set("token", jwtToken)
		params.Set("user_id", dbUser.ID)
		params.Set("username", dbUser.Username)
		params.Set("role", dbUser.Role)
		params.Set("avatar", avatarURL)
		params.Set("auth_method", "discord")
		c.Redirect(http.StatusFound, cfg.FrontendURL+"/auth/discord/callback?"+params.Encode())
	}
}

// GetAuthSettings は認証設定を返す (公開エンドポイント)
func GetAuthSettings(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		settings, err := db.GetAuthSettings(database)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_settings"})
			return
		}
		c.JSON(http.StatusOK, settings)
	}
}

// UpdateAuthSettings は認証設定を更新する (admin のみ)
func UpdateAuthSettings(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			NormalLoginEnabled  bool `json:"normal_login_enabled"`
			DiscordLoginEnabled bool `json:"discord_login_enabled"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request"})
			return
		}
		// 最低1つは有効でないとロックアウトされる
		if !body.NormalLoginEnabled && !body.DiscordLoginEnabled {
			c.JSON(http.StatusBadRequest, gin.H{"error": "at_least_one_method_required"})
			return
		}
		if err := db.UpdateAuthSettings(database, body.NormalLoginEnabled, body.DiscordLoginEnabled); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_update_settings"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

// --- Discord API helpers ---

type discordTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	Scope        string `json:"scope"`
}

type discordAPIUser struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Avatar   string `json:"avatar"`
}

func (u *discordAPIUser) AvatarURL() string {
	if u.Avatar == "" {
		return ""
	}
	return fmt.Sprintf("https://cdn.discordapp.com/avatars/%s/%s.png", u.ID, u.Avatar)
}

type discordGuildMember struct {
	Roles []string `json:"roles"`
}

func exchangeCode(cfg config.DiscordConfig, code string) (*discordTokenResponse, error) {
	data := url.Values{}
	data.Set("client_id", cfg.ClientID)
	data.Set("client_secret", cfg.ClientSecret)
	data.Set("grant_type", "authorization_code")
	data.Set("code", code)
	data.Set("redirect_uri", cfg.RedirectURI)

	req, err := http.NewRequestWithContext(
		context.Background(),
		http.MethodPost,
		"https://discord.com/api/v10/oauth2/token",
		strings.NewReader(data.Encode()),
	)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("discord token exchange: status %d body %s", resp.StatusCode, body)
	}

	var tr discordTokenResponse
	if err := json.Unmarshal(body, &tr); err != nil {
		return nil, err
	}
	if tr.AccessToken == "" {
		return nil, errors.New("empty access token from discord")
	}
	return &tr, nil
}

func fetchDiscordUser(accessToken string) (*discordAPIUser, error) {
	req, err := http.NewRequestWithContext(
		context.Background(),
		http.MethodGet,
		"https://discord.com/api/v10/users/@me",
		nil,
	)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("discord user fetch: status %d", resp.StatusCode)
	}

	var u discordAPIUser
	if err := json.NewDecoder(resp.Body).Decode(&u); err != nil {
		return nil, err
	}
	return &u, nil
}

// checkGuildMember はサーバー参加確認 + ロール一覧取得を行う。
// Bot トークンが設定されていれば Bot で確認（推奨）。
// なければユーザーの access_token で確認（guilds.members.read scope が必要）。
func checkGuildMember(cfg config.DiscordConfig, userID, userAccessToken string) (*discordGuildMember, error) {
	if cfg.BotToken != "" {
		return fetchGuildMemberWithBot(cfg.BotToken, cfg.GuildID, userID)
	}
	return fetchGuildMemberWithUserToken(userAccessToken, cfg.GuildID, userID)
}

// fetchGuildMemberWithBot は Bot トークンで /guilds/{guild}/members/{user} を叩く。
func fetchGuildMemberWithBot(botToken, guildID, userID string) (*discordGuildMember, error) {
	req, err := http.NewRequestWithContext(
		context.Background(),
		http.MethodGet,
		"https://discord.com/api/v10/guilds/"+guildID+"/members/"+userID,
		nil,
	)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bot "+botToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("user %s is not a member of guild %s", userID, guildID)
	}
	if resp.StatusCode == http.StatusForbidden {
		return nil, fmt.Errorf("bot lacks permission to view guild %s members", guildID)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("guild member fetch (bot): status %d body %s", resp.StatusCode, body)
	}

	var m discordGuildMember
	if err := json.Unmarshal(body, &m); err != nil {
		return nil, err
	}
	return &m, nil
}

// fetchGuildMemberWithUserToken はユーザートークンで /users/@me/guilds/{guild}/member を叩く。
// guilds.members.read scope が必要。Bot がサーバーにいない場合のフォールバック。
func fetchGuildMemberWithUserToken(userAccessToken, guildID, userID string) (*discordGuildMember, error) {
	req, err := http.NewRequestWithContext(
		context.Background(),
		http.MethodGet,
		"https://discord.com/api/v10/users/@me/guilds/"+guildID+"/member",
		nil,
	)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+userAccessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusForbidden {
		return nil, fmt.Errorf("user %s is not a member of guild %s", userID, guildID)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("guild member fetch (user token): status %d body %s", resp.StatusCode, body)
	}

	var m discordGuildMember
	if err := json.Unmarshal(body, &m); err != nil {
		return nil, err
	}
	return &m, nil
}

func redirectWithError(c *gin.Context, frontendURL, errCode string) {
	params := url.Values{}
	params.Set("error", errCode)
	c.Redirect(http.StatusFound, frontendURL+"/auth/discord/callback?"+params.Encode())
}
