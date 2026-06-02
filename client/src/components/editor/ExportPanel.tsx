import { Icon } from "../Icon";
import { C, F } from "../../theme/tokens";

export default function ExportPanel() {
  return (
    <div
      style={{
        padding: 16,
        backgroundColor: "rgba(26,27,35,0.6)",
        borderTop: `1px solid ${C.outlineVariant}`,
      }}
    >
      <button
        style={{
          width: "100%",
          padding: "16px 0",
          backgroundColor: C.primary,
          color: C.onPrimary,
          ...F.bodyMd,
          fontWeight: 700,
          border: "none",
          borderRadius: 4,
          boxShadow: `0 0 20px rgba(88,101,242,0.3)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: "pointer",
          transition: "transform 0.1s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform = "scale(1.02)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform = "scale(1)")
        }
        onMouseDown={(e) =>
          (e.currentTarget.style.transform = "scale(0.98)")
        }
        onMouseUp={(e) =>
          (e.currentTarget.style.transform = "scale(1.02)")
        }
      >
        <Icon
          name="enhanced_encryption"
          size={24}
          style={{ color: C.onPrimary }}
        />
        安全に書き出す
      </button>

      <p
        style={{
          fontSize: 9,
          textAlign: "center",
          color: C.outline,
          marginTop: 8,
        }}
      >
        最終セーブ: 1分前
      </p>
    </div>
  );
}