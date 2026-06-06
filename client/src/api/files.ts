import { apiGet } from "./client";
import type { CollectionFile } from "../data/files";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

function getToken(): string | null {
  const raw = localStorage.getItem("hideme_auth");
  return raw ? JSON.parse(raw).token : null;
}

// DB レコード（コレクション紐付きファイル）
export const listDbFiles = () =>
  apiGet<{ items: CollectionFile[] }>("/v1/all-files");

// 実ストレージ（NAS/ローカル）に存在するファイル一覧
export const listStorageFiles = () =>
  apiGet<{ items: import("../data/files").FileItem[] }>("/v1/files");

export const uploadFile = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return fetch(
    `${BASE_URL}/v1/files/upload`,
    { method: "POST", body: form }
  ).then((res) => {
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json() as Promise<{ name: string; size: number; uploaded: boolean }>;
  });
};

// ← 新規追加：コレクションにファイルをアップロード
export const uploadToCollection = async (
  collectionId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ id: string; file_name: string; file_size: number }> => {
  const form = new FormData();
  form.append("file", file);

  console.log("[UPLOAD] Starting upload:", file.name); // ← 追加

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          console.log("[UPLOAD] Progress:", Math.round(progress) + "%"); // ← 追加
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener("load", () => {
      console.log("[UPLOAD] Load event, status:", xhr.status); // ← 追加
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          console.log("[UPLOAD] Success:", response.id); // ← 追加
          resolve(response);
        } catch (e) {
          reject(new Error("Failed to parse response"));
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      console.log("[UPLOAD] Error event"); // ← 追加
      reject(new Error("Network error"));
    });

    xhr.addEventListener("abort", () => {
      console.log("[UPLOAD] Abort event"); // ← 追加
      reject(new Error("Upload aborted"));
    });

    xhr.open("POST", `${BASE_URL}/v1/collections/${collectionId}/files`);
    xhr.setRequestHeader("Authorization", `Bearer ${getToken()}`);
    xhr.timeout = 600000;
    
    console.log("[UPLOAD] Sending request..."); // ← 追加
    xhr.send(form);
  });
};

export const getDownloadUrl = (name: string) =>
  `${BASE_URL}/v1/files/${encodeURIComponent(name)}`;