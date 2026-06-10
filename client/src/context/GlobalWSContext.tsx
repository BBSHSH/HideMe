import { createContext, useContext, useEffect, useRef, useCallback } from "react";

type Handler = (msg: any) => void;
type Unsubscribe = () => void;

interface GlobalWSCtx {
  subscribe: (type: string, handler: Handler) => Unsubscribe;
  send: (msg: object) => void;
}

const Ctx = createContext<GlobalWSCtx>({
  subscribe: () => () => {},
  send: () => {},
});

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const WS_BASE = BASE_URL.replace(/^http/, "ws");

function getToken() {
  return JSON.parse(localStorage.getItem("hideme_auth") || "{}").token ?? "";
}

export function GlobalWSProvider({ children }: { children: React.ReactNode }) {
  const listeners = useRef<Map<string, Set<Handler>>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dead = useRef(false);
  const backoff = useRef(1000);

  const connect = useCallback(() => {
    const token = getToken();
    if (!token || dead.current) return;

    const ws = new WebSocket(`${WS_BASE}/v1/chat/ws?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => { backoff.current = 1000; };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        listeners.current.get(msg.type)?.forEach((h) => h(msg));
        listeners.current.get("*")?.forEach((h) => h(msg));
      } catch {}
    };

    ws.onclose = () => {
      if (!dead.current) {
        timerRef.current = setTimeout(() => { backoff.current = Math.min(backoff.current * 2, 30000); connect(); }, backoff.current);
      }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      dead.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const subscribe = useCallback((type: string, handler: Handler): Unsubscribe => {
    if (!listeners.current.has(type)) listeners.current.set(type, new Set());
    listeners.current.get(type)!.add(handler);
    return () => listeners.current.get(type)?.delete(handler);
  }, []);

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return <Ctx.Provider value={{ subscribe, send }}>{children}</Ctx.Provider>;
}

export function useGlobalWS() {
  return useContext(Ctx);
}
