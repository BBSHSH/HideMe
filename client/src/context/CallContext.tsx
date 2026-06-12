import { createContext, useContext, useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { useGlobalWS } from "./GlobalWSContext";
import { useAuth } from "./AuthContext";
import { useColors } from "./ThemeContext";
import { useWebRTC, type CallState } from "../hooks/useWebRTC";
import { Icon } from "../components/Icon";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

// ─── ローカルコンポーネント ───────────────────────────────────

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

// ─── Context ─────────────────────────────────────────────────

interface CallContextType {
  handleDMCall: (targetId: string, targetName: string, targetAvatar?: string) => Promise<void>;
}

const CallContext = createContext<CallContextType | null>(null);

export function useCall(): CallContextType {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallProvider");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────

export function CallProvider({ children }: { children: ReactNode }) {
  const { subscribe, send: wsSend } = useGlobalWS();
  const { user } = useAuth();

  const [callPartner,  setCallPartner]  = useState<{ id: string; name: string; avatar?: string } | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string; callerName: string; callerAvatar?: string; offer?: RTCSessionDescriptionInit;
  } | null>(null);

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

  // WS 購読: 通話シグナリング
  useEffect(() => {
    const unsubs = [
      subscribe("webrtc_offer", (msg) => setIncomingCall((prev) => ({
        callerId:     msg.sender_id,
        callerName:   prev?.callerName ?? msg.sender_id,
        callerAvatar: prev?.callerAvatar,
        offer:        msg.data as RTCSessionDescriptionInit,
      }))),
      subscribe("call_invite",  (msg) => setIncomingCall((prev) => ({
        callerId:     msg.sender_id,
        callerName:   msg.data?.callerName ?? prev?.callerName ?? "Unknown",
        callerAvatar: msg.data?.callerAvatar ?? prev?.callerAvatar,
        offer:        prev?.offer,
      }))),
      subscribe("call_reject",  ()    => webrtc.endCall()),
      subscribe("call_end",     ()    => webrtc.endCall()),
      subscribe("webrtc_answer",(msg) => webrtc.handleAnswer(msg.data)),
      subscribe("webrtc_ice",   (msg) => webrtc.handleIce(msg.data)),
    ];
    return () => unsubs.forEach((u) => u());
  }, [subscribe]);

  // 発信
  const handleDMCall = useCallback(async (targetId: string, targetName: string, targetAvatar?: string) => {
    setCallPartner({ id: targetId, name: targetName, avatar: targetAvatar });
    try {
      await webrtc.startCall(targetId);
      wsSend({ type: "call_invite", target_id: targetId, data: { callerName: user?.username, callerAvatar: user?.avatar } });
    } catch {
      setCallPartner(null);
      alert("マイクへのアクセスを許可してください");
    }
  }, [webrtc, wsSend, user]);

  // 受諾
  const handleAcceptCall = useCallback(async () => {
    if (!incomingCall) return;
    const { callerId, callerName, callerAvatar, offer } = incomingCall;
    if (!offer) {
      console.warn("[WebRTC] accept clicked but offer not yet received");
      return;
    }
    setIncomingCall(null);
    setCallPartner({ id: callerId, name: callerName, avatar: callerAvatar });
    try {
      await webrtc.acceptCall(callerId, offer);
    } catch (e) {
      console.error("[WebRTC] acceptCall failed:", e);
      setCallPartner(null);
      alert("マイクへのアクセスを許可してください");
    }
  }, [incomingCall, webrtc]);

  return (
    <CallContext.Provider value={{ handleDMCall }}>
      <audio ref={remoteAudioRef} autoPlay />

      {incomingCall && (
        <IncomingCallModal
          callerName={incomingCall.callerName}
          callerAvatar={incomingCall.callerAvatar}
          onAccept={handleAcceptCall}
          onReject={() => {
            wsSend({ type: "call_reject", target_id: incomingCall.callerId, data: {} });
            setIncomingCall(null);
          }}
        />
      )}
      {callPartner && (
        <CallBar
          state={webrtc.state}
          partnerName={callPartner.name}
          partnerAvatar={callPartner.avatar}
          muted={webrtc.muted}
          onMute={webrtc.toggleMute}
          onEnd={() => {
            wsSend({ type: "call_end", target_id: callPartner.id, data: {} });
            webrtc.endCall();
          }}
        />
      )}

      {children}
    </CallContext.Provider>
  );
}
