import { useState } from "react";

type RecentFileRowProps = {
  icon: string;
  iconColor: string;
  name: string;
  meta: string;
};

export default function RecentFileRow({ icon, iconColor, name, meta }: RecentFileRowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        padding: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: hovered ? "rgba(255,255,255,0.03)" : "transparent",
        transition: "background 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "#1f1f27",
            border: `1px solid #4546551a`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            color: iconColor,
          }}
          className="material-symbols-outlined"
        >
          {icon}
        </div>
        <div>
          <h4 style={{ margin: 0, fontWeight: 700, fontSize: 20 }}>{name}</h4>
          <p style={{ margin: "2px 0 0", fontSize: 16, color: "#8f8fa0" }}>{meta}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          style={{ background: "none", border: "none", color: "#c6c5d7", cursor: "pointer", padding: 12, fontSize: 24 }}
          className="material-symbols-outlined"
        >
          download
        </button>
        <button
          style={{ background: "none", border: "none", color: "#c6c5d7", cursor: "pointer", padding: 12, fontSize: 24 }}
          className="material-symbols-outlined"
        >
          delete
        </button>
      </div>
    </div>
  );
}
