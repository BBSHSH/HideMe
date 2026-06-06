package db

import "database/sql"

type AuthSettings struct {
	NormalLoginEnabled  bool `json:"normal_login_enabled"`
	DiscordLoginEnabled bool `json:"discord_login_enabled"`
}

func GetAuthSettings(db *sql.DB) (AuthSettings, error) {
	var s AuthSettings
	var n, d int
	err := db.QueryRow(
		`SELECT normal_login_enabled, discord_login_enabled FROM auth_settings WHERE id = 1`,
	).Scan(&n, &d)
	if err != nil {
		return s, err
	}
	s.NormalLoginEnabled = n == 1
	s.DiscordLoginEnabled = d == 1
	return s, nil
}

func UpdateAuthSettings(db *sql.DB, normal, discord bool) error {
	n, d := 0, 0
	if normal {
		n = 1
	}
	if discord {
		d = 1
	}
	_, err := db.Exec(
		`UPDATE auth_settings SET normal_login_enabled = ?, discord_login_enabled = ? WHERE id = 1`,
		n, d,
	)
	return err
}
