const WS_CHUNK_SIZE = 1 * 1024 * 1024; // WebSocketは1MB単位で送信

function getToken() {
  const raw = localStorage.getItem("hideme_auth");
  return raw ? JSON.parse(raw).token : null;
}

interface WSUploadOptions {
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

export function uploadFileViaWebSocket(opts: WSUploadOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const { file, collectionId, uploadId, trimStart, trimEnd, volume, resolution, fps, onSendProgress } = opts;

    const token = getToken();
    const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
    // https → wss、http → ws に変換
    const wsBase = BASE_URL
      ? BASE_URL.replace(/^https/, "wss").replace(/^http/, "ws")
      : `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`;
    const wsURL = wsBase + `/v1/ws-upload?token=${token}`;

    const ws = new WebSocket(wsURL);
    ws.binaryType = "arraybuffer";

    ws.onopen = async () => {
      // 1. メタ情報を送信
      ws.send(JSON.stringify({
        type: "meta",
        upload_id: uploadId,
        file_name: file.name,
        file_size: file.size,
        collection_id: collectionId,
        trim_start: trimStart,
        trim_end: trimEnd,
        volume: volume,
        resolution: resolution,
        fps: fps,
      }));

      // 2. ファイルデータを分割して送信
      let offset = 0;
      while (offset < file.size) {
        const chunk = file.slice(offset, offset + WS_CHUNK_SIZE);
        const buf = await chunk.arrayBuffer();
        ws.send(buf);
        offset += buf.byteLength;
        onSendProgress(Math.round(offset / file.size * 100));
      }
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string);
        if (msg.type === "accepted") {
          ws.close();
          resolve();
        } else if (msg.error) {
          ws.close();
          reject(new Error(msg.error));
        }
        // type: "processing" は無視（ポーリングで監視）
      } catch {}
    };

    ws.onerror = () => {
      reject(new Error("WebSocket error"));
    };

    ws.onclose = (e) => {
      if (!e.wasClean) {
        reject(new Error(`WebSocket closed unexpectedly: ${e.code}`));
      }
    };
  });
}
