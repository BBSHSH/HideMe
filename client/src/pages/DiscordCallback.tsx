import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C, F } from "../theme/tokens";
import { useAuth } from "../context/AuthContext";

const ERROR_MESSAGES: Record<string, string> = {
  discord_denied: "Discord 認証がキャンセルされました",
  invalid_callback: "無効なコールバックです",
  invalid_state: "セキュリティエラーが発生しました。再度お試しください",
  token_exchange_failed: "Discord との認証に失敗しました",
  user_fetch_failed: "Discord ユーザー情報の取得に失敗しました",
  not_guild_member: "このサーバーのメンバーではありません",
  missing_required_role: "必要なロールを持っていません",
  db_error: "サーバーエラーが発生しました",
  token_generation_failed: "トークン生成に失敗しました",
};

export default function DiscordCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorCode = params.get("error");

    if (errorCode) {
      setError(ERROR_MESSAGES[errorCode] ?? `エラーが発生しました: ${errorCode}`);
      return;
    }

    const token = params.get("token");
    const userId = params.get("user_id") ?? "";
    const username = params.get("username");
    const role = params.get("role") as "admin" | "member" | null;
    const avatar = params.get("avatar") ?? undefined;

    if (!token || !username || !role) {
      setError("認証情報が不正です");
      return;
    }

    setUser({ token, userId, username, role, auth_method: "discord", avatar });
    navigate("/", { replace: true });
  }, []);

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(ellipse at 50% 0%, rgba(88,101,242,0.15) 0%, transparent 70%), #12131b",
        }}
      >
        <div
          style={{
            width: 400,
            background: "linear-gradient(180deg, rgba(30,31,48,0.98) 0%, rgba(18,19,27,0.98) 100%)",
            border: `1px solid ${C.outlineVariant}33`,
            borderRadius: 24,
            padding: 40,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            alignItems: "center",
            textAlign: "center",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(248,113,113,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            ⚠️
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              color: C.onSurface,
              fontFamily: F.family,
            }}
          >
            Discord 認証エラー
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: "#f87171" }}>{error}</p>
          <button
            onClick={() => navigate("/login")}
            style={{
              background: C.primaryContainer,
              color: C.onPrimaryContainer,
              border: "none",
              borderRadius: 12,
              padding: "12px 24px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: F.family,
            }}
          >
            ログインに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at 50% 0%, rgba(88,101,242,0.15) 0%, transparent 70%), #12131b",
        color: C.onSurface,
        fontFamily: F.family,
        fontSize: 16,
        gap: 12,
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: `3px solid ${C.primary}`,
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ color: C.outlineVariant }}>Discord 認証中...</span>
    </div>
  );
}
