import { apiGet, apiPost } from "./client";
import type { Collection } from "../data/files";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

function getToken(): string | null {
  const raw = localStorage.getItem("hideme_auth");
  return raw ? JSON.parse(raw).token : null;
}

export type CreateCollectionInput = {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  image_url?: string;
};

export const listCollections = () =>
  apiGet<{ items: Collection[] }>("/v1/collections");

export const createCollection = (input: CreateCollectionInput) =>
  apiPost<Collection>("/v1/collections", input);

export const updateCollection = (id: string, input: CreateCollectionInput) => {
  return fetch(
    `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"}/v1/collections/${id}`,
    {
      method: "PUT",  // ← POST から PUT に変更
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${JSON.parse(localStorage.getItem("hideme_auth") || "{}").token}`,
      },
      body: JSON.stringify(input),
    }
  ).then((res) => {
    if (!res.ok) throw new Error(`Update failed: ${res.status}`);
    return res.json() as Promise<{ updated: boolean }>;
  });
};
export const deleteCollection = (id: string) => {
  return fetch(
    `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"}/v1/collections/${id}`,
    {
      method: "DELETE",  // ← POST から DELETE に変更
      headers: {
        Authorization: `Bearer ${JSON.parse(localStorage.getItem("hideme_auth") || "{}").token}`,
      },
    }
  ).then((res) => {
    if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
    return res.json() as Promise<{ deleted: boolean }>;
  });
};
export const uploadCollectionImage = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"}/v1/files/upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${JSON.parse(localStorage.getItem("hideme_auth") || "{}").token}`,
      },
      body: form,
    }
  );

  if (!response.ok) throw new Error("Upload failed");
  const data = await response.json();
  
  // file_name を使う
  return `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"}/v1/files/${encodeURIComponent(data.file_name)}`;
};