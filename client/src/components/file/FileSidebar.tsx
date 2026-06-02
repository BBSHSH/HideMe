import FilterDot from "./FilterDot";
import SidebarLink from "./SidebarLink";
import { filters, sidebarItems } from "../../data/files";

export default function FileSidebar() {
  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 80,
        bottom: 0,
        width: 288,
        display: "flex",
        flexDirection: "column",
        padding: "32px 0",
        background: `#1a1b2366`,
        backdropFilter: "blur(20px)",
        borderRight: `1px solid #45465533`,
        boxShadow: "4px 0 24px rgba(0,0,0,0.2)",
        overflowY: "auto",
      }}
    >
      <nav style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 16px" }}>
        <div style={{ marginBottom: 16 }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: "#454655",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              padding: "0 20px",
            }}
          >
            Main View
          </p>
        </div>
        {sidebarItems.map((item, index) => (
          <SidebarLink key={item.id} icon={item.icon} label={item.label} active={index === 0} />
        ))}

        <div style={{ marginTop: 64, marginBottom: 16 }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: "#454655",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              padding: "0 20px",
            }}
          >
            Filters
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 20px" }}>
          {filters.map((filter) => (
            <FilterDot key={filter.id} dotColor={filter.dotColor} label={filter.label} />
          ))}
        </div>
      </nav>

      <div style={{ padding: "0 20px", marginTop: "auto", paddingBottom: 64 }}>
        <button
          style={{
            width: "100%",
            background: "#34343d",
            border: `1px solid #4546554d`,
            color: "#e3e1ed",
            fontWeight: 700,
            fontSize: 20,
            padding: "20px 0",
            borderRadius: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "background 0.2s",
          }}
        >
          <span className="material-symbols-outlined">settings</span>
          Storage Settings
        </button>
      </div>
    </aside>
  );
}
