/**
 * AllFilesGrid — 全ファイルタイプをグリッド表示するコンポーネント
 * /file の Recent Activity で使用
 */
import { useState, useEffect } from "react";
import { C, F } from "../../theme/tokens";
import { Icon } from "../Icon";
import { getDownloadUrl } from "../../api/files";
import { formatBytes, formatRelativeTime } from "../../utils/format";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".mkv", ".avi", ".flv", ".wmv"];
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];

function fileIcon(name: string): { icon: string; color: string } {
  const lower = name.toLowerCase();
  if (VIDEO_EXTS.some((e) => lower.endsWith(e))) return { icon: "movie",            color: "#818cf8" };
  if (IMAGE_EXTS.some((e) => lower.endsWith(e))) return { icon: "image",            color: "#34d399" };
  if (lower.endsWith(".pdf"))                     return { icon: "picture_as_pdf",   color: "#f87171" };
  return                                                 { icon: "insert_drive_file", color: C.primary };
}

function isImage(name: string) {
  return IMAGE_EXTS.some((e) => name.toLowerCase().endsWith(e));
}

interface FileItem {
  id: string;
  file_name: string;
  file_size: number;
  thumbnail_name: string;
  uploader_name: string;
  uploader_avatar: string;
  uploaded_at: string;
  collection_name: string;
}

function FileCard({ file }: { file: FileItem }) {
  const [hovered, setHovered] = useState(false);
  const { icon, color } = fileIcon(file.file_name);
  const imgSrc = file.thumbnail_name
    ? `${BASE_URL}/v1/files/${encodeURIComponent(file.thumbnail_name)}`
    : isImage(file.file_name)
    ? `${BASE_URL}/v1/files/${encodeURIComponent(file.file_name)}`
    : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: 12,
        overflow: "hidden",
        background: hovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? C.primary + "44" : C.outlineVariant + "22"}`,
        transition: "all 0.2s",
        cursor: "pointer",
        minWidth: 0,
      }}
      onClick={() => window.open(getDownloadUrl(file.file_name), "_blank")}
    >
      {/* サムネイル / アイコン */}
      <div
        style={{
          width: "100%",
          aspectRatio: "16/9",
          background: C.surfaceContainer,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={file.file_name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: hovered ? "scale(1.05)" : "scale(1)",
              transition: "transform 0.4s ease",
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <Icon name={icon} size={36} style={{ color, opacity: 0.7 }} />
        )}
      </div>

      {/* 情報 */}
      <div style={{ padding: "8px 10px" }}>
        <p style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 700,
          color: C.onSurface,
          fontFamily: F.family,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {file.file_name}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 10, color: C.outline }}>
          {formatBytes(file.file_size)}
          {file.uploaded_at ? ` • ${formatRelativeTime(file.uploaded_at)}` : ""}
        </p>
        {file.collection_name && (
          <p style={{ margin: "1px 0 0", fontSize: 10, color: C.primary, fontWeight: 600,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {file.collection_name}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AllFilesGrid() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("hideme_auth") || "{}").token ?? "";
    fetch(`${BASE_URL}/v1/all-files`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => setFiles(Array.isArray(d?.items) ? d.items.slice(0, 7) : []))
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: 32, textAlign: "center", color: C.outlineVariant }}>読み込み中...</div>
  );
  if (files.length === 0) return (
    <div style={{ padding: 32, textAlign: "center", color: C.outlineVariant }}>ファイルはまだありません</div>
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${files.length}, 1fr)`,
        gap: 12,
        overflow: "hidden",
      }}
    >
      {files.map((f) => <FileCard key={f.id} file={f} />)}
    </div>
  );
}
