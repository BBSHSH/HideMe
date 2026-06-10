// @ts-ignore
import * as MP4BoxModule from "mp4box";
const MP4Box = (MP4BoxModule as any).default ?? MP4BoxModule;

export function isMp4(file: File): boolean {
  return (
    file.type === "video/mp4" ||
    file.name.toLowerCase().endsWith(".mp4") ||
    file.name.toLowerCase().endsWith(".m4v")
  );
}

export async function trimMp4(
  file: File,
  trimStart: number,
  trimEnd: number,
  onProgress?: (pct: number) => void
): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(5);

  return new Promise((resolve, reject) => {
    const mp4boxIn = MP4Box.createFile();
    const mp4boxOut = MP4Box.createFile();

    // trackId → 出力 trackId のマップ
    const trackMap: Record<number, number> = {};
    let tracksReady = 0;
    let totalTracks = 0;

    mp4boxIn.onError = (e: any) => reject(new Error(`MP4パースエラー: ${e}`));

    mp4boxIn.onReady = (info: any) => {
      totalTracks = info.tracks.length;

      for (const track of info.tracks) {
        const inId = track.id;

        // 出力トラック作成
        const outId: number = mp4boxOut.addTrack({
          timescale: track.timescale,
          width: track.video?.width ?? 0,
          height: track.video?.height ?? 0,
          hdlr: track.type === "video" ? "vide" : "soun",
          name: track.codec,
          type: track.codec,
          language: track.language ?? "und",
          duration: Math.round((trimEnd - trimStart) * track.timescale),
        });
        trackMap[inId] = outId;

        mp4boxIn.setExtractionOptions(inId, null, { nbSamples: 500 });
      }

      mp4boxIn.start();
    };

    mp4boxIn.onSamples = (inTrackId: number, _ref: any, samples: any[]) => {
      const outTrackId = trackMap[inTrackId];
      if (outTrackId == null) return;

      const timescale = samples[0]?.timescale ?? 1;
      const startDts = Math.round(trimStart * timescale);
      const endDts = Math.round(trimEnd * timescale);

      // キーフレームから開始できるよう最初のキーフレームを探す
      let firstKeyIdx = 0;
      for (let i = 0; i < samples.length; i++) {
        if (samples[i].dts >= startDts) {
          // startDts 以降で最初のキーフレームを探す（少し前も含む）
          for (let j = Math.max(0, i - 1); j >= 0; j--) {
            if (samples[j].is_sync) { firstKeyIdx = j; break; }
          }
          break;
        }
      }

      let wrote = 0;
      for (let i = firstKeyIdx; i < samples.length; i++) {
        const s = samples[i];
        if (s.dts >= endDts) break;
        if (s.dts < startDts && !s.is_sync) continue;

        const offsetDts = s.dts - startDts;
        const offsetCts = s.cts - startDts;

        mp4boxOut.addSample(outTrackId, s.data, {
          duration: s.duration,
          cts: Math.max(0, offsetCts),
          dts: Math.max(0, offsetDts),
          is_sync: s.is_sync,
          is_leading: s.is_leading ?? 0,
          depends_on: s.depends_on ?? 0,
          is_depended_on: s.is_depended_on ?? 0,
          has_redundancy: s.has_redundancy ?? 0,
          degradation_priority: s.degradation_priority ?? 0,
        });
        wrote++;
      }

      tracksReady++;
      onProgress?.(5 + Math.round((tracksReady / totalTracks) * 85));

      if (tracksReady >= totalTracks) {
        try {
          const buf: ArrayBuffer = mp4boxOut.getBuffer();
          onProgress?.(100);
          const baseName = file.name.replace(/\.[^.]+$/, "");
          resolve(new File([buf], `${baseName}.mp4`, { type: "video/mp4" }));
        } catch (e) {
          reject(new Error(`MP4書き出しエラー: ${e}`));
        }
      }
    };

    const buf = arrayBuffer as any;
    buf.fileStart = 0;
    mp4boxIn.appendBuffer(buf);
    mp4boxIn.flush();
  });
}
