import { Icon } from "../../components/Icon";
import { C, F } from "../../theme/tokens";
import type { CSSProperties } from "react";

const ACCENT   = C.primaryContainer;
const ACCENT_L = C.primary;

const files = [
  { icon: "encrypted", name: "project_alpha_v2.enc",       meta: "2.4 MB • 12分前"  },
  { icon: "policy",    name: "security_audit_report.pdf",  meta: "1.8 MB • 1時間前" },
  { icon: "database",  name: "client_database_backup.sql", meta: "452 MB • 3時間前" },
] as const;

export function RecentFiles() {
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
        {files.map((file, idx) => (
          <div
            key={idx}
            style={{
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: idx < files.length - 1 ? "1px solid rgba(88,101,242,0.05)" : "none",
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
                <Icon name={file.icon} style={{ color: ACCENT_L }} />
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0", margin: 0 }}>
                  {file.name}
                </p>
                <p style={{ fontSize: "10px", color: C.outline, margin: 0 }}>{file.meta}</p>
              </div>
            </div>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: C.outlineVariant }}>
              <Icon name="more_vert" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
export default RecentFiles;