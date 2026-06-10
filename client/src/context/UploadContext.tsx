import { createContext, useContext, useRef, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { uploadFileInChunks } from "../api/chunkUpload";
import { encodeWithWebCodecs } from "../utils/webCodecsEncoder";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export type UploadPhase = "webcodecs" | "sending" | "encoding" | "nas" | "done" | "error";

export interface UploadJob {
  id: string;
  fileName: string;
  phase: UploadPhase;
  sendPercent: number;
  encodingPercent: number;
  nasPercent: number;
  error?: string;
  collectionId: string;
  startedAt: number;
}

export interface StartUploadOpts {
  file: File;
  collectionId: string;
  trimStart: number;
  trimEnd: number;
  volume: number;
  resolution: string;
  fps: number;
  outputName?: string;
  encoder?: "ffmpeg" | "webcodecs";
}

interface UploadContextValue {
  jobs: UploadJob[];
  startUpload: (opts: StartUploadOpts) => string; // returns uploadId
  dismissJob: (id: string) => void;
  dismissDone: () => void;
}

const UploadContext = createContext<UploadContextValue | null>(null);

export function useUpload() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error("useUpload must be inside UploadProvider");
  return ctx;
}

export function UploadProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const pollingTimers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const updateJob = useCallback((id: string, patch: Partial<UploadJob>) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j));
  }, []);

  const startUpload = useCallback((opts: StartUploadOpts): string => {
    const { file, collectionId, trimStart, trimEnd, volume, resolution, fps, outputName, encoder = "ffmpeg" } = opts;
    const uploadId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
    const baseName = (outputName?.trim() || file.name.replace(/\.[^.]+$/, "")) + ".mp4";
    const renamedFile = new File([file], baseName, { type: file.type });

    const job: UploadJob = {
      id: uploadId,
      fileName: baseName,
      phase: encoder === "webcodecs" ? "webcodecs" : "sending",
      sendPercent: 0,
      encodingPercent: 0,
      nasPercent: 0,
      collectionId,
      startedAt: Date.now(),
    };

    setJobs(prev => [job, ...prev]);

    // バックグラウンドでアップロード開始
    (async () => {
      try {
        let uploadFile = renamedFile;

        // ブラウザ側エンコード（MediaRecorder）
        if (encoder === "webcodecs") {
          const { blob, ext } = await encodeWithWebCodecs(file, {
            trimStart,
            trimEnd,
            resolution,
            fps,
            volume,
            onProgress: (pct) => {
              updateJob(uploadId, { phase: "webcodecs", encodingPercent: pct });
            },
          });
          const encodedName = baseName.replace(/\.[^.]+$/, "") + ext;
          uploadFile = new File([blob], encodedName, { type: blob.type });
          updateJob(uploadId, { phase: "sending", encodingPercent: 100 });
        }

        // チャンク送信
        const mergeRes = await uploadFileInChunks({
          file: uploadFile,
          collectionId,
          uploadId,
          // WebCodecs 使用時はトリム・変換済みなのでサーバー側エンコードをスキップ
          trimStart: encoder === "webcodecs" ? 0 : trimStart,
          trimEnd: encoder === "webcodecs" ? (trimEnd - trimStart) : trimEnd,
          volume: encoder === "webcodecs" ? 100 : volume,
          resolution: encoder === "webcodecs" ? "original" : resolution,
          fps: encoder === "webcodecs" ? 0 : fps,
          skipEncode: encoder === "webcodecs",
          onSendProgress: (percent) => {
            updateJob(uploadId, { phase: "sending", sendPercent: percent });
          },
        });

        if (!mergeRes.ok && mergeRes.status !== 202) {
          const b = await mergeRes.json().catch(() => ({}));
          throw new Error((b as any).detail ?? (b as any).error ?? `HTTP ${mergeRes.status}`);
        }

        updateJob(uploadId, { sendPercent: 100 });

        // エンコード・NAS転送をポーリングで監視
        pollingTimers.current[uploadId] = setInterval(async () => {
          try {
            const res = await fetch(`${BASE_URL}/v1/upload-status/${uploadId}`);
            if (!res.ok) return;
            const d = await res.json() as { phase: string; percent?: number; message?: string };
            if (d.phase === "ffmpeg") {
              updateJob(uploadId, { phase: "encoding", encodingPercent: d.percent ?? 0 });
            } else if (d.phase === "nas") {
              updateJob(uploadId, { phase: "nas", encodingPercent: 100, nasPercent: d.percent ?? 0 });
            } else if (d.phase === "done") {
              updateJob(uploadId, { phase: "done", encodingPercent: 100, nasPercent: 100 });
              clearInterval(pollingTimers.current[uploadId]);
              delete pollingTimers.current[uploadId];
              // ブラウザ通知
              if (Notification.permission === "granted") {
                new Notification("アップロード完了", { body: baseName });
              }
            } else if (d.phase === "error") {
              updateJob(uploadId, { phase: "error", error: d.message ?? "エラー" });
              clearInterval(pollingTimers.current[uploadId]);
              delete pollingTimers.current[uploadId];
            }
          } catch {}
        }, 2000);

      } catch (err) {
        if (pollingTimers.current[uploadId]) {
          clearInterval(pollingTimers.current[uploadId]);
          delete pollingTimers.current[uploadId];
        }
        updateJob(uploadId, {
          phase: "error",
          error: err instanceof Error ? err.message : "エラーが発生しました",
        });
      }
    })();

    return uploadId;
  }, [updateJob]);

  const dismissJob = useCallback((id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
  }, []);

  const dismissDone = useCallback(() => {
    setJobs(prev => prev.filter(j => j.phase !== "done"));
  }, []);

  return (
    <UploadContext.Provider value={{ jobs, startUpload, dismissJob, dismissDone }}>
      {children}
    </UploadContext.Provider>
  );
}
