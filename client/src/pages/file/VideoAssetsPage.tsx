import { useState } from "react";
import { C, F, glassPanel } from "../../theme/tokens";
import { Icon } from "../../components/Icon";

// ─── ActionBtn ────────────────────────────────────────────────────────────────
function ActionBtn({ icon, title, danger = false }: { icon: string; title: string; danger?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding:        12,
        borderRadius:   8,
        border:         `1px solid ${danger ? `${C.error}33` : "rgba(69,70,85,0.3)"}`,
        background:     hover ? (danger ? `${C.error}1a` : `${C.primary}1a`) : "transparent",
        color:          danger ? C.error : hover ? C.primary : C.onSurfaceVariant,
        cursor:         "pointer",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        transition:     "all 0.2s",
      }}
    >
      <Icon name={icon} />
    </button>
  );
}

// ─── MetaCell ─────────────────────────────────────────────────────────────────
function MetaCell({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontFamily: F.family, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: C.onSurfaceVariant, marginBottom: 4 }}>
        {label}
      </p>
      {value
        ? <p style={{ fontFamily: F.family, ...F.bodyMd, fontWeight: 700, margin: 0 }}>{value}</p>
        : children}
    </div>
  );
}

// ─── VaultTag ─────────────────────────────────────────────────────────────────
function VaultTag({ label }: { label: string }) {
  const [hover, setHover] = useState(false);
  return (
    <span
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding:      "4px 12px",
        borderRadius: 4,
        background:   C.surfaceContainerHigh,
        border:       `1px solid ${hover ? C.primary : "rgba(69,70,85,0.3)"}`,
        fontFamily:   F.family,
        ...F.labelSm,
        color:        C.onSurface,
        cursor:       "pointer",
        transition:   "border-color 0.2s",
      }}
    >
      {label}
    </span>
  );
}

// ─── RelatedClip ──────────────────────────────────────────────────────────────
function RelatedClip({ src, title, meta, duration }: { src: string; title: string; meta: string; duration: string }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...glassPanel,
        padding:    8,
        display:    "flex",
        gap:        16,
        cursor:     "pointer",
        background: hover ? "rgba(52,52,61,0.2)" : glassPanel.background,
        transition: "all 0.2s",
      }}
    >
      <div style={{ width: 128, height: 80, borderRadius: 8, overflow: "hidden", position: "relative", flexShrink: 0 }}>
        <img src={src} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <span
          style={{
            position:     "absolute",
            bottom:       4,
            right:        4,
            padding:      "1px 4px",
            background:   "rgba(0,0,0,0.8)",
            borderRadius: 4,
            fontFamily:   F.family,
            fontSize:     10,
            fontWeight:   700,
            color:        "#fff",
          }}
        >
          {duration}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
        <h3
          style={{
            fontFamily:    F.family,
            ...F.bodyMd,
            fontWeight:    700,
            color:         hover ? C.primary : C.onSurface,
            margin:        0,
            whiteSpace:    "nowrap",
            overflow:      "hidden",
            textOverflow:  "ellipsis",
            transition:    "color 0.2s",
          }}
        >
          {title}
        </h3>
        <p style={{ fontFamily: F.family, ...F.labelSm, color: C.onSurfaceVariant, margin: "4px 0 0" }}>{meta}</p>
      </div>
    </div>
  );
}

// ─── VideoOverlay ─────────────────────────────────────────────────────────────
function VideoOverlay() {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
    >
      <div
        style={{
          flex:           1,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          background:     hover ? "rgba(0,0,0,0.4)" : "transparent",
          transition:     "background 0.2s",
        }}
      >
        {hover && (
          <button
            style={{
              width:        80,
              height:       80,
              borderRadius: "50%",
              background:   C.primary,
              border:       "none",
              cursor:       "pointer",
              display:      "flex",
              alignItems:   "center",
              justifyContent: "center",
              boxShadow:    `0 0 30px rgba(190,194,255,0.4)`,
            }}
          >
            <Icon name="play_arrow" filled size={40} style={{ color: C.onPrimary }} />
          </button>
        )}
      </div>
      <div
        style={{
          height:     64,
          background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
          display:    "flex",
          alignItems: "center",
          padding:    "0 24px",
          gap:        16,
        }}
      >
        <Icon name="play_circle" style={{ color: C.onPrimaryContainer, cursor: "pointer" }} />
        <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.2)", borderRadius: 99, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: "33%", background: C.primary }} />
        </div>
        <span style={{ fontFamily: F.family, ...F.labelSm, color: "#fff" }}>12:44 / 34:02</span>
        <Icon name="volume_up"  style={{ color: C.onPrimaryContainer, cursor: "pointer" }} />
        <Icon name="settings"   style={{ color: C.onPrimaryContainer, cursor: "pointer" }} />
        <Icon name="fullscreen" style={{ color: C.onPrimaryContainer, cursor: "pointer" }} />
      </div>
    </div>
  );
}

// ─── VideoAssetsPage ──────────────────────────────────────────────────────────
const RELATED_CLIPS = [
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBVULuKKxRBMJHX4o6HXjaovNf9ENXwnQkiZVBkcpFI5NgSGil8bNfluegftkwmG21Ag9_2GWQ0Z1mV0hyxmfrhYn7k1kDpP9URs7yAJrMzN93TY91BASBfTwT7l6fyfcefAipCJKunIWYT5WWATxBcxMZjx2AtjxE2X2zoaSSO81cHYClbL29ANF0DxkBaP81eCJHno4oNR6wUh01qazrF_MwMDnc2C37HXSoGhIZR7yX_F4yDEjW54c1lt0jizU_9SoiFlyk2tEyS",
    title: "Fracture_Plant_Defense.mp4", meta: "4 days ago • 840 MB", duration: "04:12",
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmT3mP3AIuOACN0bBIexPoPP7sjP6sSoFgtcVt1jQDKNIqVEoL8HahNRc4HO3BQWYej5gnx0xJ4CP7hkRHQwIAAfZcLX1NtVgRsP1CzlsJKY8nSyAaN0m9OeIK2_inLE4gNjaua-15JlCeNBAD0iH-wFVycLBR4Eu_sgdkpCA-52myXxRjh-DrVeA6i_DcO0ZRtnQovtV1lzYF4YGJYcmjZ_aYKtrE53I0Vpqp5lp8X2UWk1hzLbZYu-06WfMIALQn8W4fKbEiUQ6Z",
    title: "Ranked_Match_Summary.mp4", meta: "2 weeks ago • 420 MB", duration: "02:30",
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhj1rjxXHCVJM75I_qFIfmHp3iJYqKkUkRQzr1arb1RJE3QhIqAnMoDCdSfaa-JHRacJIuaM3urVMmpXAwvI-XKTK6LNiQoO85GrlhX6vpAiI4SltSOLWuZMeHr3PnXYyJ156o7wPM1JUfd2Nqga3Qd5rDnT6mC7ktYnBklpTxDcNubVhXkSmINOR1rXo8lFvk6NfXTjAw06QY7DdlF-UfN4xn22mFjTuSbNhSGlqxbfa63gyZ_Ldr6fpFqHEsIvqI9PiLWHIM4ojT",
    title: "Haven_Execute_A_Site.mp4", meta: "Oct 01, 2023 • 950 MB", duration: "08:52",
  },
];

export default function VideoAssetsPage() {
  return (
    <div
      style={{
        flex:       1,
        overflowY:  "auto",
        padding:    48,
        background: `radial-gradient(circle at top right, ${C.primary}0d 0%, transparent 60%)`,
      }}
    >
      {/* Breadcrumbs & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            {["Storage", "Video Assets", "Clips"].map((crumb, i, arr) => (
              <span key={crumb} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: F.family, ...F.labelSm, textTransform: "uppercase", letterSpacing: "0.1em", color: i === arr.length - 1 ? C.primary : C.onSurfaceVariant }}>
                  {crumb}
                </span>
                {i < arr.length - 1 && <Icon name="chevron_right" size={14} style={{ color: C.onSurfaceVariant }} />}
              </span>
            ))}
          </div>
          <h1 style={{ fontFamily: F.family, ...F.headlineLg, margin: 0 }}>VALORANT_ACE_S6_CHAMP.mp4</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          8,
              padding:      "10px 16px",
              borderRadius: 8,
              border:       `1px solid rgba(69,70,85,0.3)`,
              background:   "transparent",
              color:        C.onSurface,
              fontFamily:   F.family,
              cursor:       "pointer",
            }}
          >
            <Icon name="upload" size={20} />
            <span style={{ fontFamily: F.family, ...F.labelSm }}>Upload New Clip</span>
          </button>
          <div
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        8,
              padding:    "10px 16px",
              borderRadius: 8,
              background: C.primaryContainer,
              color:      C.onPrimaryContainer,
              fontWeight: 700,
              border:     `1px solid ${C.primary}80`,
              boxShadow:  `0 0 20px rgba(88,101,242,0.2)`,
              animation:  "vaultPulse 4s infinite cubic-bezier(0.4, 0, 0.6, 1)",
            }}
          >
            <Icon name="security" filled size={20} />
            <span style={{ fontFamily: F.family, ...F.labelSm }}>ENCRYPTED</span>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Player */}
          <div style={{ ...glassPanel, aspectRatio: "16/9", overflow: "hidden", position: "relative" }}>
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAc5aovBQRhqKLoqj3GEaZyLt3QN30rsB8PZiAxlxV-w7iR2khCRcdJ9MMOhBdC9RhEIdqYD-Jl-FbMzEfPa0aFvKvAlUpo8vlJ73LVPO86yE-NnNNnnQf7RhMzKSldLObkqqPWr4LPhQDuoOx5nMFHfM3VxkqYi6XST2qPRd2_U3ZiWDyYWseUiyjfxOOBZvE23qReVUP63SQhlJXgNSW61FizYBXUICa3JJ9OVGnOZuTnhrhebXf-y1sOoH1DDgUv0FwCJpnaYogV"
              alt="VALORANT clip"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <VideoOverlay />
          </div>

          {/* Metadata */}
          <div style={{ ...glassPanel, padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, auto)", gap: "0 40px" }}>
              <MetaCell label="File Size"   value="1.24 GB" />
              <MetaCell label="Upload Date" value="Oct 12, 2023" />
              <MetaCell label="Genre">
                <span style={{ padding: "2px 8px", borderRadius: 4, background: `${C.primary}1a`, border: `1px solid ${C.primary}33`, color: C.primary, fontFamily: F.family, ...F.labelSm }}>
                  Tactical FPS
                </span>
              </MetaCell>
              <MetaCell label="Status">
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#4ade80" }}>
                  <Icon name="verified" size={16} style={{ color: "#4ade80" }} />
                  <span style={{ fontFamily: F.family, ...F.labelSm }}>Secured</span>
                </div>
              </MetaCell>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ActionBtn icon="content_cut" title="Quick Edit" />
              <ActionBtn icon="download"    title="Download" />
              <ActionBtn icon="ios_share"   title="Share" />
              <ActionBtn icon="delete"      title="Delete" danger />
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontFamily: F.family, ...F.headlineMd, margin: 0 }}>Related Clips</h2>
            <button style={{ background: "none", border: "none", color: C.primary, fontFamily: F.family, ...F.labelSm, cursor: "pointer" }}>
              View All
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {RELATED_CLIPS.map((clip) => <RelatedClip key={clip.title} {...clip} />)}
          </div>
          <div style={{ ...glassPanel, padding: 24 }}>
            <h3 style={{ fontFamily: F.family, ...F.labelSm, textTransform: "uppercase", letterSpacing: "0.1em", color: C.onSurfaceVariant, marginBottom: 16 }}>
              Vault Tags
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["VALORANT", "COMPETITIVE", "SEASON 6", "HIGHLANDS", "ACES"].map((tag) => (
                <VaultTag key={tag} label={tag} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
