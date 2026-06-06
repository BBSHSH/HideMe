import { useState, useRef, useEffect } from "react";
import { C, F } from "../../theme/tokens";
import { Icon } from "../Icon";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

interface Collection {
  ID: string;
  Name: string;
}

interface UploadModalProps {
  onClose: () => void;
  onUploaded?: () => void;
}

export default function UploadModal({ onClose, onUploaded }: UploadModalProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName]         = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [progress, setProgress]         = useState<number | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [done, setDone]                 = useState(false);
  const [dragOver, setDragOver]         = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // コレクション一覧取得
  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("hideme_auth") || "{}").token ?? "";
    fetch(`${BASE_URL}/v1/collections`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => {
        const items: Collection[] = d?.items ?? [];
        setCollections(items);
        if (items.length > 0) setCollectionId(items[0].ID);
      })
      .catch(() => {});
  }, []);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setFileName(file.name);
    setError(null);
    setDone(false);
    setProgress(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = () => {
    if (!selectedFile || !collectionId || !fileName.trim()) return;
    setError(null);
    setProgress(0);

    const token = JSON.parse(localStorage.getItem("hideme_auth") || "{}").token ?? "";
    const form  = new FormData();
    // ファイル名を変更して送信（FormData の第3引数がサーバー側の file.Filename になる）
    form.append("file", selectedFile, fileName.trim());

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setProgress(100);
        setDone(true);
        onUploaded?.();
      } else {
        setError(`アップロード失敗 (${xhr.status})`);
        setProgress(null);
      }
    });
    xhr.addEventListener("error", () => {
      setError("ネットワークエラーが発生しました");
      setProgress(null);
    });
    xhr.open("POST", `${BASE_URL}/v1/collections/${collectionId}/files`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(form);
  };

  const uploading = progress !== null && !done;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#1a1b26",
          border: `1px solid ${C.outlineVariant}33`,
          borderRadius: 20,
          padding: 32,
          width: 480,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* ヘッダー */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.onSurface, fontFamily: F.family }}>
            ファイルをアップロード
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: C.outlineVariant, cursor: "pointer", padding: 4 }}
          >
            <Icon name="close" size={22} />
          </button>
        </div>

        {/* ファイル選択エリア */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? C.primary : selectedFile ? C.primary + "88" : C.outlineVariant + "44"}`,
            borderRadius: 12,
            padding: "24px 16px",
            textAlign: "center",
            cursor: "pointer",
            background: dragOver ? `${C.primary}0d` : selectedFile ? `${C.primary}08` : "transparent",
            transition: "all 0.2s",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
          />
          {selectedFile ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <Icon name="check_circle" size={22} style={{ color: C.primary }} />
              <span style={{ color: C.onSurface, fontWeight: 600, fontSize: 14 }}>
                {selectedFile.name}
              </span>
            </div>
          ) : (
            <>
              <Icon name="cloud_upload" size={36} style={{ color: C.outlineVariant }} />
              <p style={{ margin: "8px 0 0", color: C.outlineVariant, fontSize: 14 }}>
                クリックまたはドラッグ＆ドロップ
              </p>
            </>
          )}
        </div>

        {/* ファイル名変更 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.outlineVariant, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            ファイル名
          </label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="ファイル名を入力"
            style={{
              background: C.surfaceContainer,
              border: `1px solid ${C.outlineVariant}44`,
              borderRadius: 10,
              padding: "10px 14px",
              color: C.onSurface,
              fontSize: 14,
              fontFamily: F.family,
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* アップロード先コレクション */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.outlineVariant, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            アップロード先コレクション
          </label>
          <select
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value)}
            style={{
              background: C.surfaceContainer,
              border: `1px solid ${C.outlineVariant}44`,
              borderRadius: 10,
              padding: "10px 14px",
              color: C.onSurface,
              fontSize: 14,
              fontFamily: F.family,
              outline: "none",
              width: "100%",
              cursor: "pointer",
            }}
          >
            {collections.length === 0 && (
              <option value="">コレクションがありません</option>
            )}
            {collections.map((col) => (
              <option key={col.ID} value={col.ID}>{col.Name}</option>
            ))}
          </select>
        </div>

        {/* プログレスバー */}
        {progress !== null && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: C.outlineVariant }}>
                {done ? "アップロード完了！" : "アップロード中..."}
              </span>
              <span style={{ fontSize: 12, color: C.primary, fontWeight: 700 }}>{progress}%</span>
            </div>
            <div style={{ height: 6, background: C.surfaceVariant, borderRadius: 9999, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: done ? "#22c55e" : C.primary,
                  borderRadius: 9999,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        )}

        {/* エラー */}
        {error && (
          <p style={{ margin: 0, fontSize: 13, color: "#f87171" }}>{error}</p>
        )}

        {/* ボタン */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: `1px solid ${C.outlineVariant}44`,
              background: "transparent",
              color: C.onSurfaceVariant,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: F.family,
            }}
          >
            {done ? "閉じる" : "キャンセル"}
          </button>
          {!done && (
            <button
              onClick={handleUpload}
              disabled={!selectedFile || !collectionId || !fileName.trim() || uploading}
              style={{
                padding: "10px 24px",
                borderRadius: 10,
                border: "none",
                background: (!selectedFile || !collectionId || !fileName.trim() || uploading)
                  ? C.surfaceVariant
                  : C.primary,
                color: (!selectedFile || !collectionId || !fileName.trim() || uploading)
                  ? C.outlineVariant
                  : "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: (!selectedFile || !collectionId || !fileName.trim() || uploading)
                  ? "not-allowed"
                  : "pointer",
                fontFamily: F.family,
                transition: "background 0.2s",
              }}
            >
              {uploading ? "アップロード中..." : "アップロード"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
