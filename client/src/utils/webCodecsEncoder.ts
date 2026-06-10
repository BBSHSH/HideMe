export interface WebCodecsEncodeOptions {
  trimStart: number;
  trimEnd: number;
  resolution: string;
  fps: number;
  volume: number; // 0–200
  onProgress?: (pct: number) => void;
}

const RESOLUTION_HEIGHTS: Record<string, number> = {
  "1080p": 1080,
  "720p": 720,
  "480p": 480,
  "240p": 240,
};

const BITRATES: Record<string, number> = {
  "1080p": 8_000_000,
  "720p": 4_000_000,
  "480p": 2_000_000,
  "240p": 800_000,
};

function evenDown(n: number) {
  return n % 2 === 0 ? n : n - 1;
}

function targetDims(vw: number, vh: number, res: string): [number, number] {
  const maxH = RESOLUTION_HEIGHTS[res] ?? 720;
  if (vh <= maxH) return [evenDown(vw), evenDown(vh)];
  const scale = maxH / vh;
  return [evenDown(Math.round(vw * scale)), evenDown(maxH)];
}

export function isWebCodecsSupported(): boolean {
  return typeof MediaRecorder !== "undefined";
}

// 対応MIMEタイプを優先順に選択（H.264 > VP9 > VP8）
function chooseMimeType(): string {
  const candidates = [
    "video/mp4;codecs=avc1",
    "video/mp4;codecs=h264",
    "video/webm;codecs=h264",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "video/webm";
}

function mimeToExt(mime: string): string {
  if (mime.startsWith("video/mp4")) return ".mp4";
  return ".webm";
}

export async function encodeWithWebCodecs(
  file: File,
  opts: WebCodecsEncodeOptions
): Promise<{ blob: Blob; ext: string }> {
  const { trimStart, trimEnd, resolution, fps, volume, onProgress } = opts;

  // ── ビデオ要素 ────────────────────────────────────────
  const videoEl = document.createElement("video");
  const blobUrl = URL.createObjectURL(file);
  videoEl.src = blobUrl;
  videoEl.preload = "auto";
  // muted=false でないと AudioContext がオーディオを取得できないブラウザがある
  videoEl.muted = false;
  videoEl.volume = 0; // スピーカーからは無音

  await new Promise<void>((resolve, reject) => {
    videoEl.onloadedmetadata = () => resolve();
    videoEl.onerror = () => reject(new Error("動画ファイルを読み込めませんでした"));
    setTimeout(() => reject(new Error("動画ロードタイムアウト")), 15_000);
  });

  const srcW = videoEl.videoWidth || 1280;
  const srcH = videoEl.videoHeight || 720;
  const [tw, th] = targetDims(srcW, srcH, resolution);

  // ── Canvas（解像度スケーリング用）──────────────────────
  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d")!;

  // ── Web Audio API（音量調整）────────────────────────────
  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaElementSource(videoEl);
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = volume / 100;
  const audioDest = audioCtx.createMediaStreamDestination();
  source.connect(gainNode);
  gainNode.connect(audioDest);
  // スピーカーには接続しない（無音再生）

  // ── キャプチャストリーム合成 ───────────────────────────
  const canvasStream = canvas.captureStream(fps);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioDest.stream.getAudioTracks(),
  ]);

  const mimeType = chooseMimeType();
  const ext = mimeToExt(mimeType);
  const bitrate = BITRATES[resolution] ?? 4_000_000;

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: bitrate,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  // ── トリム開始位置にシーク ────────────────────────────
  videoEl.currentTime = trimStart;
  await new Promise<void>((resolve) => {
    videoEl.onseeked = () => resolve();
    setTimeout(resolve, 2000);
  });

  // ── Canvas描画ループ ───────────────────────────────────
  let animId = 0;
  const drawLoop = () => {
    ctx.drawImage(videoEl, 0, 0, tw, th);
    animId = requestAnimationFrame(drawLoop);
  };

  // ── 録画開始 ──────────────────────────────────────────
  recorder.start(200);
  drawLoop();
  videoEl.play();

  const duration = trimEnd - trimStart;

  // ── トリム終了まで待機 ────────────────────────────────
  await new Promise<void>((resolve) => {
    const check = () => {
      const elapsed = videoEl.currentTime - trimStart;
      onProgress?.(Math.min(96, (elapsed / duration) * 100));

      if (videoEl.currentTime >= trimEnd - 0.05 || videoEl.ended) {
        resolve();
      } else {
        setTimeout(check, 100);
      }
    };
    check();
    videoEl.onended = () => resolve();
  });

  // ── 後処理 ────────────────────────────────────────────
  cancelAnimationFrame(animId);
  videoEl.pause();

  recorder.stop();
  await new Promise<void>((r) => { recorder.onstop = () => r(); });

  await audioCtx.close();
  URL.revokeObjectURL(blobUrl);

  onProgress?.(100);

  return { blob: new Blob(chunks, { type: mimeType }), ext };
}
