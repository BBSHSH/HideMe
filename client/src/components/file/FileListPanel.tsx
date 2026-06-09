/**
 * FileListPanel — コレクション内ファイル一覧 と 全ファイル一覧 の共通コンポーネント
 *
 * collectionId が渡された場合 → そのコレクションのファイルのみ表示
 * collectionId が未指定の場合 → 全コレクションの最近ファイルを表示
 */
import { useState, useEffect, useCallback } from "react";
import { C, F, glassPanel } from "../../theme/tokens";
import { Icon } from "../Icon";
import { useAuth } from "../../context/AuthContext";
import { deleteCollectionFile } from "../../api/collections";
import { getDownloadUrl } from "../../api/files";
import { formatBytes, formatRelativeTime } from "../../utils/format";
import ImageLightbox from "./ImageLightbox";

function isImage(name: string) {
  return IMAGE_EXTS.some((e) => name.toLowerCase().endsWith(e));
}

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

interface FileRow {
  id: string;
  collection_id: string;
  collection_name: string;
  file_name: string;
  display_name?: string;
  file_size: number;
  uploaded_by: string;
  uploader_name: string;
  uploaded_at: string;
}

interface FileListPanelProps {
  /** 指定するとそのコレクションのファイルのみ表示。未指定なら全件 */
  collectionId?: string;
  /** 外部からリフレッシュを呼び出したい場合に渡す */
  refreshKey?: number;
}

export default function FileListPanel({ collectionId, refreshKey }: FileListPanelProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = JSON.parse(localStorage.getItem("hideme_auth") || "{}").token ?? "";
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let rows: FileRow[] = [];

      if (collectionId) {
        // コレクション指定 → そのコレクションのファイルのみ
        const res = await fetch(`${BASE_URL}/v1/collections/${collectionId}/files`, { headers });
        const data = await res.json();
        const items: any[] = Array.isArray(data?.items) ? data.items : [];
        rows = items.map((f) => ({
          id:              f.id,
          collection_id:   collectionId,
          collection_name: "",
          file_name:       f.file_name,
          file_size:       f.file_size,
          uploaded_by:     f.uploaded_by ?? "",
          uploader_name:   f.uploader_name ?? "",
          uploaded_at:     f.uploaded_at,
        }));
      } else {
        // 全件 → DB の最近ファイル（重複排除済み）
        const res = await fetch(`${BASE_URL}/v1/all-files`, { headers });
        const data = await res.json();
        rows = Array.isArray(data?.items) ? data.items : [];
      }

      setFiles(rows);
    } catch (e) {
      setError("ファイルの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  useEffect(() => { fetchFiles(); }, [fetchFiles, refreshKey]);

  const handleDelete = async (fileId: string, colId: string) => {
    if (!user) return;
    if (!confirm("このファイルを削除しますか？")) return;

    // collection_id を確定（prop > file の collection_id）
    const targetCollectionId = collectionId ?? colId;
    if (!targetCollectionId) {
      alert("コレクションIDが取得できませんでした");
      return;
    }

    try {
      await deleteCollectionFile(targetCollectionId, fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (e: any) {
      const status = e?.message?.match(/\d+/)?.[0];
      if (status === "403") alert("削除権限がありません");
      else if (status === "404") alert("ファイルが見つかりません（既に削除済みの可能性があります）");
      else alert("削除に失敗しました");
    }
  };

  if (loading) return (
    <div style={{ padding: 32, textAlign: "center", color: C.outlineVariant }}>読み込み中...</div>
  );
  if (error) return (
    <div style={{ padding: 32, textAlign: "center", color: "#f87171" }}>{error}</div>
  );
  if (files.length === 0) return (
    <div style={{ padding: 32, textAlign: "center", color: C.outlineVariant }}>
      ファイルはまだありません
    </div>
  );

  const imageFiles = files.filter((f) => isImage(f.file_name));
  const lightboxFile = lightboxIndex !== null ? imageFiles[lightboxIndex] : null;
  const lightboxSrc = lightboxFile
    ? `${BASE_URL}/v1/files/${encodeURIComponent(lightboxFile.file_name)}`
    : "";

  return (
    <>
    <div style={{ ...glassPanel, overflow: "hidden", borderRadius: 16 }}>
      {files.map((file, index) => {
        const { icon, color } = fileIcon(file.file_name);
        const canDelete = user?.role === "admin"
          || (!!file.uploaded_by && !!user?.userId && user.userId === file.uploaded_by);
        const colLabel = !collectionId && file.collection_name ? ` • ${file.collection_name}` : "";
        const imgIdx = isImage(file.file_name) ? imageFiles.findIndex((i) => i.id === file.id) : -1;

        return (
          <div key={file.id ?? `${file.file_name}-${index}`}>
            {index > 0 && (
              <div style={{ height: 1, background: `${C.outlineVariant}0d` }} />
            )}
            <div
              style={{
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              {/* 左: アイコン + ファイル名・メタ */}
              <div
                style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: 1,
                  cursor: imgIdx >= 0 ? "pointer" : "default" }}
                onClick={() => { if (imgIdx >= 0) setLightboxIndex(imgIdx); }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    borderRadius: 10,
                    background: C.surfaceContainer,
                    border: `1px solid ${C.outlineVariant}1a`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={icon} size={22} style={{ color }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      fontSize: 15,
                      color: C.onSurface,
                      fontFamily: F.family,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "60vw",
                    }}
                  >
                    {file.display_name || file.file_name}
                  </h4>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: C.outline }}>
                    {formatBytes(file.file_size)}
                    {file.uploaded_at ? ` • ${formatRelativeTime(file.uploaded_at)}` : ""}
                    {file.uploader_name ? ` • ${file.uploader_name}` : ""}
                    {colLabel}
                  </p>
                </div>
              </div>

              {/* 右: ダウンロード + 削除 */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <a
                  href={getDownloadUrl(file.file_name)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    color: C.onSurfaceVariant,
                    display: "flex",
                    alignItems: "center",
                    textDecoration: "none",
                  }}
                >
                  <Icon name="download" size={20} />
                </a>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(file.id, file.collection_id)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 8,
                      border: "1px solid rgba(248,113,113,0.4)",
                      background: "rgba(248,113,113,0.08)",
                      color: "#f87171",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Icon name="delete" size={15} />
                    削除
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
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
