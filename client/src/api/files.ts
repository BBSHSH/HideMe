import { apiGet } from "./client";
import type {FileListResponse } from "../data/files";

export const listFiles = () =>
  apiGet<FileListResponse>("/v1/files");

export const uploadFile = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return fetch(
    `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"}/v1/files/upload`,
    { method: "POST", body: form }
  ).then((res) => {
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json() as Promise<{ name: string; size: number; uploaded: boolean }>;
  });
};

export const getDownloadUrl = (name: string) =>
  `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"}/v1/files/${encodeURIComponent(name)}`;