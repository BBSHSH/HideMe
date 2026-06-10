import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { C, F } from "../../theme/tokens";
import { Icon } from "../../components/Icon";
import { getCollectionFiles, deleteCollectionFile, recordView, updateCollectionFile } from "../../api/collections";
import { getUsers, UserItem } from "../../api/chat";
import { useCollections } from "../../hooks/useFiles";
import { useAuth } from "../../context/AuthContext";
import { formatBytes, formatRelativeTime } from "../../utils/format";
import VideoThumbnail from "../../components/file/VideoThumbnail";
import { useIsMobile } from "../../hooks/useIsMobile";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

interface CollectionFile {
  id: string;
  collection_id: string;
  file_name: string;
  display_name?: string;
  file_size: number;
  thumbnail_name: string;
  uploaded_at: string;
  uploaded_by: string;
  uploader_name: string;
  uploader_avatar: string;
  view_count?: number;
}

// ─── MetaCell ─────────────────────────────────────────────────────────────────
function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: C.onSurfaceVariant }}>{label}</p>
      <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: C.onSurface, fontFamily: F.family }}>{value}</p>
    </div>
  );
}

// ─── RelatedClip ──────────────────────────────────────────────────────────────
function RelatedClip({ file }: { file: CollectionFile }) {
  const [hover, setHover] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => navigate(`/file/video/${file.id}`)}
      style={{
        display: "flex", gap: 12, cursor: "pointer", borderRadius: 10,
        padding: 8,
        background: hover ? "rgba(255,255,255,0.06)" : "transparent",
        transition: "background 0.2s",
      }}
    >
      <div style={{ width: 100, height: 62, borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
        <VideoThumbnail
          fileName={file.file_name}
          fileSize={0}
          fileId={file.id}
          thumbnailName={file.thumbnail_name}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
        <p style={{
          margin: 0, fontSize: 12, fontWeight: 700,
          color: hover ? C.primary : C.onSurface,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          transition: "color 0.2s",
        }}>
          {file.file_name.replace(/\.[^.]+$/, "")}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: C.onSurfaceVariant }}>
          {formatBytes(file.file_size)} · {formatRelativeTime(file.uploaded_at)}
        </p>
      </div>
    </div>
  );
}

// ─── EditFileModal ────────────────────────────────────────────────────────────
function EditFileModal({
  file,
  collectionId,
  collections,
  isAdmin,
  onClose,
  onSaved,
}: {
  file: CollectionFile;
  collectionId: string;
  collections: { ID: string; Name: string }[];
  isAdmin: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [displayName, setDisplayName] = useState(file.display_name || file.file_name.replace(/\.[^.]+$/, ""));
  const [selectedCollectionId, setSelectedCollectionId] = useState(collectionId);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [uploadedBy, setUploadedBy] = useState(file.uploaded_by || "");
  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdmin) {
      getUsers().then(r => setUsers(r.items || [])).catch(() => {});
    }
  }, [isAdmin]);

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setThumbnail(f);
    const url = URL.createObjectURL(f);
    setThumbPreview(url);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCollectionFile(collectionId, file.id, {
        displayName,
        collectionId: selectedCollectionId,
        thumbnail: thumbnail ?? undefined,
        uploadedBy: isAdmin ? uploadedBy || undefined : undefined,
      });
      onSaved();
    } catch {
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8, color: C.onSurface,
    fontSize: 13, fontFamily: F.family, boxSizing: "border-box",
    outline: "none",
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, backdropFilter: "blur(4px)" }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 201, width: 420, maxWidth: "calc(100vw - 32px)",
        background: "#1a1b24", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 18,
        boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
      }}>
        {/* ヘッダー */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.onSurface, fontFamily: F.family }}>
            動画を編集
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.onSurfaceVariant, display: "flex" }}>
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* 表示名 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            表示名
          </label>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            style={inputStyle}
            placeholder="動画の表示名"
          />
        </div>

        {/* コレクション */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            コレクション
          </label>
          <select
            value={selectedCollectionId}
            onChange={e => setSelectedCollectionId(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            {collections.map(col => (
              <option key={col.ID} value={col.ID} style={{ background: "#1a1b24" }}>
                {col.Name}
              </option>
            ))}
          </select>
        </div>

        {/* アップロード者（管理者のみ） */}
        {isAdmin && users.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              アップロード者
            </label>
            <select
              value={uploadedBy}
              onChange={e => setUploadedBy(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="" style={{ background: "#1a1b24" }}>— 変更しない —</option>
              {users.map(u => (
                <option key={u.id} value={u.id} style={{ background: "#1a1b24" }}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* サムネイル */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            サムネイル
          </label>
          <input ref={thumbInputRef} type="file" accept="image/*" style={{ position: "absolute", width: 0, height: 0, opacity: 0, overflow: "hidden" }} onChange={handleThumbChange} />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 80, height: 50, borderRadius: 6, overflow: "hidden",
              background: "#000", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0,
            }}>
              {thumbPreview ? (
                <img src={thumbPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : file.thumbnail_name ? (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL ?? ""}/v1/files/${encodeURIComponent(file.thumbnail_name)}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="image" size={20} style={{ color: C.outlineVariant }} />
                </div>
              )}
            </div>
            <button
              onClick={() => thumbInputRef.current?.click()}
              style={{
                padding: "7px 14px", borderRadius: 8, cursor: "pointer",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                color: C.onSurface, fontSize: 12, fontWeight: 600,
              }}
            >
              画像を選択
            </button>
          </div>
        </div>

        {/* 保存ボタン */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px", borderRadius: 8, cursor: "pointer",
              background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
              color: C.onSurfaceVariant, fontSize: 13, fontWeight: 600,
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "9px 24px", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer",
              background: "linear-gradient(135deg, #5865f2, #7c3aed)",
              border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── VideoAssetsPage ──────────────────────────────────────────────────────────
export default function VideoAssetsPage() {
  const params = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const { collections } = useCollections();
  const { user } = useAuth();
  const [currentFile, setCurrentFile] = useState<CollectionFile | null>(null);
  const [currentCollectionId, setCurrentCollectionId] = useState("");
  const [relatedFiles, setRelatedFiles] = useState<CollectionFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const fileId = params.fileId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let allFiles: CollectionFile[] = [];
        let colId = "";

        for (const collection of collections) {
          const response = await getCollectionFiles(collection.ID);
          const items: CollectionFile[] = response?.items || [];
          allFiles = [...allFiles, ...items.map(f => ({ ...f, collection_id: collection.ID }))];
          if (items.find((f: CollectionFile) => f.id === fileId)) colId = collection.ID;
        }

        const current = allFiles.find((f) => f.id === fileId);
        setCurrentFile(current || null);
        setCurrentCollectionId(colId);

        // 視聴回数カウント
        if (current && colId) {
          recordView(colId, current.id).catch(() => {});
        }

        if (current && colId) {
          const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".mkv", ".avi", ".flv", ".wmv"];
          const related = allFiles
            .filter(f => f.collection_id === colId && f.id !== fileId && VIDEO_EXTS.some(e => f.file_name.toLowerCase().endsWith(e)))
            .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
            .slice(0, 6);
          setRelatedFiles(related);
        }
      } finally {
        setLoading(false);
      }
    };
    if (fileId && collections.length > 0) fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, collections, refreshKey]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = `${BASE_URL}/v1/files/${encodeURIComponent(currentFile!.file_name)}`;
    a.download = currentFile!.file_name;
    a.click();
  };

  const handleDelete = async () => {
    if (!currentFile || !currentCollectionId) return;
    if (!confirm("このファイルを削除しますか？")) return;
    try {
      await deleteCollectionFile(currentCollectionId, currentFile.id);
      navigate(-1);
    } catch {
      alert("削除に失敗しました");
    }
  };

  const canEdit = user?.role === "admin" || user?.userId === currentFile?.uploaded_by;
  const canDelete = canEdit;
  const isMobile = useIsMobile();
  const displayTitle = currentFile?.display_name || currentFile?.file_name.replace(/\.[^.]+$/, "") || "";

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: C.outlineVariant }}>Loading...</div>;
  if (!currentFile) return <div style={{ padding: 48, textAlign: "center", color: "#f87171" }}>Video not found</div>;

  const handleSaved = () => {
    setShowEdit(false);
    setRefreshKey(k => k + 1);
  };

  return (
    <div style={{
      flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
      overflow: "hidden", boxSizing: "border-box",
    }}>
      {showEdit && (
        <EditFileModal
          file={currentFile}
          collectionId={currentCollectionId}
          collections={collections}
          isAdmin={user?.role === "admin"}
          onClose={() => setShowEdit(false)}
          onSaved={handleSaved}
        />
      )}

      {isMobile ? (
        /* ── モバイル: YouTube風縦レイアウト ── */
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>

          {/* 動画プレイヤー（16:9固定） */}
          <div style={{ width: "100%", aspectRatio: "16/9", background: "#000", flexShrink: 0 }}>
            <video
              src={`${BASE_URL}/v1/files/${encodeURIComponent(currentFile.file_name)}`}
              controls
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          </div>

          {/* タイトル・メタ・アクション */}
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

            {/* 戻るボタン + タイトル */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <button onClick={() => navigate(-1)} style={{
                width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(69,70,85,0.3)",
                background: "transparent", color: C.onSurfaceVariant,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon name="arrow_back" size={18} />
              </button>
              <h1 style={{
                margin: 0, fontSize: 16, fontWeight: 800, color: C.onSurface,
                fontFamily: F.family, lineHeight: 1.35,
              }}>
                {displayTitle}
              </h1>
            </div>

            {/* メタ情報 */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <MetaCell label="サイズ" value={formatBytes(currentFile.file_size)} />
              <MetaCell label="アップロード" value={formatRelativeTime(currentFile.uploaded_at)} />
              <MetaCell label="投稿者" value={currentFile.uploader_name || currentFile.uploaded_by || "Unknown"} />
              {currentFile.view_count != null && <MetaCell label="視聴回数" value={`${currentFile.view_count.toLocaleString()}回`} />}
            </div>

            {/* アクション */}
            <div style={{ display: "flex", gap: 8 }}>
              <ActionBtn icon="download" label="DL" onClick={handleDownload} />
              {canEdit && <ActionBtn icon="edit" label="編集" onClick={() => setShowEdit(true)} />}
              {canDelete && <ActionBtn icon="delete" label="削除" danger onClick={handleDelete} />}
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* 関連動画リスト */}
          <div style={{ padding: "0 16px 40px", display: "flex", flexDirection: "column", gap: 4 }}>
            {relatedFiles.length > 0 && (
              <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: C.onSurfaceVariant }}>
                関連動画
              </p>
            )}
            {relatedFiles.map(f => <RelatedClip key={f.id} file={f} />)}
          </div>
        </div>

      ) : (
        /* ── デスクトップ: 従来の横2カラム ── */
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "16px 24px", gap: 12, overflow: "hidden" }}>

          {/* ヘッダー */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <button onClick={() => navigate(-1)} style={{
              width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(69,70,85,0.3)",
              background: "transparent", color: C.onSurfaceVariant,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="arrow_back" size={18} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                margin: 0, fontSize: 18, fontWeight: 700, color: C.onSurface,
                fontFamily: F.family, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {displayTitle}
              </h1>
            </div>
            <div style={{ display: "flex", gap: 24, alignItems: "center", flexShrink: 0 }}>
              <MetaCell label="File Size" value={formatBytes(currentFile.file_size)} />
              <MetaCell label="Upload Date" value={formatRelativeTime(currentFile.uploaded_at)} />
              <MetaCell label="Uploaded By" value={currentFile.uploader_name || currentFile.uploaded_by || "Unknown"} />
              {currentFile.view_count != null && <MetaCell label="視聴回数" value={`${currentFile.view_count.toLocaleString()}回`} />}
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <ActionBtn icon="download" label="ダウンロード" onClick={handleDownload} />
              {canEdit && <ActionBtn icon="edit" label="編集" onClick={() => setShowEdit(true)} />}
              {canDelete && <ActionBtn icon="delete" label="削除" danger onClick={handleDelete} />}
            </div>
          </div>

          {/* メインコンテンツ */}
          <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
            <div style={{ borderRadius: 12, overflow: "hidden", background: "#000", border: "1px solid rgba(69,70,85,0.4)" }}>
              <video
                src={`${BASE_URL}/v1/files/${encodeURIComponent(currentFile.file_name)}`}
                controls
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.onSurfaceVariant, flexShrink: 0 }}>
                Related Files
              </h2>
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                {relatedFiles.length === 0
                  ? <p style={{ color: C.outlineVariant, fontSize: 13 }}>No related files</p>
                  : relatedFiles.map(f => <RelatedClip key={f.id} file={f} />)
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────
function ActionBtn({ icon, label, onClick, danger = false }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      title={label}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: 36, paddingInline: 14, borderRadius: 8, gap: 6,
        border: `1px solid ${danger ? `${C.error}44` : "rgba(69,70,85,0.3)"}`,
        background: hover ? (danger ? `${C.error}1a` : `${C.primary}1a`) : "rgba(255,255,255,0.03)",
        color: danger ? C.error : hover ? C.primary : C.onSurfaceVariant,
        cursor: "pointer", display: "flex", alignItems: "center",
        fontSize: 12, fontWeight: 600, transition: "all 0.2s",
      }}
    >
      <Icon name={icon} size={16} />
      <span>{label}</span>
    </button>
  );
}
