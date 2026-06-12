import { useState, useEffect } from "react";
import { C, F } from "../theme/tokens";
import { Icon } from "../components/Icon";
import { getAuthSettings, updateAuthSettings, forceLogoutAll, type AuthSettings } from "../api/auth";

export default function AdminAuthSettings() {
  const [settings, setSettings] = useState<AuthSettings>({
    normal_login_enabled: true,
    discord_login_enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [forceLoggingOut, setForceLoggingOut] = useState(false);
  const [forceLogoutDone, setForceLogoutDone] = useState(false);

  useEffect(() => {
    getAuthSettings()
      .then(setSettings)
      .catch(() => setError("設定の読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    if (!settings.normal_login_enabled && !settings.discord_login_enabled) {
      setError("少なくとも1つのログイン方法を有効にする必要があります");
      return;
    }

    setSaving(true);
    try {
      await updateAuthSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("設定の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleForceLogout = async () => {
    if (!window.confirm("全ユーザーを強制ログアウトしますか？\n管理者自身も含め全員がログアウトされます。")) return;
    setForceLoggingOut(true);
    try {
      await forceLogoutAll();
      setForceLogoutDone(true);
      setTimeout(() => setForceLogoutDone(false), 4000);
    } catch {
      setError("強制ログアウトに失敗しました");
    } finally {
      setForceLoggingOut(false);
    }
  };

  const toggle = (key: keyof AuthSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setError(null);
  };

  const cardStyle = {
    background: "rgba(30,31,48,0.8)",
    border: `1px solid ${C.outlineVariant}22`,
    borderRadius: 16,
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  };

  const toggleStyle = (active: boolean) => ({
    width: 44,
    height: 24,
    borderRadius: 12,
    background: active ? C.primary : `${C.outlineVariant}44`,
    border: "none",
    cursor: "pointer",
    position: "relative" as const,
    transition: "background 0.2s",
    flexShrink: 0,
  });

  const knobStyle = (active: boolean) => ({
    position: "absolute" as const,
    top: 3,
    left: active ? 23 : 3,
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#fff",
    transition: "left 0.2s",
  });

  if (loading) {
    return (
      <div style={{ padding: 48, color: C.outlineVariant, textAlign: "center" }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div style={{ padding: 48, display: "flex", flexDirection: "column", gap: 32, maxWidth: 600 }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: C.primaryContainer,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="key" size={22} style={{ color: C.onPrimaryContainer }} />
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              color: C.onSurface,
              fontFamily: F.family,
              letterSpacing: "-0.03em",
            }}
          >
            認証設定
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: C.outlineVariant }}>
          ユーザーが利用できるログイン方法を管理します。変更は即時反映されます。
        </p>
      </div>

      {/* 設定カード */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            color: C.outlineVariant,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          ログイン方法
        </h2>

        {/* 通常ログイン */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: settings.normal_login_enabled
                  ? `${C.primary}22`
                  : `${C.outlineVariant}11`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
              }}
            >
              <Icon
                name="person"
                size={22}
                style={{
                  color: settings.normal_login_enabled ? C.primary : C.outlineVariant,
                }}
              />
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 15,
                  color: C.onSurface,
                  fontFamily: F.family,
                }}
              >
                通常ログイン
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: C.outlineVariant }}>
                ユーザー名とパスワードによる認証
              </p>
            </div>
          </div>
          <button
            onClick={() => toggle("normal_login_enabled")}
            style={toggleStyle(settings.normal_login_enabled)}
            aria-label="通常ログイン切り替え"
          >
            <div style={knobStyle(settings.normal_login_enabled)} />
          </button>
        </div>

        {/* Discord ログイン */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: settings.discord_login_enabled
                  ? "rgba(88,101,242,0.2)"
                  : `${C.outlineVariant}11`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 71 55"
                fill="none"
                style={{ opacity: settings.discord_login_enabled ? 1 : 0.35 }}
              >
                <path
                  d="M60.105 4.898A58.55 58.55 0 0 0 45.653.415a40.31 40.31 0 0 0-1.804 3.696 54.246 54.246 0 0 0-16.287 0A40.207 40.207 0 0 0 25.757.415 58.427 58.427 0 0 0 11.297 4.9C1.627 19.224-.995 33.173.314 46.924a58.654 58.654 0 0 0 17.9 9.06 44.262 44.262 0 0 0 3.826-6.209 38.34 38.34 0 0 1-6.028-2.895c.506-.37 1-.752 1.476-1.143 11.625 5.373 24.21 5.373 35.695 0 .48.4.974.783 1.476 1.143a38.276 38.276 0 0 1-6.036 2.9 44.11 44.11 0 0 0 3.82 6.203 58.519 58.519 0 0 0 17.91-9.055C71.56 30.895 68.17 17.065 60.105 4.899ZM23.794 38.498c-3.511 0-6.41-3.226-6.41-7.177 0-3.95 2.838-7.18 6.41-7.18 3.571 0 6.47 3.23 6.41 7.18.002 3.95-2.838 7.177-6.41 7.177Zm23.412 0c-3.51 0-6.41-3.226-6.41-7.177 0-3.95 2.838-7.18 6.41-7.18 3.571 0 6.47 3.23 6.41 7.18 0 3.95-2.838 7.177-6.41 7.177Z"
                  fill={settings.discord_login_enabled ? "#5865F2" : C.outlineVariant}
                />
              </svg>
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 15,
                  color: C.onSurface,
                  fontFamily: F.family,
                }}
              >
                Discord ログイン
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: C.outlineVariant }}>
                Discord OAuth2 + サーバーロール認証
              </p>
            </div>
          </div>
          <button
            onClick={() => toggle("discord_login_enabled")}
            style={toggleStyle(settings.discord_login_enabled)}
            aria-label="Discord ログイン切り替え"
          >
            <div style={knobStyle(settings.discord_login_enabled)} />
          </button>
        </div>
      </div>

      {/* 警告 */}
      {!settings.normal_login_enabled && !settings.discord_login_enabled && (
        <div
          style={{
            background: "rgba(248,113,113,0.1)",
            border: "1px solid rgba(248,113,113,0.3)",
            borderRadius: 12,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Icon name="warning" size={18} style={{ color: "#f87171", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#f87171" }}>
            少なくとも1つのログイン方法を有効にしてください
          </span>
        </div>
      )}

      {/* エラー / 成功メッセージ */}
      {error && (
        <p style={{ margin: 0, color: "#f87171", fontSize: 14 }}>{error}</p>
      )}
      {success && (
        <div
          style={{
            background: "rgba(74,222,128,0.1)",
            border: "1px solid rgba(74,222,128,0.3)",
            borderRadius: 12,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Icon name="check_circle" size={18} style={{ color: "#4ade80", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#4ade80" }}>設定を保存しました</span>
        </div>
      )}

      {/* 保存ボタン */}
      <button
        onClick={handleSave}
        disabled={saving || (!settings.normal_login_enabled && !settings.discord_login_enabled)}
        style={{
          alignSelf: "flex-start",
          padding: "12px 28px",
          borderRadius: 12,
          border: "none",
          background:
            !settings.normal_login_enabled && !settings.discord_login_enabled
              ? `${C.surfaceVariant}4d`
              : C.primaryContainer,
          color:
            !settings.normal_login_enabled && !settings.discord_login_enabled
              ? C.outlineVariant
              : C.onPrimaryContainer,
          fontWeight: 800,
          fontSize: 15,
          fontFamily: F.family,
          cursor: saving ? "wait" : "pointer",
          transition: "all 0.2s",
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? "保存中..." : "設定を保存"}
      </button>

      {/* 強制ログアウトセクション */}
      <div style={{ borderTop: `1px solid ${C.outlineVariant}22`, paddingTop: 32, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: C.outlineVariant, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            危険な操作
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: C.outlineVariant }}>
            一度実行すると元に戻せません。慎重に行ってください。
          </p>
        </div>
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="logout" size={22} style={{ color: "#ef4444" }} />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: C.onSurface, fontFamily: F.family }}>
                全アカウントを強制ログアウト
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: C.outlineVariant }}>
                現在ログイン中の全ユーザー（管理者含む）を即時ログアウトします
              </p>
            </div>
          </div>
          <button
            onClick={handleForceLogout}
            disabled={forceLoggingOut}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "1px solid rgba(239,68,68,0.4)",
              background: "rgba(239,68,68,0.12)",
              color: "#ef4444",
              fontWeight: 700,
              fontSize: 14,
              fontFamily: F.family,
              cursor: forceLoggingOut ? "wait" : "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              opacity: forceLoggingOut ? 0.6 : 1,
              transition: "all 0.2s",
            }}
          >
            {forceLoggingOut ? "処理中..." : "強制ログアウト"}
          </button>
        </div>
        {forceLogoutDone && (
          <div style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="check_circle" size={18} style={{ color: "#4ade80", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#4ade80" }}>全ユーザーに強制ログアウトを送信しました</span>
          </div>
        )}
      </div>
    </div>
  );
}
