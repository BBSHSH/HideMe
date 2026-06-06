import { Icon } from "../../components/Icon";
import { C, F } from "../../theme/tokens";
import type { CSSProperties } from "react";
import { useStorageFiles } from "../../hooks/useFiles";
import { getDownloadUrl } from "../../api/files";
import { formatBytes, formatRelativeTime } from "../../utils/format";

const ACCENT   = C.primaryContainer;
const ACCENT_L = C.primary;

const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".mkv", ".avi", ".flv", ".wmv"];
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];

function fileIcon(name: string): { icon: string; color: string } {
  const lower = name.toLowerCase();
  if (VIDEO_EXTS.some((e) => lower.endsWith(e))) return { icon: "movie", color: "#818cf8" };
  if (IMAGE_EXTS.some((e) => lower.endsWith(e))) return { icon: "image", color: "#34d399" };
  if (lower.endsWith(".pdf")) return { icon: "picture_as_pdf", color: "#f87171" };
  return { icon: "insert_drive_file", color: ACCENT_L };
}

export function RecentFiles() {
  const { files, loading, error } = useStorageFiles();

  return (
    <div
      style={{
        backgroundColor: "rgba(30,41,59,0.4)",
        borderRadius: "8px",
        border: "1px solid rgba(88,101,242,0.1)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "24px",
          borderBottom: "1px solid rgba(88,101,242,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h3
          style={{
            ...(F.headlineMd as CSSProperties),
            fontSize: "20px",
            color: "white",
            margin: 0,
          }}
        >
          最近のファイル
        </h3>
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 700,
            color: ACCENT,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          すべて表示
        </button>
      </div>

      {/* Rows */}
      <div>
        {loading && (
          <div style={{ padding: 24, textAlign: "center", color: C.outline, fontSize: 14 }}>Loading...</div>
        )}
        {error && (
          <div style={{ padding: 24, textAlign: "center", color: "#f87171", fontSize: 14 }}>Failed to load</div>
        )}
        {!loading && !error && files.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: C.outline, fontSize: 14 }}>No files yet</div>
        )}
        {files.slice(0, 5).map((file, idx) => {
          const { icon, color } = fileIcon(file.name);
          return (
            <div
              key={file.name}
              style={{
                padding: "16px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: idx < Math.min(files.length, 5) - 1 ? "1px solid rgba(88,101,242,0.05)" : "none",
                transition: "background-color 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(88,101,242,0.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    backgroundColor: "#0f172a",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(88,101,242,0.1)",
                  }}
                >
                  <Icon name={icon} style={{ color }} />
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0", margin: 0 }}>
                    {file.name}
                  </p>
                  <p style={{ fontSize: "10px", color: C.outline, margin: 0 }}>
                    {formatBytes(file.size)} • {formatRelativeTime(file.modified)}
                  </p>
                </div>
              </div>
              <button
                style={{ background: "none", border: "none", cursor: "pointer", color: C.outlineVariant }}
                onClick={() => window.open(getDownloadUrl(file.name), "_blank")}
              >
                <Icon name="download" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default RecentFiles;
