import { useRef, useState, useCallback } from "react";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export type CallState = "idle" | "calling" | "ringing" | "connected" | "ended";

interface RTCEvents {
  onSignal: (type: string, targetId: string, data: unknown) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onStateChange: (s: CallState) => void;
}

export function useWebRTC(events: RTCEvents) {
  const pcRef        = useRef<RTCPeerConnection | null>(null);
  const localStream  = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CallState>("idle");
  const [muted, setMuted] = useState(false);

  const setCallState = (s: CallState) => {
    setState(s);
    events.onStateChange(s);
  };

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
    setCallState("idle");
    setMuted(false);
  }, []);

  const createPC = useCallback((targetId: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (e) => {
      if (e.candidate) events.onSignal("webrtc_ice", targetId, e.candidate);
    };
    pc.ontrack = (e) => {
      remoteStream.current = e.streams[0];
      events.onRemoteStream(e.streams[0]);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setCallState("connected");
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") cleanup();
    };
    return pc;
  }, [events, cleanup]);

  /** 通話を開始（発信側） */
  const startCall = useCallback(async (targetId: string) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStream.current = stream;
    const pc = createPC(targetId);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pcRef.current = pc;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    events.onSignal("webrtc_offer", targetId, offer);
    setCallState("calling");
  }, [createPC, events]);

  /** 着信を受諾（受信側） */
  const acceptCall = useCallback(async (targetId: string, offer: RTCSessionDescriptionInit) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStream.current = stream;
    const pc = createPC(targetId);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pcRef.current = pc;

    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    events.onSignal("webrtc_answer", targetId, answer);
    setCallState("connected");
  }, [createPC, events]);

  /** ICE candidate 受信処理 */
  const handleIce = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (pcRef.current) await pcRef.current.addIceCandidate(candidate);
  }, []);

  /** Answer 受信処理（発信側） */
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (pcRef.current) await pcRef.current.setRemoteDescription(answer);
  }, []);

  /** 通話終了 */
  const endCall = useCallback(() => {
    setCallState("ended");
    cleanup();
  }, [cleanup]);

  /** マイクミュート切替 */
  const toggleMute = useCallback(() => {
    localStream.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setMuted((m) => !m);
  }, []);

  return { state, muted, startCall, acceptCall, handleIce, handleAnswer, endCall, toggleMute };
}
