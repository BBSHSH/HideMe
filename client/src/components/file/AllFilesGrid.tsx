/**
 * AllFilesGrid — 全ファイルタイプをグリッド表示するコンポーネント
 * /file の Recent Activity で使用
 */
import { useState, useEffect, useRef } from "react";
import { C, F } from "../../theme/tokens";
import { Icon } from "../Icon";
import { getDownloadUrl } from "../../api/files";
import { formatBytes, formatRelativeTime } from "../../utils/format";
import { useAuth } from "../../context/AuthContext";
import { deleteCollectionFile } from "../../api/collections";
import ImageLightbox from "./ImageLightbox";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".mkv", ".avi", ".flv", ".wmv"];
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];

const CARD_WIDTH = 200;
const GAP = 12;

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
  collection_id: string;
  file_name: string;
  display_name?: string;
  file_size: number;
  thumbnail_name: string;
  uploaded_by: string;
  uploader_name: string;
  uploader_avatar: string;
  uploaded_at: string;
  collection_name: string;
}

function FileCard({ file, onDelete, onImageClick }: { file: FileItem; onDelete?: () => void; onImageClick?: () => void }) {
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
        flexShrink: 0,
        width: CARD_WIDTH,
        display: "flex",
        flexDirection: "column",
        borderRadius: 12,
        overflow: "hidden",
        background: hovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? C.primary + "44" : C.outlineVariant + "22"}`,
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      onClick={() => {
        if (isImage(file.file_name) && onImageClick) {
          onImageClick();
        } else {
          window.open(getDownloadUrl(file.file_name), "_blank");
        }
      }}
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
          position: "relative",
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
        {/* 削除ボタン（ホバー時） */}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{
              position: "absolute", top: 6, right: 6,
              width: 28, height: 28, borderRadius: "50%",
              background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
              border: "1px solid rgba(248,113,113,0.4)",
              color: "#f87171", display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", padding: 0,
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.2s",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
          </button>
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
          {file.display_name || file.file_name}
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
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const imageFiles = files.filter((f) => isImage(f.file_name));
  const lightboxFile = lightboxIndex !== null ? imageFiles[lightboxIndex] : null;
  const lightboxSrc = lightboxFile
    ? `${BASE_URL}/v1/files/${encodeURIComponent(lightboxFile.file_name)}`
    : "";

  const handleDelete = async (file: FileItem) => {
    if (!confirm("このファイルを削除しますか？")) return;
    try {
      await deleteCollectionFile(file.collection_id, file.id);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (e: any) {
      const status = e?.message?.match(/\d+/)?.[0];
      if (status === "403") alert("削除権限がありません");
      else alert("削除に失敗しました");
    }
  };

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows);
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateArrows); ro.disconnect(); };
  }, [files]);

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("hideme_auth") || "{}").token ?? "";
    fetch(`${BASE_URL}/v1/all-files`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => setFiles(Array.isArray(d?.items) ? d.items : []))
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, []);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? CARD_WIDTH + GAP : -(CARD_WIDTH + GAP), behavior: "smooth" });
  };

  const arrowBtn = (dir: "left" | "right", visible: boolean) => (
    <button
      onClick={() => scroll(dir)}
      style={{
        position: "absolute", top: "50%", [dir]: -16,
        transform: "translateY(-50%)", zIndex: 10,
        width: 32, height: 32, borderRadius: "50%",
        border: "1px solid rgba(88,101,242,0.35)",
        background: "rgba(18,19,27,0.92)", backdropFilter: "blur(8px)",
        color: "#bec2ff", display: "flex", alignItems: "center",
        justifyContent: "center", cursor: "pointer",
        opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.2s", boxShadow: "0 2px 12px rgba(88,101,242,0.25)", padding: 0,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
        {dir === "left" ? "chevron_left" : "chevron_right"}
      </span>
    </button>
  );

  if (loading) return <div style={{ padding: 32, textAlign: "center", color: C.outlineVariant }}>読み込み中...</div>;
  if (files.length === 0) return <div style={{ padding: 32, textAlign: "center", color: C.outlineVariant }}>ファイルはまだありません</div>;

  return (
    <>
    <div style={{ position: "relative" }}>
      <style>{`.af-hscroll::-webkit-scrollbar{display:none}.af-hscroll{-ms-overflow-style:none;scrollbar-width:none}`}</style>
      {arrowBtn("left", canLeft)}
      <div
        ref={scrollRef}
        className="af-hscroll"
        style={{ display: "flex", gap: GAP, overflowX: "auto", overflowY: "visible", paddingBottom: 4, paddingTop: 2 }}
      >
        {files.map((f) => {
          const imgIdx = isImage(f.file_name) ? imageFiles.findIndex((i) => i.id === f.id) : -1;
          return (
            <FileCard
              key={f.id}
              file={f}
              onDelete={(user?.role === "admin" || user?.userId === f.uploaded_by)
                ? () => handleDelete(f)
                : undefined}
              onImageClick={imgIdx >= 0 ? () => setLightboxIndex(imgIdx) : undefined}
            />
          );
        })}
      </div>
      {canRight && (
        <div style={{
          position: "absolute", top: 0, right: 0,
          width: 72, height: "calc(100% - 4px)",
          background: "linear-gradient(to right, transparent, #12131b 85%)",
          pointerEvents: "none",
        }} />
      )}
      {arrowBtn("right", canRight)}
    </div>

    {lightboxFile && (
      <ImageLightbox
        src={lightboxSrc}
        name={lightboxFile.file_name}
        onClose={() => setLightboxIndex(null)}
        hasPrev={lightboxIndex! > 0}
        hasNext={lightboxIndex! < imageFiles.length - 1}
        onPrev={() => setLightboxIndex((i) => (i ?? 1) - 1)}
        onNext={() => setLightboxIndex((i) => (i ?? 0) + 1)}
      />
    )}
    </>
  );
}
