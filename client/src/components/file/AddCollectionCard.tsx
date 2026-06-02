import { useState } from "react";

export default function AddCollectionCard() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        border: `2px dashed ${hovered ? `#bec2ff80` : `#4546554d`}`,
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        gap: 16,
        cursor: "pointer",
        background: hovered ? `#bec2ff0d` : "transparent",
        transition: "all 0.3s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 9999,
          background: hovered ? "#5865f2" : "#34343d",
          color: hovered ? "#fffdff" : "#e3e1ed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s",
          fontSize: 40,
        }}
        className="material-symbols-outlined"
      >
        add
      </div>
      <div style={{ textAlign: "center" }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#e3e1ed" }}>Create New</h3>
        <p style={{ margin: "4px 0 0", fontSize: 16, color: "#c6c5d7" }}>Organize your content</p>
      </div>
    </div>
  );
}
