import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C, F } from "../theme/tokens";
import { Icon } from "../components/Icon";
import appIcon from "../assets/icon.png";
import { useLogin } from "../hooks/useAuth";
import { getAuthSettings, getDiscordLoginURL, type AuthSettings } from "../api/auth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useLogin();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AuthSettings>({
    normal_login_enabled: true,
    discord_login_enabled: false,
  });

  useEffect(() => {
    getAuthSettings()
      .then(setSettings)
      .catch(() => {/* デフォルト値のまま */});
  }, []);

  const handleLogin = async () => {
    const ok = await login(username, password);
    if (ok) navigate("/");
  };

  const handleDiscordLogin = () => {
    window.location.href = getDiscordLoginURL();
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${C.outlineVariant}33`,
    borderRadius: 12,
    padding: "14px 16px",
    color: C.onSurface,
    fontSize: 15,
    fontFamily: F.family,
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  const showNormal = settings.normal_login_enabled;
  const showDiscord = settings.discord_login_enabled;
  const showDivider = showNormal && showDiscord;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(88,101,242,0.15) 0%, transparent 70%), #12131b",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          margin: "0 16px",
          background:
            "linear-gradient(180deg, rgba(30,31,48,0.98) 0%, rgba(18,19,27,0.98) 100%)",
          border: `1px solid ${C.outlineVariant}33`,
          borderRadius: 24,
          padding: 40,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img src={appIcon} style={{ width: 64, height: 64, objectFit: "contain" }} />
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 800,
              color: C.onSurface,
              fontFamily: F.family,
              letterSpacing: "-0.03em",
            }}
          >
            HideMe
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: C.outlineVariant }}>
            サインインしてください
          </p>
        </div>

        {/* Discord ログイン */}
        {showDiscord && (
          <button
            onClick={handleDiscordLogin}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "13px 0",
              borderRadius: 12,
              border: "none",
              background: "#5865F2",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              fontFamily: F.family,
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
          >
            {/* Discord ロゴ SVG */}
            <svg width="20" height="20" viewBox="0 0 71 55" fill="none">
              <path
                d="M60.105 4.898A58.55 58.55 0 0 0 45.653.415a40.31 40.31 0 0 0-1.804 3.696 54.246 54.246 0 0 0-16.287 0A40.207 40.207 0 0 0 25.757.415 58.427 58.427 0 0 0 11.297 4.9C1.627 19.224-.995 33.173.314 46.924a58.654 58.654 0 0 0 17.9 9.06 44.262 44.262 0 0 0 3.826-6.209 38.34 38.34 0 0 1-6.028-2.895c.506-.37 1-.752 1.476-1.143 11.625 5.373 24.21 5.373 35.695 0 .48.4.974.783 1.476 1.143a38.276 38.276 0 0 1-6.036 2.9 44.11 44.11 0 0 0 3.82 6.203 58.519 58.519 0 0 0 17.91-9.055C71.56 30.895 68.17 17.065 60.105 4.899ZM23.794 38.498c-3.511 0-6.41-3.226-6.41-7.177 0-3.95 2.838-7.18 6.41-7.18 3.571 0 6.47 3.23 6.41 7.18.002 3.95-2.838 7.177-6.41 7.177Zm23.412 0c-3.51 0-6.41-3.226-6.41-7.177 0-3.95 2.838-7.18 6.41-7.18 3.571 0 6.47 3.23 6.41 7.18 0 3.95-2.838 7.177-6.41 7.177Z"
                fill="#fff"
              />
            </svg>
            Discord でログイン
          </button>
        )}

        {/* 区切り線 */}
        {showDivider && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: C.outlineVariant,
              fontSize: 13,
            }}
          >
            <div style={{ flex: 1, height: 1, background: `${C.outlineVariant}33` }} />
            または
            <div style={{ flex: 1, height: 1, background: `${C.outlineVariant}33` }} />
          </div>
        )}

        {/* 通常ログイン */}
        {showNormal && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ユーザー名"
                style={inputStyle}
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                type="password"
                style={inputStyle}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            {error && (
              <span style={{ color: "#f87171", fontSize: 14, textAlign: "center" }}>
                {error}
              </span>
            )}

            <button
              onClick={handleLogin}
              disabled={!username || !password || loading}
              style={{
                background:
                  username && password ? C.primaryContainer : `${C.surfaceVariant}4d`,
                color:
                  username && password ? C.onPrimaryContainer : C.outlineVariant,
                border: "none",
                borderRadius: 12,
                padding: "14px 0",
                fontWeight: 800,
                fontSize: 15,
                cursor: username && password ? "pointer" : "default",
                fontFamily: F.family,
                transition: "all 0.2s",
              }}
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </>
        )}

        {/* どちらも無効の場合 (管理ミス防止メッセージ) */}
        {!showNormal && !showDiscord && (
          <p
            style={{
              margin: 0,
              textAlign: "center",
              color: "#f87171",
              fontSize: 14,
            }}
          >
            ログイン方法が設定されていません。管理者にお問い合わせください。
          </p>
        )}
      </div>
    </div>
  );
}
