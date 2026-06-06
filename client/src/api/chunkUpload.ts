const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk
const PARALLEL = 1; // 順番に送信（並列だとCloudflareに制限される）

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

async function uploadChunk(
  BASE_URL: string,
  token: string,
  collectionId: string,
  uploadId: string,
  fileName: string,
  totalChunks: number,
  index: number,
  chunk: Blob
): Promise<void> {
  const res = await fetch(`${BASE_URL}/v1/collections/${collectionId}/chunk`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "X-Upload-ID": uploadId,
      "X-Chunk-Index": String(index),
      "X-Total-Chunks": String(totalChunks),
      "X-File-Name": fileName,
      "Content-Type": "application/octet-stream",
    },
    body: chunk,
  });
  if (!res.ok) throw new Error(`Chunk ${index} upload failed: ${res.status}`);
}

// チャンクアップロード：並列送信でCloudflareの100MB制限を回避
export async function uploadFileInChunks(opts: ChunkUploadOptions): Promise<Response> {
  const { file, collectionId, uploadId, trimStart, trimEnd, volume, resolution, fps, onSendProgress } = opts;

  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
  const token = getToken();

  let completed = 0;

  // PARALLEL 個ずつ並列送信
  for (let i = 0; i < totalChunks; i += PARALLEL) {
    const batch = [];
    for (let j = i; j < Math.min(i + PARALLEL, totalChunks); j++) {
      const start = j * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      batch.push(uploadChunk(BASE_URL, token, collectionId, uploadId, file.name, totalChunks, j, file.slice(start, end)));
    }
    await Promise.all(batch);
    completed += batch.length;
    onSendProgress(Math.round((completed / totalChunks) * 100));
  }

  // 全チャンク送信完了後、サーバーに結合・処理を依頼
  const mergeRes = await fetch(`${BASE_URL}/v1/collections/${collectionId}/merge`, {
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

  return mergeRes;
}
