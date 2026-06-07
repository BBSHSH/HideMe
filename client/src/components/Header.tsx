import { NavLink, useNavigate } from "react-router-dom";
import type { CSSProperties } from "react";
import { useState } from "react";

import { Icon } from "./Icon";
import { C, F, glassPanel } from "../theme/tokens";
import { useAuth } from "../context/AuthContext";
import { useIsMobile } from "../hooks/useIsMobile";

export type NavItem = {
  id: string;
  label: string;
  icon: string;
  path: string;
};

type HeaderProps = {
  navItems?: NavItem[];
  onLogout?: () => void;
};

const defaultNavItems: NavItem[] = [
  {
    id: "dashboard",
    icon: "dashboard",
    label: "Dash",
    path: "/",
  },
  {
    id: "messages",
    icon: "forum",
    label: "Chat",
    path: "/chat",
  },
  {
    id: "storage",
    icon: "folder_shared",
    label: "Storage",
    path: "/file",
  },
  {
    id: "editor",
    icon: "video_settings",
    label: "Editor",
    path: "/editor",
  },
  {
    id: "settings",
    icon: "settings",
    label: "Config",
    path: "/settings",
  },
];

const headerStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: 72,

  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",

  padding: "0 24px",

  zIndex: 100,

  ...glassPanel,

  borderRadius: 0,
  borderTop: "none",
  borderLeft: "none",
  borderRight: "none",

  boxShadow: "0 4px 30px rgba(0,0,0,0.4)",
};

export default function Header({
  navItems = defaultNavItems,
  onLogout,
}: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  return (
    <>
    {/* モバイル用ドロワー */}
    {isMobile && showDrawer && (
      <>
        <div
          onClick={() => setShowDrawer(false)}
          style={{ position: "fixed", inset: 0, zIndex: 199, background: "rgba(0,0,0,0.6)" }}
        />
        <div style={{
          position: "fixed", top: 0, left: 0, bottom: 0, width: 260, zIndex: 200,
          background: "linear-gradient(180deg, rgba(30,31,48,0.98) 0%, rgba(18,19,27,0.98) 100%)",
          borderRight: `1px solid ${C.outlineVariant}33`,
          display: "flex", flexDirection: "column", padding: "24px 16px", gap: 8,
          boxShadow: "8px 0 40px rgba(0,0,0,0.6)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 8px 24px" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: C.primaryContainer,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="shield" filled size={20} style={{ color: "#fff" }} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 900, color: C.primary, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              HideMe
            </span>
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === "/"}
              onClick={() => setShowDrawer(false)}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 16px", borderRadius: 12, textDecoration: "none",
                color: isActive ? C.primary : C.onSurfaceVariant,
                background: isActive ? "rgba(88,101,242,0.12)" : "transparent",
                fontWeight: 700, fontSize: 15, fontFamily: F.family,
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon name={item.icon} filled={isActive} size={22} style={{ color: isActive ? C.primary : C.onSurfaceVariant }} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </>
    )}
    <header style={{
      ...headerStyle,
      gridTemplateColumns: isMobile ? "auto 1fr auto" : "1fr auto 1fr",
      padding: isMobile ? "0 16px" : "0 24px",
    }}>
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,

            borderRadius: 12,

            background: C.primaryContainer,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            boxShadow:
              "0 0 20px rgba(88,101,242,0.45)",
          }}
        >
          <Icon
            name="shield"
            filled
            size={22}
            style={{ color: "#fff" }}
          />
        </div>

        <div>
          <h1
            style={{
              ...F.labelSm,

              margin: 0,

              fontSize: 17,
              fontWeight: 900,

              color: C.primary,

              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            HideMe
          </h1>

          <p
            style={{
              margin: 0,
              marginTop: 2,

              fontSize: 9,
              fontWeight: 700,

              color: C.outline,

              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Secure Perimeter
          </p>
        </div>
      </div>

      {/* Navigation (デスクトップのみ) / ハンバーガー (モバイルのみ) */}
      {isMobile ? (
        <button
          onClick={() => setShowDrawer(true)}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: C.onSurfaceVariant, padding: 8, borderRadius: 8,
          }}
        >
          <Icon name="menu" size={26} style={{ color: C.onSurfaceVariant }} />
        </button>
      ) : null}
      <nav
        style={{
          display: isMobile ? "none" : "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === "/"}
            style={({ isActive }) => ({
              position: "relative",

              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",

              gap: 4,

              padding: "8px 20px",

              borderRadius: 12,

              textDecoration: "none",

              color: isActive
                ? C.primary
                : C.onSurfaceVariant,

              background: isActive
                ? "rgba(88,101,242,0.12)"
                : "transparent",

              transition:
                "all .25s cubic-bezier(.22,1,.36,1)",
            })}
          >
            {({ isActive }) => (
              <>
                <Icon
                  name={item.icon}
                  filled={isActive}
                  size={26}
                  style={{
                    color: isActive
                      ? C.primary
                      : C.onSurfaceVariant,

                    transition:
                      "all .25s cubic-bezier(.22,1,.36,1)",

                    transform: isActive
                      ? "scale(1.08)"
                      : "scale(1)",

                    filter: isActive
                      ? "drop-shadow(0 0 8px rgba(88,101,242,.45))"
                      : "none",
                  }}
                />

                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,

                    letterSpacing: "0.05em",
                    textTransform: "uppercase",

                    transition:
                      "all .25s cubic-bezier(.22,1,.36,1)",
                  }}
                >
                  {item.label}
                </span>

                {/* Active Indicator */}
                <div
                  style={{
                    position: "absolute",

                    left: 12,
                    right: 12,
                    bottom: -8,

                    height: 3,

                    borderRadius: 999,

                    background: C.primary,

                    boxShadow:
                      "0 0 12px rgba(88,101,242,.6)",

                    transform: isActive
                      ? "scaleX(1)"
                      : "scaleX(0)",

                    opacity: isActive ? 1 : 0,

                    transformOrigin: "center",

                    transition:
                      "all .28s cubic-bezier(.22,1,.36,1)",
                  }}
                />
              </>
            )}
          </NavLink>
        ))}
      </nav>

     {/* Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 12,
          position: "relative",
        }}
      >
        {/* ... New と notifications ボタンはそのまま ... */}

        {/* Account Menu */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "1px solid rgba(88,101,242,.3)",
              background: "rgba(88,101,242,.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all .45s cubic-bezier(.22,1,.36,1)",
              overflow: "hidden",
              padding: 0,
            }}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <Icon name="account_circle" filled size={24} style={{ color: C.primary }} />
            )}
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                onClick={() => setShowMenu(false)}
                style={{ position: "fixed", inset: 0, zIndex: 99 }}
              />

              {/* Menu */}
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 12,
                  minWidth: 220,
                  background: "linear-gradient(180deg, rgba(30,31,48,0.95) 0%, rgba(18,19,27,0.95) 100%)",
                  border: `1px solid ${C.outlineVariant}33`,
                  borderRadius: 16,
                  overflow: "hidden",
                  zIndex: 100,
                  boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                }}
              >
                {/* ユーザー情報 */}
                <div
                  style={{
                    padding: "14px 16px",
                    borderBottom: `1px solid ${C.outlineVariant}1a`,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <Icon name="account_circle" filled size={32} style={{ color: C.primary }} />
                  )}
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: C.onSurface }}>
                      {user?.username}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: C.outlineVariant }}>
                      {user?.auth_method === "discord" ? "Discord" : "通常ログイン"} ·{" "}
                      {user?.role === "admin" ? "管理者" : "メンバー"}
                    </p>
                  </div>
                </div>

                {/* 管理者: 認証設定 */}
                {isAdmin && (
                  <button
                    onClick={() => {
                      navigate("/admin/auth-settings");
                      setShowMenu(false);
                    }}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      borderBottom: `1px solid ${C.outlineVariant}1a`,
                      padding: "12px 16px",
                      color: C.onSurface,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      transition: "all 0.2s",
                      textAlign: "left",
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(88,101,242,0.08)";
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                  >
                    <Icon name="key" size={18} style={{ color: C.primary }} />
                    認証設定
                  </button>
                )}

                {/* Logout */}
                <button
                  onClick={() => {
                    onLogout?.();
                    setShowMenu(false);
                  }}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    padding: "12px 16px",
                    color: "#f87171",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    transition: "all 0.2s",
                    textAlign: "left",
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,107,107,0.1)";
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  <Icon name="logout" size={18} />
                  ログアウト
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
    </>
  );
}
