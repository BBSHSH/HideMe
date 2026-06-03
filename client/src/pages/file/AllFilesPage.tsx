import { C, F, glassPanel } from "../../theme/tokens";
import { Icon } from "../../components/Icon";
import { useFileList } from "../../hooks/useFiles";
import { getDownloadUrl } from "../../api/files";
import CollectionGrid from "../../components/file/CollectionGrid"; // ← インポート
import RecentFileRow from "../../components/file/RecentFileRow"; // ← インポート
import { formatBytes, formatRelativeTime } from "../../utils/format";


function RecentActivityList() {
  const { files, loading, error } = useFileList();

  if (loading) return (
    <div style={{ padding: 32, textAlign: "center", color: C.outlineVariant }}>
      Loading...
    </div>
  );

  if (error) return (
    <div style={{ padding: 32, textAlign: "center", color: "#f87171" }}>
      Failed to load files
    </div>
  );

  if (files.length === 0) return (
    <div style={{ padding: 32, textAlign: "center", color: C.outlineVariant }}>
      No files yet
    </div>
  );

  return (
    <>
      {files.map((file) => (
        <div key={file.id}>
          <RecentFileRow
            icon="insert_drive_file"
            iconColor={C.primary}
            name={file.file_name}
            meta={`Uploaded ${formatRelativeTime(file.uploaded_at)} • ${formatBytes(file.file_size)}`}
            downloadUrl={getDownloadUrl(file.file_name)}
          />
          <div style={{ height: 1, background: `${C.outlineVariant}0d` }} />
        </div>
      ))}
    </>
  );
}

// ─── AllFilesPage ─────────────────────────────────────────────────────────────
export default function AllFilesPage() {
  return (
    <div style={{ padding: 48, display: "flex", flexDirection: "column", gap: 48 }}>
      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <nav style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.outlineVariant }}>
            <span>Collections</span>
            <Icon name="chevron_right" size={14} style={{ color: C.outlineVariant }} />
            <span style={{ color: C.onSurface, fontWeight: 700 }}>Main Storage</span>
          </nav>
          <h1 style={{ margin: 0, fontFamily: F.family, fontSize: 36, fontWeight: 700, color: C.onSurface, letterSpacing: "-0.03em" }}>
            Explore Collections
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            style={{
              background: C.surfaceVariant,
              color: C.onSurface,
              border: `1px solid ${C.outlineVariant}33`,
              borderRadius: 24,
              padding: "14px 24px",
              fontWeight: 700,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              fontFamily: F.family,
            }}
          >
            <Icon name="create_new_folder" size={20} />
            New Collection
          </button>
          <button
            style={{
              background: C.primaryContainer,
              color: C.onPrimaryContainer,
              border: "none",
              borderRadius: 24,
              padding: "14px 24px",
              fontWeight: 800,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              fontFamily: F.family,
              boxShadow: "0 25px 50px -12px rgba(88,101,242,0.4)",
            }}
          >
            <Icon name="cloud_upload" size={20} />
            Upload Content
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ ...glassPanel, padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ color: C.outlineVariant, fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Vault Usage
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: C.onSurface, letterSpacing: "-0.02em" }}>12.4 GB</span>
              <span style={{ fontSize: 16, color: C.outlineVariant }}> / 100 GB</span>
            </div>
          </div>
          <div style={{ width: 240, height: 10, background: C.surfaceVariant, borderRadius: 9999, overflow: "hidden" }}>
            <div style={{ width: "45%", height: "100%", background: C.primary }} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32, borderLeft: `1px solid ${C.outlineVariant}1a`, paddingLeft: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ color: C.outlineVariant, fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>Status</span>
            <span style={{ color: C.primary, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, fontSize: 16 }}>
              <Icon name="verified_user" size={16} filled />
              Encrypted
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ color: C.outlineVariant, fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>Active Items</span>
            <span style={{ color: C.onSurface, fontWeight: 800, fontSize: 16 }}>2,636 Files</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button style={{ padding: 10, background: "none", border: "none", color: C.onSurfaceVariant, borderRadius: 10, cursor: "pointer" }}>
            <Icon name="list" />
          </button>
          <button style={{ padding: 10, background: `${C.primary}1a`, border: `1px solid ${C.primary}33`, color: C.primary, borderRadius: 10, cursor: "pointer" }}>
            <Icon name="grid_view" />
          </button>
        </div>
      </div>

      {/* Collection Grid */}
      <CollectionGrid />

      {/* Recent activity */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ margin: 0, fontFamily: F.family, fontSize: 24, fontWeight: 700, color: C.onSurface, letterSpacing: "-0.02em" }}>
          Recent Activity
        </h2>
        <div style={{ ...glassPanel, overflow: "hidden", border: `1px solid ${C.outlineVariant}1a` }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.outlineVariant}1a`, display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.03)" }}>
            <Icon name="history" style={{ color: C.primary }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Latest files uploaded to vault</span>
          </div>
          <RecentActivityList />
        </div>
      </div>

      {/* Vault status toast */}
      <div style={{ position: "fixed", bottom: 32, right: 32, background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)", backdropFilter: "blur(40px)", padding: "12px 20px", borderRadius: 24, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 0 20px rgba(88,101,242,0.3), 0 25px 50px -12px rgba(0,0,0,0.5)", border: `1px solid ${C.primary}33`, zIndex: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 12, height: 12, background: "#22c55e", borderRadius: 9999, boxShadow: "0 0 10px rgba(34,197,94,0.8)", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: C.onSurface }}>Vault Sync Active</span>
        </div>
        <div style={{ width: 1, height: 28, background: `${C.outlineVariant}33` }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: C.outlineVariant, textTransform: "uppercase", letterSpacing: "0.05em" }}>Last sync: 2m ago</span>
      </div>
    </div>
  );
}