import type { CSSProperties, ReactNode } from "react";
import { glassPanel } from "../../theme/tokens";

type Props = {
  children: ReactNode;
  style?: CSSProperties;
};

export default function Card({
  children,
  style,
}: Props) {
  return (
    <div
      style={{
        ...glassPanel,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}