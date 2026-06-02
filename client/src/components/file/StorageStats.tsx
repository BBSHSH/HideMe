import { glassPanel } from "./styles";
import { storageStats } from "../../data/files";

export default function StorageStats() {
  const progressWidth = `${storageStats.usedRatio * 100}%`;
  const listActive = storageStats.viewMode === "list";
  const gridActive = storageStats.viewMode === "grid";

  return (
    <div
      style={{
        ...glassPanel,
        borderRadius: 16,
        padding: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 40,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span
            style={{
              color: "#454655",
              fontWeight: 700,
              fontSize: 14,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Total Vault Usage
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: "#e3e1ed", letterSpacing: "-0.02em" }}>
              {storageStats.used}
            </span>
            <span style={{ fontSize: 20, color: "#454655" }}> / {storageStats.total}</span>
          </div>
        </div>
        {/* Progress bar */}
        <div
          style={{
            width: 320,
            height: 12,
            background: "#34343d",
            borderRadius: 9999,
            overflow: "hidden",
            display: "flex",
          }}
        >
          <div style={{ width: progressWidth, height: "100%", background: "#bec2ff" }} />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 40,
          borderLeft: `1px solid #4546551a`,
          paddingLeft: 40,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: "#454655", fontWeight: 700, fontSize: 14, textTransform: "uppercase", marginBottom: 4 }}>
            Status
          </span>
          <span style={{ color: "#bec2ff", fontWeight: 700, display: "flex", alignItems: "center", gap: 8, fontSize: 20 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              {storageStats.statusIcon}
            </span>
            {storageStats.statusLabel}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: "#454655", fontWeight: 700, fontSize: 14, textTransform: "uppercase", marginBottom: 4 }}>
            Active Items
          </span>
          <span style={{ color: "#e3e1ed", fontWeight: 800, fontSize: 20 }}>{storageStats.activeItems}</span>
        </div>
      </div>

      {/* View toggles */}
      <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
        <button
          style={{
            padding: 12,
            background: listActive ? `#bec2ff1a` : "none",
            border: listActive ? `1px solid #bec2ff33` : "none",
            color: listActive ? "#bec2ff" : "#c6c5d7",
            borderRadius: 12,
            cursor: "pointer",
            fontSize: 24,
          }}
          className="material-symbols-outlined"
        >
          list
        </button>
        <button
          style={{
            padding: 12,
            background: gridActive ? `#bec2ff1a` : "none",
            border: gridActive ? `1px solid #bec2ff33` : "none",
            color: gridActive ? "#bec2ff" : "#c6c5d7",
            borderRadius: 12,
            cursor: "pointer",
            fontSize: 24,
          }}
          className="material-symbols-outlined"
        >
          grid_view
        </button>
      </div>
    </div>
  );
}
