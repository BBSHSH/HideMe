import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { C, F, glassPanel } from "../../theme/tokens";
import { Icon } from "../../components/Icon";
import { useAuth } from "../../context/AuthContext";
import { useCollections } from "../../hooks/useFiles";
import { useEffect } from "react";
import type { CollectionFile } from "../../data/files";
import EditCollectionModal from "../../components/file/EditCollectionModal";

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { collections } = useCollections();
  const [openEdit, setOpenEdit] = useState(false);

  const collection = collections.find((c) => c.ID === id);

  if (!collection) {
    return (
      <div style={{ padding: 48, color: C.outlineVariant, textAlign: "center" }}>
        コレクションが見つかりません
      </div>
    );
  }
  const handleCollectionUpdated = () => {
    // コレクション一覧を再取得するために、ページをリロード
    window.location.reload();
  };
  const handleCollectionDeleted = () => {
    // 削除後は /file に戻る
    navigate("/file");
  };
  return (
    <div style={{ padding: 48, display: "flex", flexDirection: "column", gap: 32 }}>
      {openEdit && (
        <EditCollectionModal
          collection={collection}
          onClose={() => setOpenEdit(false)}
          onUpdated={handleCollectionUpdated}
          onDeleted={handleCollectionDeleted}
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
          }}
        >
          {collection.ImageURL ? (
            <img
              src={collection.ImageURL}
              alt={collection.Name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Icon name={collection.Icon || "folder"} size={60} style={{ color: C.onSurfaceVariant }} />
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: C.onSurface, fontFamily: F.family, letterSpacing: "-0.03em" }}>
            {collection.Name}
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: C.outlineVariant }}>
            {collection.Description}
          </p>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {/* ... 既存のコード ... */}
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
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
      </div>

      {/* Upload Section */}
      <UploadSection collectionId={id!} />

      {/* Files List */}
      <FilesList collectionId={id!} />
      {openEdit && collection && (
      <EditCollectionModal
        collection={collection}
        onClose={() => setOpenEdit(false)}
        onUpdated={() => {
          setOpenEdit(false);
          // 必要なら再取得ロジック
        }}
        onDeleted={() => {
          setOpenEdit(false);
          navigate("/file");
        }}
      />
    )}

    </div>
  );
}

function UploadSection({ collectionId }: { collectionId: string }) {
  const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
        const form = new FormData();
        form.append("file", file);

        const token = JSON.parse(localStorage.getItem("hideme_auth") || "{}").token;
        
        const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"}/v1/collections/${collectionId}/files`,
        {
            method: "POST",
            headers: {
            Authorization: `Bearer ${token}`,
            },
            body: form,
        }
        );

        const data = await response.json();
        console.log("Upload response:", data); // ← ここで詳細を確認

        if (response.ok) {
        window.location.reload();
        } else {
        console.error("Upload failed:", data);
        }
    } finally {
        setUploading(false);
    }
};

  return (
    <div style={{ ...glassPanel, padding: 24, borderRadius: 16 }}>
      <label
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 32,
          border: `2px dashed ${C.primary}80`,
          borderRadius: 12,
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        <Icon name="cloud_upload" size={40} style={{ color: C.primary }} />
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: C.onSurface }}>
            ファイルをアップロード
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: C.outlineVariant }}>
            ドラッグ&ドロップまたはクリック
          </p>
        </div>
        <input
          type="file"
          onChange={handleUpload}
          disabled={uploading}
          style={{ display: "none" }}
        />
      </label>
    </div>
  );
}

function FilesList({ collectionId }: { collectionId: string }) {
  const [files, setFiles] = useState<CollectionFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"}/v1/collections/${collectionId}/files`
        );

        const data = await res.json();
        console.log("FILES RESPONSE:", data);

        // ★ ここで防御（APIが壊れてても落ちない）
        const items = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];

        setFiles(items);
      } catch (err) {
        console.error("fetch error:", err);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [collectionId]);

  // サイズフォーマット（完全防御）
  const formatSize = (size: unknown) => {
    const n = Number(size);
    if (!Number.isFinite(n) || n <= 0) return "0.0 MB";
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  };

  // key生成（絶対安全）
  const getKey = (file: any, index: number) =>
    file?.id ??
    file?.file_name ??
    `${file?.file_size ?? "size"}-${index}`;

  if (loading) {
    return <div style={{ color: C.outlineVariant }}>読み込み中...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2
        style={{
          margin: 0,
          fontSize: 24,
          fontWeight: 700,
          color: C.onSurface,
          fontFamily: F.family,
        }}
      >
        ファイル
      </h2>

      {files.length === 0 ? (
        <div
          style={{
            color: C.outlineVariant,
            textAlign: "center",
            padding: 32,
          }}
        >
          ファイルはまだありません
        </div>
      ) : (
        <div style={{ ...glassPanel, overflow: "hidden", borderRadius: 16 }}>
          {files.map((file, index) => {
            console.log("FILE ITEM:", file);

            return (
              <div key={getKey(file, index)}>
                {index > 0 && (
                  <div
                    style={{
                      height: 1,
                      background: `${C.outlineVariant}0d`,
                    }}
                  />
                )}

                <div
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        color: C.onSurface,
                      }}
                    >
                      {file?.file_name ?? "unknown file"}
                    </h4>

                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 13,
                        color: C.outline,
                      }}
                    >
                      {formatSize(file?.file_size)}
                    </p>
                  </div>

                  <Icon
                    name="insert_drive_file"
                    size={24}
                    style={{ color: C.primary }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}