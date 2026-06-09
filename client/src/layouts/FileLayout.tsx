import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { C, F } from "../theme/tokens";
import { Icon } from "../components/Icon";
import { useIsMobile } from "../hooks/useIsMobile";
import { useCollections } from "../hooks/useFiles";
import UploadModal from "../components/file/UploadModal";
import { useSidebarNav } from "../hooks/useSidebarNav";
import { useAuth } from "../context/AuthContext";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

function getToken() {
  return JSON.parse(localStorage.getItem("hideme_auth") || "{}").token ?? "";
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".mkv", ".avi", ".flv", ".wmv"];

// ストレージ上限フォールバック（StatVFS が使えない環境用）
const STORAGE_MAX_FALLBACK = 1 * 1024 * 1024 * 1024 * 1024; // 1 TB



// ─── SidebarLink ─────────────────────────────────────────────────────────────
function SidebarLink({
  icon,
  label,
  to,
}: {
  icon:  string;
  label: string;
  to:    string;
}) {
  const [hover, setHover] = useState(false);

  return (
    // NavLink は to が完全一致(end)のときだけ active になる
    // 「すべて (/file)」だけ end を付けて子ルートで光らないようにする
    <NavLink
      to={to}
      end={to === "/file"}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={({ isActive }) => ({
        display:        "flex",
        alignItems:     "center",
        gap:            16,
        padding:        "12px 20px",
        borderRadius:   12,
        background:     isActive
                          ? "rgba(88,101,242,0.12)"
                          : hover
                          ? `${C.surfaceVariant}4d`
                          : "transparent",
        color:          isActive ? C.primary : C.onSurfaceVariant,
        fontFamily:     F.family,
        fontSize:       16,
        fontWeight:     isActive ? 700 : 600,
        textDecoration: "none",
        transition:     "all 0.2s",
        cursor:         "pointer",
        boxShadow:      isActive ? "inset 3px 0 0 rgba(88,101,242,0.7)" : "none",
      })}
    >
      {({ isActive }) => (
        <>
          <Icon name={icon} filled={isActive} />
          {label}
        </>
      )}
    </NavLink>
  );
}


// ─── CollectionLink ──────────────────────────────────────────────────────────
function CollectionLink({ id, name, color }: { id: string; name: string; color: string }) {
  const [hover, setHover] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === `/file/collection/${id}`;

  return (
    <button
      onClick={() => navigate(`/file/collection/${id}`)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display:        "flex",
        alignItems:     "center",
        gap:            12,
        padding:        "9px 12px",
        borderRadius:   10,
        background:     isActive ? `${color}1a` : hover ? `${C.surfaceVariant}4d` : "transparent",
        border:         "none",
        color:          isActive ? color : C.onSurfaceVariant,
        fontFamily:     F.family,
        fontSize:       14,
        fontWeight:     isActive ? 700 : 500,
        textAlign:      "left",
        cursor:         "pointer",
        transition:     "all 0.15s",
        width:          "100%",
      }}
    >
      <span style={{
        width:        10, height: 10,
        borderRadius: 9999,
        background:   color || C.primary,
        flexShrink:   0,
        boxShadow:    isActive ? `0 0 6px ${color}99` : "none",
      }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {name}
      </span>
    </button>
  );
}

// ─── FileLayout ───────────────────────────────────────────────────────────────
export default function FileLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();
  const isShorts = location.pathname === "/file/shorts";
  const { collections } = useCollections();
  const { items: navItems } = useSidebarNav(isAdmin);
  const enabledNav = navItems.filter((i) => i.enabled);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUpload,  setShowUpload]  = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // ストレージ使用量
  const [totalSizeB,    setTotalSizeB]    = useState(0);
  const [totalFiles,    setTotalFiles]    = useState(0);
  const [storageTotalB, setStorageTotalB] = useState(0);
  const [storageUsedB,  setStorageUsedB]  = useState(0);
  useEffect(() => {
    fetch(`${BASE_URL}/v1/stats`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setTotalSizeB(d?.total_size_bytes ?? 0);
        setTotalFiles(d?.total_files ?? 0);
        setStorageTotalB(d?.storage_total_bytes ?? 0);
        setStorageUsedB(d?.storage_used_bytes ?? 0);
      })
      .catch(() => {});
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const isVideo = VIDEO_EXTS.some(ext => f.name.toLowerCase().endsWith(ext)) || f.type.startsWith("video/");
    if (isVideo) {
      navigate("/editor", { state: { file: f } });
    } else {
      setPendingFile(f);
      setShowUpload(true);
    }
  };

  return (
    <div
      style={{
        display:         "flex",
        flexDirection:   isMobile ? "column" : "row",
        height:          isMobile ? "calc(100vh - 56px)" : "calc(100vh - 72px)",
        fontFamily:      F.family,
        background:      C.background,
        backgroundImage: "radial-gradient(circle at 2px 2px, rgba(88,101,242,0.05) 1px, transparent 0)",
        backgroundSize:  "32px 32px",
        color:           C.onSurface,
      }}
    >
      {/* ── Sidebar (デスクトップ) / 上部タブナビ (モバイル) ── */}
      {isMobile && isShorts ? null : isMobile ? (
        /* モバイル: 上部スクロール可能タブ */
        <nav style={{
          display: "flex", flexShrink: 0, overflowX: "auto",
          padding: "8px 12px", gap: 6,
          background: `${C.surfaceContainerLow}aa`,
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${C.outlineVariant}33`,
          scrollbarWidth: "none",
        }}>
          {enabledNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/file"}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                padding: "8px 14px", borderRadius: 20, textDecoration: "none",
                background: isActive ? `${C.primaryContainer}33` : "transparent",
                border: `1px solid ${isActive ? C.primary + "44" : "transparent"}`,
                color: isActive ? C.primary : C.onSurfaceVariant,
                fontSize: 13, fontWeight: 700, fontFamily: F.family,
                whiteSpace: "nowrap",
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon name={item.icon} filled={isActive} size={16} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      ) : (
        /* デスクトップ: 左サイドバー */
        <aside
          style={{
            width:          288,
            flexShrink:     0,
            display:        "flex",
            flexDirection:  "column",
            padding:        "32px 0",
            background:     `${C.surfaceContainerLow}aa`,
            backdropFilter: "blur(20px)",
            borderRight:    `1px solid ${C.outlineVariant}33`,
            boxShadow:      "4px 0 24px rgba(0,0,0,0.2)",
            overflowY:      "auto",
          }}
        >
          <nav
            style={{
              display:       "flex",
              flexDirection: "column",
              gap:           8,
              padding:       "0 16px",
            }}
          >
            <p
              style={{
                margin:          "0 0 16px",
                fontSize:        14,
                fontWeight:      600,
                color:           C.outlineVariant,
                textTransform:   "uppercase",
                letterSpacing:   "0.1em",
                padding:         "0 20px",
              }}
            >
              Main View
            </p>

            {enabledNav.map((item) => (
              <SidebarLink key={item.to} {...item} />
            ))}

            <p
              style={{
                margin:        "40px 0 12px",
                fontSize:      11,
                fontWeight:    700,
                color:         C.outlineVariant,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                padding:       "0 20px",
              }}
            >
              Collections
            </p>
            <div
              style={{
                display:       "flex",
                flexDirection: "column",
                gap:           2,
                padding:       "0 8px",
              }}
            >
              {collections.length === 0 ? (
                <p style={{ margin: 0, padding: "6px 12px", fontSize: 13, color: C.outlineVariant, fontStyle: "italic" }}>
                  コレクションなし
                </p>
              ) : (
                collections.map((col) => (
                  <CollectionLink
                    key={col.ID}
                    id={col.ID}
                    name={col.Name}
                    color={col.Color || C.primary}
                  />
                ))
              )}
            </div>
          </nav>

          {/* ── ストレージ使用量 + アップロードボタン ── */}
          <div style={{ padding: "0 16px", marginTop: "auto", paddingBottom: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            {/* ストレージ情報 */}
            {(() => {
              // NASからディスク容量が取れた場合はそれを使い、なければフォールバック
              const usedB  = storageTotalB > 0 ? storageUsedB  : totalSizeB;
              const totalB = storageTotalB > 0 ? storageTotalB : STORAGE_MAX_FALLBACK;
              const pct = Math.min(100, Math.round((usedB / totalB) * 100));
              const barColor = pct >= 90 ? "#f87171" : pct >= 70 ? "#fbbf24" : C.primary;
              return (
                <div style={{
                  background: `${C.surfaceVariant}55`,
                  border: `1px solid ${C.outlineVariant}22`,
                  borderRadius: 14,
                  padding: "12px 14px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="storage" size={14} style={{ color: C.outlineVariant }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.outlineVariant, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                        Storage
                      </span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: barColor }}>
                      {pct}%
                    </span>
                  </div>
                  <div style={{ height: 5, background: `${C.surfaceContainerLow}`, borderRadius: 9999, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`,
                      background: barColor,
                      borderRadius: 9999,
                      transition: "width 0.5s ease",
                      boxShadow: `0 0 8px ${barColor}88`,
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span style={{ fontSize: 10, color: C.outlineVariant }}>{formatBytes(usedB)} 使用中</span>
                    <span style={{ fontSize: 10, color: C.outlineVariant }}>{formatBytes(totalB)}</span>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: 10, color: C.outlineVariant }}>
                    {totalFiles.toLocaleString()} ファイル
                  </p>
                </div>
              );
            })()}

            {/* アップロードボタン */}
            <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelect} />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width:          "100%",
                background:     "linear-gradient(135deg, #5865f2, #7c3aed)",
                border:         "none",
                color:          "#fff",
                fontWeight:     700,
                fontSize:       14,
                padding:        "12px 0",
                borderRadius:   12,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                gap:            8,
                cursor:         "pointer",
                fontFamily:     "inherit",
                boxShadow:      "0 2px 16px rgba(88,101,242,0.4)",
                transition:     "opacity 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              <Icon name="upload" size={18} />
              アップロード
            </button>
          </div>
        </aside>
      )}

      {/* ── Main（タブで切り替わる） ── */}
      <main
        style={{
          flex:     1,
          overflow: "hidden",
          display:  "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <Outlet />
      </main>

      {/* ── アップロードモーダル ── */}
      {showUpload && (
        <UploadModal
          initialFile={pendingFile ?? undefined}
          onClose={() => { setShowUpload(false); setPendingFile(null); }}
          onUploaded={() => { setShowUpload(false); setPendingFile(null); }}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        ::-webkit-scrollbar-thumb { background: #5865f2; border-radius: 10px; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes vaultPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.8; transform: scale(1.02); }
        }
        @keyframes pageIn {
          0%   { opacity: 0; transform: scale(0.98) translateY(4px); filter: blur(2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
        }
      `}</style>
    </div>
  );
}
