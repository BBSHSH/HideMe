import { useState } from "react";
import { C, F, glassPanel } from "../../theme/tokens";
import { Icon } from "../../components/Icon";

// ─── CollectionCard ───────────────────────────────────────────────────────────
interface CollectionCardProps {
  title:        string;
  subtitle:     string;
  itemCount:    string;
  badgeColor:   string;
  badgeBorder:  string;
  buttonColor:  string;
  imageSrc?:    string;
  iconFallback?: string;
  iconBg?:      string;
}

function CollectionCard({
  title, subtitle, itemCount,
  badgeColor, badgeBorder, buttonColor,
  imageSrc, iconFallback, iconBg,
}: CollectionCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...glassPanel,
        display:    "flex",
        flexDirection: "column",
        cursor:     "pointer",
        transform:  hovered ? "translateY(-8px)" : "translateY(0)",
        borderColor: hovered ? "rgba(88,101,242,0.4)" : "rgba(69,70,85,0.4)",
        background: hovered
          ? "rgba(88,101,242,0.08)"
          : "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
        boxShadow:  hovered ? "0 20px 40px -20px rgba(88,101,242,0.3)" : "none",
        transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
        overflow:   "hidden",
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          height:     224,
          background: iconBg ?? C.surfaceVariant,
          position:   "relative",
          overflow:   "hidden",
          display:    "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position:   "absolute",
            inset:      0,
            background: "linear-gradient(to top, #12131b, transparent)",
            opacity:    0.6,
            zIndex:     1,
          }}
        />
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={title}
            style={{
              width:      "100%",
              height:     "100%",
              objectFit:  "cover",
              transform:  hovered ? "scale(1.1)" : "scale(1)",
              transition: "transform 0.7s",
            }}
          />
        ) : (
          <Icon
            name={iconFallback ?? "folder"}
            size={100}
            style={{
              color:      `${C.onSurface}33`,
              transform:  hovered ? "scale(1.1)" : "scale(1)",
              transition: "transform 0.7s",
            }}
          />
        )}
        {/* Badge */}
        <div style={{ position: "absolute", top: 16, right: 16, zIndex: 2 }}>
          <span
            style={{
              background:     "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              color:          badgeColor,
              padding:        "4px 12px",
              borderRadius:   9999,
              fontSize:       12,
              fontWeight:     700,
              border:         `1px solid ${badgeBorder}`,
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
            <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: C.onSurface, letterSpacing: "-0.02em" }}>
              {title}
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: C.onSurfaceVariant }}>
              {subtitle}
            </p>
          </div>
          <button
            style={{ background: "none", border: "none", color: C.onSurfaceVariant, cursor: "pointer", padding: 4 }}
          >
            <Icon name="more_vert" size={20} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            style={{
              flex:         1,
              background:   `${buttonColor}1a`,
              color:        buttonColor,
              border:       "none",
              borderRadius: 12,
              padding:      "8px 0",
              fontWeight:   700,
              fontSize:     14,
              cursor:       "pointer",
              fontFamily:   F.family,
              transition:   "background 0.2s",
            }}
          >
            Quick Edit
          </button>
          <button
            style={{
              background:   `${C.surfaceVariant}4d`,
              border:       "none",
              borderRadius: 12,
              padding:      8,
              color:        C.onSurface,
              cursor:       "pointer",
              display:      "flex",
              alignItems:   "center",
              justifyContent: "center",
            }}
          >
            <Icon name="share" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AddNewCard ───────────────────────────────────────────────────────────────
function AddNewCard() {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border:         `2px dashed ${hovered ? `${C.primary}80` : `${C.outlineVariant}4d`}`,
        borderRadius:   16,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        padding:        40,
        gap:            16,
        cursor:         "pointer",
        background:     hovered ? `${C.primary}0d` : "transparent",
        transition:     "all 0.3s",
      }}
    >
      <div
        style={{
          width:          80,
          height:         80,
          borderRadius:   9999,
          background:     hovered ? C.primaryContainer : C.surfaceVariant,
          color:          hovered ? C.onPrimaryContainer : C.onSurface,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          transition:     "all 0.3s",
        }}
      >
        <Icon name="add" size={40} />
      </div>
      <div style={{ textAlign: "center" }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.onSurface }}>Create New</h3>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: C.onSurfaceVariant }}>Organize your content</p>
      </div>
    </div>
  );
}

// ─── RecentFileRow ────────────────────────────────────────────────────────────
function RecentFileRow({ icon, iconColor, name, meta }: {
  icon: string; iconColor: string; name: string; meta: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding:        "16px 20px",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        background:     hovered ? "rgba(255,255,255,0.03)" : "transparent",
        transition:     "background 0.2s",
        cursor:         "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width:          52,
            height:         52,
            borderRadius:   12,
            background:     C.surfaceContainer,
            border:         `1px solid ${C.outlineVariant}1a`,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon} size={24} style={{ color: iconColor }} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontWeight: 700, fontSize: 16, color: C.onSurface }}>{name}</h4>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: C.outline }}>{meta}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <button style={{ background: "none", border: "none", color: C.onSurfaceVariant, cursor: "pointer", padding: 8 }}>
          <Icon name="download" size={20} />
        </button>
        <button style={{ background: "none", border: "none", color: C.onSurfaceVariant, cursor: "pointer", padding: 8 }}>
          <Icon name="delete" size={20} />
        </button>
      </div>
    </div>
  );
}

// ─── AllFilesPage ─────────────────────────────────────────────────────────────
export default function AllFilesPage() {
  return (
    <div style={{ padding: 48, display: "flex", flexDirection: "column", gap: 48 }}>

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <nav style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.outlineVariant }}>
            <span>Collections</span>
            <Icon name="chevron_right" size={14} style={{ color: C.outlineVariant }} />
            <span style={{ color: C.onSurface, fontWeight: 700 }}>Main Storage</span>
          </nav>
          <h1 style={{ margin: 0, fontFamily: F.family, fontSize: 36, fontWeight: 700, color: C.onSurface, letterSpacing: "-0.03em" }}>
            Explore Collections
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            style={{
              background:   C.surfaceVariant,
              color:        C.onSurface,
              border:       `1px solid ${C.outlineVariant}33`,
              borderRadius: 24,
              padding:      "14px 24px",
              fontWeight:   700,
              fontSize:     15,
              display:      "flex",
              alignItems:   "center",
              gap:          10,
              cursor:       "pointer",
              fontFamily:   F.family,
            }}
          >
            <Icon name="create_new_folder" size={20} />
            New Collection
          </button>
          <button
            style={{
              background:   C.primaryContainer,
              color:        C.onPrimaryContainer,
              border:       "none",
              borderRadius: 24,
              padding:      "14px 24px",
              fontWeight:   800,
              fontSize:     15,
              display:      "flex",
              alignItems:   "center",
              gap:          10,
              cursor:       "pointer",
              fontFamily:   F.family,
              boxShadow:    "0 25px 50px -12px rgba(88,101,242,0.4)",
            }}
          >
            <Icon name="cloud_upload" size={20} />
            Upload Content
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div
        style={{
          ...glassPanel,
          padding:        20,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          gap:            32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ color: C.outlineVariant, fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Vault Usage
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: C.onSurface, letterSpacing: "-0.02em" }}>12.4 GB</span>
              <span style={{ fontSize: 16, color: C.outlineVariant }}> / 100 GB</span>
            </div>
          </div>
          <div style={{ width: 240, height: 10, background: C.surfaceVariant, borderRadius: 9999, overflow: "hidden" }}>
            <div style={{ width: "45%", height: "100%", background: C.primary }} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32, borderLeft: `1px solid ${C.outlineVariant}1a`, paddingLeft: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ color: C.outlineVariant, fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>Status</span>
            <span style={{ color: C.primary, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, fontSize: 16 }}>
              <Icon name="verified_user" size={16} filled />
              Encrypted
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ color: C.outlineVariant, fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>Active Items</span>
            <span style={{ color: C.onSurface, fontWeight: 800, fontSize: 16 }}>2,636 Files</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button style={{ padding: 10, background: "none", border: "none", color: C.onSurfaceVariant, borderRadius: 10, cursor: "pointer" }}>
            <Icon name="list" />
          </button>
          <button
            style={{
              padding:      10,
              background:   `${C.primary}1a`,
              border:       `1px solid ${C.primary}33`,
              color:        C.primary,
              borderRadius: 10,
              cursor:       "pointer",
            }}
          >
            <Icon name="grid_view" />
          </button>
        </div>
      </div>

      {/* Collection cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
        <CollectionCard
          title="Valorant"
          subtitle="Clips & VODs"
          itemCount="128 Items"
          badgeColor={C.primary}
          badgeBorder={`${C.primary}4d`}
          buttonColor={C.primary}
          imageSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuDmSuhQxlltTYj1EZYrbQU7YGBQBMQVYgRAQ59Cj8XNwuxpPk7-hHSlqhhLilROI02Ve80IXoOonkx5YRhRgGXBWA4W8FisrfARwraCvj24DLDIqXCOvDvcx63ah8m6PLBaKb2wEn1NjJKWwBGEjo1YDC91HqVNhxkKJkWGW-yRokP81lJqjmDSeVqbRc8STG5Tl1ecSmhb2h7WkX1kH_ysl5sVwsQySExpGHaGn_IBsJ9qhbDRH7QT_BhjVvO75dFmIkdxEfewX6Za"
        />
        <CollectionCard
          title="Overwatch"
          subtitle="Highlights"
          itemCount="42 Items"
          badgeColor={C.tertiary}
          badgeBorder={`${C.tertiary}4d`}
          buttonColor={C.tertiary}
          imageSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuAEgyDn1IcgJtdC-pj8CIQ0rq1xZLmsZZf9AjFpdjCSP_NBeVumiUA24km-xcL_kJTbooEHH6vq38SmEBS8f2xYm6WSIOPdma1uTi9Ks43ddq3HfU9BwAIwo-HbWZBpkX_jHMTFuNhoSLpT0pVV0YLLmLtaRHCiSfFT0s7iEM6GsYsyKxOWnNfXgrTuFohsHi9plGPHgeJXAVoJKj3keQQFmjEBuPgj_VVi02rRN6GZED2iBQ4uXGnKervZPNgxAnnIqjBF54M4j_QE"
        />
        <CollectionCard
          title="Minecraft"
          subtitle="Saves & World Data"
          itemCount="2,450 Items"
          badgeColor={C.onSurface}
          badgeBorder={`${C.outlineVariant}4d`}
          buttonColor={C.onSurface}
          iconFallback="grid_on"
          iconBg="linear-gradient(135deg, rgba(34,197,94,0.2), rgba(59,130,246,0.2))"
        />
        <AddNewCard />
      </div>

      {/* Recent activity */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ margin: 0, fontFamily: F.family, fontSize: 24, fontWeight: 700, color: C.onSurface, letterSpacing: "-0.02em" }}>
          Recent Activity
        </h2>
        <div style={{ ...glassPanel, overflow: "hidden", border: `1px solid ${C.outlineVariant}1a` }}>
          <div
            style={{
              padding:        "16px 20px",
              borderBottom:   `1px solid ${C.outlineVariant}1a`,
              display:        "flex",
              alignItems:     "center",
              gap:            10,
              background:     "rgba(255,255,255,0.03)",
            }}
          >
            <Icon name="history" style={{ color: C.primary }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Latest files uploaded to vault</span>
          </div>
          <RecentFileRow icon="movie"       iconColor={C.tertiary} name="clutch_round_final.mp4"    meta="Uploaded 2 hours ago • 45.2 MB" />
          <div style={{ height: 1, background: `${C.outlineVariant}0d` }} />
          <RecentFileRow icon="description" iconColor={C.primary}  name="vanguard_config_v2.cfg"    meta="Uploaded yesterday • 12 KB" />
        </div>
      </div>

      {/* Vault status toast */}
      <div
        style={{
          position:       "fixed",
          bottom:         32,
          right:          32,
          background:     "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
          backdropFilter: "blur(40px)",
          padding:        "12px 20px",
          borderRadius:   24,
          display:        "flex",
          alignItems:     "center",
          gap:            16,
          boxShadow:      "0 0 20px rgba(88,101,242,0.3), 0 25px 50px -12px rgba(0,0,0,0.5)",
          border:         `1px solid ${C.primary}33`,
          zIndex:         60,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width:        12,
              height:       12,
              background:   "#22c55e",
              borderRadius: 9999,
              boxShadow:    "0 0 10px rgba(34,197,94,0.8)",
              animation:    "pulse 2s infinite",
            }}
          />
          <span style={{ fontSize: 14, fontWeight: 800, color: C.onSurface }}>Vault Sync Active</span>
        </div>
        <div style={{ width: 1, height: 28, background: `${C.outlineVariant}33` }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: C.outlineVariant, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Last sync: 2m ago
        </span>
      </div>
    </div>
  );
}
