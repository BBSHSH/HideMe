import { apiGet } from "./client";
import type { CollectionFile } from "../data/files";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

function getToken(): string | null {
  const raw = localStorage.getItem("hideme_auth");
  return raw ? JSON.parse(raw).token : null;
}

export const listDbFiles = () =>
  apiGet<{ items: CollectionFile[] }>("/v1/all-files");

export const listStorageFiles = () =>
  apiGet<{ items: import("../data/files").FileItem[] }>("/v1/files");

export const uploadFile = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return fetch(`${BASE_URL}/v1/files/upload`, { method: "POST", body: form }).then((res) => {
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json() as Promise<{ name: string; size: number; uploaded: boolean }>;
  });
};

export const uploadToCollection = async (
  collectionId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ id: string; file_name: string; file_size: number }> => {
  const form = new FormData();
  form.append("file", file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress((e.loaded / e.total) * 100);
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error("Failed to parse response"));
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.open("POST", `${BASE_URL}/v1/collections/${collectionId}/files`);
    xhr.setRequestHeader("Authorization", `Bearer ${getToken()}`);
    xhr.timeout = 600000;
    xhr.send(form);
  });
};

export const getDownloadUrl = (name: string) =>
  `${BASE_URL}/v1/files/${encodeURIComponent(name)}`;
