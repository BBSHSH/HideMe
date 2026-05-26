import React from "react";
import { NavLink } from "react-router-dom";

export type NavItem = {
  id: string;
  label: string;
  icon: string;
  path: string;
};

type HeaderProps = {
  navItems?: NavItem[];
  onNewProject?: () => void;
};

const defaultNavItems: NavItem[] = [
  { id: "dashboard", icon: "dashboard", label: "ダッシュボード", path: "/" },
  { id: "messages", icon: "chat_bubble", label: "メッセージ", path: "/messages" },
  { id: "storage", icon: "folder_shared", label: "ストレージ", path: "/storage" },
  { id: "editor", icon: "video_settings", label: "エディター", path: "/editor" },
  { id: "settings", icon: "settings", label: "設定", path: "/settings" },
];

const Header: React.FC<HeaderProps> = ({
  navItems = defaultNavItems,
  onNewProject,
}) => {
  return (
    <header>
      <nav style={{ display: "flex", gap: "4px" }}>
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            style={({ isActive }) => ({
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              color: isActive ? "#5865F2" : "#94a3b8",
              textDecoration: "none",
              borderBottom: isActive
                ? "2px solid #5865F2"
                : "2px solid transparent",
              transition: "color 0.2s",
            })}
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "20px",
                    fontVariationSettings: isActive
                      ? "'FILL' 1"
                      : "'FILL' 0",
                  }}
                >
                  {item.icon}
                </span>

                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                  }}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </header>
  );
};

export default Header;