import React from "react";

export type NavItem = {
  id: string;
  label: string;
  icon: string; // material-symbols-outlined に渡す文字列
};

export type SidebarProps = {
  // 受け取ってもいいし、渡されなければこのファイル内のデフォルトを使う
  navItems?: NavItem[];
  activeNav: string;
  setActiveNav: (id: string) => void;
  onNewProject?: () => void;
};

// 追加したい navItems（デフォルト）
const defaultNavItems: NavItem[] = [
  { id: "dashboard", icon: "dashboard", label: "ダッシュボード" },
  { id: "messages", icon: "chat_bubble", label: "メッセージ" },
  { id: "storage", icon: "folder_shared", label: "ストレージ" },
  { id: "editor", icon: "video_settings", label: "エディター" },
  { id: "settings", icon: "settings", label: "設定" },
];

export function Sidebar({
  navItems = defaultNavItems, // ← 渡されなければ上の配列を使う
  activeNav,
  setActiveNav,
  onNewProject,
}: SidebarProps) {
  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        height: "100%",
        width: "256px",
        display: "flex",
        flexDirection: "column",
        padding: "16px",
        gap: "8px",
        background: "rgba(11,12,14,0.4)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(88,101,242,0.1)",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px", marginBottom: "32px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: "#5865F2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
            boxShadow: "0 0 20px rgba(88,101,242,0.3)",
          }}
        >
          <span className="material-symbols-outlined" style={{ color: "white", fontVariationSettings: "'FILL' 1" }}>
            shield
          </span>
        </div>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 900, color: "#5865F2", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            HideMe
          </h1>
          <p style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Secure Perimeter
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
        {navItems.map((item) => {
          const isActive = activeNav === item.id;

          return (
            <a
              key={item.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveNav(item.id);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.05em",
                transition: "all 0.2s",
                ...(isActive
                  ? {
                      backgroundColor: "rgba(88,101,242,0.1)",
                      color: "#5865F2",
                      borderRight: "2px solid #5865F2",
                      boxShadow: "0 0 15px rgba(88,101,242,0.2)",
                    }
                  : { color: "#94a3b8" }),
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(88,101,242,0.1)";
                  (e.currentTarget as HTMLElement).style.color = "#a5b4fc";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#94a3b8";
                }
              }}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* New Project Button */}
      <div style={{ paddingTop: "16px", borderTop: "1px solid rgba(88,101,242,0.1)" }}>
        <button
          type="button"
          onClick={onNewProject}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#5865F2",
            color: "white",
            fontWeight: 700,
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "14px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
        >
          <span className="material-symbols-outlined">add</span>
          <span>New Project</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;