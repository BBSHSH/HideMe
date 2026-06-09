import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C, F } from "../../theme/tokens";
import CollectionGrid from "../../components/file/CollectionGrid";
import AllFilesGrid from "../../components/file/AllFilesGrid";
import UploadModal from "../../components/file/UploadModal";
import { useIsMobile } from "../../hooks/useIsMobile";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".mkv", ".avi", ".flv", ".wmv"];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function getToken() {
  return JSON.parse(localStorage.getItem("hideme_auth") || "{}").token ?? "";
}

function useStats() {
  const [stats, setStats] = useState<{ files: number; sizeB: number; cols: number } | null>(null);
  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/v1/stats`).then(r => r.json()),
      fetch(`${BASE_URL}/v1/collections`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(r => r.json()),
    ]).then(([s, c]) => setStats({
      files: s.total_files ?? 0,
      sizeB: s.total_size_bytes ?? 0,
      cols: (c?.items ?? []).length,
    })).catch(() => {});
  }, []);
  return stats;
}

export default function AllFilesPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const stats = useStats();
  const px = isMobile ? 18 : 32;

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
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelect} />

      {showUpload && (
        <UploadModal
          initialFile={pendingFile ?? undefined}
          onClose={() => { setShowUpload(false); setPendingFile(null); }}
          onUploaded={() => { setShowUpload(false); setPendingFile(null); }}
        />
      )}

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>

        {/* ── Hero ── */}
        <div style={{
          position: "relative",
          overflow: "hidden",
          padding: isMobile ? "32px 18px 28px" : "18px 32px 36px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          {/* 背景グロー */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 80% 100% at 60% -20%, rgba(88,101,242,0.18) 0%, transparent 70%)",
          }} />
          <div style={{
            position: "absolute", top: -60, right: -60,
            width: 320, height: 320, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* コンテンツ */}
          <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: "linear-gradient(135deg, rgba(88,101,242,0.3), rgba(124,58,237,0.3))",
                  border: "1px solid rgba(88,101,242,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#bec2ff" }}>folder_open</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(190,194,255,0.6)",
                  letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: F.family }}>
                  Storage
                </span>
              </div>

              <h1 style={{
                margin: "0 0 4px", fontSize: isMobile ? 28 : 36,
                fontWeight: 900, color: C.onSurface,
                fontFamily: F.family, letterSpacing: "-0.04em", lineHeight: 1.1,
              }}>
                All Files
              </h1>

              {/* インライン統計 */}
              <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap", marginTop: 10 }}>
                {[
                  { icon: "database", label: stats ? formatBytes(stats.sizeB) : "—", color: "#818cf8" },
                  { icon: "insert_drive_file", label: stats ? `${stats.files} files` : "—", color: "#34d399" },
                  { icon: "collections_bookmark", label: stats ? `${stats.cols} collections` : "—", color: "#f472b6" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center" }}>
                    {i > 0 && (
                      <span style={{ width: 3, height: 3, borderRadius: "50%",
                        background: "rgba(255,255,255,0.2)", margin: "0 10px" }} />
                    )}
                    <span className="material-symbols-outlined"
                      style={{ fontSize: 13, color: s.color, marginRight: 5, verticalAlign: "middle" }}>
                      {s.icon}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)",
                      fontFamily: F.family }}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* アップロードボタン */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                flexShrink: 0,
                display: "flex", alignItems: "center", gap: 7,
                padding: isMobile ? "10px 14px" : "11px 22px",
                borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #5865f2, #7c3aed)",
                color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: F.family,
                boxShadow: "0 4px 20px rgba(88,101,242,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                letterSpacing: "0.01em",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17 }}>upload</span>
              {!isMobile && "アップロード"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

          {/* ── Collections ── */}
          <section style={{ padding: `28px ${px}px` }}>
            <SectionHeader icon="collections_bookmark" title="Collections" iconColor="#f472b6" />
            <div style={{ marginTop: 14 }}>
              <CollectionGrid horizontal sortable />
            </div>
          </section>

          <Divider px={px} />

          {/* ── Recent Activity ── */}
          <section style={{ padding: `28px ${px}px 48px` }}>
            <SectionHeader icon="history" title="Recent Activity" iconColor="#34d399" />
            <div style={{ marginTop: 14 }}>
              <AllFilesGrid />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, iconColor }: { icon: string; title: string; iconColor: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: `${iconColor}1a`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15, color: iconColor }}>{icon}</span>
      </div>
      <h2 style={{
        margin: 0, fontSize: 14, fontWeight: 800,
        color: C.onSurface, fontFamily: F.family,
        letterSpacing: "-0.01em",
      }}>
        {title}
      </h2>
    </div>
  );
}

function Divider({ px }: { px: number }) {
  return (
    <div style={{ margin: `0 ${px}px`, height: 1, background: "rgba(255,255,255,0.05)" }} />
  );
}
