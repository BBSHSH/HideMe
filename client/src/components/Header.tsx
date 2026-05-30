import { NavLink } from "react-router-dom";
import type { CSSProperties } from "react";
import type { User } from "../App";

import { Icon } from "./Icon";
import { C, F, glassPanel } from "../theme/tokens";

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
  {
    id: "dashboard",
    icon: "dashboard",
    label: "Dash",
    path: "/",
  },
  {
    id: "messages",
    icon: "chat_bubble",
    label: "Chat",
    path: "/messages",
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
  onNewProject,
  onLogout,
}: HeaderProps) {
  return (
    <header style={headerStyle}>
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

      {/* Navigation */}
      <nav
        style={{
          display: "flex",
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
        }}
      >
        <button
          onClick={onNewProject}
          style={{
            height: 40,

            border: "none",
            borderRadius: 12,

            background: C.primaryContainer,
            color: "#fff",

            display: "flex",
            alignItems: "center",
            gap: 8,

            padding: "0 16px",

            cursor: "pointer",

            fontWeight: 700,

            transition:
              "all .25s cubic-bezier(.22,1,.36,1)",

            boxShadow:
              "0 8px 24px rgba(88,101,242,.35)",
          }}
        >
          <Icon
            name="add"
            size={18}
            style={{ color: "#fff" }}
          />

          New
        </button>

        <button
          style={{
            width: 40,
            height: 40,

            borderRadius: 12,

            border:
              "1px solid rgba(255,255,255,.08)",

            background:
              "rgba(255,255,255,.04)",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            cursor: "pointer",

            transition:
              "all .25s cubic-bezier(.22,1,.36,1)",
          }}
        >
          <Icon
            name="notifications"
            size={22}
            style={{
              color: C.onSurfaceVariant,
            }}
          />
        </button>

        <button
          onClick={onLogout}
          style={{
            width: 40,
            height: 40,

            borderRadius: "50%",

            border:
              "1px solid rgba(88,101,242,.3)",

            background:
              "rgba(88,101,242,.15)",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            cursor: "pointer",

            transition:
              "all .45s cubic-bezier(.22,1,.36,1)",
          }}
        >
          <Icon
            name="account_circle"
            filled
            size={24}
            style={{
              color: C.primary,
            }}
          />
        </button>
      </div>
    </header>
  );
}