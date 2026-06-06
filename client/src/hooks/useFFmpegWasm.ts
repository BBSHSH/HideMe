import { useRef, useState, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export type FFmpegStatus = "idle" | "loading" | "ready" | "encoding" | "done" | "error";

export interface EncodeOptions {
  trimStart:  number;
  trimEnd:    number;
  volume:     number;
  resolution: "1080p" | "720p" | "480p" | "240p";
  fps:        24 | 30 | 60;
  onProgress?: (pct: number) => void;
}

const RES_MAP: Record<string, string> = {
  "1080p": "1920x1080",
  "720p":  "1280x720",
  "480p":  "854x480",
  "240p":  "426x240",
};

// jsDelivr から @ffmpeg/ffmpeg がサポートするコア＆WASM をロード
const CORE_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm";

export function useFFmpegWasm() {
  const ffRef   = useRef<FFmpeg | null>(null);
  const [status, setStatus] = useState<FFmpegStatus>("idle");

  const load = useCallback(async () => {
    if (ffRef.current?.isLoaded()) return;
    setStatus("loading");
    try {
      const ff = new FFmpeg();

      ff.on("log", ({ message }) => {
        console.debug("[ffmpeg]", message);
      });

      console.log("[FFmpeg] Loading from jsDelivr...");

      // ESM ビルドを明示的に指定（より安定）
      await ff.load({
        coreURL: CORE_URL,
        wasmURL: WASM_URL,
      });

      ffRef.current = ff;
      setStatus("ready");
      console.log("[FFmpeg] Loaded successfully");
    } catch (e) {
      console.error("[FFmpeg] Load error:", e);
      setStatus("error");
      throw e;
    }
  }, []);

  const encode = useCallback(async (file: File, opts: EncodeOptions): Promise<File> => {
    if (!ffRef.current?.isLoaded()) {
      await load();
    }
    const ff = ffRef.current!;

    setStatus("encoding");
    const INPUT  = "input" + (file.name.match(/\.[^.]+$/)?.[0] ?? ".mp4");
    const OUTPUT = "output.mp4";

    try {
      ff.on("progress", ({ progress }) => {
        const pct = Math.min(100, Math.round(progress * 100));
        opts.onProgress?.(pct);
      });

      await ff.writeFile(INPUT, await fetchFile(file));

      const args: string[] = [];

      // トリム
      const duration = opts.trimEnd - opts.trimStart;
      if (opts.trimStart > 0) args.push("-ss", opts.trimStart.toFixed(3));
      args.push("-i", INPUT);
      args.push("-t", duration.toFixed(3));

      // 音量
      const vol = opts.volume / 100;
      if (Math.abs(vol - 1) > 0.01) {
        args.push("-af", `volume=${vol.toFixed(2)}`);
      }

      // 解像度・FPS（ffmpeg.wasm は遅いため低品質・高速設定）
      args.push(
        "-vf",    `scale=${RES_MAP[opts.resolution]}:flags=bilinear`,  // lanczos → bilinear (高速化)
        "-r",     String(opts.fps),
        "-c:v",   "libx264",
        "-preset", "ultrafast",  // fast → ultrafast
        "-crf",   "28",          // 23 → 28 (品質低下だが大幅に高速化)
        "-c:a",   "aac",
        "-b:a",   "64k",         // 128k → 64k
        "-movflags", "+faststart",
        "-y",
        OUTPUT,
      );

      console.log("[FFmpeg] Starting encode with args:", args);
      await ff.exec(args);

      const data = await ff.readFile(OUTPUT);
      const blob = new Blob([data], { type: "video/mp4" });

      // クリーンアップ
      try { await ff.deleteFile(INPUT);  } catch {}
      try { await ff.deleteFile(OUTPUT); } catch {}
      ff.off("progress", () => {});

      setStatus("done");
      console.log("[FFmpeg] Encode completed");
      return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".mp4", { type: "video/mp4" });
    } catch (e) {
      console.error("[FFmpeg] Encode error:", e);
      setStatus("error");
      throw e;
    }
  }, [load]);

  const reset = useCallback(() => setStatus("ready"), []);

  return { status, load, encode, reset };
}
