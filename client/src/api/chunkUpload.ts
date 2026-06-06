const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

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

// チャンクアップロード：ファイルを5MB単位に分割して送信し、サーバーで結合する
export async function uploadFileInChunks(opts: ChunkUploadOptions): Promise<Response> {
  const { file, collectionId, uploadId, trimStart, trimEnd, volume, resolution, fps, onSendProgress } = opts;

  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
  const token = getToken();

  // 各チャンクを順番に送信
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

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

    if (!res.ok) {
      throw new Error(`Chunk ${i} upload failed: ${res.status}`);
    }

    // 送信進捗を通知
    onSendProgress(Math.round(((i + 1) / totalChunks) * 100));
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
