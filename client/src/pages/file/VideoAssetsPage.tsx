import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { C, F, glassPanel } from "../../theme/tokens";
import { Icon } from "../../components/Icon";
import { getCollectionFiles } from "../../api/collections";
import { useCollections } from "../../hooks/useFiles";
import { formatBytes, formatRelativeTime } from "../../utils/format";
import VideoThumbnail from "../../components/file/VideoThumbnail";

interface CollectionFile {
  id: string;
  file_name: string;
  file_size: number;
  thumbnail_name: string;
  uploaded_at: string;
  uploaded_by: string;
  uploader_name: string;
  uploader_avatar: string;
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────
function ActionBtn({ icon, title, danger = false }: { icon: string; title: string; danger?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 12,
        borderRadius: 8,
        border: `1px solid ${danger ? `${C.error}33` : "rgba(69,70,85,0.3)"}`,
        background: hover ? (danger ? `${C.error}1a` : `${C.primary}1a`) : "transparent",
        color: danger ? C.error : hover ? C.primary : C.onSurfaceVariant,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
      }}
    >
      <Icon name={icon} />
    </button>
  );
}

// ─── MetaCell ─────────────────────────────────────────────────────────────────
function MetaCell({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <p
        style={{
          fontFamily: F.family,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: C.onSurfaceVariant,
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      {value ? (
        <p style={{ fontFamily: F.family, fontSize: 14, fontWeight: 700, margin: 0 }}>{value}</p>
      ) : (
        children
      )}
    </div>
  );
}

// ─── RelatedClip ──────────────────────────────────────────────────────────────
function RelatedClip({
  fileName,
  fileId,
  thumbnailName,
  title,
  meta,
  duration,
}: {
  fileName: string;
  fileId: string;
  thumbnailName: string;
  title: string;
  meta: string;
  duration: string;
}) {
  const [hover, setHover] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => navigate(`/file/video/${fileId}`)}
      style={{
        ...glassPanel,
        padding: 8,
        display: "flex",
        gap: 16,
        cursor: "pointer",
        background: hover ? "rgba(52,52,61,0.2)" : glassPanel.background,
        transition: "all 0.2s",
      }}
    >
      {/* サムネイル — via.placeholder.com を使わず VideoThumbnail で表示 */}
      <div style={{ width: 128, height: 80, borderRadius: 8, overflow: "hidden", position: "relative", flexShrink: 0 }}>
        <VideoThumbnail
          fileName={fileName}
          fileSize={0}
          fileId={fileId}
          thumbnailName={thumbnailName}
        />
        {duration !== "—" && (
          <span
            style={{
              position: "absolute",
              bottom: 4,
              right: 4,
              padding: "1px 4px",
              background: "rgba(0,0,0,0.8)",
              borderRadius: 4,
              fontFamily: F.family,
              fontSize: 10,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {duration}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
        <h3
          style={{
            fontFamily: F.family,
            fontSize: 14,
            fontWeight: 700,
            color: hover ? C.primary : C.onSurface,
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            transition: "color 0.2s",
          }}
        >
          {title}
        </h3>
        <p style={{ fontFamily: F.family, fontSize: 12, color: C.onSurfaceVariant, margin: "4px 0 0" }}>{meta}</p>
      </div>
    </div>
  );
}

// ─── VideoAssetsPage ──────────────────────────────────────────────────────────
export default function VideoAssetsPage() {
  const params = useParams<{ fileId: string }>();
  const { collections } = useCollections();
  const [currentFile, setCurrentFile] = useState<CollectionFile | null>(null);
  const [relatedFiles, setRelatedFiles] = useState<CollectionFile[]>([]);
  const [loading, setLoading] = useState(true);

  const fileId = params.fileId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let allFiles: CollectionFile[] = [];
        let currentCollectionId = "";

        // すべてのコレクションからファイルを取得
        for (const collection of collections) {
          const response = await getCollectionFiles(collection.ID);
          const items = response?.items || [];
          allFiles = [...allFiles, ...items];

          // 現在のファイルが見つかったらコレクション ID を保存
          const found = items.find((f: CollectionFile) => f.id === fileId);
          if (found) {
            currentCollectionId = collection.ID;
          }
        }

        // 現在のファイルを探す
        const current = allFiles.find((f) => f.id === fileId);
        setCurrentFile(current || null);

        // 同じコレクションの他のファイルを関連動画として表示
        if (current && currentCollectionId) {
          const collectionFiles = await getCollectionFiles(currentCollectionId);
          const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".mkv", ".avi", ".flv", ".wmv"];
          const isVideo = (name: string) =>
            VIDEO_EXTS.some((ext) => name.toLowerCase().endsWith(ext));

          const related = (collectionFiles?.items || [] as CollectionFile[])
            .filter((f: CollectionFile) => f.id !== fileId && isVideo(f.file_name))
            .sort(
              (a: CollectionFile, b: CollectionFile) =>
                new Date(b.uploaded_at).getTime() -
                new Date(a.uploaded_at).getTime()
            )
            .slice(0, 3);
          setRelatedFiles(related);
        }
      } finally {
        setLoading(false);
      }
    };

    if (fileId && collections.length > 0) fetchData();
  }, [fileId, collections]);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: C.outlineVariant }}>
        Loading video...
      </div>
    );
  }

  if (!currentFile) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#f87171" }}>
        Video not found
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: 48,
        background: `radial-gradient(circle at top right, ${C.primary}0d 0%, transparent 60%)`,
      }}
    >
      {/* Breadcrumbs & Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            {["Storage", "Video Assets", "Player"].map((crumb, i, arr) => (
              <span key={crumb} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontFamily: F.family,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: i === arr.length - 1 ? C.primary : C.onSurfaceVariant,
                  }}
                >
                  {crumb}
                </span>
                {i < arr.length - 1 && (
                  <Icon name="chevron_right" size={14} style={{ color: C.onSurfaceVariant }} />
                )}
              </span>
            ))}
          </div>
          <h1 style={{ fontFamily: F.family, fontSize: 32, fontWeight: 700, margin: 0 }}>
            {currentFile.file_name}
          </h1>
        </div>

        <div
          style={{
            ...glassPanel,
            padding: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, auto)", gap: "0 40px" }}>
            <MetaCell label="File Size" value={formatBytes(currentFile.file_size)} />
            <MetaCell label="Upload Date" value={formatRelativeTime(currentFile.uploaded_at)} />
            <MetaCell label="Uploaded By" value={currentFile.uploaded_by || "Unknown"} />
            <MetaCell label="Status">
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#4ade80" }}>
                <Icon name="verified" size={16} style={{ color: "#4ade80" }} />
                <span style={{ fontFamily: F.family, fontSize: 12 }}>Secured</span>
              </div>
            </MetaCell>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ActionBtn icon="download" title="Download" />
            <ActionBtn icon="ios_share" title="Share" />
            <ActionBtn icon="delete" title="Delete" danger />
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
        {/* Left - Player */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{
            aspectRatio: "16/9",
            overflow: "hidden",
            position: "relative",
            background: "#000",
            borderRadius: 12,
            border: "1px solid rgba(69,70,85,0.4)",
            // backdropFilter は動画コンテナに使うと GPU レイヤー競合で映像が出なくなるため使わない
          }}>
            <video
              src={`${import.meta.env.VITE_API_BASE_URL ?? ""}/v1/files/${encodeURIComponent(currentFile.file_name)}`}
              controls
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          </div>
        </div>

        {/* Right - Related Clips */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontFamily: F.family, fontSize: 24, fontWeight: 700, margin: 0 }}>
              Related Files
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {relatedFiles.length === 0 ? (
              <p style={{ color: C.outlineVariant }}>No related files</p>
            ) : (
              relatedFiles.map((file) => (
                <RelatedClip
                  key={file.id}
                  fileName={file.file_name}
                  fileId={file.id}
                  thumbnailName={file.thumbnail_name || ""}
                  title={file.file_name.replace(/\.mp4$/i, "")}
                  meta={`${formatBytes(file.file_size)} • ${formatRelativeTime(file.uploaded_at)}`}
                  duration="—"
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}