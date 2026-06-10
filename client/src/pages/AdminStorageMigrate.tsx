import { useState, useEffect, useRef } from "react";
import { C, F } from "../theme/tokens";
import { Icon } from "../components/Icon";
import { apiPost, apiGet } from "../api/client";

interface MigrateStatus {
  status: "idle" | "running" | "done" | "error";
  total: number;
  done: number;
  current: string;
  errors: number;
  error?: string;
}

export default function AdminStorageMigrate() {
  const [status, setStatus] = useState<MigrateStatus>({
    status: "idle", total: 0, done: 0, current: "", errors: 0,
  });
  const [starting, setStarting] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async () => {
    try {
      const s = await apiGet<MigrateStatus>("/v1/admin/migrate-status");
      setStatus(s);
      if (s.status !== "running") stopPolling();
    } catch {}
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => {
    fetchStatus();
    return () => stopPolling();
  }, []);

  const startMigration = async () => {
    setStarting(true);
    try {
      await apiPost("/v1/admin/migrate-storage", {});
      pollingRef.current = setInterval(fetchStatus, 1500);
      await fetchStatus();
    } catch (e) {
      setStatus(prev => ({ ...prev, status: "error", error: String(e) }));
    } finally {
      setStarting(false);
    }
  };

  const pct = status.total > 0 ? Math.round((status.done / status.total) * 100) : 0;
  const isRunning = status.status === "running";
  const isDone = status.status === "done";
  const isError = status.status === "error";

  const cardStyle = {
    background: "rgba(30,31,48,0.8)",
    border: `1px solid ${C.outlineVariant}22`,
    borderRadius: 16,
    padding: "20px 24px",
  };

  return (
    <div style={{ padding: 48, display: "flex", flexDirection: "column", gap: 32, maxWidth: 600 }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(88,101,242,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="move_to_inbox" size={22} style={{ color: "#5865F2" }} />
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.onSurface, fontFamily: F.family, letterSpacing: "-0.03em" }}>
            ストレージ移植
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: C.outlineVariant }}>
          NAS上のファイルをすべてローカルストレージにコピーします。
        </p>
      </div>

      {/* 手順 */}
      <div style={cardStyle}>
        <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: C.outlineVariant, textTransform: "uppercase", letterSpacing: "0.08em" }}>手順</p>
        {[
          "「移植開始」ボタンを押してファイルをNAS→ローカルにコピー",
          "完了後、サーバーの config.yaml で storage.type を local に変更",
          "サーバーを再起動",
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: i < 2 ? 10 : 0 }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
              background: "rgba(88,101,242,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: "#5865F2",
            }}>{i + 1}</div>
            <p style={{ margin: 0, fontSize: 13, color: C.onSurface, lineHeight: 1.6 }}>{step}</p>
          </div>
        ))}
      </div>

      {/* 進捗カード */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.outlineVariant, textTransform: "uppercase", letterSpacing: "0.08em" }}>進捗</p>
          {status.total > 0 && (
            <span style={{ fontSize: 13, fontWeight: 800, color: C.onSurface }}>
              {status.done} / {status.total} ({pct}%)
            </span>
          )}
        </div>

        {/* プログレスバー */}
        <div style={{ height: 8, background: `${C.outlineVariant}22`, borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
          <div style={{
            height: "100%",
            width: `${isDone ? 100 : pct}%`,
            background: isError ? "#f87171" : isDone ? "#4ade80" : "#5865F2",
            borderRadius: 4,
            transition: "width 0.4s ease",
          }} />
        </div>

        {/* ステータステキスト */}
        {status.status === "idle" && (
          <p style={{ margin: 0, fontSize: 13, color: C.outlineVariant }}>未開始</p>
        )}
        {isRunning && (
          <p style={{ margin: 0, fontSize: 12, color: C.outlineVariant, wordBreak: "break-all" }}>
            コピー中: <span style={{ color: C.onSurface }}>{status.current}</span>
          </p>
        )}
        {isDone && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="check_circle" size={16} style={{ color: "#4ade80" }} />
            <p style={{ margin: 0, fontSize: 13, color: "#4ade80" }}>
              完了 — {status.done}ファイルをコピーしました
              {status.errors > 0 && (
                <span style={{ color: "#f87171" }}> ({status.errors}件のエラー)</span>
              )}
            </p>
          </div>
        )}
        {isError && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="error" size={16} style={{ color: "#f87171" }} />
            <p style={{ margin: 0, fontSize: 13, color: "#f87171" }}>{status.error}</p>
          </div>
        )}
      </div>

      {/* 完了後の案内 */}
      {isDone && (
        <div style={{
          background: "rgba(74,222,128,0.08)",
          border: "1px solid rgba(74,222,128,0.25)",
          borderRadius: 12, padding: "14px 18px",
        }}>
          <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 14, color: "#4ade80" }}>次のステップ</p>
          <p style={{ margin: 0, fontSize: 13, color: C.onSurface, lineHeight: 1.7, fontFamily: "monospace" }}>
            config.yaml:<br />
            storage:<br />
            {"  "}type: <span style={{ color: "#4ade80" }}>local</span>
          </p>
          <p style={{ margin: "10px 0 0", fontSize: 12, color: C.outlineVariant }}>
            変更後、サーバーを再起動してください。
          </p>
        </div>
      )}

      {/* 開始ボタン */}
      <button
        onClick={startMigration}
        disabled={isRunning || starting}
        style={{
          alignSelf: "flex-start",
          padding: "12px 28px",
          borderRadius: 12,
          border: "none",
          background: isRunning || starting ? `${C.surfaceVariant}4d` : "rgba(88,101,242,0.85)",
          color: isRunning || starting ? C.outlineVariant : "#fff",
          fontWeight: 800,
          fontSize: 15,
          fontFamily: F.family,
          cursor: isRunning || starting ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Icon name="move_to_inbox" size={18} />
        {isRunning ? "移植中..." : starting ? "開始中..." : "移植開始"}
      </button>
    </div>
  );
}
