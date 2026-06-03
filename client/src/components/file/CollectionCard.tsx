import { useState } from "react";
import { C, glassPanel } from "../../theme/tokens";
import { Icon } from "../Icon";

interface CollectionCardProps {
  title: string;
  subtitle: string;
  itemCount: string;
  badgeColor: string;
  badgeBorder: string;
  buttonColor: string;
  imageSrc?: string;
  iconFallback?: string;
  iconBg?: string;
  size?: "small" | "medium" | "large";  // ← 追加
}

export default function CollectionCard({
  title,
  subtitle,
  imageSrc,
  iconFallback,
  iconBg,
  size = "small",  // ← デフォルト
}: CollectionCardProps) {
  const [hovered, setHovered] = useState(false);

  const sizeConfig = {
    small: { height: 140, fontSize: 18, iconSize: 70 },
    medium: { height: 224, fontSize: 24, iconSize: 100 },
    large: { height: 300, fontSize: 28, iconSize: 120 },
  };

  const config = sizeConfig[size];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...glassPanel,
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transform: hovered ? "translateY(-8px)" : "translateY(0)",
        borderColor: hovered ? "rgba(88,101,242,0.4)" : "rgba(69,70,85,0.4)",
        background: hovered
          ? "rgba(88,101,242,0.08)"
          : "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
        boxShadow: hovered ? "0 20px 40px -20px rgba(88,101,242,0.3)" : "none",
        transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: config.height,
          background: iconBg ?? C.surfaceVariant,
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
          <Icon
            name={iconFallback ?? "folder"}
            size={config.iconSize}
            style={{
              color: `${C.onSurface}33`,
              transform: hovered ? "scale(1.1)" : "scale(1)",
              transition: "transform 0.7s",
            }}
          />
        )}
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: config.fontSize, fontWeight: 700, color: C.onSurface, letterSpacing: "-0.02em" }}>
            {title}
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: C.onSurfaceVariant }}>
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}