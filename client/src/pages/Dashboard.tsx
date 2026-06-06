import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C, F } from "../theme/tokens";
import { Icon } from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { formatBytes, formatRelativeTime } from "../utils/format";
import CollectionGrid from "../components/file/CollectionGrid";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

function getToken() {
  return JSON.parse(localStorage.getItem("hideme_auth") || "{}").token ?? "";
}

// ─── データフック ───────────────────────────────────────────

function useStats() {
  const [data, setData] = useState({ total_files: 0, total_size_bytes: 0 });
  useEffect(() => {
    fetch(`${BASE_URL}/v1/stats`).then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  return data;
}

function useCollectionCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    fetch(`${BASE_URL}/v1/collections`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json()).then((d) => setCount((d?.items ?? []).length)).catch(() => {});
  }, []);
  return count;
}

function useAllFiles(limit = 6) {
  const [files, setFiles] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${BASE_URL}/v1/all-files`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json()).then((d) => setFiles((d?.items ?? []).slice(0, limit))).catch(() => {});
  }, [limit]);
  return files;
}

function useRecentChat() {
  const [channels, setChannels] = useState<{ id: string; name: string }[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${BASE_URL}/v1/chat/channels`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json())
      .then(async (d) => {
        const textChs = (d?.items ?? []).filter((c: any) => c.type !== "voice").slice(0, 3);
        setChannels(textChs.map((c: any) => ({ id: c.id, name: c.name })));
        const allMsgs: any[] = [];
        await Promise.all(textChs.map(async (ch: any) => {
          const res = await fetch(`${BASE_URL}/v1/chat/channels/${ch.id}/messages?limit=10`,
            { headers: { Authorization: `Bearer ${getToken()}` } });
          const data = await res.json();
          (data?.items ?? []).forEach((m: any) => allMsgs.push({ ...m, channelName: ch.name }));
        }));
        allMsgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setMessages(allMsgs.slice(0, 6));
      }).catch(() => {});
  }, []);
  return { channels, messages };
}

// ─── サブコンポーネント ─────────────────────────────────────

const cardBase = {
  background: "rgba(88,101,242,0.06)",
  border: "1px solid rgba(88,101,242,0.18)",
  borderRadius: 12,
  padding: "10px 14px",
  display: "flex",
  alignItems: "center",
  gap: 12,
} as const;

function InfoCard({ icon, label, value, sub }: { icon: string; label: string; value: string; sub: string }) {
  return (
    <div style={{ ...cardBase, flex: 1 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: "rgba(88,101,242,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={icon} size={17} style={{ color: C.primary }} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: C.outlineVariant,
          textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
        <p style={{ margin: "1px 0 0", fontSize: 16, fontWeight: 800, color: C.onSurface,
          letterSpacing: "-0.02em", fontFamily: F.family }}>{value}</p>
        <p style={{ margin: 0, fontSize: 10, color: C.outline }}>{sub}</p>
      </div>
    </div>
  );
}

const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".mkv", ".avi"];
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
function fileIcon(name: string) {
  const l = name.toLowerCase();
  if (VIDEO_EXTS.some((e) => l.endsWith(e))) return { icon: "movie",            color: "#818cf8" };
  if (IMAGE_EXTS.some((e) => l.endsWith(e))) return { icon: "image",            color: "#34d399" };
  if (l.endsWith(".pdf"))                     return { icon: "picture_as_pdf",   color: "#f87171" };
  return                                             { icon: "insert_drive_file", color: C.primary };
}

function RecentFileRow({ file }: { file: any }) {
  const { icon, color } = fileIcon(file.file_name ?? "");
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 12px",
        borderRadius: 8, background: hov ? "rgba(255,255,255,0.04)" : "transparent",
        transition: "background 0.15s", cursor: "pointer" }}
      onClick={() => window.open(`${BASE_URL}/v1/files/${encodeURIComponent(file.file_name)}`, "_blank")}>
      <div style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 6,
        background: C.surfaceContainer, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={14} style={{ color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.onSurface,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.file_name}</p>
        <p style={{ margin: 0, fontSize: 10, color: C.outline }}>
          {formatBytes(file.file_size)} · {formatRelativeTime(file.uploaded_at)}
        </p>
      </div>
    </div>
  );
}

function Avatar({ username, avatar, size = 24 }: { username: string; avatar?: string; size?: number }) {
  const [err, setErr] = useState(false);
  const src = avatar?.startsWith("http") ? avatar : "";
  const color = `hsl(${[...username].reduce((a, c) => a + c.charCodeAt(0), 0) % 360},55%,52%)`;
  if (src && !err)
    return <img src={src} onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42, fontWeight: 800, color: "#fff" }}>
      {username[0]?.toUpperCase()}
    </div>
  );
}

function ChatMsgRow({ msg }: { msg: any }) {
  const [hov, setHov] = useState(false);
  const d = new Date(msg.created_at);
  const timeStr = d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 10px",
        borderRadius: 8, background: hov ? "rgba(255,255,255,0.03)" : "transparent",
        transition: "background 0.1s" }}>
      <Avatar username={msg.username} avatar={msg.avatar} size={26} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 1 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.onSurface }}>{msg.username}</span>
          <span style={{ fontSize: 10, color: C.outline }}>#{msg.channelName}</span>
          <span style={{ fontSize: 10, color: C.outline, marginLeft: "auto" }}>{timeStr}</span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: C.onSurfaceVariant, lineHeight: 1.4,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {msg.content}
        </p>
      </div>
    </div>
  );
}

// ─── メインダッシュボード ───────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const stats = useStats();
  const collectionCount = useCollectionCount();
  const recentFiles = useAllFiles(6);
  const { messages: chatMsgs } = useRecentChat();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "おはようございます" : hour < 18 ? "こんにちは" : "こんばんは";

  const sectionLabel = {
    margin: 0, fontSize: 11, fontWeight: 700 as const, color: C.outlineVariant,
    textTransform: "uppercase" as const, letterSpacing: "0.08em",
  };
  const seeAll = (path: string, label = "すべて見る →") => (
    <button onClick={() => navigate(path)}
      style={{ background: "none", border: "none", color: C.primary, fontSize: 11,
        fontWeight: 700, cursor: "pointer", fontFamily: F.family }}>{label}</button>
  );

  return (
    <div style={{
      flex: 1, minHeight: 0,
      display: "flex", flexDirection: "column",
      padding: "20px 32px", gap: 14,
      overflow: "hidden", boxSizing: "border-box",
      fontFamily: F.family, color: C.onSurface,
    }}>

      {/* ── ヘッダー ── */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: C.outlineVariant }}>{greeting}、</p>
          <h1 style={{ margin: "1px 0 0", fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>
            {user?.username ?? "Guest"}
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {[
            { icon: "perm_media", label: "ファイル", path: "/file" },
            { icon: "forum",      label: "チャット", path: "/chat" },
            { icon: "settings",   label: "設定",     path: "/settings" },
          ].map((a) => (
            <button key={a.label} onClick={() => navigate(a.path)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              padding: "8px 12px", borderRadius: 10,
              border: "1px solid rgba(88,101,242,0.12)",
              background: "rgba(88,101,242,0.04)",
              color: C.onSurfaceVariant, fontSize: 10, fontWeight: 700,
              cursor: "pointer", fontFamily: F.family,
            }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(88,101,242,0.12)"; el.style.color = "#bec2ff"; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(88,101,242,0.04)"; el.style.color = C.onSurfaceVariant; }}>
              <Icon name={a.icon} size={16} />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ flexShrink: 0, display: "flex", gap: 12 }}>
        <InfoCard icon="storage"     label="使用ストレージ" value={formatBytes(stats.total_size_bytes)} sub={`${stats.total_files} ファイル`} />
        <InfoCard icon="folder_open" label="総ファイル数"   value={stats.total_files.toLocaleString()} sub={formatBytes(stats.total_size_bytes)} />
        <InfoCard icon="collections" label="コレクション数" value={String(collectionCount)} sub={`${stats.total_files} ファイル · ${formatBytes(stats.total_size_bytes)}`} />
      </div>

      {/* ── コレクション ── */}
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={sectionLabel}>コレクション</p>
          {seeAll("/file")}
        </div>
        <CollectionGrid horizontal cardSize="small" />
      </div>

      {/* ── ボトム：最近のファイル ＋ チャット ── */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 14, overflow: "hidden" }}>

        {/* 最近のファイル */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={sectionLabel}>最近のファイル</p>
            {seeAll("/file")}
          </div>
          <div style={{
            flex: 1, minHeight: 0,
            background: "rgba(88,101,242,0.06)", border: "1px solid rgba(88,101,242,0.18)",
            borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column",
          }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "4px" }}>
              {recentFiles.length === 0
                ? <div style={{ padding: 20, textAlign: "center", color: C.outline, fontSize: 12 }}>ファイルがありません</div>
                : recentFiles.map((f) => <RecentFileRow key={f.id} file={f} />)
              }
            </div>
          </div>
        </div>

        {/* チャットウィジェット */}
        <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={sectionLabel}>最近のメッセージ</p>
            {seeAll("/chat", "チャットへ →")}
          </div>
          <div style={{
            flex: 1, minHeight: 0,
            background: "rgba(88,101,242,0.06)", border: "1px solid rgba(88,101,242,0.18)",
            borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column",
          }}>
            {chatMsgs.length === 0 ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column", gap: 8, color: C.outline }}>
                <Icon name="forum" size={32} style={{ opacity: 0.3 }} />
                <p style={{ fontSize: 12, margin: 0 }}>メッセージなし</p>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: "auto", padding: "4px" }}>
                {chatMsgs.map((m) => <ChatMsgRow key={m.id} msg={m} />)}
              </div>
            )}
            <div style={{ flexShrink: 0, padding: "8px 10px",
              borderTop: `1px solid rgba(88,101,242,0.18)` }}>
              <button onClick={() => navigate("/chat")} style={{
                width: "100%", padding: "7px 0", borderRadius: 8, border: "none",
                background: "rgba(88,101,242,0.15)", color: C.primary,
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F.family,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <Icon name="open_in_new" size={14} />
                チャットを開く
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
