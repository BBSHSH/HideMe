import { glassPanel } from "./styles";
import RecentFileRow from "./RecentFileRow";
import { useStorageFiles } from "../../hooks/useFiles";
import { getDownloadUrl } from "../../api/files";
import { formatBytes, formatRelativeTime } from "../../utils/format";
import { C } from "../../theme/tokens";

const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".mkv", ".avi", ".flv", ".wmv"];
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];

function fileIcon(name: string): { icon: string; color: string } {
  const lower = name.toLowerCase();
  if (VIDEO_EXTS.some((e) => lower.endsWith(e))) return { icon: "movie", color: "#818cf8" };
  if (IMAGE_EXTS.some((e) => lower.endsWith(e))) return { icon: "image", color: "#34d399" };
  if (lower.endsWith(".pdf")) return { icon: "picture_as_pdf", color: "#f87171" };
  return { icon: "insert_drive_file", color: C.primary };
}

export default function RecentActivity() {
  const { files, loading, error } = useStorageFiles();

  return (
    <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#e3e1ed", letterSpacing: "-0.02em" }}>
        Recent Activity
      </h2>
      <div
        style={{
          ...glassPanel,
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid #4546551a`,
        }}
      >
        <div
          style={{
            padding: 20,
            borderBottom: `1px solid #4546551a`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <span className="material-symbols-outlined" style={{ color: "#bec2ff" }}>
            history
          </span>
          <span style={{ fontWeight: 700, fontSize: 20 }}>Latest files uploaded to vault</span>
        </div>
        <div>
          {loading && (
            <div style={{ padding: 32, textAlign: "center", color: "#8f8fa0" }}>Loading...</div>
          )}
          {error && (
            <div style={{ padding: 32, textAlign: "center", color: "#f87171" }}>Failed to load files</div>
          )}
          {!loading && !error && files.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: "#8f8fa0" }}>No files yet</div>
          )}
          {files.map((file, index) => {
            const { icon, color } = fileIcon(file.name);
            return (
              <div key={file.name}>
                <RecentFileRow
                  icon={icon}
                  iconColor={color}
                  name={file.name}
                  meta={`${formatRelativeTime(file.modified)} • ${formatBytes(file.size)}`}
                  downloadUrl={getDownloadUrl(file.name)}
                />
                {index < files.length - 1 && (
                  <div style={{ height: 1, background: `#4546550d` }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
