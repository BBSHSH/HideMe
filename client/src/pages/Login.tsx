import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C, F } from "../theme/tokens";
import { Icon } from "../components/Icon";
import { useLogin } from "../hooks/useAuth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useLogin();
  const navigate = useNavigate();

  const handleLogin = async () => {
    const ok = await login(username, password);
    if (ok) navigate("/");
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
          gap: 24,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: C.primaryContainer,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="lock" size={28} style={{ color: C.onPrimaryContainer }} />
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.onSurface, fontFamily: F.family, letterSpacing: "-0.03em" }}>
            HideMe
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: C.outlineVariant }}>
            サインインしてください
          </p>
        </div>

        {/* Fields */}
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

        {/* Error */}
        {error && (
          <span style={{ color: "#f87171", fontSize: 14, textAlign: "center" }}>{error}</span>
        )}

        {/* Button */}
        <button
          onClick={handleLogin}
          disabled={!username || !password || loading}
          style={{
            background: username && password ? C.primaryContainer : `${C.surfaceVariant}4d`,
            color: username && password ? C.onPrimaryContainer : C.outlineVariant,
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
      </div>
    </div>
  );
}