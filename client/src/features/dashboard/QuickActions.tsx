import { Icon } from "../../components/Icon";
import { C } from "../../theme/tokens";
import type { CSSProperties } from "react";

const ACCENT_L = C.primary;

const labelSm: CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  color: C.onSurfaceVariant,
  textTransform: "uppercase",
  letterSpacing: "0.2em",
};

const actions = [
  { icon: "add_to_photos", label: "新規チャンネル" },
  { icon: "upload_file",   label: "アップロード"   },
  { icon: "lock",          label: "Vault 管理"      },
  { icon: "person_add",    label: "招待"            },
] as const;

export function QuickActions() {
  return (
    <div>
      <h3 style={{ ...labelSm, marginBottom: "16px" }}>クイックアクション</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {actions.map((action) => (
          <button
            key={action.label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              padding: "24px",
              borderRadius: "8px",
              border: "1px solid rgba(88,101,242,0.1)",
              background: "none",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.border = "1px solid rgba(88,101,242,0.4)";
              el.style.backgroundColor = "rgba(88,101,242,0.05)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.border = "1px solid rgba(88,101,242,0.1)";
              el.style.backgroundColor = "transparent";
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: C.surfaceContainerLow,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={action.icon} style={{ color: ACCENT_L }} />
            </div>
            <span style={{ fontSize: "14px", fontWeight: 700, color: C.onSurfaceVariant }}>
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
export default QuickActions;