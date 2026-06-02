import { C } from "../../theme/tokens";

type Props = {
  value: number;
};

export default function ProgressBar({
  value,
}: Props) {
  return (
    <div
      style={{
        width: "100%",
        height: 8,
        borderRadius: 999,
        background: C.surfaceVariant,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${value}%`,
          height: "100%",
          background: C.primary,
          transition: "0.3s",
        }}
      />
    </div>
  );
}