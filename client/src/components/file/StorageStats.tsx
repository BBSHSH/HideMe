import { useState, useEffect } from "react";
import { C, F } from "../../theme/tokens";
import { Icon } from "../Icon";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function getToken() {
  return JSON.parse(localStorage.getItem("hideme_auth") || "{}").token ?? "";
}

// ─── 統一カードスタイル（Dashboard と同じ） ───────────────
const cardBase = {
  flex: 1,
  background: "rgba(88,101,242,0.06)",
  border: "1px solid rgba(88,101,242,0.18)",
  borderRadius: 12,
  padding: "10px 14px",
  display: "flex",
  alignItems: "center",
  gap: 12,
} as const;

function InfoCard({ icon, label, value, sub }: { icon: string; label: string; value: string; sub: string }) {
  return (
    <div style={cardBase}>
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: "rgba(88,101,242,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={icon} size={17} style={{ color: C.primary }} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#454655",
          textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
        <p style={{ margin: "1px 0 0", fontSize: 16, fontWeight: 800, color: "#e3e1ed",
          letterSpacing: "-0.02em", fontFamily: F.family }}>{value}</p>
        <p style={{ margin: 0, fontSize: 10, color: C.outline }}>{sub}</p>
      </div>
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────
interface StorageStatsProps {
  onUploadClick?: () => void;
}

export default function StorageStats({ onUploadClick }: StorageStatsProps = {}) {
  const [totalFiles,   setTotalFiles]   = useState<number>(0);
  const [totalSizeB,   setTotalSizeB]   = useState<number>(0);
  const [collections,  setCollections]  = useState<number>(0);
  const [loading,      setLoading]      = useState(true);
  const [btnHover,     setBtnHover]     = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/v1/stats`).then((r) => r.json()),
      fetch(`${BASE_URL}/v1/collections`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      }).then((r) => r.json()),
    ])
      .then(([stats, cols]) => {
        setTotalFiles(stats.total_files ?? 0);
        setTotalSizeB(stats.total_size_bytes ?? 0);
        setCollections((cols?.items ?? []).length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const dash = loading ? "—" : undefined;

  return (
    <div style={{ display: "flex", alignItems: "stretch", gap: 14 }}>
      <InfoCard
        icon="storage"
        label="使用ストレージ"
        value={dash ?? formatBytes(totalSizeB)}
        sub={dash ?? `${totalFiles.toLocaleString()} ファイル`}
      />
      <InfoCard
        icon="folder_open"
        label="総ファイル数"
        value={dash ?? totalFiles.toLocaleString()}
        sub={dash ?? formatBytes(totalSizeB)}
      />
      <InfoCard
        icon="collections"
        label="コレクション数"
        value={dash ?? String(collections)}
        sub={dash ?? `${totalFiles.toLocaleString()} ファイル · ${formatBytes(totalSizeB)}`}
      />

      {/* アップロードボタン */}
      {onUploadClick && (
        <button
          onClick={onUploadClick}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
            padding: "10px 18px",
            borderRadius: 12,
            border: `1px solid rgba(88,101,242,${btnHover ? "0.5" : "0.3"})`,
            background: btnHover ? "rgba(88,101,242,0.2)" : "rgba(88,101,242,0.08)",
            color: btnHover ? "#bec2ff" : C.primary,
            fontWeight: 700, fontSize: 13,
            cursor: "pointer", transition: "all 0.2s",
            fontFamily: F.family, whiteSpace: "nowrap",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>upload</span>
          アップロード
        </button>
      )}
    </div>
  );
}
