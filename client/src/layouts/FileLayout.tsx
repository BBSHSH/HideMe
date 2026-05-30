import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { C, F } from "../theme/tokens";
import { Icon } from "../components/Icon";

// ─── サイドバーのタブ定義 ──────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: "grid_view",   label: "すべて",       to: "/file" },
  { icon: "movie",       label: "動画",          to: "/file/video" },
  { icon: "schedule",    label: "最近の項目",    to: "/file/recent" },
  { icon: "favorite",    label: "お気に入り",    to: "/file/favorites" },
  { icon: "auto_delete", label: "Cleanup",       to: "/file/cleanup" },
] as const;

const FILTER_DOTS = [
  { color: C.primary,   label: "Gaming" },
  { color: C.tertiary,  label: "Personal" },
  { color: C.secondary, label: "Work" },
] as const;

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
                          ? `${C.primaryContainer}33`
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

// ─── FilterDot ───────────────────────────────────────────────────────────────
function FilterDot({ color, label }: { color: string; label: string }) {
  return (
    <div
      style={{
        display:     "flex",
        alignItems:  "center",
        gap:         16,
        color:       C.onSurfaceVariant,
        padding:     "6px 0",
        cursor:      "pointer",
        fontSize:    16,
        lineHeight:  1.5,
      }}
    >
      <span
        style={{
          width:        12,
          height:       12,
          borderRadius: 9999,
          background:   color,
          flexShrink:   0,
        }}
      />
      {label}
    </div>
  );
}

// ─── FileLayout ───────────────────────────────────────────────────────────────
export default function FileLayout() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display:         "flex",
        height:          "calc(100vh - 80px)", // ヘッダー高さ分引く（Layout.tsxに合わせて調整）
        fontFamily:      F.family,
        background:      C.background,
        backgroundImage: "radial-gradient(circle at 2px 2px, rgba(88,101,242,0.05) 1px, transparent 0)",
        backgroundSize:  "32px 32px",
        color:           C.onSurface,
      }}
    >
      {/* ── Sidebar ── */}
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
          {/* Section label */}
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

          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}

          {/* Filters */}
          <p
            style={{
              margin:        "64px 0 16px",
              fontSize:      14,
              fontWeight:    600,
              color:         C.outlineVariant,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              padding:       "0 20px",
            }}
          >
            Filters
          </p>
          <div
            style={{
              display:       "flex",
              flexDirection: "column",
              gap:           8,
              padding:       "0 20px",
            }}
          >
            {FILTER_DOTS.map((f) => (
              <FilterDot key={f.label} {...f} />
            ))}
          </div>
        </nav>

        {/* Storage Settings ボタン */}
        <div
          style={{ padding: "0 20px", marginTop: "auto", paddingBottom: 64 }}
        >
          <button
            onClick={() => navigate("/settings")}
            style={{
              width:          "100%",
              background:     C.surfaceVariant,
              border:         `1px solid ${C.outlineVariant}4d`,
              color:          C.onSurface,
              fontWeight:     700,
              fontSize:       16,
              padding:        "16px 0",
              borderRadius:   24,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              gap:            8,
              cursor:         "pointer",
              fontFamily:     "inherit",
              transition:     "background 0.2s",
            }}
          >
            <Icon name="settings" />
            Storage Settings
          </button>
        </div>
      </aside>

      {/* ── Main（タブで切り替わる） ── */}
      <main
        style={{
          flex:      1,
          overflowY: "auto",
        }}
      >
        <Outlet />
      </main>

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
      `}</style>
    </div>
  );
}
