const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB（Cloudflare経由時）

function getToken() {
  const raw = localStorage.getItem("hideme_auth");
  return raw ? JSON.parse(raw).token : null;
}

interface ChunkUploadOptions {
  file: File;
  collectionId: string;
  uploadId: string;
  trimStart: number;
  trimEnd: number;
  volume: number;
  resolution: string;
  fps: number;
  onSendProgress: (percent: number) => void;
}

// direct URL を取得（Cloudflare経由しない場合）
async function getDirectURL(): Promise<string | null> {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
  try {
    const res = await fetch(`${BASE_URL}/v1/upload-config`);
    if (res.ok) {
      const cfg = await res.json();
      if (cfg.use_direct_url && cfg.upload_url) return cfg.upload_url;
    }
  } catch {}
  return null;
}

// direct URLが使える場合：multipartで一括送信（チャンク不要）
async function uploadDirect(
  directURL: string,
  opts: ChunkUploadOptions
): Promise<Response> {
  const { file, collectionId, uploadId, trimStart, trimEnd, volume, resolution, fps, onSendProgress } = opts;
  const token = getToken();

  const form = new FormData();
  form.append("file", file, file.name);
  form.append("trim_start", String(trimStart));
  form.append("trim_end", String(trimEnd));
  form.append("volume", String(volume));
  form.append("resolution", resolution);
  form.append("fps", String(fps));

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        onSendProgress(Math.round(ev.loaded / ev.total * 100));
      } else {
        // lengthComputable が false でも loaded でアニメーション
        onSendProgress(1); // 少なくとも開始を示す
      }
    };
    xhr.onload = () => resolve(new Response(xhr.responseText, { status: xhr.status }));
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.open("POST", `${directURL}/v1/collections/${collectionId}/files`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("X-Upload-ID", uploadId);
    xhr.timeout = 7200000;
    xhr.send(form);
  });
}

// Cloudflare経由の場合：5MB チャンクで送信
async function uploadChunked(
  opts: ChunkUploadOptions
): Promise<Response> {
  const { file, collectionId, uploadId, trimStart, trimEnd, volume, resolution, fps, onSendProgress } = opts;
  const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
  const token = getToken();
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  let completed = 0;

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const chunk = file.slice(start, Math.min(start + CHUNK_SIZE, file.size));
    const res = await fetch(`${BASE_URL}/v1/collections/${collectionId}/chunk`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Upload-ID": uploadId,
        "X-Chunk-Index": String(i),
        "X-Total-Chunks": String(totalChunks),
        "X-File-Name": file.name,
        "Content-Type": "application/octet-stream",
      },
      body: chunk,
    });
    if (!res.ok) throw new Error(`Chunk ${i} failed: ${res.status}`);
    completed++;
    onSendProgress(Math.round(completed / totalChunks * 100));
  }

  return fetch(`${BASE_URL}/v1/collections/${collectionId}/merge`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "X-Upload-ID": uploadId,
      "X-Total-Chunks": String(totalChunks),
      "X-File-Name": file.name,
      "X-Trim-Start": String(trimStart),
      "X-Trim-End": String(trimEnd),
      "X-Volume": String(volume),
      "X-Resolution": resolution,
      "X-FPS": String(fps),
    },
  });
}

// メイン：direct URLがあれば一括送信、なければチャンク送信
export async function uploadFileInChunks(opts: ChunkUploadOptions): Promise<Response> {
  const directURL = await getDirectURL();
  if (directURL) {
    return uploadDirect(directURL, opts);
  }
  return uploadChunked(opts);
}
