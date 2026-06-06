import { useState } from "react";
import { C, F } from "../../theme/tokens";
import { Icon } from "../../components/Icon";
import CollectionGrid from "../../components/file/CollectionGrid";
import AllFilesGrid from "../../components/file/AllFilesGrid";
import StorageStats from "../../components/file/StorageStats";
import UploadModal from "../../components/file/UploadModal";

export default function AllFilesPage() {
  const [showUpload, setShowUpload] = useState(false);
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        padding: "20px 32px",
        gap: 16,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* ── ヘッダー ── */}
      <div style={{ flexShrink: 0 }}>
        <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.outlineVariant, marginBottom: 4 }}>
          <span>Collections</span>
          <Icon name="chevron_right" size={12} style={{ color: C.outlineVariant }} />
          <span style={{ color: C.onSurface, fontWeight: 700 }}>All Files</span>
        </nav>
        <h1 style={{ margin: 0, fontFamily: F.family, fontSize: 26, fontWeight: 800, color: C.onSurface, letterSpacing: "-0.03em" }}>
          Explore Collections
        </h1>
      </div>

      {/* ── Stats ── */}
      <div style={{ flexShrink: 0 }}>
        <StorageStats onUploadClick={() => setShowUpload(true)} />
      </div>
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploaded={() => setShowUpload(false)} />
      )}

      {/* ── Collections（1行分の高さ、はみ出し非表示） ── */}
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.onSurface, fontFamily: F.family }}>
          Collections
        </h2>
        <CollectionGrid horizontal />
      </div>

      {/* ── Recent Activity（グリッドが 2 行分の高さを自動決定） ── */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="history" size={16} style={{ color: C.primary }} />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.onSurface, fontFamily: F.family }}>
            Recent Activity
          </h2>
        </div>
        <AllFilesGrid />
      </div>
    </div>
  );
}
