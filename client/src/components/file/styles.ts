import type { CSSProperties } from "react";

export const glassPanel: CSSProperties = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
  backdropFilter: "blur(40px)",
  border: "1px solid rgba(190,194,255,0.1)",
};

export const card: CSSProperties = {
  ...glassPanel,
  borderRadius: 16,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  cursor: "pointer",
  border: "1px solid rgba(69,70,85,0.4)",
  transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
};
