import { useState, useEffect, useMemo, useRef } from "react";
import { useSettings } from "../../context/SettingsContext";
import { useNavigate } from "react-router-dom";
import { C } from "../../theme/tokens";
import { useCollections } from "../../hooks/useFiles";
import { useAuth } from "../../context/AuthContext";
import CreateCollectionModal from "./CreateCollectionModal";
import CollectionCard from "./CollectionCard";
import AddCollectionCard from "./AddCollectionCard";
import { formatBytes } from "../../utils/format";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

function getToken() {
  return JSON.parse(localStorage.getItem("hideme_auth") || "{}").token ?? "";
}

interface CollectionGridProps {
  columns?: 1 | 2 | 3 | 4;
  cardSize?: "small" | "medium" | "large"; // 未指定なら設定値を使用
  showAddButton?: boolean;
  linkPath?: string;
  horizontal?: boolean; // 横スクロールモード
}

export default function CollectionGrid({
  cardSize,
  showAddButton = true,
  linkPath = "/file/collection",
  horizontal = false,
}: CollectionGridProps) {
  const { collections, loading, error } = useCollections();
  const { isAdmin } = useAuth();
  const { settings } = useSettings();
  // cardSize prop が指定されていなければ設定値を使用
  const resolvedCardSize = cardSize ?? settings.collectionCardSize;
  const [showModal, setShowModal] = useState(false);
  const [, forceRefresh] = useState(0);
  const navigate = useNavigate();

  // コレクションごとのファイル数・容量を集計
  const [allFiles, setAllFiles] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${BASE_URL}/v1/all-files`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((d) => setAllFiles(d?.items ?? []))
      .catch(() => {});
  }, []);

  const collectionStats = useMemo(() => {
    const map: Record<string, { count: number; size: number }> = {};
    for (const f of allFiles) {
      const id = f.collection_id;
      if (!id) continue;
      if (!map[id]) map[id] = { count: 0, size: 0 };
      map[id].count++;
      map[id].size += f.file_size ?? 0;
    }
    return map;
  }, [allFiles]);

  const handleCreated = () => forceRefresh((n) => n + 1);

  const sizeConfig = { small: 180, medium: 240, large: 300 };
  const minWidth = sizeConfig[resolvedCardSize];

  if (loading) return (
    <div style={{ color: C.outlineVariant, padding: 32, textAlign: "center" }}>Loading...</div>
  );
  if (error) return (
    <div style={{ color: "#f87171", padding: 32, textAlign: "center" }}>Failed to load collections</div>
  );

  const cards = (
    <>
      {collections.map((col) => {
        const cs = collectionStats[col.ID] ?? { count: 0, size: 0 };
        const subtitle = `${cs.count} ファイル · ${formatBytes(cs.size)}`;
        return (
          <div
            key={col.ID}
            onClick={() => navigate(`${linkPath}/${col.ID}`)}
            style={{ cursor: "pointer", flexShrink: horizontal ? 0 : undefined, width: horizontal ? minWidth : undefined }}
          >
            <CollectionCard
              title={col.Name}
              subtitle={subtitle}
              itemCount=""
              badgeColor={col.Color || C.primary}
              badgeBorder={`${col.Color || C.primary}4d`}
              buttonColor={col.Color || C.primary}
              iconFallback={col.Icon || "folder"}
              imageSrc={
                col.ImageURL
                  ? col.ImageURL.startsWith("http")
                    ? col.ImageURL
                    : `${BASE_URL}/v1/files/${col.ImageURL}`
                  : undefined
              }
              size={resolvedCardSize}
            />
          </div>
        );
      })}
      {showAddButton && isAdmin && (
        <div style={{ flexShrink: horizontal ? 0 : undefined, width: horizontal ? minWidth : undefined }}>
          <AddCollectionCard onClick={() => setShowModal(true)} />
        </div>
      )}
    </>
  );

  return (
    <>
      {showModal && (
        <CreateCollectionModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      {horizontal ? (
        <HorizontalScroll minWidth={minWidth}>{cards}</HorizontalScroll>
      ) : (
        // ── 通常グリッドモード ──
        <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`, gap: 16, overflow: "hidden" }}>
          {cards}
        </div>
      )}
    </>
  );
}

// ── 横スクロールコンテナ（矢印ボタン付き） ─────────────────────────────

function HorizontalScroll({ children, minWidth }: { children: React.ReactNode; minWidth: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft,  setCanLeft]  = useState(false);
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
  }, []);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? minWidth + 16 : -(minWidth + 16), behavior: "smooth" });
  };

  const arrowBtn = (dir: "left" | "right", visible: boolean) => (
    <button
      onClick={() => scroll(dir)}
      style={{
        position: "absolute",
        top: "50%",
        [dir]: -16,
        transform: "translateY(-50%)",
        zIndex: 10,
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: "1px solid rgba(88,101,242,0.35)",
        background: "rgba(18,19,27,0.92)",
        backdropFilter: "blur(8px)",
        color: "#bec2ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.2s",
        boxShadow: "0 2px 12px rgba(88,101,242,0.25)",
        padding: 0,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
        {dir === "left" ? "chevron_left" : "chevron_right"}
      </span>
    </button>
  );

  return (
    <div style={{ position: "relative" }}>
      <style>{`
        .col-hscroll::-webkit-scrollbar { display: none; }
        .col-hscroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {arrowBtn("left",  canLeft)}

      <div
        ref={scrollRef}
        className="col-hscroll"
        style={{
          display: "flex",
          gap: 16,
          overflowX: "auto",
          overflowY: "visible",
          paddingBottom: 4,
          paddingTop: 2,
        }}
      >
        {children}
      </div>

      {/* 右フェード */}
      {canRight && (
        <div style={{
          position: "absolute",
          top: 0, right: 0,
          width: 72, height: "calc(100% - 4px)",
          background: "linear-gradient(to right, transparent, #12131b 85%)",
          pointerEvents: "none",
        }} />
      )}

      {arrowBtn("right", canRight)}
    </div>
  );
}
