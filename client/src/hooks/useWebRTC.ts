import { useRef, useState, useCallback } from "react";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export type CallState = "idle" | "calling" | "ringing" | "connected" | "ended";

interface RTCEvents {
  onSignal: (type: string, targetId: string, data: unknown) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onStateChange: (s: CallState) => void;
}

export function useWebRTC(events: RTCEvents) {
  // stale closure防止: 常に最新コールバックを参照
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const pcRef       = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  // remote description 設定前に届いた ICE candidate をバッファリング
  const pendingIce  = useRef<RTCIceCandidateInit[]>([]);

  const [state, setState] = useState<CallState>("idle");
  const [muted, setMuted] = useState(false);

  const setCallState = useCallback((s: CallState) => {
    setState(s);
    eventsRef.current.onStateChange(s);
  }, []);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
    pendingIce.current = [];
    setCallState("idle");
    setMuted(false);
  }, [setCallState]);

  const createPC = useCallback((targetId: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (e) => {
      if (e.candidate) eventsRef.current.onSignal("webrtc_ice", targetId, e.candidate);
    };
    pc.ontrack = (e) => {
      eventsRef.current.onRemoteStream(e.streams[0]);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected")             setCallState("connected");
      if (pc.connectionState === "failed" ||
          pc.connectionState === "closed")               cleanup();
      // "disconnected" は一時的な状態のため cleanup しない（自動回復を待つ）
    };
    return pc;
  }, [setCallState, cleanup]);

  /** 通話開始（発信側）: webrtc_offer を送信し、相手に通知が届く */
  const startCall = useCallback(async (targetId: string) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStream.current = stream;
    const pc = createPC(targetId);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pcRef.current = pc;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    eventsRef.current.onSignal("webrtc_offer", targetId, offer);
    setCallState("calling");
  }, [createPC, setCallState]);

  /** 着信を受諾（受信側） */
  const acceptCall = useCallback(async (targetId: string, offer: RTCSessionDescriptionInit) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStream.current = stream;
    const pc = createPC(targetId);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pcRef.current = pc;

    await pc.setRemoteDescription(offer);

    // setRemoteDescription 後にバッファリング済み ICE を適用
    for (const c of pendingIce.current) {
      await pc.addIceCandidate(c).catch(() => {});
    }
    pendingIce.current = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    eventsRef.current.onSignal("webrtc_answer", targetId, answer);
    setCallState("connected");
  }, [createPC, setCallState]);

  /** ICE candidate 受信処理 */
  const handleIce = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (pcRef.current?.remoteDescription) {
      await pcRef.current.addIceCandidate(candidate).catch(() => {});
    } else {
      // PC がないか remoteDescription 未設定ならバッファリング
      pendingIce.current.push(candidate);
    }
  }, []);

  /** Answer 受信処理（発信側） */
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (!pcRef.current) return;
    await pcRef.current.setRemoteDescription(answer).catch(() => {});
    // setRemoteDescription 後にバッファリング済み ICE を適用
    for (const c of pendingIce.current) {
      await pcRef.current.addIceCandidate(c).catch(() => {});
    }
    pendingIce.current = [];
  }, []);

  /** 通話終了 */
  const endCall = useCallback(() => {
    setCallState("ended");
    cleanup();
  }, [cleanup, setCallState]);

  /** マイクミュート切替 */
  const toggleMute = useCallback(() => {
    localStream.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setMuted((m) => !m);
  }, []);

  return { state, muted, startCall, acceptCall, handleIce, handleAnswer, endCall, toggleMute };
}
