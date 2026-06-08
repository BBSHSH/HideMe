import { useRef, useState } from "react";
import { C, F } from "../../theme/tokens";
import { Icon } from "../Icon";
import { updateCollection, deleteCollection, uploadCollectionImage } from "../../api/collections";
import type { Collection } from "../../data/files";

const GENRES = [
  { value: "", label: "すべて", icon: "apps" },
  { value: "video", label: "動画", icon: "movie" },
  { value: "image", label: "画像", icon: "image" },
  { value: "audio", label: "音楽", icon: "music_note" },
  { value: "document", label: "書類", icon: "description" },
] as const;

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

function resolveImageURL(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/v1/") || url.startsWith("/")) return `${BASE_URL}${url}`;
  return `${BASE_URL}/v1/files/${encodeURIComponent(url)}`;
}

const PRESET_COLORS = [
  "#bec2ff", "#ffb689", "#e3e1ed", "#f28b82", "#81c995", "#78d9ec",
];

interface Props {
  collection: Collection;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

export default function EditCollectionModal({ collection, onClose, onUpdated, onDeleted }: Props) {
  const [name, setName] = useState(collection.Name);
  const [description, setDescription] = useState(collection.Description);
  const [color, setColor] = useState(collection.Color);
  const [genre, setGenre] = useState(collection.Genre || "");
  const [imageURL, setImageURL] = useState<string | null>(collection.ImageURL || null);
  const [imagePreview, setImagePreview] = useState<string | null>(resolveImageURL(collection.ImageURL));
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    setError(null);
    try {
      const url = await uploadCollectionImage(file);
      setImageURL(url);
    } catch {
      setError("画像のアップロードに失敗しました");
      setImagePreview(resolveImageURL(collection.ImageURL));
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await updateCollection(collection.ID, {
        name,
        description,
        color,
        icon: "folder",
        image_url: imageURL ?? undefined,
        genre,
      });
      onUpdated();
      onClose();
    } catch {
      setError("更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteCollection(collection.ID);
      onDeleted();
      onClose();
    } catch {
      setError("削除に失敗しました");
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

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 102,
            width: 400,
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
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.onSurface, fontFamily: F.family }}>
              本当によろしいですか？
            </h3>
            <p style={{ margin: "12px 0 0", fontSize: 14, color: C.outlineVariant }}>
              「{collection.Name}」を削除します。この操作は取り消せません。
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => setShowDeleteConfirm(false)}
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
              onClick={handleDelete}
              disabled={loading}
              style={{
                flex: 1,
                background: "#f87171",
                border: "none",
                borderRadius: 12,
                padding: "12px 0",
                color: "white",
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? "default" : "pointer",
                fontFamily: F.family,
              }}
            >
              {loading ? "削除中..." : "削除する"}
            </button>
          </div>
        </div>
      )}

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
            コレクションを編集
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
                {uploading ? "アップロード中..." : "画像を変更"}
              </button>
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

        {/* Genre */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: C.outlineVariant, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            ジャンル
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {GENRES.map((g) => (
              <button
                key={g.value}
                onClick={() => setGenre(g.value)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: `1.5px solid ${genre === g.value ? color : `${C.outlineVariant}44`}`,
                  background: genre === g.value ? `${color}22` : "transparent",
                  color: genre === g.value ? color : C.onSurfaceVariant,
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  fontFamily: F.family, transition: "all 0.15s",
                }}
              >
                <Icon name={g.icon} size={16} />
                {g.label}
              </button>
            ))}
          </div>
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
        <div style={{ display: "flex", gap: 12 }}>
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
            onClick={handleUpdate}
            disabled={!name.trim() || loading || uploading}
            style={{
              flex: 1,
              background: name.trim() && !uploading ? C.primaryContainer : `${C.surfaceVariant}4d`,
              border: "none",
              borderRadius: 12,
              padding: "12px 0",
              color: name.trim() && !uploading ? C.onPrimaryContainer : C.outlineVariant,
              fontWeight: 800,
              fontSize: 15,
              cursor: name.trim() && !uploading ? "pointer" : "default",
              fontFamily: F.family,
            }}
          >
            {loading ? "保存中..." : "保存"}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading}
            style={{
              background: "#f87171",
              border: "none",
              borderRadius: 12,
              padding: "12px 20px",
              color: "white",
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? "default" : "pointer",
              fontFamily: F.family,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="delete" size={18} />
            削除
          </button>
        </div>
      </div>
    </>
  );
}