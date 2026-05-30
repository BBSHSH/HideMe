import type { CSSProperties } from "react";

const base: CSSProperties = {
  fontFamily:          "'Material Symbols Outlined'",
  fontWeight:          400,
  fontStyle:           "normal",
  lineHeight:          1,
  letterSpacing:       "normal",
  textTransform:       "none",
  display:             "inline-block",
  verticalAlign:       "middle",
  whiteSpace:          "nowrap",
  wordWrap:            "normal",
  direction:           "ltr",
  WebkitFontSmoothing: "antialiased",
};

export function Icon({
  name,
  filled = false,
  size = 24,
  style,
}: {
  name:     string;
  filled?:  boolean;
  size?:    number;
  style?:   CSSProperties;
}) {
  return (
    <span
      style={{
        ...base,
        fontSize: size,
        fontVariationSettings: filled
          ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
          : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
        ...style,
      }}
    >
      {name}
    </span>
  );
}
