import { useRef, useState } from "react";
import { C, F } from "../../theme/tokens";
import { Icon } from "../Icon";
import { createCollection, uploadCollectionImage } from "../../api/collections";

const PRESET_COLORS = [
  "#bec2ff", "#ffb689", "#e3e1ed", "#f28b82", "#81c995", "#78d9ec",
];

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateCollectionModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, _setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon] = useState("folder");
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }

    console.log("File selected:", file.name);
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    setError(null);
    try {
      console.log("Starting upload...");
      const url = await uploadCollectionImage(file);
      console.log("Upload successful, URL:", url);
      setImageURL(url);
    } catch (e) {
      console.error("Upload error:", e);
      setError("画像のアップロードに失敗しました");
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };
  
  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createCollection({
        name,
        description,
        color,
        icon,
        image_url: imageURL ?? undefined,
      });
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

        {/* Image Upload */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: C.outlineVariant, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            アイコン画像
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Preview */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                background: imagePreview ? "transparent" : `${C.surfaceVariant}80`,
                border: `2px dashed ${C.outlineVariant}55`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                overflow: "hidden",
                flexShrink: 0,
                transition: "border-color 0.2s",
              }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Icon name="add_photo_alternate" size={28} />
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  background: `${C.surfaceVariant}80`,
                  border: `1px solid ${C.outlineVariant}33`,
                  borderRadius: 10,
                  padding: "8px 16px",
                  color: C.onSurface,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: uploading ? "default" : "pointer",
                  fontFamily: F.family,
                }}
              >
                {uploading ? "アップロード中..." : "画像を選択"}
              </button>
              <span style={{ fontSize: 12, color: C.outlineVariant }}>
                JPG / PNG / WebP
              </span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif"
            style={{ display: "none" }}
            onChange={handleImageChange}
          />
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
            disabled={!name.trim() || loading || uploading}
            style={{
              flex: 2,
              background: name.trim() && !uploading ? C.primaryContainer : `${C.surfaceVariant}4d`,
              border: "none",
              borderRadius: 12,
              padding: "12px 0",
              color: name.trim() && !uploading ? C.onPrimaryContainer : C.outlineVariant,
              fontWeight: 800,
              fontSize: 15,
              cursor: name.trim() && !uploading ? "pointer" : "default",
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
