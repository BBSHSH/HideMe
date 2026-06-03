import { useState } from "react";
import { C } from "../../theme/tokens";
import { Icon } from "../Icon";

interface AddCollectionCardProps {
  onClick: () => void;
}

export default function AddCollectionCard({ onClick }: AddCollectionCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `2px dashed ${hovered ? `${C.primary}80` : `${C.outlineVariant}4d`}`,
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        gap: 16,
        cursor: "pointer",
        background: hovered ? `${C.primary}0d` : "transparent",
        transition: "all 0.3s",
        minHeight: 300,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 9999,
          background: hovered ? C.primaryContainer : C.surfaceVariant,
          color: hovered ? C.onPrimaryContainer : C.onSurface,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s",
        }}
      >
        <Icon name="add" size={40} />
      </div>
      <div style={{ textAlign: "center" }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.onSurface }}>Create New</h3>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: C.onSurfaceVariant }}>Organize your content</p>
      </div>
    </div>
  );
}