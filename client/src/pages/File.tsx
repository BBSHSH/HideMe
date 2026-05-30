import { useState } from "react";

// ── Shared style helpers ─────────────────────────────────────────────────────
const glassPanel: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
  backdropFilter: "blur(40px)",
  border: `1px solid rgba(190,194,255,0.1)`,
};

const card: React.CSSProperties = {
  ...glassPanel,
  borderRadius: 16,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  cursor: "pointer",
  border: `1px solid rgba(69,70,85,0.4)`,
  transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
};

// ── Sub-components ───────────────────────────────────────────────────────────

function NavLink({
  label,
  active = false,
  href = "#",
}: {
  label: string;
  active?: boolean;
  href?: string;
}) {
  return (
    <a
      href={href}
      style={{
        color: active ? "#bec2ff" : "#c6c5d7",
        fontWeight: active ? 800 : 600,
        fontSize: 20,
        lineHeight: "1.6",
        textDecoration: "none",
        borderBottom: active ? `4px solid #bec2ff` : "none",
        paddingBottom: active ? 4 : 0,
        transition: "color 0.3s",
        cursor: "pointer",
      }}
    >
      {label}
    </a>
  );
}

function SidebarLink({
  icon,
  label,
  active = false,
}: {
  icon: string;
  label: string;
  active?: boolean;
}) {
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

function FilterDot({
  dotColor,
  label,
}: {
  dotColor: string;
  label: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        color: "#c6c5d7",
        padding: "6px 0",
        cursor: "pointer",
        fontSize: 16,
        lineHeight: "1.5",
      }}
    >
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: 9999,
          background: dotColor,
          flexShrink: 0,
        }}
      />
      {label}
    </div>
  );
}

interface CollectionCardProps {
  title: string;
  subtitle: string;
  itemCount: string;
  badgeColor: string;
  badgeBorder: string;
  buttonColor: string;
  buttonHoverBg: string;
  imageSrc?: string;
  iconFallback?: string;
  iconBg?: string;
}

function CollectionCard({
  title,
  subtitle,
  itemCount,
  badgeColor,
  badgeBorder,
  buttonColor,
  imageSrc,
  iconFallback,
  iconBg,
}: CollectionCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        ...card,
        transform: hovered ? "translateY(-8px)" : "translateY(0)",
        borderColor: hovered ? "rgba(88,101,242,0.4)" : "rgba(69,70,85,0.4)",
        background: hovered
          ? "rgba(88,101,242,0.08)"
          : "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
        boxShadow: hovered ? "0 20px 40px -20px rgba(88,101,242,0.3)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div
        style={{
          height: 224,
          background: iconBg ?? "#34343d",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, #12131b, transparent)",
            opacity: 0.6,
            zIndex: 1,
          }}
        />
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: hovered ? "scale(1.1)" : "scale(1)",
              transition: "transform 0.7s",
            }}
          />
        ) : (
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 100,
              color: `#e3e1ed33`,
              transform: hovered ? "scale(1.1)" : "scale(1)",
              transition: "transform 0.7s",
            }}
          >
            {iconFallback}
          </span>
        )}
        {/* Badge */}
        <div style={{ position: "absolute", top: 16, right: 16, zIndex: 2 }}>
          <span
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              color: badgeColor,
              padding: "4px 12px",
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 700,
              border: `1px solid ${badgeBorder}`,
            }}
          >
            {itemCount}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#e3e1ed", letterSpacing: "-0.02em" }}>
              {title}
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 16, color: "#c6c5d7" }}>{subtitle}</p>
          </div>
          <button
            style={{
              background: "none",
              border: "none",
              color: "#c6c5d7",
              cursor: "pointer",
              padding: 4,
              fontSize: 24,
            }}
            className="material-symbols-outlined"
          >
            more_vert
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            style={{
              flex: 1,
              background: `${buttonColor}1a`,
              color: buttonColor,
              border: "none",
              borderRadius: 12,
              padding: "8px 0",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            Quick Edit
          </button>
          <button
            style={{
              background: `#34343d4d`,
              border: "none",
              borderRadius: 12,
              padding: 8,
              color: "#e3e1ed",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
            className="material-symbols-outlined"
          >
            share
          </button>
        </div>
      </div>
    </div>
  );
}

function AddNewCard() {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        border: `2px dashed ${hovered ? `#bec2ff80` : `#4546554d`}`,
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        gap: 16,
        cursor: "pointer",
        background: hovered ? `#bec2ff0d` : "transparent",
        transition: "all 0.3s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 9999,
          background: hovered ? "#5865f2" : "#34343d",
          color: hovered ? "#fffdff" : "#e3e1ed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s",
          fontSize: 40,
        }}
        className="material-symbols-outlined"
      >
        add
      </div>
      <div style={{ textAlign: "center" }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#e3e1ed" }}>Create New</h3>
        <p style={{ margin: "4px 0 0", fontSize: 16, color: "#c6c5d7" }}>Organize your content</p>
      </div>
    </div>
  );
}

function RecentFileRow({
  icon,
  iconColor,
  name,
  meta,
}: {
  icon: string;
  iconColor: string;
  name: string;
  meta: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        padding: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: hovered ? "rgba(255,255,255,0.03)" : "transparent",
        transition: "background 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "#1f1f27",
            border: `1px solid #4546551a`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            color: iconColor,
          }}
          className="material-symbols-outlined"
        >
          {icon}
        </div>
        <div>
          <h4 style={{ margin: 0, fontWeight: 700, fontSize: 20 }}>{name}</h4>
          <p style={{ margin: "2px 0 0", fontSize: 16, color: "#8f8fa0" }}>{meta}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          style={{ background: "none", border: "none", color: "#c6c5d7", cursor: "pointer", padding: 12, fontSize: 24 }}
          className="material-symbols-outlined"
        >
          download
        </button>
        <button
          style={{ background: "none", border: "none", color: "#c6c5d7", cursor: "pointer", padding: 12, fontSize: 24 }}
          className="material-symbols-outlined"
        >
          delete
        </button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function File() {
  return (
    <div
      style={{
        fontFamily: "'Manrope', sans-serif",
        background: "#12131b",
        backgroundImage: "radial-gradient(circle at 2px 2px, rgba(88,101,242,0.05) 1px, transparent 0)",
        backgroundSize: "32px 32px",
        color: "#e3e1ed",
        minHeight: "100vh",
      }}
    >
      <div style={{ display: "flex", minHeight: "calc(100vh - 80px)" }}>
        {/* ── Sidebar ── */}
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
            <SidebarLink icon="grid_view" label="すべて" active />
            <SidebarLink icon="movie" label="動画"/>
            <SidebarLink icon="schedule" label="最近の項目" />
            <SidebarLink icon="favorite" label="お気に入り" />
            <SidebarLink icon="auto_delete" label="Cleanup" />

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
              <FilterDot dotColor={"#bec2ff"} label="Gaming" />
              <FilterDot dotColor={"#ffb689"} label="Personal" />
              <FilterDot dotColor={"#c4c6ce"} label="Work" />
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

        {/* ── Main ── */}
        <main
          style={{
            marginLeft: 288,
            flex: 1,
            padding: 64,
            display: "flex",
            flexDirection: "column",
            gap: 64,
          }}
        >
          {/* Page header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <nav style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "#454655" }}>
                <span>Collections</span>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
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

          {/* Stats bar */}
          <div
            style={{
              ...glassPanel,
              borderRadius: 16,
              padding: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 40,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span
                  style={{
                    color: "#454655",
                    fontWeight: 700,
                    fontSize: 14,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Total Vault Usage
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: "#e3e1ed", letterSpacing: "-0.02em" }}>
                    12.4 GB
                  </span>
                  <span style={{ fontSize: 20, color: "#454655" }}> / 100 GB</span>
                </div>
              </div>
              {/* Progress bar */}
              <div
                style={{
                  width: 320,
                  height: 12,
                  background: "#34343d",
                  borderRadius: 9999,
                  overflow: "hidden",
                  display: "flex",
                }}
              >
                <div style={{ width: "45%", height: "100%", background: "#bec2ff" }} />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 40,
                borderLeft: `1px solid #4546551a`,
                paddingLeft: 40,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "#454655", fontWeight: 700, fontSize: 14, textTransform: "uppercase", marginBottom: 4 }}>
                  Status
                </span>
                <span
                  style={{ color: "#bec2ff", fontWeight: 700, display: "flex", alignItems: "center", gap: 8, fontSize: 20 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>verified_user</span>
                  Encrypted
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "#454655", fontWeight: 700, fontSize: 14, textTransform: "uppercase", marginBottom: 4 }}>
                  Active Items
                </span>
                <span style={{ color: "#e3e1ed", fontWeight: 800, fontSize: 20 }}>2,636 Files</span>
              </div>
            </div>

            {/* View toggles */}
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <button
                style={{
                  padding: 12,
                  background: "none",
                  border: "none",
                  color: "#c6c5d7",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontSize: 24,
                }}
                className="material-symbols-outlined"
              >
                list
              </button>
              <button
                style={{
                  padding: 12,
                  background: `#bec2ff1a`,
                  border: `1px solid #bec2ff33`,
                  color: "#bec2ff",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontSize: 24,
                }}
                className="material-symbols-outlined"
              >
                grid_view
              </button>
            </div>
          </div>

          {/* Collection cards grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 20,
            }}
          >
            <CollectionCard
              title="Valorant"
              subtitle="Clips & VODs"
              itemCount="128 Items"
              badgeColor={"#bec2ff"}
              badgeBorder={`#bec2ff4d`}
              buttonColor={"#bec2ff"}
              buttonHoverBg={`#bec2ff33`}
              imageSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuDmSuhQxlltTYj1EZYrbQU7YGBQBMQVYgRAQ59Cj8XNwuxpPk7-hHSlqhhLilROI02Ve80IXoOonkx5YRhRgGXBWA4W8FisrfARwraCvj24DLDIqXCOvDvcx63ah8m6PLBaKb2wEn1NjJKWwBGEjo1YDC91HqVNhxkKJkWGW-yRokP81lJqjmDSeVqbRc8STG5Tl1ecSmhb2h7WkX1kH_ysl5sVwsQySExpGHaGn_IBsJ9qhbDRH7QT_BhjVvO75dFmIkdxEfewX6Za"
            />
            <CollectionCard
              title="Overwatch"
              subtitle="Highlights"
              itemCount="42 Items"
              badgeColor={"#ffb689"}
              badgeBorder={`#ffb6894d`}
              buttonColor={"#ffb689"}
              buttonHoverBg={`#ffb68933`}
              imageSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuAEgyDn1IcgJtdC-pj8CIQ0rq1xZLmsZZf9AjFpdjCSP_NBeVumiUA24km-xcL_kJTbooEHH6vq38SmEBS8f2xYm6WSIOPdma1uTi9Ks43ddq3HfU9BwAIwo-HbWZBpkX_jHMTFuNhoSLpT0pVV0YLLmLtaRHCiSfFT0s7iEM6GsYsyKxOWnNfXgrTuFohsHi9plGPHgeJXAVoJKj3keQQFmjEBuPgj_VVi02rRN6GZED2iBQ4uXGnKervZPNgxAnnIqjBF54M4j_QE"
            />
            <CollectionCard
              title="Minecraft"
              subtitle="Saves & World Data"
              itemCount="2,450 Items"
              badgeColor={"#e3e1ed"}
              badgeBorder={`#4546554d`}
              buttonColor={"#e3e1ed"}
              buttonHoverBg={`#34343d`}
              iconFallback="grid_on"
              iconBg="linear-gradient(135deg, rgba(34,197,94,0.2), rgba(59,130,246,0.2))"
            />
            <AddNewCard />
          </div>

          {/* Recent activity */}
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 20 }}>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#e3e1ed", letterSpacing: "-0.02em" }}>
              Recent Activity
            </h2>
            <div
              style={{
                ...glassPanel,
                borderRadius: 16,
                overflow: "hidden",
                border: `1px solid #4546551a`,
              }}
            >
              <div
                style={{
                  padding: 20,
                  borderBottom: `1px solid #4546551a`,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <span className="material-symbols-outlined" style={{ color: "#bec2ff" }}>history</span>
                <span style={{ fontWeight: 700, fontSize: 20 }}>Latest files uploaded to vault</span>
              </div>
              <div>
                <RecentFileRow
                  icon="movie"
                  iconColor={"#ffb689"}
                  name="clutch_round_final.mp4"
                  meta="Uploaded 2 hours ago • 45.2 MB"
                />
                <div style={{ height: 1, background: `#4546550d` }} />
                <RecentFileRow
                  icon="description"
                  iconColor={"#bec2ff"}
                  name="vanguard_config_v2.cfg"
                  meta="Uploaded yesterday • 12 KB"
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Vault status toast ── */}
      <div
        style={{
          position: "fixed",
          bottom: 32,
          right: 32,
          ...glassPanel,
          padding: "12px 20px",
          borderRadius: 24,
          display: "flex",
          alignItems: "center",
          gap: 20,
          boxShadow: "0 0 20px rgba(88,101,242,0.3), 0 25px 50px -12px rgba(0,0,0,0.5)",
          border: `1px solid #bec2ff33`,
          zIndex: 60,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 12,
              height: 12,
              background: "#22c55e",
              borderRadius: 9999,
              boxShadow: "0 0 10px rgba(34,197,94,0.8)",
              animation: "pulse 2s infinite",
            }}
          />
          <span style={{ fontSize: 16, fontWeight: 800, color: "#e3e1ed" }}>Vault Sync Active</span>
        </div>
        <div style={{ width: 1, height: 32, background: `#45465533` }} />
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#454655",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Last sync: 2m ago
        </span>
      </div>

      {/* pulse keyframe injected once */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
        input::placeholder { color: #8f8fa0; }
      `}</style>
    </div>
  );
}