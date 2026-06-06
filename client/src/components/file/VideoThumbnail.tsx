import { useState, useEffect } from "react";
import { C } from "../../theme/tokens";
import { Icon } from "../Icon";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

interface VideoThumbnailProps {
  fileName: string;
  fileSize: number;
  fileId?: string;
  /** サーバーに保存済みのサムネイルファイル名 */
  thumbnailName?: string;
}

/** サムネイルを localStorage にキャッシュするキーを生成 */
const cacheKey = (fileId: string) => `thumb_cache_${fileId}`;

export default function VideoThumbnail({
  fileName,
  fileSize: _fileSize,
  fileId,
  thumbnailName,
}: VideoThumbnailProps) {
  const [imgSrc, setImgSrc] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      // 1. サーバー保存済みサムネイルがある場合はそれを使う（最速）
      if (thumbnailName) {
        setImgSrc(`${BASE_URL}/v1/files/${encodeURIComponent(thumbnailName)}`);
        setLoading(false);
        return;
      }

      // 2. localStorage キャッシュを確認
      if (fileId) {
        const cached = localStorage.getItem(cacheKey(fileId));
        if (cached) {
          setImgSrc(cached);
          setLoading(false);
          return;
        }
      }

      // 3. 動画から Canvas で抽出してキャッシュ
      try {
        const videoUrl = `${BASE_URL}/v1/files/${encodeURIComponent(fileName)}`;
        const video = document.createElement("video");
        video.src = videoUrl;
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.preload = "metadata";

        const timeout = setTimeout(() => {
          if (!cancelled) setLoading(false);
        }, 20000);

        video.onloadedmetadata = () => {
          video.currentTime = Math.min(1, video.duration * 0.05);
        };

        video.onseeked = () => {
          clearTimeout(timeout);
          if (cancelled) return;
          try {
            const canvas = document.createElement("canvas");
            canvas.width = 480;
            canvas.height = 270;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(video, 0, 0, 480, 270);
              const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
              if (fileId) {
                try { localStorage.setItem(cacheKey(fileId), dataUrl); } catch { /* quota */ }
              }
              setImgSrc(dataUrl);
            }
          } finally {
            setLoading(false);
          }
        };

        video.onerror = () => {
          clearTimeout(timeout);
          if (!cancelled) setLoading(false);
        };
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [fileName, fileId, thumbnailName]);

  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: C.surfaceVariant,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="movie" size={36} style={{ color: `${C.onSurface}44` }} />
      </div>
    );
  }

  if (!imgSrc) {
    // フォールバック: ファイル名のグラデーションプレースホルダー
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, rgba(88,101,242,0.3) 0%, rgba(18,19,27,0.8) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 6,
          padding: 8,
        }}
      >
        <Icon name="movie" size={32} style={{ color: "rgba(190,194,255,0.6)" }} />
        <span
          style={{
            fontSize: 10,
            color: "rgba(190,194,255,0.5)",
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "90%",
          }}
        >
          {fileName}
        </span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={fileName}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}
