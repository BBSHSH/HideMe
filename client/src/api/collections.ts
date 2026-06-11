import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { Collection } from "../data/files";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

function getToken(): string {
  return JSON.parse(localStorage.getItem("hideme_auth") || "{}").token ?? "";
}

export type CreateCollectionInput = {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  image_url?: string;
  genre?: string;
};

export async function getCollectionFiles(collectionId: string) {
  const response = await fetch(`${BASE_URL}/v1/collections/${collectionId}/files`);
  if (!response.ok) throw new Error("Failed to fetch collection files");
  return response.json();
}

export async function getCollectionById(collectionId: string) {
  const response = await fetch(`${BASE_URL}/v1/collections/${collectionId}`);
  if (!response.ok) throw new Error("Failed to fetch collection");
  return response.json();
}

export const listCollections = () =>
  apiGet<{ items: Collection[] }>("/v1/collections");

export const createCollection = (input: CreateCollectionInput) =>
  apiPost<Collection>("/v1/collections", input);

export const updateCollection = (id: string, input: CreateCollectionInput) =>
  apiPut<{ updated: boolean }>(`/v1/collections/${id}`, input);

export const deleteCollection = (id: string) =>
  apiDelete<{ deleted: boolean }>(`/v1/collections/${id}`);

export const recordView = (collectionId: string, fileId: string): Promise<void> =>
  fetch(`${BASE_URL}/v1/collections/${collectionId}/files/${fileId}/view`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  }).then(() => {});

export const deleteCollectionFile = (collectionId: string, fileId: string) =>
  apiDelete<{ deleted: boolean }>(`/v1/collections/${collectionId}/files/${fileId}`);

export const updateCollectionFile = async (
  collectionId: string,
  fileId: string,
  params: { displayName: string; collectionId: string; thumbnail?: File; uploadedBy?: string }
): Promise<void> => {
  const form = new FormData();
  form.append("display_name", params.displayName);
  form.append("collection_id", params.collectionId);
  if (params.thumbnail) form.append("thumbnail", params.thumbnail);
  if (params.uploadedBy) form.append("uploaded_by", params.uploadedBy);

  const res = await fetch(
    `${BASE_URL}/v1/collections/${collectionId}/files/${fileId}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: form,
    }
  );
  if (!res.ok) throw new Error(`Update failed: ${res.status}`);
};

export const uploadCollectionImage = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", "icons");

  const response = await fetch(`${BASE_URL}/v1/files/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  });

  if (!response.ok) throw new Error("Upload failed");
  const data = await response.json();
  return data.file_name;
};
