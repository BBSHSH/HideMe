// @ts-ignore
import * as MP4BoxModule from "mp4box";
// CommonJS互換
const MP4Box = (MP4BoxModule as any).default ?? MP4BoxModule;

export async function trimMp4(
  file: File,
  trimStart: number,
  trimEnd: number,
  onProgress?: (pct: number) => void
): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(10);

  return new Promise((resolve, reject) => {
    const mp4boxIn = MP4Box.createFile();
    const mp4boxOut = MP4Box.createFile();

    const trackIds: number[] = [];
    const outputSamples: Record<number, any[]> = {};
    let totalTracks = 0;
    let readyTracks = 0;

    mp4boxIn.onError = (e: any) => reject(new Error(`MP4パースエラー: ${e}`));

    mp4boxIn.onReady = (info: any) => {
      totalTracks = info.tracks.length;

      for (const track of info.tracks) {
        const id = track.id;
        trackIds.push(id);
        outputSamples[id] = [];

        mp4boxIn.setExtractionOptions(id, null, { nbSamples: 1000 });

        // 出力トラックを追加
        const opts: any = {
          language: track.language ?? "und",
          duration: Math.round((trimEnd - trimStart) * track.timescale),
          width: track.video?.width ?? 0,
          height: track.video?.height ?? 0,
          timescale: track.timescale,
          media_duration: Math.round((trimEnd - trimStart) * track.timescale),
          hdlr: track.type === "video" ? "vide" : "soun",
          name: track.codec,
          type: track.codec,
          description_index: 1,
        };

        mp4boxOut.addTrack(opts);
      }

      mp4boxIn.start();
    };

    mp4boxIn.onSamples = (trackId: number, _ref: any, samples: any[]) => {
      const timescale = samples[0]?.timescale ?? 1;
      const startDts = trimStart * timescale;
      const endDts = trimEnd * timescale;

      for (const sample of samples) {
        if (sample.dts >= startDts && sample.dts < endDts) {
          // DTS を 0 基準に調整
          const adjusted = {
            ...sample,
            dts: sample.dts - Math.round(startDts),
            cts: sample.cts - Math.round(startDts),
          };
          outputSamples[trackId].push(adjusted);
        }
      }

      readyTracks++;
      onProgress?.(10 + Math.round((readyTracks / (totalTracks || 1)) * 60));

      if (readyTracks >= totalTracks) {
        // 全トラック揃ったら出力
        for (let i = 0; i < trackIds.length; i++) {
          const tid = trackIds[i];
          mp4boxOut.addSamples(i + 1, outputSamples[tid]);
        }

        try {
          const outBuffer = mp4boxOut.getBuffer();
          onProgress?.(100);
          const baseName = file.name.replace(/\.[^.]+$/, "");
          resolve(new File([outBuffer], `${baseName}.mp4`, { type: "video/mp4" }));
        } catch (e) {
          reject(new Error(`MP4出力エラー: ${e}`));
        }
      }
    };

    // ArrayBuffer をフィード
    const buf = arrayBuffer as any;
    buf.fileStart = 0;
    mp4boxIn.appendBuffer(buf);
    mp4boxIn.flush();
  });
}

export function isMp4(file: File): boolean {
  return (
    file.type === "video/mp4" ||
    file.name.toLowerCase().endsWith(".mp4") ||
    file.name.toLowerCase().endsWith(".m4v")
  );
}
