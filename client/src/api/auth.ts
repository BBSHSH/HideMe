import { apiPost } from "./client";

export type AuthResponse = {
  token: string;
  username: string;
  role: "admin" | "member";
};

export const login = (username: string, password: string) =>
  apiPost<AuthResponse>("/v1/auth/login", { username, password });

export const register = (username: string, password: string, role: "admin" | "member" = "member") =>
  apiPost<AuthResponse>("/v1/auth/register", { username, password, role });