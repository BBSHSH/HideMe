import type { CSSProperties } from "react";

// ─── CSS変数参照（テーマ切替で自動更新） ───────────────────
export const C = {
  background:             "var(--c-background)",
  surface:                "var(--c-surface)",
  surfaceContainer:       "var(--c-surfaceContainer)",
  surfaceContainerLow:    "var(--c-surfaceContainerLow)",
  surfaceContainerHigh:   "var(--c-surfaceContainerHigh)",
  surfaceVariant:         "var(--c-surfaceVariant)",
  onBackground:           "var(--c-onBackground)",
  onSurface:              "var(--c-onSurface)",
  onSurfaceVariant:       "var(--c-onSurfaceVariant)",
  primary:                "var(--c-primary)",
  primaryContainer:       "var(--c-primaryContainer)",
  onPrimary:              "var(--c-onPrimary)",
  onPrimaryContainer:     "var(--c-onPrimaryContainer)",
  secondary:              "var(--c-secondary)",
  tertiary:               "var(--c-tertiary)",
  outline:                "var(--c-outline)",
  outlineVariant:         "var(--c-outlineVariant)",
  error:                  "var(--c-error)",
  // セマンティックα（rgba合成不要な箇所で利用）
  border:                 "var(--c-border)",           // outline 30%
  borderStrong:           "var(--c-borderStrong)",      // outline 50%
  overlay05:              "var(--c-overlay05)",         // primary 5%
  overlay10:              "var(--c-overlay10)",         // primary 10%
  overlay15:              "var(--c-overlay15)",         // primary 15%
  overlay20:              "var(--c-overlay20)",         // primary 20%
  glass:                  "var(--c-glass)",
  glassBorder:            "var(--c-glassBorder)",
} as const;

// ─── 静的カラー定義（ThemeContext で CSS変数にセット） ────
export const DARK = {
  background:           "#12131b",
  surface:              "#12131b",
  surfaceContainer:     "#1f1f27",
  surfaceContainerLow:  "#1a1b23",
  surfaceContainerHigh: "#292932",
  surfaceVariant:       "#34343d",
  onBackground:         "#e3e1ed",
  onSurface:            "#e3e1ed",
  onSurfaceVariant:     "#c6c5d7",
  primary:              "#bec2ff",
  primaryContainer:     "#5865f2",
  onPrimary:            "#000da4",
  onPrimaryContainer:   "#fffdff",
  secondary:            "#c4c6ce",
  tertiary:             "#ffb689",
  outline:              "#8f8fa0",
  outlineVariant:       "#454655",
  error:                "#ffb4ab",
  // α合成済みセマンティック
  border:               "rgba(69,70,85,0.30)",
  borderStrong:         "rgba(69,70,85,0.50)",
  overlay05:            "rgba(88,101,242,0.05)",
  overlay10:            "rgba(88,101,242,0.10)",
  overlay15:            "rgba(88,101,242,0.15)",
  overlay20:            "rgba(88,101,242,0.20)",
  glass:                "rgba(255,255,255,0.04)",
  glassBorder:          "rgba(69,70,85,0.40)",
} as const;

export const LIGHT = {
  background:           "#f0f1f8",
  surface:              "#ffffff",
  surfaceContainer:     "#e8e8f2",
  surfaceContainerLow:  "#f5f5fb",
  surfaceContainerHigh: "#dcdce8",
  surfaceVariant:       "#e2e2ec",
  onBackground:         "#1a1b26",
  onSurface:            "#1a1b26",
  onSurfaceVariant:     "#44455a",
  primary:              "#3d4de8",
  primaryContainer:     "#5865f2",
  onPrimary:            "#ffffff",
  onPrimaryContainer:   "#ffffff",
  secondary:            "#5c5d70",
  tertiary:             "#b35c00",
  outline:              "#75768a",
  outlineVariant:       "#b8b9cc",
  error:                "#b3261e",
  // α合成済みセマンティック
  border:               "rgba(184,185,204,0.50)",
  borderStrong:         "rgba(184,185,204,0.80)",
  overlay05:            "rgba(88,101,242,0.05)",
  overlay10:            "rgba(88,101,242,0.10)",
  overlay15:            "rgba(88,101,242,0.18)",
  overlay20:            "rgba(88,101,242,0.22)",
  glass:                "rgba(0,0,0,0.03)",
  glassBorder:          "rgba(180,180,200,0.50)",
} as const;

export type ThemeColors = typeof DARK;

export const F = {
  family: "'Manrope', sans-serif",
  headlineLg: { fontSize: 32, lineHeight: 1.2, letterSpacing: "-0.03em", fontWeight: 700 },
  headlineMd: { fontSize: 24, lineHeight: 1.2, letterSpacing: "-0.02em", fontWeight: 700 },
  bodyMd:     { fontSize: 16, lineHeight: 1.5, letterSpacing: "0em",     fontWeight: 400 },
  labelSm:    { fontSize: 12, lineHeight: 1,   letterSpacing: "0.05em",  fontWeight: 600 },
} as const;

export const glassPanel: CSSProperties = {
  background:     "var(--c-glass)",
  backdropFilter: "blur(40px)",
  border:         "1px solid var(--c-glassBorder)",
  borderRadius:   16,
};
