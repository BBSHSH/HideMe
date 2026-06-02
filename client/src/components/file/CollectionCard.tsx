import { useState } from "react";
import { card } from "./styles";

type CollectionCardProps = {
  title: string;
  subtitle: string;
  itemCount: string;
  badgeColor: string;
  badgeBorder: string;
  buttonColor: string;
  buttonHoverBg?: string;
  imageSrc?: string;
  iconFallback?: string;
  iconBg?: string;
};

export default function CollectionCard(props: CollectionCardProps) {
  const {
    title,
    subtitle,
    itemCount,
    badgeColor,
    badgeBorder,
    buttonColor,
    imageSrc,
    iconFallback,
    iconBg,
  } = props;
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
