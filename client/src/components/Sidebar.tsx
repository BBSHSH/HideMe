import { useState } from "react";
import { Link } from "react-router-dom";

export type NavItem = {
  id: string;
  label: string;
  icon: string;
  path: string;
};

export type SidebarProps = {
  navItems?: NavItem[];
  activeNav: string;
  setActiveNav: (id: string) => void;
  onNewProject?: () => void;
};

const defaultNavItems: NavItem[] = [
  {
    id: "dashboard",
    icon: "dashboard",
    label: "ダッシュボード",
    path: "/",
  },
  {
    id: "messages",
    icon: "chat_bubble",
    label: "メッセージ",
    path: "/messages",
  },
  {
    id: "storage",
    icon: "folder_shared",
    label: "ストレージ",
    path: "/storage",
  },
  {
    id: "editor",
    icon: "video_settings",
    label: "エディター",
    path: "/editor",
  },
  {
    id: "settings",
    icon: "settings",
    label: "設定",
    path: "/settings",
  },
];

export function Sidebar({
  navItems = defaultNavItems,
  activeNav,
  setActiveNav,
  onNewProject,
}: SidebarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        height: "100%",
        width: expanded ? "256px" : "88px",
        display: "flex",
        flexDirection: "column",
        padding: "16px",
        gap: "8px",
        background: "rgba(11,12,14,0.4)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(88,101,242,0.1)",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        zIndex: 50,

        transition:
          "width 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "8px",
          marginBottom: "32px",
          minHeight: "56px",
        }}
      >
        <div
          style={{
            minWidth: "40px",
            width: "40px",
            height: "40px",
            backgroundColor: "#5865F2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "12px",
            boxShadow: "0 0 20px rgba(88,101,242,0.3)",
            transition: "all 0.3s",
            transform: expanded ? "scale(1.05)" : "scale(1)",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              color: "white",
              fontVariationSettings: "'FILL' 1",
            }}
          >
            shield
          </span>
        </div>

        {/* Logo Text */}
        <div
          style={{
            opacity: expanded ? 1 : 0,
            transform: expanded
              ? "translateX(0)"
              : "translateX(-12px)",
            transition: "all 0.35s ease",
            whiteSpace: "nowrap",
          }}
        >
          <h1
            style={{
              fontSize: "18px",
              fontWeight: 900,
              color: "#5865F2",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            HideMe
          </h1>

          <p
            style={{
              fontSize: "10px",
              color: "#64748b",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Secure Perimeter
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {navItems.map((item) => {
          const isActive = activeNav === item.id;

          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setActiveNav(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "14px 16px",
                borderRadius: "12px",
                textDecoration: "none",
                overflow: "hidden",
                transition: "all 0.25s ease",

                ...(isActive
                  ? {
                      backgroundColor: "rgba(88,101,242,0.15)",
                      color: "#5865F2",
                    }
                  : {
                      color: "#94a3b8",
                    }),
              }}
            >
              {/* Icon */}
              <span
                className="material-symbols-outlined"
                style={{
                  minWidth: "24px",
                  transition:
                    "transform 0.35s cubic-bezier(0.22,1,0.36,1)",
                  transform: expanded
                    ? "scale(1.15)"
                    : "scale(1)",
                }}
              >
                {item.icon}
              </span>

              {/* Label */}
              <span
                style={{
                  opacity: expanded ? 1 : 0,
                  transform: expanded
                    ? "translateX(0)"
                    : "translateX(-10px)",
                  transition:
                    "all 0.35s cubic-bezier(0.22,1,0.36,1)",
                  whiteSpace: "nowrap",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Button */}
      <button
        type="button"
        onClick={onNewProject}
        style={{
          height: "52px",
          borderRadius: "14px",
          border: "none",
          background: "#5865F2",
          color: "white",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: expanded ? "flex-start" : "center",
          gap: "12px",
          padding: expanded ? "0 16px" : "0",
          overflow: "hidden",
          transition:
            "all 0.4s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <span className="material-symbols-outlined">
          add
        </span>

        <span
          style={{
            opacity: expanded ? 1 : 0,
            width: expanded ? "auto" : 0,
            transition: "all 0.3s ease",
            whiteSpace: "nowrap",
            overflow: "hidden",
            fontWeight: 700,
          }}
        >
          New Project
        </span>
      </button>
    </aside>
  );
}

export default Sidebar;