const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const WS_URL   = BASE_URL.replace(/^http/, "ws");

function token() {
  return JSON.parse(localStorage.getItem("hideme_auth") || "{}").token ?? "";
}
function authHeaders(): Record<string, string> {
  const t = token();
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export interface VoiceParticipant { user_id: string; username: string; avatar: string; muted: boolean; }
export interface Channel { id: string; name: string; description: string; type: string; position: number; created_at: string; voice_participants?: VoiceParticipant[]; }
export interface Message  { id: string; channel_id: string; user_id: string; username: string; avatar: string; content: string; created_at: string; edited_at?: string; }

export const getChannels  = (): Promise<{ items: Channel[] }> =>
  fetch(`${BASE_URL}/v1/chat/channels`, { headers: authHeaders() }).then((r) => r.json());

export const createChannel = (name: string, description = "", type = "text"): Promise<Channel> =>
  fetch(`${BASE_URL}/v1/chat/channels`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ name, description, type }) }).then((r) => r.json());

export const voiceJoin  = (channelId: string) =>
  fetch(`${BASE_URL}/v1/chat/channels/${channelId}/voice/join`,  { method: "POST", headers: authHeaders() }).then((r) => r.json());
export const voiceLeave = (channelId: string) =>
  fetch(`${BASE_URL}/v1/chat/channels/${channelId}/voice/leave`, { method: "POST", headers: authHeaders() }).then((r) => r.json());

export const deleteChannel = (id: string): Promise<void> =>
  fetch(`${BASE_URL}/v1/chat/channels/${id}`, { method: "DELETE", headers: authHeaders() }).then(() => {});

export const getMessages = (channelId: string, limit = 50): Promise<{ items: Message[] }> =>
  fetch(`${BASE_URL}/v1/chat/channels/${channelId}/messages?limit=${limit}`, { headers: authHeaders() }).then((r) => r.json());

export const postMessage = (channelId: string, content: string): Promise<Message> =>
  fetch(`${BASE_URL}/v1/chat/channels/${channelId}/messages`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ content }) }).then((r) => r.json());

export const deleteMessage = (id: string): Promise<void> =>
  fetch(`${BASE_URL}/v1/chat/messages/${id}`, { method: "DELETE", headers: authHeaders() }).then(() => {});

// ─── DM ─────────────────────────────────────────────────────
export interface DMConversation {
  id: string; user1_id: string; user2_id: string;
  user1_name: string; user2_name: string;
  user1_avatar: string; user2_avatar: string;
  created_at: string; last_message?: string; last_at?: string;
}
export interface DMMessage {
  id: string; conversation_id: string;
  sender_id: string; sender_name: string; sender_avatar: string;
  content: string; created_at: string;
}
export interface UserItem { id: string; username: string; avatar: string; }

export const getUsers = (): Promise<{ items: UserItem[] }> =>
  fetch(`${BASE_URL}/v1/users`, { headers: authHeaders() }).then((r) => r.json());

export const getDMConversations = (): Promise<{ items: DMConversation[] }> =>
  fetch(`${BASE_URL}/v1/dm/conversations`, { headers: authHeaders() }).then((r) => r.json());

export const openDMConversation = (targetId: string, targetName: string, targetAvatar: string): Promise<DMConversation> =>
  fetch(`${BASE_URL}/v1/dm/conversations`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({ target_id: targetId, target_name: targetName, target_avatar: targetAvatar }),
  }).then((r) => r.json());

export const getDMMessages = (convId: string, limit = 50): Promise<{ items: DMMessage[] }> =>
  fetch(`${BASE_URL}/v1/dm/conversations/${convId}/messages?limit=${limit}`, { headers: authHeaders() }).then((r) => r.json());

export const postDMMessage = (convId: string, content: string): Promise<DMMessage> =>
  fetch(`${BASE_URL}/v1/dm/conversations/${convId}/messages`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ content }),
  }).then((r) => r.json());

/** WebSocket 接続を作成して返す */
export function openChatWS(onMessage: (msg: any) => void): WebSocket {
  const t = token();
  const url = t ? `${WS_URL}/v1/chat/ws?token=${encodeURIComponent(t)}` : `${WS_URL}/v1/chat/ws`;
  const ws = new WebSocket(url);
  ws.onmessage = (e) => { try { onMessage(JSON.parse(e.data)); } catch {} };
  return ws;
}

/** WebSocket でシグナルを送る */
export function sendSignal(ws: WebSocket, type: string, targetId: string, data: unknown) {
  if (ws.readyState === WebSocket.OPEN)
    ws.send(JSON.stringify({ type, target_id: targetId, data }));
}
