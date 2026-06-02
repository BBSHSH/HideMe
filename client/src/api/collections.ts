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

export const updateCollection = (id: string, input: CreateCollectionInput) =>
  apiPost<{ updated: boolean }>(`/v1/collections/${id}`, input);

export const deleteCollection = (id: string) =>
  apiPost<{ deleted: boolean }>(`/v1/collections/${id}`, {});

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