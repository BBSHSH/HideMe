import { Icon } from "../../components/Icon";
import { C, F } from "../../theme/tokens";
import type { CSSProperties } from "react";

const ACCENT   = C.primaryContainer;
const ACCENT_L = C.primary;

const tags = [
  { label: "TLS 1.3 Active", accent: true  },
  { label: "Zone: JP-E1",    accent: false },
];

export function VaultStatus() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px",
        backgroundColor: "rgba(88,101,242,0.05)",
        border: "1px solid rgba(88,101,242,0.2)",
        borderRadius: "8px",
        backdropFilter: "blur(16px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ position: "relative" }}>
          <Icon name="verified_user" filled size={36} style={{ color: ACCENT }} />
          <span
            className="animate-pulse"
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              width: "12px",
              height: "12px",
              backgroundColor: ACCENT_L,
              borderRadius: "50%",
            }}
          />
        </div>
        <div>
          <h2
            style={{
              ...(F.headlineMd as CSSProperties),
              color: "white",
              margin: 0,
            }}
          >
            セキュリティ・ペリメーター: 有効
          </h2>
          <p style={{ color: C.onSurfaceVariant, fontSize: "14px", margin: 0 }}>
            暗号化トンネルが正常に動作しています。
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        {tags.map(({ label, accent }) => (
          <span
            key={label}
            style={{
              padding: "4px 12px",
              backgroundColor: accent ? "rgba(88,101,242,0.1)" : C.surfaceContainerLow,
              border: `1px solid ${accent ? "rgba(88,101,242,0.3)" : C.outlineVariant}`,
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: 700,
              color: accent ? ACCENT_L : C.onSurfaceVariant,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
export default VaultStatus;