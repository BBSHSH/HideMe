import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { C, F } from "../../theme/tokens";
import { Icon } from "../../components/Icon";
import CollectionGrid from "../../components/file/CollectionGrid";
import AllFilesGrid from "../../components/file/AllFilesGrid";
import StorageStats from "../../components/file/StorageStats";
import UploadModal from "../../components/file/UploadModal";
import { useIsMobile } from "../../hooks/useIsMobile";

const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".mkv", ".avi", ".flv", ".wmv"];

export default function AllFilesPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const px = isMobile ? 16 : 28;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const isVideo = VIDEO_EXTS.some(ext => f.name.toLowerCase().endsWith(ext)) || f.type.startsWith("video/");
    if (isVideo) {
      navigate("/editor", { state: { file: f } });
    } else {
      setPendingFile(f);
      setShowUpload(true);
    }
  };

  return (
    <div style={{
      flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
      overflow: "hidden", boxSizing: "border-box",
    }}>

      {/* ── ヘッダー ── */}
      <div style={{
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: `14px ${px}px`,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: C.primary }}>folder_open</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: C.onSurface, fontFamily: F.family, letterSpacing: "-0.03em" }}>
            All Files
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
          {!isMobile && "アップロード"}
        </button>
      </div>

      <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelect} />

      {showUpload && (
        <UploadModal
          initialFile={pendingFile ?? undefined}
          onClose={() => { setShowUpload(false); setPendingFile(null); }}
          onUploaded={() => { setShowUpload(false); setPendingFile(null); }}
        />
      )}

      {/* ── スクロール本体 ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: `20px ${px}px 48px` }}>

          {/* ── Stats ── */}
          <StorageStats />

          {/* ── Collections ── */}
          <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.primary }}>collections_bookmark</span>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.onSurface, fontFamily: F.family, letterSpacing: "-0.02em" }}>
                  Collections
                </h2>
              </div>
            </div>
            <CollectionGrid horizontal />
          </section>

          {/* ── Recent Activity ── */}
          <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.primary }}>history</span>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.onSurface, fontFamily: F.family, letterSpacing: "-0.02em" }}>
                Recent Activity
              </h2>
            </div>
            <AllFilesGrid />
          </section>

        </div>
      </div>
    </div>
  );
}
