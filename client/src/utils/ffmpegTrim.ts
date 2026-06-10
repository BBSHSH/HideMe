import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoading: Promise<FFmpeg> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (ffmpegLoading) return ffmpegLoading;

  ffmpegLoading = (async () => {
    const ffmpeg = new FFmpeg();
    const base = `${location.origin}/ffmpeg`;
    // UMD版を使う: importScripts() で classic worker に読み込める
    await ffmpeg.load({
      coreURL: `${base}/ffmpeg-core.js`,
      wasmURL: `${base}/ffmpeg-core.wasm`,
    });
    ffmpegInstance = ffmpeg;
    ffmpegLoading = null;
    return ffmpeg;
  })();

  return ffmpegLoading;
}

export async function trimWithFFmpegWasm(
  file: File,
  trimStart: number,
  trimEnd: number,
  onProgress?: (pct: number) => void
): Promise<File> {
  const ffmpeg = await getFFmpeg();

  const onProg = ({ progress }: { progress: number }) => {
    onProgress?.(Math.min(95, progress * 100));
  };
  ffmpeg.on("progress", onProg);

  const logs: string[] = [];
  const onLog = ({ message }: { message: string }) => logs.push(message);
  ffmpeg.on("log", onLog);

  try {
    const ext = file.name.slice(file.name.lastIndexOf(".")) || ".mp4";
    const inputName = `input${ext}`;
    const outputName = "trimmed.mp4";

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    await ffmpeg.exec([
      "-ss", String(trimStart),
      "-to", String(trimEnd),
      "-i", inputName,
      "-c", "copy",
      "-avoid_negative_ts", "make_zero",
      "-y",
      outputName,
    ]);

    const raw = await ffmpeg.readFile(outputName);
    const data = new Uint8Array(
      raw instanceof Uint8Array
        ? (raw.buffer.slice(0) as ArrayBuffer)
        : (raw as unknown as ArrayBuffer)
    );
    onProgress?.(100);

    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([data.buffer as ArrayBuffer], `${baseName}.mp4`, { type: "video/mp4" });

  } catch (err) {
    console.error("[ffmpegTrim] error:", err, "\n", logs.slice(-5).join("\n"));
    throw new Error(`トリム失敗: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    ffmpeg.off("progress", onProg);
    ffmpeg.off("log", onLog);
  }
}
