import { glassPanel } from "./styles";
import { vaultStatus } from "../../data/files";

export default function VaultStatusToast() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        right: 32,
        ...glassPanel,
        padding: "12px 20px",
        borderRadius: 24,
        display: "flex",
        alignItems: "center",
        gap: 20,
        boxShadow: "0 0 20px rgba(88,101,242,0.3), 0 25px 50px -12px rgba(0,0,0,0.5)",
        border: `1px solid #bec2ff33`,
        zIndex: 60,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            width: 12,
            height: 12,
            background: "#22c55e",
            borderRadius: 9999,
            boxShadow: "0 0 10px rgba(34,197,94,0.8)",
            animation: "pulse 2s infinite",
          }}
        />
        <span style={{ fontSize: 16, fontWeight: 800, color: "#e3e1ed" }}>{vaultStatus.label}</span>
      </div>
      <div style={{ width: 1, height: 32, background: `#45465533` }} />
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#454655",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Last sync: {vaultStatus.lastSync}
      </span>
    </div>
  );
}
