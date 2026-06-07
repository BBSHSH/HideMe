import { useRef, useState, useEffect } from "react";
import { useStorageFiles } from "../../hooks/useFiles";
import { formatBytes, formatRelativeTime } from "../../utils/format";
import { C } from "../../theme/tokens";
import CollectionCard from "./CollectionCard";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const CARD_WIDTH = 200;
const GAP = 16;

export default function RecentActivity() {
  const { files, loading, error } = useStorageFiles();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows);
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateArrows); ro.disconnect(); };
  }, [files]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? CARD_WIDTH + GAP : -(CARD_WIDTH + GAP), behavior: "smooth" });
  };

  const arrowBtn = (dir: "left" | "right", visible: boolean) => (
    <button
      onClick={() => scroll(dir)}
      style={{
        position: "absolute", top: "50%", [dir]: -16,
        transform: "translateY(-50%)", zIndex: 10,
        width: 32, height: 32, borderRadius: "50%",
        border: "1px solid rgba(88,101,242,0.35)",
        background: "rgba(18,19,27,0.92)", backdropFilter: "blur(8px)",
        color: "#bec2ff", display: "flex", alignItems: "center",
        justifyContent: "center", cursor: "pointer",
        opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.2s", boxShadow: "0 2px 12px rgba(88,101,242,0.25)", padding: 0,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
        {dir === "left" ? "chevron_left" : "chevron_right"}
      </span>
    </button>
  );

  if (loading) return <div style={{ padding: 32, textAlign: "center", color: C.outlineVariant }}>読み込み中...</div>;
  if (error) return <div style={{ padding: 32, textAlign: "center", color: "#f87171" }}>Failed to load files</div>;
  if (files.length === 0) return <div style={{ padding: 32, textAlign: "center", color: C.outlineVariant }}>No files yet</div>;

  return (
    <div style={{ position: "relative" }}>
      <style>{`.ra-hscroll::-webkit-scrollbar{display:none}.ra-hscroll{-ms-overflow-style:none;scrollbar-width:none}`}</style>
      {arrowBtn("left", canLeft)}
      <div
        ref={scrollRef}
        className="ra-hscroll"
        style={{ display: "flex", gap: GAP, overflowX: "auto", overflowY: "visible", paddingBottom: 4, paddingTop: 2 }}
      >
        {files.map((file) => (
          <div
            key={file.name}
            style={{ flexShrink: 0, width: CARD_WIDTH, cursor: "pointer" }}
            onClick={() => window.open(`${BASE_URL}/v1/files/${file.name}`, "_blank")}
          >
            <CollectionCard
              title={file.name.replace(/\.[^.]+$/, "")}
              subtitle={`${formatBytes(file.size)} · ${formatRelativeTime(file.modified)}`}
              itemCount=""
              badgeColor={C.primary}
              badgeBorder={`${C.primary}4d`}
              buttonColor={C.primary}
              iconFallback="insert_drive_file"
              size="small"
            />
          </div>
        ))}
      </div>
      {canRight && (
        <div style={{
          position: "absolute", top: 0, right: 0,
          width: 72, height: "calc(100% - 4px)",
          background: "linear-gradient(to right, transparent, #12131b 85%)",
          pointerEvents: "none",
        }} />
      )}
      {arrowBtn("right", canRight)}
    </div>
  );
}
