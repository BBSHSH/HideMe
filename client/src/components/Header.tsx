import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

import { Icon } from "./Icon";
import { C, F, glassPanel } from "../theme/tokens";
import appIcon from "../assets/icon.png";
import { useAuth } from "../context/AuthContext";
import { useIsMobile } from "../hooks/useIsMobile";
import { useSidebarNav } from "../hooks/useSidebarNav";

export type NavItem = {
  id: string;
  label: string;
  icon: string;
  path: string;
};

type HeaderProps = {
  onLogout?: () => void;
};

const PC_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", icon: "dashboard",     label: "Dash",    path: "/"        },
  { id: "messages",  icon: "forum",          label: "Chat",    path: "/chat"    },
  { id: "storage",   icon: "folder_shared",  label: "Storage", path: "/file"    },
  { id: "editor",    icon: "video_settings", label: "Editor",  path: "/editor"  },
  { id: "settings",  icon: "settings",       label: "Config",  path: "/settings"},
];

export default function Header({ onLogout }: HeaderProps) {
  const { user, isAdmin } = useAuth();
  const { storageDefaultTab } = useSidebarNav(isAdmin);
  const navItems = PC_NAV_ITEMS.map((item) =>
    item.id === "storage" ? { ...item, path: storageDefaultTab } : item
  );
  const [showMenu,   setShowMenu]   = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);
  const navigate   = useNavigate();
  const location   = useLocation();
  const isMobile   = useIsMobile();

  const HEADER_H = isMobile ? 56 : 72;

  return (
    <>
      {/* ── モバイル ドロワー ── */}
      {isMobile && showDrawer && (
        <>
          <div onClick={() => setShowDrawer(false)}
            style={{ position: "fixed", inset: 0, zIndex: 199, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} />
          <div style={{
            position: "fixed", top: 0, left: 0, bottom: 0, width: 240, zIndex: 200,
            background: "rgba(18,19,27,0.98)",
            borderRight: "1px solid rgba(255,255,255,0.07)",
            display: "flex", flexDirection: "column",
            boxShadow: "8px 0 40px rgba(0,0,0,0.6)",
            animation: "drawerIn 0.22s cubic-bezier(0.4,0,0.2,1) both",
          }}>
            <style>{`@keyframes drawerIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>

            {/* ドロワーヘッダー */}
            <div style={{
              height: 56, display: "flex", alignItems: "center", gap: 10,
              padding: "0 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <img src={appIcon} style={{ width: 30, height: 30, objectFit: "contain" }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 900, color: C.primary, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                HideMe
              </span>
            </div>

            {/* ナビリンク */}
            <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, padding: "12px 12px" }}>
              {navItems.map((item) => {
                const forceActive = item.id === "storage" && location.pathname.startsWith("/file");
                return (
                <NavLink key={item.id} to={item.path} end={item.path === "/"}
                  onClick={() => setShowDrawer(false)}
                  style={({ isActive: routerActive }) => {
                    const isActive = forceActive || routerActive;
                    return {
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "11px 14px", borderRadius: 10, textDecoration: "none",
                      color: isActive ? C.primary : C.onSurfaceVariant,
                      background: isActive ? "rgba(88,101,242,0.12)" : "transparent",
                      fontWeight: 700, fontSize: 14, fontFamily: F.family,
                      transition: "all 0.15s",
                    };
                  }}
                >
                  {({ isActive: routerActive }) => {
                    const isActive = forceActive || routerActive;
                    return (
                    <>
                      <Icon name={item.icon} filled={isActive} size={20}
                        style={{ color: isActive ? C.primary : C.onSurfaceVariant }} />
                      {item.label}
                    </>
                  );}}
                </NavLink>
              );})}

            </nav>

            {/* ユーザー情報 */}
            {user && (
              <div style={{
                padding: "14px 16px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(88,101,242,0.2)", overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {user.avatar
                    ? <img src={user.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <Icon name="account_circle" filled size={20} style={{ color: C.primary }} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.onSurface,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.username}
                  </p>
                  <p style={{ margin: 0, fontSize: 10, color: C.outlineVariant }}>
                    {user.role === "admin" ? "管理者" : "メンバー"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── ヘッダー本体 ── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0,
        height: HEADER_H, zIndex: 100,
        display: "flex", alignItems: "center",
        padding: isMobile ? "0 12px" : "0 24px",
        gap: isMobile ? 0 : 0,
        ...glassPanel,
        borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none",
        boxShadow: "0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.3)",
      }}>

        {isMobile ? (
          /* ── モバイル: [ハンバーガー] [ロゴ中央] [アバター] ── */
          <>
            {/* ハンバーガー */}
            <button onClick={() => setShowDrawer(true)} style={{
              width: 36, height: 36, borderRadius: 9,
              background: "transparent", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: C.onSurfaceVariant, flexShrink: 0,
            }}>
              <Icon name="menu" size={22} />
            </button>

            {/* ロゴ（中央） */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <img src={appIcon} style={{ width: 28, height: 28, objectFit: "contain" }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 900, color: C.primary, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                HideMe
              </span>
            </div>

            {/* アバター */}
            <button onClick={() => setShowMenu(!showMenu)} style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              border: "1px solid rgba(88,101,242,0.3)",
              background: "rgba(88,101,242,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", overflow: "hidden", padding: 0,
            }}>
              {user?.avatar
                ? <img src={user.avatar} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                : <Icon name="account_circle" filled size={20} style={{ color: C.primary }} />
              }
            </button>
          </>
        ) : (
          /* ── デスクトップ: [ロゴ] [ナビ中央] [アバター右] ── */
          <>
            {/* ロゴ */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <img src={appIcon} style={{ width: 36, height: 36, objectFit: "contain" }} />
              </div>
              <div>
                <h1 style={{
                  margin: 0, fontSize: 17, fontWeight: 900, color: C.primary,
                  letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: F.family,
                }}>HideMe</h1>
                <p style={{ margin: 0, marginTop: 1, fontSize: 9, fontWeight: 700, color: C.outline,
                  letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Secure Perimeter
                </p>
              </div>
            </div>

            {/* ナビ（中央） */}
            <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {navItems.map((item) => {
                // Storage は /file/* 全体でアクティブ表示
                const forceActive = item.id === "storage" && location.pathname.startsWith("/file");
                return (
                <NavLink key={item.id} to={item.path} end={item.path === "/"}
                  style={({ isActive: routerActive }) => {
                    const isActive = forceActive || routerActive;
                    return {
                      position: "relative", display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 4,
                      padding: "8px 20px", borderRadius: 12, textDecoration: "none",
                      color: isActive ? C.primary : C.onSurfaceVariant,
                      background: isActive ? "rgba(88,101,242,0.12)" : "transparent",
                      transition: "all .25s cubic-bezier(.22,1,.36,1)",
                    };
                  }}
                >
                  {({ isActive: routerActive }) => {
                    const isActive = forceActive || routerActive;
                    return (
                    <>
                      <Icon name={item.icon} filled={isActive} size={26}
                        style={{
                          color: isActive ? C.primary : C.onSurfaceVariant,
                          transform: isActive ? "scale(1.08)" : "scale(1)",
                          filter: isActive ? "drop-shadow(0 0 8px rgba(88,101,242,.45))" : "none",
                          transition: "all .25s cubic-bezier(.22,1,.36,1)",
                        }}
                      />
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                        {item.label}
                      </span>
                      <div style={{
                        position: "absolute", left: 12, right: 12, bottom: -8,
                        height: 3, borderRadius: 999, background: C.primary,
                        boxShadow: "0 0 12px rgba(88,101,242,.6)",
                        transform: isActive ? "scaleX(1)" : "scaleX(0)",
                        opacity: isActive ? 1 : 0, transformOrigin: "center",
                        transition: "all .28s cubic-bezier(.22,1,.36,1)",
                      }} />
                    </>
                  );}}
                </NavLink>
              );})}
            </nav>

            {/* アバター（右） */}
            <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", position: "relative" }}>
              <button onClick={() => setShowMenu(!showMenu)} style={{
                width: 40, height: 40, borderRadius: "50%",
                border: "1px solid rgba(88,101,242,.3)", background: "rgba(88,101,242,.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", overflow: "hidden", padding: 0,
              }}>
                {user?.avatar
                  ? <img src={user.avatar} alt={user.username} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                  : <Icon name="account_circle" filled size={24} style={{ color: C.primary }} />
                }
              </button>
            </div>
          </>
        )}

        {/* ── アカウントドロップダウン（共通） ── */}
        {showMenu && (
          <>
            <div ref={menuRef} style={{
              position: "absolute", top: HEADER_H - 4, right: isMobile ? 12 : 24,
              minWidth: 210,
              background: "rgba(22,23,34,0.97)", backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, overflow: "hidden", zIndex: 200,
              boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
              animation: "menuIn 0.18s cubic-bezier(0.4,0,0.2,1) both",
            }}>
              <style>{`@keyframes menuIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>

              {/* ユーザー情報 */}
              <div style={{
                padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                {user?.avatar
                  ? <img src={user.avatar} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }} />
                  : <Icon name="account_circle" filled size={30} style={{ color: C.primary }} />
                }
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: C.onSurface }}>{user?.username}</p>
                  <p style={{ margin: 0, fontSize: 10, color: C.outlineVariant }}>
                    {user?.auth_method === "discord" ? "Discord" : "通常ログイン"} · {user?.role === "admin" ? "管理者" : "メンバー"}
                  </p>
                </div>
              </div>

              {isAdmin && (
                <>
                  <MenuBtn icon="key" label="認証設定" onClick={() => { navigate("/admin/auth-settings"); setShowMenu(false); }} />
                  <MenuBtn icon="move_to_inbox" label="ストレージ移植" onClick={() => { navigate("/admin/storage-migrate"); setShowMenu(false); }} />
                </>
              )}
              <MenuBtn icon="logout" label="ログアウト" danger onClick={() => { onLogout?.(); setShowMenu(false); }} />
            </div>
          </>
        )}
      </header>

    </>
  );
}

function MenuBtn({ icon, label, danger = false, onClick }: { icon: string; label: string; danger?: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", background: hov ? (danger ? "rgba(248,113,113,0.1)" : "rgba(88,101,242,0.08)") : "transparent",
        border: "none", padding: "11px 14px",
        color: danger ? "#f87171" : C.onSurface,
        fontSize: 13, fontWeight: 600, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 10,
        transition: "background 0.15s", textAlign: "left", fontFamily: F.family,
      }}
    >
      <Icon name={icon} size={17} style={{ color: danger ? "#f87171" : C.primary }} />
      {label}
    </button>
  );
}
