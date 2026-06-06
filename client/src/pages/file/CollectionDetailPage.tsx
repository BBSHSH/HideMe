import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { C, F } from "../../theme/tokens";
import { Icon } from "../../components/Icon";
import { useAuth } from "../../context/AuthContext";
import { useCollections } from "../../hooks/useFiles";
import EditCollectionModal from "../../components/file/EditCollectionModal";
import FileUploadButton from "../../components/file/FileUploadButton";
import FileListPanel from "../../components/file/FileListPanel";

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { collections } = useCollections();
  const [openEdit, setOpenEdit] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const collection = collections.find((c) => c.ID === id);

  if (!collection) {
    return (
      <div style={{ padding: 48, color: C.outlineVariant, textAlign: "center" }}>
        コレクションが見つかりません
      </div>
    );
  }

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div style={{ padding: 48, display: "flex", flexDirection: "column", gap: 32, overflowY: "auto", flex: 1 }}>
      {openEdit && (
        <EditCollectionModal
          collection={collection}
          onClose={() => setOpenEdit(false)}
          onUpdated={() => { setOpenEdit(false); handleRefresh(); }}
          onDeleted={() => { setOpenEdit(false); navigate("/file"); }}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 16,
            background: collection.ImageURL ? "transparent" : C.surfaceVariant,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {collection.ImageURL ? (
            <img src={collection.ImageURL} alt={collection.Name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Icon name={collection.Icon || "folder"} size={60} style={{ color: C.onSurfaceVariant }} />
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: C.onSurface, fontFamily: F.family, letterSpacing: "-0.03em" }}>
            {collection.Name}
          </h1>
          {collection.Description && (
            <p style={{ margin: 0, fontSize: 16, color: C.outlineVariant }}>{collection.Description}</p>
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <button
              onClick={() => navigate("/file")}
              style={{
                background: C.surfaceVariant,
                color: C.onSurface,
                border: `1px solid ${C.outlineVariant}33`,
                borderRadius: 12,
                padding: "10px 20px",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: F.family,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Icon name="arrow_back" size={18} />
              戻る
            </button>
            {isAdmin && (
              <button
                onClick={() => setOpenEdit(true)}
                style={{
                  background: C.primaryContainer,
                  color: C.onPrimaryContainer,
                  border: "none",
                  borderRadius: 12,
                  padding: "10px 20px",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  fontFamily: F.family,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Icon name="edit" size={18} />
                編集
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upload */}
      <FileUploadButton collectionId={id!} fileType="all" onRefresh={handleRefresh} />

      {/* Files — このコレクションのみ表示 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: C.onSurface, fontFamily: F.family }}>
          ファイル
        </h2>
        <FileListPanel collectionId={id!} refreshKey={refreshKey} />
      </div>
    </div>
  );
}
