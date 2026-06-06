package auth

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var ErrInvalidToken = errors.New("invalid token")

type Claims struct {
	UserID      string `json:"user_id"`
	Username    string `json:"username"`
	Role        string `json:"role"`
	// Discord ユーザーの場合に設定
	AuthMethod  string `json:"auth_method,omitempty"` // "password" | "discord"
	DiscordID   string `json:"discord_id,omitempty"`
	AvatarURL   string `json:"avatar_url,omitempty"`
	jwt.RegisteredClaims
}

func jwtSecret() []byte {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		s = "changeme-in-production"
	}
	return []byte(s)
}

func GenerateToken(userID, username, role string) (string, error) {
	claims := Claims{
		UserID:     userID,
		Username:   username,
		Role:       role,
		AuthMethod: "password",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret())
}

// GenerateDiscordToken は Discord ログイン用のJWTを生成する。
func GenerateDiscordToken(userID, username, role, discordID, avatarURL string) (string, error) {
	claims := Claims{
		UserID:     userID,
		Username:   username,
		Role:       role,
		AuthMethod: "discord",
		DiscordID:  discordID,
		AvatarURL:  avatarURL,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret())
}

func ParseToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return jwtSecret(), nil
	})
	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}
	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, ErrInvalidToken
	}
	return claims, nil
}
