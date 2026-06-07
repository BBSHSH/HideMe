import { useState, useEffect } from "react";
import { C, F } from "../../theme/tokens";
import { Icon } from "../Icon";
import { useIsMobile } from "../../hooks/useIsMobile";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function getToken() {
  return JSON.parse(localStorage.getItem("hideme_auth") || "{}").token ?? "";
}

function InfoCard({
  icon, label, value, sub, color = C.primary,
}: {
  icon: string; label: string; value: string; sub: string; color?: string;
}) {
  return (
    <div style={{
      flex: 1,
      background: `${color}0d`,
      border: `1px solid ${color}28`,
      borderRadius: 14,
      padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 12,
      minWidth: 0,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: `${color}1a`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={icon} size={19} style={{ color }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>{label}</p>
        <p style={{
          margin: "3px 0 1px", fontSize: 18, fontWeight: 900,
          color: C.onSurface, letterSpacing: "-0.03em", fontFamily: F.family,
          lineHeight: 1,
        }}>{value}</p>
        <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{sub}</p>
      </div>
    </div>
  );
}

interface StorageStatsProps {
  onUploadClick?: () => void;
}

export default function StorageStats({ onUploadClick }: StorageStatsProps = {}) {
  const [totalFiles,  setTotalFiles]  = useState<number>(0);
  const [totalSizeB,  setTotalSizeB]  = useState<number>(0);
  const [collections, setCollections] = useState<number>(0);
  const [loading,     setLoading]     = useState(true);
  const isMobile = useIsMobile();

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
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
      gap: isMobile ? 10 : 12,
    }}>
      <InfoCard
        icon="storage"
        label="使用ストレージ"
        value={dash ?? formatBytes(totalSizeB)}
        sub={dash ?? `${totalFiles.toLocaleString()} ファイル`}
        color="#5865f2"
      />
      <InfoCard
        icon="insert_drive_file"
        label="総ファイル数"
        value={dash ?? totalFiles.toLocaleString()}
        sub={dash ?? formatBytes(totalSizeB)}
        color="#34d399"
      />
      {/* モバイルで3つ目は2列分 */}
      <div style={{ gridColumn: isMobile ? "1 / -1" : undefined, display: "flex" }}>
        <InfoCard
          icon="collections_bookmark"
          label="コレクション"
          value={dash ?? String(collections)}
          sub={dash ?? `${totalFiles} ファイル`}
          color="#f472b6"
        />
      </div>
    </div>
  );
}
