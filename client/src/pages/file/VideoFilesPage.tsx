import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { C, F } from "../../theme/tokens";
import { Icon } from "../../components/Icon";
import CollectionGrid from "../../components/file/CollectionGrid";
import AllVideosGrid from "../../components/file/AllVideosGrid";
import StorageStats from "../../components/file/StorageStats";

export default function VideoFilesPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setRefresh] = useState(0);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // エディター画面へ（コレクションはエディター内で選択）
    navigate("/editor", { state: { file } });
    e.target.value = "";
  };

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        padding: "12px 32px",
        gap: 10,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* ── ヘッダー ── */}
      <div style={{ flexShrink: 0 }}>
        <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.outlineVariant, marginBottom: 4 }}>
          <span>Collections</span>
          <Icon name="chevron_right" size={12} style={{ color: C.outlineVariant }} />
          <span style={{ color: C.onSurface, fontWeight: 700 }}>Videos</span>
        </nav>
        <h1 style={{ margin: 0, fontFamily: F.family, fontSize: 22, fontWeight: 800, color: C.onSurface, letterSpacing: "-0.03em" }}>
          Explore Video Collections
        </h1>
      </div>

      {/* ── Stats（アップロードボタン付き） ── */}
      <div style={{ flexShrink: 0 }}>
        <StorageStats onUploadClick={handleUploadClick} />
      </div>

      {/* ── Video Collections ── */}
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.onSurface, fontFamily: F.family }}>
          Video Collections
        </h2>
        <CollectionGrid linkPath="/file/videocollection" horizontal />
      </div>

      {/* ── Recent Videos（残りスペースに収める） ── */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Icon name="movie" size={16} style={{ color: C.primary }} />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.onSurface, fontFamily: F.family }}>
            Recent Videos
          </h2>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <AllVideosGrid key={String(setRefresh)} />
        </div>
      </div>
    </div>
  );
}
