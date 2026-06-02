type FilterDotProps = {
  dotColor: string;
  label: string;
};

export default function FilterDot({ dotColor, label }: FilterDotProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        color: "#c6c5d7",
        padding: "6px 0",
        cursor: "pointer",
        fontSize: 16,
        lineHeight: "1.5",
      }}
    >
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: 9999,
          background: dotColor,
          flexShrink: 0,
        }}
      />
      {label}
    </div>
  );
}
