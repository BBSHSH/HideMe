export default function FileHeader() {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <nav style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "#454655" }}>
          <span>Collections</span>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            chevron_right
          </span>
          <span style={{ color: "#e3e1ed", fontWeight: 700 }}>Main Storage</span>
        </nav>
        <h1 style={{ margin: 0, fontSize: 40, fontWeight: 700, color: "#e3e1ed", letterSpacing: "-0.03em" }}>
          Explore Collections
        </h1>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <button
          style={{
            background: "#34343d",
            color: "#e3e1ed",
            border: `1px solid #45465533`,
            borderRadius: 24,
            padding: "20px 32px",
            fontWeight: 700,
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 10px 25px -10px rgba(0,0,0,0.3)",
            transition: "background 0.2s",
          }}
        >
          <span className="material-symbols-outlined">create_new_folder</span>
          New Collection
        </button>
        <button
          style={{
            background: "#5865f2",
            color: "#fffdff",
            border: "none",
            borderRadius: 24,
            padding: "20px 32px",
            fontWeight: 800,
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 25px 50px -12px rgba(88,101,242,0.4)",
            transition: "filter 0.2s, transform 0.1s",
          }}
        >
          <span className="material-symbols-outlined">cloud_upload</span>
          Upload Content
        </button>
      </div>
    </div>
  );
}
