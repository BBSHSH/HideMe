import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { C, F } from "../../theme/tokens";
import { Icon } from "../../components/Icon";
import { getCollectionFiles, deleteCollectionFile, recordView } from "../../api/collections";
import { useCollections } from "../../hooks/useFiles";
import { useAuth } from "../../context/AuthContext";
import { formatBytes, formatRelativeTime } from "../../utils/format";
import VideoThumbnail from "../../components/file/VideoThumbnail";
import { useIsMobile } from "../../hooks/useIsMobile";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

interface CollectionFile {
  id: string;
  collection_id: string;
  file_name: string;
  file_size: number;
  thumbnail_name: string;
  uploaded_at: string;
  uploaded_by: string;
  uploader_name: string;
  uploader_avatar: string;
  view_count?: number;
}

// ─── MetaCell ─────────────────────────────────────────────────────────────────
function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: C.onSurfaceVariant }}>{label}</p>
      <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: C.onSurface, fontFamily: F.family }}>{value}</p>
    </div>
  );
}

// ─── RelatedClip ──────────────────────────────────────────────────────────────
function RelatedClip({ file }: { file: CollectionFile }) {
  const [hover, setHover] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => navigate(`/file/video/${file.id}`)}
      style={{
        display: "flex", gap: 12, cursor: "pointer", borderRadius: 10,
        padding: 8,
        background: hover ? "rgba(255,255,255,0.06)" : "transparent",
        transition: "background 0.2s",
      }}
    >
      <div style={{ width: 100, height: 62, borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
        <VideoThumbnail
          fileName={file.file_name}
          fileSize={0}
          fileId={file.id}
          thumbnailName={file.thumbnail_name}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
        <p style={{
          margin: 0, fontSize: 12, fontWeight: 700,
          color: hover ? C.primary : C.onSurface,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          transition: "color 0.2s",
        }}>
          {file.file_name.replace(/\.[^.]+$/, "")}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: C.onSurfaceVariant }}>
          {formatBytes(file.file_size)} · {formatRelativeTime(file.uploaded_at)}
        </p>
      </div>
    </div>
  );
}

// ─── VideoAssetsPage ──────────────────────────────────────────────────────────
export default function VideoAssetsPage() {
  const params = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const { collections } = useCollections();
  const { user } = useAuth();
  const [currentFile, setCurrentFile] = useState<CollectionFile | null>(null);
  const [currentCollectionId, setCurrentCollectionId] = useState("");
  const [relatedFiles, setRelatedFiles] = useState<CollectionFile[]>([]);
  const [loading, setLoading] = useState(true);
  const fileId = params.fileId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let allFiles: CollectionFile[] = [];
        let colId = "";

        for (const collection of collections) {
          const response = await getCollectionFiles(collection.ID);
          const items: CollectionFile[] = response?.items || [];
          allFiles = [...allFiles, ...items.map(f => ({ ...f, collection_id: collection.ID }))];
          if (items.find((f: CollectionFile) => f.id === fileId)) colId = collection.ID;
        }

        const current = allFiles.find((f) => f.id === fileId);
        setCurrentFile(current || null);
        setCurrentCollectionId(colId);

        // 視聴回数カウント
        if (current && colId) {
          recordView(colId, current.id).catch(() => {});
        }

        if (current && colId) {
          const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".mkv", ".avi", ".flv", ".wmv"];
          const related = allFiles
            .filter(f => f.collection_id === colId && f.id !== fileId && VIDEO_EXTS.some(e => f.file_name.toLowerCase().endsWith(e)))
            .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
            .slice(0, 6);
          setRelatedFiles(related);
        }
      } finally {
        setLoading(false);
      }
    };
    if (fileId && collections.length > 0) fetchData();
  }, [fileId, collections]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = `${BASE_URL}/v1/files/${encodeURIComponent(currentFile!.file_name)}`;
    a.download = currentFile!.file_name;
    a.click();
  };

  const handleDelete = async () => {
    if (!currentFile || !currentCollectionId) return;
    if (!confirm("このファイルを削除しますか？")) return;
    try {
      await deleteCollectionFile(currentCollectionId, currentFile.id);
      navigate(-1);
    } catch {
      alert("削除に失敗しました");
    }
  };

  const canDelete = user?.role === "admin" || user?.userId === currentFile?.uploaded_by;
  const isMobile = useIsMobile();

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: C.outlineVariant }}>Loading...</div>;
  if (!currentFile) return <div style={{ padding: 48, textAlign: "center", color: "#f87171" }}>Video not found</div>;

  return (
    <div style={{
      flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
      overflow: "hidden", boxSizing: "border-box",
    }}>

      {isMobile ? (
        /* ── モバイル: YouTube風縦レイアウト ── */
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>

          {/* 動画プレイヤー（16:9固定） */}
          <div style={{ width: "100%", aspectRatio: "16/9", background: "#000", flexShrink: 0 }}>
            <video
              src={`${BASE_URL}/v1/files/${encodeURIComponent(currentFile.file_name)}`}
              controls
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          </div>

          {/* タイトル・メタ・アクション */}
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

            {/* 戻るボタン + タイトル */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <button onClick={() => navigate(-1)} style={{
                width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(69,70,85,0.3)",
                background: "transparent", color: C.onSurfaceVariant,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon name="arrow_back" size={18} />
              </button>
              <h1 style={{
                margin: 0, fontSize: 16, fontWeight: 800, color: C.onSurface,
                fontFamily: F.family, lineHeight: 1.35,
              }}>
                {currentFile.file_name.replace(/\.[^.]+$/, "")}
              </h1>
            </div>

            {/* メタ情報 */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <MetaCell label="サイズ" value={formatBytes(currentFile.file_size)} />
              <MetaCell label="アップロード" value={formatRelativeTime(currentFile.uploaded_at)} />
              <MetaCell label="投稿者" value={currentFile.uploader_name || currentFile.uploaded_by || "Unknown"} />
              {currentFile.view_count != null && <MetaCell label="視聴回数" value={`${currentFile.view_count.toLocaleString()}回`} />}
            </div>

            {/* アクション */}
            <div style={{ display: "flex", gap: 8 }}>
              <ActionBtn icon="download" label="DL" onClick={handleDownload} />
              {canDelete && <ActionBtn icon="delete" label="削除" danger onClick={handleDelete} />}
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* 関連動画リスト */}
          <div style={{ padding: "0 16px 40px", display: "flex", flexDirection: "column", gap: 4 }}>
            {relatedFiles.length > 0 && (
              <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: C.onSurfaceVariant }}>
                関連動画
              </p>
            )}
            {relatedFiles.map(f => <RelatedClip key={f.id} file={f} />)}
          </div>
        </div>

      ) : (
        /* ── デスクトップ: 従来の横2カラム ── */
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "16px 24px", gap: 12, overflow: "hidden" }}>

          {/* ヘッダー */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <button onClick={() => navigate(-1)} style={{
              width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(69,70,85,0.3)",
              background: "transparent", color: C.onSurfaceVariant,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="arrow_back" size={18} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                margin: 0, fontSize: 18, fontWeight: 700, color: C.onSurface,
                fontFamily: F.family, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {currentFile.file_name.replace(/\.[^.]+$/, "")}
              </h1>
            </div>
            <div style={{ display: "flex", gap: 24, alignItems: "center", flexShrink: 0 }}>
              <MetaCell label="File Size" value={formatBytes(currentFile.file_size)} />
              <MetaCell label="Upload Date" value={formatRelativeTime(currentFile.uploaded_at)} />
              <MetaCell label="Uploaded By" value={currentFile.uploader_name || currentFile.uploaded_by || "Unknown"} />
              {currentFile.view_count != null && <MetaCell label="視聴回数" value={`${currentFile.view_count.toLocaleString()}回`} />}
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <ActionBtn icon="download" label="ダウンロード" onClick={handleDownload} />
              {canDelete && <ActionBtn icon="delete" label="削除" danger onClick={handleDelete} />}
            </div>
          </div>

          {/* メインコンテンツ */}
          <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
            <div style={{ borderRadius: 12, overflow: "hidden", background: "#000", border: "1px solid rgba(69,70,85,0.4)" }}>
              <video
                src={`${BASE_URL}/v1/files/${encodeURIComponent(currentFile.file_name)}`}
                controls
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.onSurfaceVariant, flexShrink: 0 }}>
                Related Files
              </h2>
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                {relatedFiles.length === 0
                  ? <p style={{ color: C.outlineVariant, fontSize: 13 }}>No related files</p>
                  : relatedFiles.map(f => <RelatedClip key={f.id} file={f} />)
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────
function ActionBtn({ icon, label, onClick, danger = false }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      title={label}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: 36, paddingInline: 14, borderRadius: 8, gap: 6,
        border: `1px solid ${danger ? `${C.error}44` : "rgba(69,70,85,0.3)"}`,
        background: hover ? (danger ? `${C.error}1a` : `${C.primary}1a`) : "rgba(255,255,255,0.03)",
        color: danger ? C.error : hover ? C.primary : C.onSurfaceVariant,
        cursor: "pointer", display: "flex", alignItems: "center",
        fontSize: 12, fontWeight: 600, transition: "all 0.2s",
      }}
    >
      <Icon name={icon} size={16} />
      <span>{label}</span>
    </button>
  );
}
