import {Icon}  from "../Icon";
import { C, F } from "../../theme/tokens";

type Props = {
  title: string;
  icon?: string;
};

export default function SectionTitle({
  title,
  icon,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: C.primary,
      }}
    >
      {icon && (
        <Icon
          name={icon}
          filled
        />
      )}

      <span
        style={{
          ...F.labelSm,
          textTransform: "uppercase",
        }}
      >
        {title}
      </span>
    </div>
  );
}