import { Muxer, ArrayBufferTarget } from "mp4-muxer";

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
  return (
    typeof VideoEncoder !== "undefined" &&
    typeof VideoFrame !== "undefined" &&
    typeof OffscreenCanvas !== "undefined"
  );
}

export async function encodeWithWebCodecs(
  file: File,
  opts: WebCodecsEncodeOptions
): Promise<Blob> {
  const { trimStart, trimEnd, resolution, fps, volume, onProgress } = opts;

  // ── ビデオ要素のロード ──────────────────────────────────
  const videoEl = document.createElement("video");
  const blobUrl = URL.createObjectURL(file);
  videoEl.src = blobUrl;
  videoEl.muted = true;
  videoEl.preload = "auto";

  await new Promise<void>((resolve, reject) => {
    videoEl.onloadedmetadata = () => resolve();
    videoEl.onerror = () => reject(new Error("動画ファイルを読み込めませんでした"));
    setTimeout(() => reject(new Error("動画ロードタイムアウト")), 15_000);
  });

  const srcW = videoEl.videoWidth || 1280;
  const srcH = videoEl.videoHeight || 720;
  const [tw, th] = targetDims(srcW, srcH, resolution);

  // ── Muxer ──────────────────────────────────────────────
  const muxTarget = new ArrayBufferTarget();

  // 音声エンコーダーが利用可能か確認
  const hasAudioEncoder = typeof AudioEncoder !== "undefined" && typeof AudioData !== "undefined";
  const useAudio = hasAudioEncoder;

  const muxer = new Muxer({
    target: muxTarget,
    video: { codec: "avc", width: tw, height: th },
    ...(useAudio ? { audio: { codec: "aac", sampleRate: 44100, numberOfChannels: 2 } } : {}),
    fastStart: "in-memory",
  });

  // ── VideoEncoder ───────────────────────────────────────
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { throw e; },
  });

  const videoConfig: VideoEncoderConfig = {
    codec: "avc1.42001f",
    width: tw,
    height: th,
    bitrate: BITRATES[resolution] ?? 4_000_000,
    framerate: fps,
    bitrateMode: "variable",
  };

  const support = await VideoEncoder.isConfigSupported(videoConfig);
  if (!support.supported) {
    throw new Error("このブラウザではH.264エンコードがサポートされていません");
  }
  videoEncoder.configure(videoConfig);

  // ── 音声処理 ────────────────────────────────────────────
  let audioEncoder: AudioEncoder | null = null;
  let audioBuffer: AudioBuffer | null = null;

  if (useAudio) {
    try {
      audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: () => { audioEncoder = null; },
      });

      const audioSupport = await AudioEncoder.isConfigSupported({
        codec: "mp4a.40.2",
        sampleRate: 44100,
        numberOfChannels: 2,
        bitrate: 128_000,
      });

      if (audioSupport.supported) {
        audioEncoder.configure({
          codec: "mp4a.40.2",
          sampleRate: 44100,
          numberOfChannels: 2,
          bitrate: 128_000,
        });

        const arrBuf = await file.arrayBuffer();
        const tmpCtx = new AudioContext();
        audioBuffer = await tmpCtx.decodeAudioData(arrBuf);
        await tmpCtx.close();
      } else {
        audioEncoder.close();
        audioEncoder = null;
      }
    } catch {
      audioEncoder?.close();
      audioEncoder = null;
      audioBuffer = null;
    }
  }

  // ── 音声エンコード（先にすべてエンコード）──────────────
  if (audioEncoder && audioBuffer) {
    const sampleRate = audioBuffer.sampleRate;
    const nCh = Math.min(audioBuffer.numberOfChannels, 2);
    const startSample = Math.floor(trimStart * sampleRate);
    const endSample = Math.floor(trimEnd * sampleRate);
    const totalSamples = endSample - startSample;
    const gainFactor = volume / 100;
    const CHUNK = 1024;

    for (let s = 0; s < totalSamples; s += CHUNK) {
      const len = Math.min(CHUNK, totalSamples - s);
      const timestamp = Math.round((s / sampleRate) * 1_000_000);

      // planar float32 format (f32)
      const data = new Float32Array(len * nCh);
      for (let c = 0; c < nCh; c++) {
        const chanData = audioBuffer.getChannelData(c);
        for (let i = 0; i < len; i++) {
          const src = startSample + s + i;
          data[c * len + i] = src < chanData.length ? chanData[src] * gainFactor : 0;
        }
      }

      const audioData = new AudioData({
        format: "f32",
        sampleRate,
        numberOfChannels: nCh,
        numberOfFrames: len,
        timestamp,
        data,
      });
      audioEncoder.encode(audioData);
      audioData.close();
    }
  }

  // ── ビデオフレームエンコード ────────────────────────────
  const canvas = new OffscreenCanvas(tw, th);
  const ctx2d = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  const totalFrames = Math.ceil((trimEnd - trimStart) * fps);
  const frameInterval = 1 / fps;

  for (let i = 0; i < totalFrames; i++) {
    const t = trimStart + i * frameInterval;
    videoEl.currentTime = t;

    await new Promise<void>((resolve) => {
      const onSeeked = () => {
        videoEl.removeEventListener("seeked", onSeeked);
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(resolve, 500);
      videoEl.addEventListener("seeked", onSeeked);
    });

    ctx2d.drawImage(videoEl, 0, 0, tw, th);
    const timestamp = Math.round(i * (1_000_000 / fps));
    const frame = new VideoFrame(canvas, { timestamp });
    videoEncoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
    frame.close();

    onProgress?.(Math.min(97, (i / totalFrames) * 100));

    // UIをブロックしないよう定期的に yield
    if (i % 10 === 0) {
      await new Promise(r => setTimeout(r, 0));
    }
  }

  // ── フラッシュ & 完了 ──────────────────────────────────
  await videoEncoder.flush();
  if (audioEncoder) await audioEncoder.flush();
  muxer.finalize();

  URL.revokeObjectURL(blobUrl);
  onProgress?.(100);

  return new Blob([muxTarget.buffer], { type: "video/mp4" });
}
