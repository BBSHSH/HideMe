import { apiGet, apiPost, apiPut } from "./client";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export type AuthResponse = {
  token: string;
  user_id: string;
  username: string;
  role: "admin" | "member";
  auth_method?: "password" | "discord";
  avatar?: string;
};

export type AuthSettings = {
  normal_login_enabled: boolean;
  discord_login_enabled: boolean;
};

export const login = (username: string, password: string): Promise<AuthResponse> =>
  fetch(`${BASE_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  }).then((res) => {
    if (!res.ok) throw new Error(`Login failed: ${res.status}`);
    return res.json();
  });

export const register = (username: string, password: string, role: "admin" | "member" = "member"): Promise<AuthResponse> =>
  fetch(`${BASE_URL}/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, role }),
  }).then((res) => {
    if (!res.ok) throw new Error(`Register failed: ${res.status}`);
    return res.json();
  });

export const getAuthSettings = () =>
  apiGet<AuthSettings>("/v1/auth/settings");

export const updateAuthSettings = (settings: AuthSettings) =>
  apiPut<{ ok: boolean }>("/v1/auth/settings", settings);

export const forceLogoutAll = () =>
  apiPost<{ ok: boolean }>("/v1/admin/force-logout", {});

/** Discord OAuth の開始 URL を返す (ブラウザリダイレクト用) */
export const getDiscordLoginURL = () =>
  `${BASE_URL}/v1/auth/discord`;