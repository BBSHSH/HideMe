import { useState, useEffect, useRef, useCallback } from "react";
import { useColors } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/Icon";
import { F } from "../theme/tokens";
import { useIsMobile } from "../hooks/useIsMobile";
import {
  getChannels, createChannel, deleteChannel,
  getMessages, postMessage, deleteMessage,
  getDMConversations, openDMConversation, getDMMessages, postDMMessage,
  getUsers, voiceJoin, voiceLeave,
  type Channel, type Message, type DMConversation, type DMMessage,
  type UserItem, type VoiceParticipant,
} from "../api/chat";
import { useGlobalWS } from "../context/GlobalWSContext";
import { useWebRTC, type CallState } from "../hooks/useWebRTC";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

// ─── helpers ────────────────────────────────────────────────
function fmtTime(iso: string) {
  const d = new Date(iso), now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

// ─── Avatar ──────────────────────────────────────────────────
function Avatar({ username, avatar, size = 36 }: { username: string; avatar?: string; size?: number }) {
  const [err, setErr] = useState(false);
  const src = avatar?.startsWith("http") ? avatar : avatar ? `${BASE_URL}/${avatar}` : "";
  const color = `hsl(${[...username].reduce((a, c) => a + c.charCodeAt(0), 0) % 360},55%,52%)`;
  if (src && !err)
    return <img src={src} onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, fontSize: size * 0.42, fontWeight: 800, color: "#fff" }}>
      {username[0]?.toUpperCase()}
    </div>
  );
}

// ─── メッセージ行 ────────────────────────────────────────────
function MsgRow({ username, avatar, content, time, prevUsername, prevTime, canDelete, onDelete }: {
  username: string; avatar?: string; content: string; time: string;
  prevUsername?: string; prevTime?: string; canDelete: boolean; onDelete: () => void;
}) {
  const C = useColors();
  const [hov, setHov] = useState(false);
  const grouped = prevUsername === username && !!prevTime &&
    new Date(time).getTime() - new Date(prevTime).getTime() < 5 * 60 * 1000;
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", gap: 12, padding: grouped ? "1px 16px" : "8px 16px 2px",
        background: hov ? C.glass as string : "transparent", position: "relative", alignItems: "flex-start" }}>
      <div style={{ width: 40, flexShrink: 0 }}>
        {!grouped && <Avatar username={username} avatar={avatar} size={40} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {!grouped && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.onSurface }}>{username}</span>
            <span style={{ fontSize: 11, color: C.outline }}>{fmtTime(time)}</span>
          </div>
        )}
        <p style={{ margin: 0, fontSize: 14, color: C.onSurface, lineHeight: 1.5,
          wordBreak: "break-word", whiteSpace: "pre-wrap" }}>{content}</p>
      </div>
      {hov && canDelete && (
        <button onClick={onDelete} style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          background: C.surfaceContainerHigh as string, border: "none", borderRadius: 6,
          padding: "4px 8px", cursor: "pointer", color: "#f87171",
          display: "flex", alignItems: "center", gap: 4, fontSize: 12,
        }}><Icon name="delete" size={14} /></button>
      )}
    </div>
  );
}

// ─── メッセージエリア ────────────────────────────────────────
function MessageArea({ items, myUserId, isAdmin, onDelete }: {
  items: (Message | DMMessage)[]; myUserId?: string; isAdmin: boolean;
  onDelete: (id: string) => void;
}) {
  const C = useColors();
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [items]);

  const rows: React.ReactNode[] = [];
  items.forEach((msg, i) => {
    const prev     = items[i - 1];
    const username = "username" in msg ? msg.username  : msg.sender_name;
    const avatar   = "avatar"   in msg ? msg.avatar    : msg.sender_avatar;
    const userId   = "user_id"  in msg ? msg.user_id   : msg.sender_id;
    const prevName = prev ? ("username" in prev ? prev.username  : prev.sender_name) : undefined;

    if (!prev || fmtDate(msg.created_at) !== fmtDate(prev.created_at)) {
      rows.push(
        <div key={`d-${msg.id}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px 4px" }}>
          <div style={{ flex: 1, height: 1, background: `${C.outlineVariant}44` }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.outline }}>{fmtDate(msg.created_at)}</span>
          <div style={{ flex: 1, height: 1, background: `${C.outlineVariant}44` }} />
        </div>
      );
    }
    rows.push(
      <MsgRow key={msg.id} username={username} avatar={avatar} content={msg.content} time={msg.created_at}
        prevUsername={prevName} prevTime={prev?.created_at}
        canDelete={isAdmin || myUserId === userId} onDelete={() => onDelete(msg.id)} />
    );
  });
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "8px 0" }}>
      {rows}<div ref={bottomRef} />
    </div>
  );
}

// ─── 入力欄 ──────────────────────────────────────────────────
const MAX_CHARS = 2000;

function InputBar({ placeholder, onSend }: { placeholder: string; onSend: (t: string) => Promise<void> }) {
  const C = useColors();
  const [val, setVal] = useState("");
  const [sending, setSending] = useState(false);
  const overLimit = val.length > MAX_CHARS;
  const nearLimit = val.length > MAX_CHARS * 0.8;
  const send = async () => {
    if (!val.trim() || sending || overLimit) return;
    setSending(true);
    try { await onSend(val.trim()); setVal(""); } finally { setSending(false); }
  };
  return (
    <div style={{ padding: "8px 16px 12px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "flex-end",
        background: C.surfaceVariant, borderRadius: 10,
        border: `1px solid ${overLimit ? "#f87171" : C.outlineVariant + "44"}`, padding: "6px 12px",
        transition: "border-color 0.15s" }}>
        <textarea value={val} onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={placeholder} rows={1}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none",
            color: C.onSurface, fontSize: 14, fontFamily: F.family, resize: "none",
            lineHeight: 1.5, maxHeight: 120, overflowY: "auto", padding: "4px 0" }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 120) + "px";
          }} />
        <button onClick={send} disabled={!val.trim() || sending || overLimit} style={{
          background: val.trim() && !overLimit ? C.primaryContainer : "transparent", border: "none",
          borderRadius: 7, padding: "6px 8px", marginLeft: 4, flexShrink: 0,
          color: val.trim() && !overLimit ? C.onPrimaryContainer : C.outline,
          cursor: val.trim() && !overLimit ? "pointer" : "default", display: "flex", alignItems: "center",
        }}><Icon name="send" size={18} /></button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <p style={{ margin: 0, fontSize: 11, color: C.outline }}>Enter で送信 · Shift+Enter で改行</p>
        {nearLimit && (
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700,
            color: overLimit ? "#f87171" : val.length > MAX_CHARS * 0.9 ? "#f59e0b" : C.outline }}>
            {MAX_CHARS - val.length}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── 通話バー（画面下部に固定表示） ─────────────────────────
function CallBar({ state, partnerName, partnerAvatar, muted, onMute, onEnd }: {
  state: CallState; partnerName: string; partnerAvatar?: string;
  muted: boolean; onMute: () => void; onEnd: () => void;
}) {
  if (state === "idle" || state === "ended") return null;
  const label = state === "calling" ? "発信中..." : state === "ringing" ? "着信中..." : "通話中";
  return (
    <div style={{
      position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
      background: state === "connected" ? "#22c55e" : "#f59e0b",
      borderRadius: 50, padding: "10px 20px", display: "flex", alignItems: "center", gap: 14,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 500,
    }}>
      <Avatar username={partnerName} avatar={partnerAvatar} size={30} />
      <div>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#fff" }}>{partnerName}</p>
        <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.8)" }}>{label}</p>
      </div>
      {state === "connected" && (
        <button onClick={onMute} style={{
          background: muted ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.2)",
          border: "none", borderRadius: "50%", width: 34, height: 34,
          cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        }}><Icon name={muted ? "mic_off" : "mic"} size={16} /></button>
      )}
      <button onClick={onEnd} style={{
        background: "#ef4444", border: "none", borderRadius: "50%",
        width: 34, height: 34, cursor: "pointer", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}><Icon name="call_end" size={16} /></button>
    </div>
  );
}

// ─── 着信モーダル ─────────────────────────────────────────────
function IncomingCallModal({ callerName, callerAvatar, onAccept, onReject }: {
  callerName: string; callerAvatar?: string; onAccept: () => void; onReject: () => void;
}) {
  const C = useColors();
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 600 }}>
      <div style={{ background: C.surfaceContainer, borderRadius: 20, padding: 32,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: 280 }}>
        <div style={{ animation: "pulse 1.5s infinite" }}>
          <Avatar username={callerName} avatar={callerAvatar} size={64} />
        </div>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.onSurface }}>{callerName}</p>
        <p style={{ margin: 0, fontSize: 13, color: C.outline }}>音声通話の着信...</p>
        <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
          <button onClick={onReject} style={{
            width: 56, height: 56, borderRadius: "50%", border: "none",
            background: "#ef4444", color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Icon name="call_end" size={24} /></button>
          <button onClick={onAccept} style={{
            width: 56, height: 56, borderRadius: "50%", border: "none",
            background: "#22c55e", color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Icon name="call" size={24} /></button>
        </div>
      </div>
    </div>
  );
}

// ─── 音声チャンネル表示 ──────────────────────────────────────
function VoiceChannelItem({ ch, isJoined, participants, onClick, onDelete, isAdmin: _isAdmin }: {
  ch: Channel; isJoined: boolean; participants: VoiceParticipant[];
  onClick: () => void; onDelete?: () => void; isAdmin: boolean;
}) {
  const C = useColors();
  const [hov, setHov] = useState(false);
  return (
    <div>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px",
          borderRadius: 6, cursor: "pointer", marginBottom: 1,
          background: isJoined ? "rgba(34,197,94,0.15)" : hov ? C.overlay05 as string : "transparent",
          transition: "background 0.1s" }}>
        <Icon name="volume_up" size={15} style={{ color: isJoined ? "#22c55e" : C.outline, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: isJoined ? 700 : 500,
          color: isJoined ? "#22c55e" : C.outline,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.name}</span>
        {hov && onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: 2, flexShrink: 0 }}>
            <Icon name="close" size={13} />
          </button>
        )}
      </div>
      {/* 参加者一覧 */}
      {participants.length > 0 && (
        <div style={{ paddingLeft: 28, marginBottom: 4 }}>
          {participants.map((p) => (
            <div key={p.user_id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 4px" }}>
              <Avatar username={p.username} avatar={p.avatar} size={20} />
              <span style={{ fontSize: 12, color: C.outline }}>{p.username}</span>
              {p.muted && <Icon name="mic_off" size={12} style={{ color: C.outline }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── モーダル類 ──────────────────────────────────────────────
function NewDMModal({ onClose, onSelect, myId }: { onClose: () => void; onSelect: (u: UserItem) => void; myId?: string }) {
  const C = useColors();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => { getUsers().then((d) => setUsers(d.items ?? [])); }, []);
  const filtered = users.filter((u) => u.id !== myId && u.username.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.surfaceContainer, border: `1px solid ${C.outlineVariant}44`,
        borderRadius: 16, padding: 24, width: 360, display: "flex", flexDirection: "column", gap: 14,
      }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.onSurface }}>DMを開始</h3>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ユーザーを検索..."
          style={{ background: C.surfaceVariant, border: `1px solid ${C.outlineVariant}44`,
            borderRadius: 8, padding: "9px 13px", color: C.onSurface, fontSize: 13, fontFamily: F.family, outline: "none" }} />
        <div style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
          {filtered.length === 0
            ? <p style={{ fontSize: 13, color: C.outline, textAlign: "center", padding: 16 }}>見つかりません</p>
            : filtered.map((u) => (
              <div key={u.id} onClick={() => onSelect(u)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.overlay10 as string)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <Avatar username={u.username} avatar={u.avatar} size={32} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.onSurface }}>{u.username}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

function CreateChannelModal({ onClose, onCreate }: { onClose: () => void; onCreate: (n: string, d: string, t: string) => void }) {
  const C = useColors();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState<"text" | "voice">("text");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.surfaceContainer, border: `1px solid ${C.outlineVariant}44`,
        borderRadius: 16, padding: 28, width: 400, display: "flex", flexDirection: "column", gap: 16,
      }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.onSurface }}>チャンネルを作成</h3>
        {/* チャンネルタイプ選択 */}
        <div style={{ display: "flex", gap: 8 }}>
          {(["text", "voice"] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} style={{
              flex: 1, padding: "10px", borderRadius: 10,
              border: `1px solid ${type === t ? C.primaryContainer : C.outlineVariant + "44"}`,
              background: type === t ? C.overlay15 as string : "transparent",
              color: type === t ? C.primary : C.outline,
              cursor: "pointer", fontFamily: F.family, fontWeight: 700, fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <Icon name={t === "text" ? "tag" : "volume_up"} size={16} />
              {t === "text" ? "テキスト" : "ボイス"}
            </button>
          ))}
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="チャンネル名"
          style={{ background: C.surfaceVariant, border: `1px solid ${C.outlineVariant}44`,
            borderRadius: 8, padding: "10px 14px", color: C.onSurface, fontSize: 14, fontFamily: F.family, outline: "none" }} />
        {type === "text" && (
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="説明 (任意)"
            style={{ background: C.surfaceVariant, border: `1px solid ${C.outlineVariant}44`,
              borderRadius: 8, padding: "10px 14px", color: C.onSurface, fontSize: 14, fontFamily: F.family, outline: "none" }} />
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 8,
            border: `1px solid ${C.outlineVariant}44`, background: "transparent",
            color: C.outline, cursor: "pointer", fontFamily: F.family, fontWeight: 700 }}>キャンセル</button>
          <button onClick={() => name.trim() && onCreate(name.trim(), desc.trim(), type)} style={{
            padding: "8px 18px", borderRadius: 8, border: "none",
            background: C.primaryContainer, color: C.onPrimaryContainer,
            cursor: "pointer", fontFamily: F.family, fontWeight: 700 }}>作成</button>
        </div>
      </div>
    </div>
  );
}

// ─── サイドバー部品 ───────────────────────────────────────────
function SectionHeader({ label, onAdd, mt }: { label: string; onAdd?: () => void; mt?: number }) {
  const C = useColors();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "6px 6px 3px", marginTop: mt }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: C.outline,
        textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      {onAdd && (
        <button onClick={onAdd} style={{ background: "none", border: "none",
          color: C.outline, cursor: "pointer", padding: 2, lineHeight: 1 }}>
          <Icon name="add" size={16} />
        </button>
      )}
    </div>
  );
}

function SidebarItem({ active, icon, label, subLabel, avatar, onClick, onDelete }: {
  active: boolean; icon?: string; label: string; subLabel?: string;
  avatar?: string; onClick: () => void; onDelete?: () => void;
}) {
  const C = useColors();
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px",
        borderRadius: 6, cursor: "pointer", marginBottom: 1,
        background: active ? C.overlay15 as string : hov ? C.overlay05 as string : "transparent",
        transition: "background 0.1s" }}>
      {avatar !== undefined
        ? <Avatar username={label} avatar={avatar} size={28} />
        : icon && <span style={{ fontSize: 16, color: active ? C.onSurface : C.outline, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: active ? 700 : 500,
          color: active ? C.onSurface : C.outline,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</p>
        {subLabel && <p style={{ margin: 0, fontSize: 11, color: C.outline,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subLabel}</p>}
      </div>
      {hov && onDelete && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: 2, flexShrink: 0 }}>
          <Icon name="close" size={13} />
        </button>
      )}
    </div>
  );
}

// ─── 型定義 ──────────────────────────────────────────────────
type ActiveView = { kind: "none" } | { kind: "channel"; channel: Channel } | { kind: "dm"; conv: DMConversation };

// ─── メイン ──────────────────────────────────────────────────
export default function Chat() {
  const C = useColors();
  const { user, isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const { subscribe, send: wsSend } = useGlobalWS();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);

  const [channels,       setChannels]       = useState<Channel[]>([]);
  const [dmConvs,        setDmConvs]        = useState<DMConversation[]>([]);
  const [chanMsgs,       setChanMsgs]       = useState<Message[]>([]);
  const [dmMsgs,         setDmMsgs]         = useState<DMMessage[]>([]);
  const [active,         setActive]         = useState<ActiveView>({ kind: "none" });
  const [showCreateChan, setShowCreateChan] = useState(false);
  const [showNewDM,      setShowNewDM]      = useState(false);
  const [joinedVoice,    setJoinedVoice]    = useState<string | null>(null); // 参加中の音声チャンネルID
  const [voiceParticipants, setVoiceParticipants] = useState<Record<string, VoiceParticipant[]>>({});

  // WebRTC 通話状態
  const [callPartner,    setCallPartner]    = useState<{ id: string; name: string; avatar?: string } | null>(null);
  const [incomingCall,   setIncomingCall]   = useState<{ callerId: string; callerName: string; callerAvatar?: string; offer: RTCSessionDescriptionInit } | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const webrtc = useWebRTC({
    onSignal: (type, targetId, data) => {
      wsSend({ type, target_id: targetId, data });
    },
    onRemoteStream: (stream) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(() => {});
      }
    },
    onStateChange: (s) => {
      if (s === "idle" || s === "ended") setCallPartner(null);
    },
  });

  // 初期ロード
  useEffect(() => {
    getChannels().then((d) => {
      const items = d.items ?? [];
      setChannels(items);
      // 音声参加者初期化
      const vp: Record<string, VoiceParticipant[]> = {};
      items.forEach((ch: any) => { vp[ch.id] = ch.voice_participants ?? []; });
      setVoiceParticipants(vp);
      const textChs = items.filter((ch: Channel) => ch.type !== "voice");
      if (textChs.length > 0) setActive({ kind: "channel", channel: textChs[0] });
    });
    getDMConversations().then((d) => setDmConvs(d.items ?? []));
  }, []);

  // WebSocket（グローバルWSを購読）
  useEffect(() => {
    const unsubs = [
      subscribe("message",         (msg) => setChanMsgs((p) => [...p, msg.data])),
      subscribe("dm",              (msg) => { setDmMsgs((p) => [...p, msg.data]); setDmConvs((p) => p.map((c) => c.id === msg.channel_id ? { ...c, last_message: msg.data.content } : c)); }),
      subscribe("delete",          (msg) => setChanMsgs((p) => p.filter((m) => m.id !== msg.data?.id))),
      subscribe("channel_created", (msg) => setChannels((p) => [...p, msg.data])),
      subscribe("channel_deleted", (msg) => { setChannels((p) => p.filter((c) => c.id !== msg.channel_id)); setActive((cur) => cur.kind === "channel" && cur.channel.id === msg.channel_id ? { kind: "none" } : cur); }),
      subscribe("voice_state",     (msg) => setVoiceParticipants((p) => ({ ...p, [msg.channel_id]: msg.data ?? [] }))),
      subscribe("call_invite",     (msg) => setIncomingCall({ callerId: msg.sender_id, callerName: msg.data?.callerName ?? "Unknown", callerAvatar: msg.data?.callerAvatar, offer: msg.data?.offer })),
      subscribe("call_accept",     (msg) => webrtc.handleAnswer(msg.data)),
      subscribe("call_reject",     ()    => webrtc.endCall()),
      subscribe("call_end",        ()    => webrtc.endCall()),
      subscribe("webrtc_offer",    (msg) => setIncomingCall({ callerId: msg.sender_id, callerName: msg.data?.callerName ?? msg.sender_id, callerAvatar: msg.data?.callerAvatar, offer: msg.data })),
      subscribe("webrtc_answer",   (msg) => webrtc.handleAnswer(msg.data)),
      subscribe("webrtc_ice",      (msg) => webrtc.handleIce(msg.data)),
    ];
    return () => unsubs.forEach((u) => u());
  }, [subscribe]);

  // アクティブ変更時にメッセージ取得
  const activeKey = active.kind === "channel" ? active.channel.id : active.kind === "dm" ? active.conv.id : null;
  useEffect(() => {
    if (active.kind === "channel" && active.channel.type !== "voice") {
      setChanMsgs([]);
      getMessages(active.channel.id).then((d) => setChanMsgs(d.items ?? []));
    } else if (active.kind === "dm") {
      setDmMsgs([]);
      getDMMessages(active.conv.id).then((d) => setDmMsgs(d.items ?? []));
    }
  }, [activeKey]);

  // 音声チャンネル参加/退出
  const handleVoiceToggle = async (ch: Channel) => {
    if (joinedVoice === ch.id) {
      await voiceLeave(ch.id);
      setJoinedVoice(null);
    } else {
      if (joinedVoice) await voiceLeave(joinedVoice);
      await voiceJoin(ch.id);
      setJoinedVoice(ch.id);
    }
  };

  // DM 通話発信
  const handleDMCall = async (targetId: string, targetName: string, targetAvatar?: string) => {
    setCallPartner({ id: targetId, name: targetName, avatar: targetAvatar });
    // WS 経由で offer を送る（useWebRTC の startCall が内部で webrtc_offer を送る）
    await webrtc.startCall(targetId);
    // call_invite を別途送って相手に通知
    wsSend({ type: "call_invite", target_id: targetId, data: { callerName: user?.username, callerAvatar: user?.avatar } });
  };

  // 着信受諾
  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    setCallPartner({ id: incomingCall.callerId, name: incomingCall.callerName, avatar: incomingCall.callerAvatar });
    await webrtc.acceptCall(incomingCall.callerId, incomingCall.offer);
    setIncomingCall(null);
  };

  const sendChannel = useCallback(async (content: string) => {
    if (active.kind !== "channel") return;
    await postMessage(active.channel.id, content);
  }, [active]);

  const sendDM = useCallback(async (content: string) => {
    if (active.kind !== "dm") return;
    await postDMMessage(active.conv.id, content);
  }, [active]);

  const dmPartner = (conv: DMConversation) => {
    const me1 = conv.user1_id === user?.userId;
    return { id: me1 ? conv.user2_id : conv.user1_id,
             name:   me1 ? conv.user2_name   : conv.user1_name,
             avatar: me1 ? conv.user2_avatar : conv.user1_avatar };
  };

  const textChannels  = channels.filter((c) => c.type !== "voice");
  const voiceChannels = channels.filter((c) => c.type === "voice");

  const handleSelectChannel = (ch: Channel) => {
    setActive({ kind: "channel", channel: ch });
    if (isMobile) setMobileSidebarOpen(false);
  };
  const handleSelectDM = (conv: DMConversation) => {
    setActive({ kind: "dm", conv });
    if (isMobile) setMobileSidebarOpen(false);
  };

  return (
    <div style={{ height: isMobile ? "calc(100vh - 56px)" : "calc(100vh - 72px)", display: "flex", overflow: "hidden",
      fontFamily: F.family, background: C.background }}>

      <audio ref={remoteAudioRef} autoPlay />

      {showCreateChan && (
        <CreateChannelModal onClose={() => setShowCreateChan(false)}
          onCreate={async (n, d, t) => { await createChannel(n, d, t); setShowCreateChan(false); }} />
      )}
      {showNewDM && (
        <NewDMModal onClose={() => setShowNewDM(false)} myId={user?.userId}
          onSelect={async (u) => {
            const conv = await openDMConversation(u.id, u.username, u.avatar);
            setDmConvs((p) => p.find((c) => c.id === conv.id) ? p : [conv, ...p]);
            setActive({ kind: "dm", conv });
            setShowNewDM(false);
          }} />
      )}
      {incomingCall && (
        <IncomingCallModal callerName={incomingCall.callerName} callerAvatar={incomingCall.callerAvatar}
          onAccept={handleAcceptCall} onReject={() => {
            wsSend({ type: "call_reject", target_id: incomingCall.callerId, data: {} });
            setIncomingCall(null);
          }} />
      )}
      {callPartner && (
        <CallBar state={webrtc.state} partnerName={callPartner.name} partnerAvatar={callPartner.avatar}
          muted={webrtc.muted} onMute={webrtc.toggleMute}
          onEnd={() => {
            if (callPartner) wsSend({ type: "call_end", target_id: callPartner.id, data: {} });
            webrtc.endCall();
          }} />
      )}

      {/* ── サイドバー ── */}
      <div style={{
        width: isMobile ? "100%" : 240, flexShrink: 0, background: C.surfaceContainerLow,
        borderRight: `1px solid ${C.outlineVariant}33`,
        display: isMobile && !mobileSidebarOpen ? "none" : "flex",
        flexDirection: "column", overflow: "hidden",
      }}>

        <div style={{ padding: "14px 16px", fontWeight: 800, fontSize: 15, color: C.onSurface,
          borderBottom: `1px solid ${C.outlineVariant}33` }}>HideMe</div>

        <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>

          {/* テキストチャンネル (admin のみ作成可) */}
          <SectionHeader label="テキストチャンネル" onAdd={isAdmin ? () => setShowCreateChan(true) : undefined} />
          {textChannels.map((ch) => (
            <SidebarItem key={ch.id}
              active={active.kind === "channel" && active.channel.id === ch.id}
              icon="#" label={ch.name}
              onClick={() => handleSelectChannel(ch)}
              onDelete={isAdmin ? async () => { if (confirm("削除しますか？")) await deleteChannel(ch.id); } : undefined}
            />
          ))}
          {textChannels.length === 0 && isAdmin && (
            <p style={{ fontSize: 12, color: C.outline, padding: "2px 8px" }}>＋ でチャンネルを作成</p>
          )}

          {/* ボイスチャンネル */}
          <SectionHeader label="ボイスチャンネル" onAdd={isAdmin ? () => setShowCreateChan(true) : undefined} mt={12} />
          {voiceChannels.map((ch) => (
            <VoiceChannelItem key={ch.id} ch={ch}
              isJoined={joinedVoice === ch.id}
              participants={voiceParticipants[ch.id] ?? []}
              onClick={() => handleVoiceToggle(ch)}
              onDelete={isAdmin ? async () => { if (confirm("削除しますか？")) await deleteChannel(ch.id); } : undefined}
              isAdmin={isAdmin}
            />
          ))}
          {voiceChannels.length === 0 && isAdmin && (
            <p style={{ fontSize: 12, color: C.outline, padding: "2px 8px" }}>＋ でボイスチャンネルを作成</p>
          )}

          {/* ダイレクトメッセージ */}
          <SectionHeader label="ダイレクトメッセージ" onAdd={() => setShowNewDM(true)} mt={14} />
          {dmConvs.map((conv) => {
            const p = dmPartner(conv);
            return (
              <SidebarItem key={conv.id} active={active.kind === "dm" && active.conv.id === conv.id}
                label={p.name} avatar={p.avatar}
                subLabel={conv.last_message ? conv.last_message.slice(0, 22) + (conv.last_message.length > 22 ? "…" : "") : undefined}
                onClick={() => handleSelectDM(conv)}
              />
            );
          })}
          {dmConvs.length === 0 && (
            <p style={{ fontSize: 12, color: C.outline, padding: "2px 8px" }}>＋ でDMを開始</p>
          )}
        </div>

        {/* ユーザー情報 */}
        <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.outlineVariant}33`,
          background: C.surfaceContainer, display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar username={user?.username ?? "?"} avatar={user?.avatar} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.onSurface,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.username}</p>
            <p style={{ margin: 0, fontSize: 10, color: C.outline }}>{user?.role === "admin" ? "管理者" : "メンバー"}</p>
          </div>
        </div>
      </div>

      {/* ── メインエリア ── */}
      <div style={{
        flex: 1, minWidth: 0, display: isMobile && mobileSidebarOpen ? "none" : "flex",
        flexDirection: "column", overflow: "hidden",
      }}>
        {active.kind === "none" ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 12, color: C.outline }}>
            <Icon name="forum" size={56} style={{ opacity: 0.25 }} />
            <p style={{ fontSize: 15 }}>チャンネルまたはDMを選択してください</p>
          </div>
        ) : (
          <>
            {/* ヘッダー */}
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.outlineVariant}33`,
              background: C.surface, flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
              {isMobile && (
                <button onClick={() => setMobileSidebarOpen(true)} style={{
                  background: "transparent", border: "none", cursor: "pointer", padding: 4,
                  color: C.onSurfaceVariant, display: "flex", alignItems: "center",
                }}>
                  <Icon name="arrow_back" size={22} style={{ color: C.onSurfaceVariant }} />
                </button>
              )}
              {active.kind === "dm"
                ? <Avatar username={dmPartner(active.conv).name} avatar={dmPartner(active.conv).avatar} size={28} />
                : <span style={{ fontSize: 20, color: C.outline }}>#</span>
              }
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.onSurface }}>
                  {active.kind === "channel" ? active.channel.name : dmPartner(active.conv).name}
                </span>
                {active.kind === "channel" && active.channel.description && (
                  <span style={{ fontSize: 12, color: C.outline, marginLeft: 10 }}>{active.channel.description}</span>
                )}
                {active.kind === "dm" && (
                  <span style={{ fontSize: 12, color: C.outline, marginLeft: 10 }}>ダイレクトメッセージ</span>
                )}
              </div>
              {/* DM 通話ボタン */}
              {active.kind === "dm" && webrtc.state === "idle" && (
                <button onClick={() => {
                  const p = dmPartner(active.conv);
                  handleDMCall(p.id, p.name, p.avatar);
                }} style={{
                  background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
                  borderRadius: 8, padding: "6px 14px", color: "#22c55e",
                  cursor: "pointer", fontFamily: F.family, fontWeight: 700, fontSize: 13,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Icon name="call" size={16} />通話
                </button>
              )}
            </div>

            {/* ウェルカム */}
            <div style={{ padding: "16px 20px 8px", flexShrink: 0 }}>
              {active.kind === "channel" ? (
                <>
                  <div style={{ width: 48, height: 48, borderRadius: "50%",
                    background: C.overlay15 as string, display: "flex", alignItems: "center",
                    justifyContent: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 24, color: C.outline }}>#</span>
                  </div>
                  <h2 style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 800, color: C.onSurface }}>
                    {active.channel.name} へようこそ！
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: C.outline }}>
                    {active.channel.description || `これが #${active.channel.name} の最初のメッセージです。`}
                  </p>
                </>
              ) : (
                <>
                  <Avatar username={dmPartner(active.conv).name} avatar={dmPartner(active.conv).avatar} size={48} />
                  <h2 style={{ margin: "10px 0 2px", fontSize: 18, fontWeight: 800, color: C.onSurface }}>
                    {dmPartner(active.conv).name}
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: C.outline }}>
                    {dmPartner(active.conv).name} とのダイレクトメッセージの最初です。
                  </p>
                </>
              )}
              <div style={{ height: 1, background: `${C.outlineVariant}33`, marginTop: 12 }} />
            </div>

            <MessageArea
              items={active.kind === "channel" ? chanMsgs : dmMsgs}
              myUserId={user?.userId} isAdmin={isAdmin}
              onDelete={async (id) => { if (active.kind === "channel") await deleteMessage(id); }}
            />
            <InputBar
              placeholder={active.kind === "channel"
                ? `#${active.channel.name} にメッセージを送信`
                : `${dmPartner(active.conv).name} にメッセージを送信`}
              onSend={active.kind === "channel" ? sendChannel : sendDM}
            />
          </>
        )}
      </div>
    </div>
  );
}
