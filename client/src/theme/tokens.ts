import type { CSSProperties } from "react";

export const C = {
  background:             "#12131b",
  surface:                "#12131b",
  surfaceContainer:       "#1f1f27",
  surfaceContainerLow:    "#1a1b23",
  surfaceContainerHigh:   "#292932",
  surfaceVariant:         "#34343d",
  onBackground:           "#e3e1ed",
  onSurface:              "#e3e1ed",
  onSurfaceVariant:       "#c6c5d7",
  primary:                "#bec2ff",
  primaryContainer:       "#5865f2",
  onPrimary:              "#000da4",
  onPrimaryContainer:     "#fffdff",
  secondary:              "#c4c6ce",
  tertiary:               "#ffb689",
  outline:                "#8f8fa0",
  outlineVariant:         "#454655",
  error:                  "#ffb4ab",
} as const;

export const F = {
  family: "'Manrope', sans-serif",
  headlineLg: { fontSize: 32, lineHeight: 1.2, letterSpacing: "-0.03em", fontWeight: 700 },
  headlineMd: { fontSize: 24, lineHeight: 1.2, letterSpacing: "-0.02em", fontWeight: 700 },
  bodyMd:     { fontSize: 16, lineHeight: 1.5, letterSpacing: "0em",     fontWeight: 400 },
  labelSm:    { fontSize: 12, lineHeight: 1,   letterSpacing: "0.05em",  fontWeight: 600 },
} as const;

export const glassPanel: CSSProperties = {
  background:     "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
  backdropFilter: "blur(40px)",
  border:         `1px solid rgba(69,70,85,0.4)`,
  borderRadius:   16,
};
