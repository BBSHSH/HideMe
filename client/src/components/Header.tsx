import React from "react";
import { NavLink } from "react-router-dom";
import type { User } from "../App";

export type NavItem = {
  id: string;
  label: string;
  icon: string;
  path: string;
};

type HeaderProps = {
  navItems?: NavItem[];
  onNewProject?: () => void;
  user?: User;
  onLogout?: () => void;
};

const defaultNavItems: NavItem[] = [
  { id: "dashboard", icon: "dashboard", label: "Dash", path: "/" },
  { id: "messages", icon: "chat_bubble", label: "Chat", path: "/messages" },
  { id: "storage", icon: "folder_shared", label: "Storage", path: "/file" },
  { id: "editor", icon: "video_settings", label: "Editor", path: "/editor" },
  { id: "settings", icon: "settings", label: "Config", path: "/settings" },
];

const Header: React.FC<HeaderProps> = ({
  navItems = defaultNavItems,
  onNewProject,
  user,
  onLogout,
}) => {
  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, height: "72px", zIndex: 50,
      display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center",
      padding: "0 24px",
      background: "rgba(15,23,42,0.8)", backdropFilter: "blur(40px)",
      borderBottom: "1px solid rgba(88,101,242,0.15)",
      boxShadow: "0 4px 30px rgba(0,0,0,0.4)",
    }}>

      {/* Left: Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "40px", height: "40px", backgroundColor: "#3c4adb",
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: "10px", boxShadow: "0 0 20px rgba(88,101,242,0.5)",
        }}>
          <span className="material-symbols-outlined" style={{ color: "white", fontSize: "22px", fontVariationSettings: "'FILL' 1" }}>shield</span>
        </div>
        <div>
          <h1 style={{ fontSize: "17px", fontWeight: 900, color: "#5865F2", letterSpacing: "0.2em", textTransform: "uppercase", lineHeight: 1, margin: 0 }}>HideMe</h1>
          <p style={{ fontSize: "9px", fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "3px", marginBottom: 0 }}>Secure Perimeter</p>
        </div>
      </div>

      {/* Center: Nav */}
      <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === "/"}
            style={({ isActive }) => ({
              padding: "8px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              color: isActive ? "#5865F2" : "#64748b",
              textDecoration: "none",
              borderRadius: "10px",
              background: isActive ? "rgba(88,101,242,0.12)" : "transparent",
              transition: "all 0.2s ease",
              position: "relative",
            })}
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "26px",
                    fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400",
                    transition: "all 0.2s ease",
                    filter: isActive ? "drop-shadow(0 0 6px rgba(88,101,242,0.6))" : "none",
                  }}
                >
                  {item.icon}
                </span>
                <span style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Right: Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "flex-end" }}>
        <button
          onClick={onNewProject}
          style={{
            backgroundColor: "#5865F2", color: "white", padding: "8px 18px",
            borderRadius: "8px", fontWeight: 700, fontSize: "12px", letterSpacing: "0.05em",
            display: "flex", alignItems: "center", gap: "6px",
            boxShadow: "0 4px 15px rgba(88,101,242,0.35)", border: "none", cursor: "pointer",
            textTransform: "uppercase", transition: "all 0.2s",
          }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
          New
        </button>

        <button style={{ padding: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", cursor: "pointer", color: "#64748b", display: "flex" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>notifications</span>
        </button>

        <div
          onClick={onLogout}
          style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "rgba(88,101,242,0.15)", border: "1px solid rgba(88,101,242,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
          <span className="material-symbols-outlined" style={{ color: "#5865F2", fontSize: "22px", fontVariationSettings: "'FILL' 1" }}>account_circle</span>
        </div>
      </div>

    </header>
  );
};

export default Header;