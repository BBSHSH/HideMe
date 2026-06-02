type SidebarLinkProps = {
  icon: string;
  label: string;
  active?: boolean;
};

export default function SidebarLink({ icon, label, active = false }: SidebarLinkProps) {
  return (
    <a
      href="#"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "12px 20px",
        borderRadius: 12,
        background: active ? `#5865f233` : "transparent",
        color: active ? "#bec2ff" : "#c6c5d7",
        fontWeight: active ? 700 : 600,
        fontSize: 20,
        lineHeight: "1.6",
        textDecoration: "none",
        transition: "all 0.2s",
        cursor: "pointer",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
        {icon}
      </span>
      {label}
    </a>
  );
}
