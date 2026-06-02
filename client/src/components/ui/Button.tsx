import type { ButtonHTMLAttributes, CSSProperties } from "react";
import { C } from "../../theme/tokens";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export default function Button({
  variant = "primary",
  style,
  children,
  ...props
}: Props) {
  const base: CSSProperties = {
    height: 44,
    padding: "0 16px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,

    fontWeight: 700,

    transition: "0.2s",
  };

  return (
    <button
      {...props}
      style={{
        ...base,

        ...(variant === "primary"
          ? {
              background: C.primaryContainer,
              color: C.onPrimaryContainer,
            }
          : {
              background: C.surfaceContainerHigh,
              color: C.onSurface,
            }),

        ...style,
      }}
    >
      {children}
    </button>
  );
}