import { useState } from "react";
import { C } from "../../theme/tokens";
import { Icon } from "../Icon";

interface RecentFileRowProps {
  icon: string;
  iconColor: string;
  name: string;
  meta: string;
  downloadUrl: string;
}

export default function RecentFileRow({
  icon,
  iconColor,
  name,
  meta,
  downloadUrl,
}: RecentFileRowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: hovered ? "rgba(255,255,255,0.03)" : "transparent",
        transition: "background 0.2s",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            background: C.surfaceContainer,
            border: `1px solid ${C.outlineVariant}1a`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon} size={24} style={{ color: iconColor }} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontWeight: 700, fontSize: 16, color: C.onSurface }}>{name}</h4>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: C.outline }}>{meta}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <button
          style={{ background: "none", border: "none", color: C.onSurfaceVariant, cursor: "pointer", padding: 8 }}
          onClick={() => window.open(downloadUrl, "_blank")}
        >
          <Icon name="download" size={20} />
        </button>
        <button style={{ background: "none", border: "none", color: C.onSurfaceVariant, cursor: "pointer", padding: 8 }}>
          <Icon name="delete" size={20} />
        </button>
      </div>
    </div>
  );
}