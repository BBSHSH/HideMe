import { useRef, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { C, F } from "../../theme/tokens";
import { useCollections } from "../../hooks/useFiles";
import { getCollectionFiles } from "../../api/collections";
import { formatBytes, formatRelativeTime } from "../../utils/format";
import { useIsMobile } from "../../hooks/useIsMobile";
import VideoThumbnail from "../../components/file/VideoThumbnail";

const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".mkv", ".avi", ".flv", ".wmv"];

interface VideoFile {
  id: string;
  file_name: string;
  file_size: number;
  thumbnail_name: string;
  uploaded_at: string;
  uploader_name: string;
  uploader_avatar: string;
  collection_id: string;
  collection_name: string;
  color: string;
}

// ── VideoCard (YouTubeスタイル) ───────────────────────────────────────────────
function VideoCard({ video, onPlay }: { video: VideoFile; onPlay: () => void }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onClick={onPlay}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 10 }}
    >
      {/* サムネイル */}
      <div style={{
        width: "100%", aspectRatio: "16/9", borderRadius: 10, overflow: "hidden",
        position: "relative",
        border: `1px solid ${hov ? "rgba(88,101,242,0.4)" : "rgba(255,255,255,0.06)"}`,
        transition: "border-color 0.2s",
      }}>
        <VideoThumbnail
          fileName={video.file_name}
          fileSize={video.file_size}
          fileId={video.id}
          thumbnailName={video.thumbnail_name}
        />
        {/* 再生ボタン */}
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: hov ? "rgba(0,0,0,0.3)" : "transparent", transition: "background 0.2s",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "rgba(88,101,242,0.92)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: hov ? 1 : 0, transform: hov ? "scale(1)" : "scale(0.5)",
            transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#fff", marginLeft: 3 }}>play_arrow</span>
          </div>
        </div>
        {/* コレクション色ドット */}
        <div style={{
          position: "absolute", bottom: 6, left: 6,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
          borderRadius: 6, padding: "2px 8px",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: video.color || C.primary, flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{video.collection_name}</span>
        </div>
      </div>

      {/* メタ情報 */}
      <div style={{ display: "flex", gap: 10 }}>
        {/* アバター */}
        <div style={{
          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #5865f2, #7c3aed)",
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
        }}>
          {video.uploader_avatar
            ? <img src={video.uploader_avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                {(video.uploader_name || "?")[0].toUpperCase()}
              </span>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, fontSize: 13, fontWeight: 700, color: hov ? C.primary : C.onSurface,
            lineHeight: 1.3, transition: "color 0.15s",
            overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {video.file_name.replace(/\.[^.]+$/, "")}
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: C.onSurfaceVariant }}>
            {video.uploader_name || "Unknown"}
          </p>
          <p style={{ margin: "1px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            {formatBytes(video.file_size)} · {formatRelativeTime(video.uploaded_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function VideoFilesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { collections } = useCollections();
  const isMobile = useIsMobile();
  const [allVideos, setAllVideos] = useState<VideoFile[]>([]);
  const [loading, setLoading] = useState(true);

  const activeCol = searchParams.get("collection") || "all";
  const setActiveCol = (id: string) => setSearchParams(id === "all" ? {} : { collection: id }, { replace: true });

  useEffect(() => {
    if (!collections.length) return;
    (async () => {
      let all: VideoFile[] = [];
      for (const col of collections) {
        const res = await getCollectionFiles(col.ID).catch(() => null);
        const items: VideoFile[] = (res?.items || [])
          .filter((f: VideoFile) => VIDEO_EXTS.some(e => f.file_name.toLowerCase().endsWith(e)))
          .map((f: VideoFile) => ({ ...f, collection_id: col.ID, collection_name: col.Name, color: col.Color || C.primary }));
        all = [...all, ...items];
      }
      all.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
      setAllVideos(all);
      setLoading(false);
    })();
  }, [collections]);

  const filtered = activeCol === "all" ? allVideos : allVideos.filter(v => v.collection_id === activeCol);
  const px = isMobile ? 16 : 28;
  const cols = isMobile ? 1 : 3;

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <input ref={fileInputRef} type="file" accept="video/*" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) navigate("/editor", { state: { file: f } }); e.target.value = ""; }} />

      {/* ── ヘッダー ── */}
      <div style={{
        flexShrink: 0, padding: `14px ${px}px`,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: C.primary }}>smart_display</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: C.onSurface, fontFamily: F.family, letterSpacing: "-0.03em" }}>
            Video Vault
          </span>
        </div>
        <button onClick={() => fileInputRef.current?.click()} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
          borderRadius: 8, border: "none",
          background: "linear-gradient(135deg, #5865f2, #7c3aed)",
          color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
          boxShadow: "0 2px 12px rgba(88,101,242,0.35)",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>
          アップロード
        </button>
      </div>

      {/* ── コレクションフィルタータブ ── */}
      <div style={{
        flexShrink: 0, display: "flex", gap: 8, padding: `10px ${px}px`,
        overflowX: "auto", borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <style>{`.ftab::-webkit-scrollbar{display:none}`}</style>
        {[{ ID: "all", Name: "すべて", Color: C.primary }, ...collections].map(col => {
          const active = activeCol === col.ID;
          return (
            <button key={col.ID} onClick={() => setActiveCol(col.ID)} style={{
              flexShrink: 0, padding: "5px 14px", borderRadius: 20,
              border: `1px solid ${active ? (col.Color || C.primary) : "rgba(255,255,255,0.1)"}`,
              background: active ? `${col.Color || C.primary}22` : "transparent",
              color: active ? (col.Color || C.primary) : C.onSurfaceVariant,
              fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer",
              transition: "all 0.15s",
            }}>
              {col.Name}
            </button>
          );
        })}
      </div>

      {/* ── グリッド ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: `20px ${px}px 40px` }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: C.outlineVariant }}>読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: C.outlineVariant }}>動画はまだありません</div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 20,
          }}>
            {filtered.map(v => (
              <VideoCard key={v.id} video={v} onPlay={() => navigate(`/file/video/${v.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
