import { useState } from "react";
import { C, F } from "../../theme/tokens";
import { Icon } from "../Icon";
import { createCollection } from "../../api/collections";

const PRESET_COLORS = [
  "#bec2ff", "#ffb689", "#e3e1ed", "#f28b82", "#81c995", "#78d9ec",
];

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateCollectionModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState("folder");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createCollection({ name, description, color, icon });
      onCreated();
      onClose();
    } catch {
      setError("作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 101,
          width: 480,
          background: "linear-gradient(180deg, rgba(30,31,48,0.98) 0%, rgba(18,19,27,0.98) 100%)",
          border: `1px solid ${C.outlineVariant}33`,
          borderRadius: 24,
          padding: 32,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.onSurface, fontFamily: F.family }}>
            新しいコレクション
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: C.onSurfaceVariant, cursor: "pointer", padding: 4 }}
          >
            <Icon name="close" size={22} />
          </button>
        </div>

        {/* Name */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: C.outlineVariant, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            名前 *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="コレクション名"
            style={{
              background: `${C.surfaceVariant}80`,
              border: `1px solid ${C.outlineVariant}33`,
              borderRadius: 12,
              padding: "12px 16px",
              color: C.onSurface,
              fontSize: 15,
              fontFamily: F.family,
              outline: "none",
            }}
          />
        </div>

        {/* Description */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: C.outlineVariant, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            説明
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="任意"
            style={{
              background: `${C.surfaceVariant}80`,
              border: `1px solid ${C.outlineVariant}33`,
              borderRadius: 12,
              padding: "12px 16px",
              color: C.onSurface,
              fontSize: 15,
              fontFamily: F.family,
              outline: "none",
            }}
          />
        </div>

        {/* Color */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: C.outlineVariant, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            カラー
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9999,
                  background: c,
                  border: color === c ? `3px solid ${C.onSurface}` : "3px solid transparent",
                  cursor: "pointer",
                  transition: "border 0.2s",
                }}
              />
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <span style={{ color: "#f87171", fontSize: 14 }}>{error}</span>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: `${C.surfaceVariant}4d`,
              border: "none",
              borderRadius: 12,
              padding: "12px 0",
              color: C.onSurfaceVariant,
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              fontFamily: F.family,
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            style={{
              flex: 2,
              background: name.trim() ? C.primaryContainer : `${C.surfaceVariant}4d`,
              border: "none",
              borderRadius: 12,
              padding: "12px 0",
              color: name.trim() ? C.onPrimaryContainer : C.outlineVariant,
              fontWeight: 800,
              fontSize: 15,
              cursor: name.trim() ? "pointer" : "default",
              fontFamily: F.family,
              transition: "all 0.2s",
            }}
          >
            {loading ? "作成中..." : "作成する"}
          </button>
        </div>
      </div>
    </>
  );
}