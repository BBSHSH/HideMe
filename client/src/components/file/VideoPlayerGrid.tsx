import { useState } from "react";
import VideoThumbnail from "./VideoThumbnail";

interface Category {
  label: string;
  value: string;
}

interface VideoCardData {
  id: number;
  title: string;
  channel: string;
  views: string;
  time: string;
  duration: string;
  badge?: {
    type: string;
    icon: string;
    style: React.CSSProperties;
  };
  imgSrc: string;
  avatarSrc: string;
  uploaderName?: string;
  fileInfo?: {
    fileName: string;
    fileSize: number;
    fileId?: string;
    thumbnailName?: string;
    uploadedBy?: string;
  };
}

interface VideoPlayerGridProps {
  videos: VideoCardData[];
  categories?: Category[];
  onCategoryChange?: (category: string) => void;
  onVideoClick?: (video: VideoCardData) => void;
  onDelete?: (fileId: string, uploadedBy: string) => void;
  currentUserId?: string;
  isAdmin?: boolean;
  maxRows?: number;
  cardMinWidth?: number;
}

/** アップロード者のイニシャルアバター（Discord アバターがない場合）*/
function UploaderAvatar({ name, src }: { name: string; src: string }) {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgError(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }

  // イニシャルフォールバック
  const initials = name
    .split(/[\s_\-#]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  // 名前をハッシュして色を決める
  const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: `hsl(${hue}, 55%, 35%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 800,
        color: "#fff",
        letterSpacing: "0.02em",
      }}
    >
      {initials || "?"}
    </div>
  );
}

export default function VideoPlayerGrid({
  videos,
  categories = [],
  onCategoryChange,
  onVideoClick,
  onDelete: _onDelete,
  currentUserId: _currentUserId,
  isAdmin: _isAdmin,
  maxRows,
  cardMinWidth = 260,
}: VideoPlayerGridProps) {
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    onCategoryChange?.(category);
  };

  // タイトルを2行分の高さに固定するためのライン高さ
  const TITLE_LINE_HEIGHT = 22; // px
  const TITLE_LINES = 2;
  const TITLE_HEIGHT = TITLE_LINE_HEIGHT * TITLE_LINES;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Category Chips */}
      {categories.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 8,
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              style={{
                padding: "4px 16px",
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                border:
                  activeCategory === cat.value
                    ? "none"
                    : "1px solid rgba(190,194,255,0.1)",
                background:
                  activeCategory === cat.value
                    ? "#5865f2"
                    : "rgba(31,31,39,0.4)",
                color: activeCategory === cat.value ? "#fffdff" : "#c6c5d7",
                boxShadow:
                  activeCategory === cat.value
                    ? "0 10px 20px rgba(88,101,242,0.2)"
                    : "none",
                transition: "all 0.2s",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Video Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fill, minmax(${cardMinWidth}px, 1fr))`,
          gridAutoRows: "auto",
          alignContent: "start",
          ...(maxRows != null ? {
            gridTemplateRows: `repeat(${maxRows}, auto)`,
            gridAutoRows: 0,
            overflow: "hidden",
          } : {}),
          gap: 16,
          overflow: "hidden",
        }}
      >
        {videos.map((card) => {
          const isHovered = hoveredCardId === card.id;
          const uploaderName = card.uploaderName || card.channel || "Unknown";

          return (
            <div
              key={card.id}
              onMouseEnter={() => setHoveredCardId(card.id)}
              onMouseLeave={() => setHoveredCardId(null)}
              onClick={() => onVideoClick?.(card)}
              style={{ cursor: "pointer" }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  position: "relative",
                  borderRadius: 12,
                  overflow: "hidden",
                  aspectRatio: "16 / 9",
                  marginBottom: 10,
                  background: "rgba(31,31,39,0.4)",
                  backdropFilter: "blur(20px)",
                  border: `1px solid ${
                    isHovered
                      ? "rgba(190,194,255,0.3)"
                      : "rgba(190,194,255,0.1)"
                  }`,
                  boxShadow: isHovered
                    ? "0 0 35px rgba(88,101,242,0.4)"
                    : "0 0 20px rgba(88,101,242,0.15)",
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    transform: isHovered ? "scale(1.05)" : "scale(1)",
                    transition: "transform 0.5s ease",
                    overflow: "hidden",
                  }}
                >
                  {card.fileInfo ? (
                    <VideoThumbnail
                      fileName={card.fileInfo.fileName}
                      fileSize={card.fileInfo.fileSize}
                      fileId={card.fileInfo.fileId}
                      thumbnailName={card.fileInfo.thumbnailName}
                    />
                  ) : (
                    <img
                      src={card.imgSrc}
                      alt={card.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                </div>

                {/* Duration Badge */}
                {card.duration && card.duration !== "—" && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      background: "rgba(18,19,27,0.85)",
                      backdropFilter: "blur(6px)",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#bec2ff",
                      border: "1px solid rgba(190,194,255,0.2)",
                    }}
                  >
                    {card.duration}
                  </div>
                )}

                {/* Secure Badge */}
                {card.badge && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      backdropFilter: "blur(6px)",
                      padding: "2px 8px",
                      borderRadius: 9999,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      border: "1px solid",
                      ...card.badge.style,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                      {card.badge.icon}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }}>
                      {card.badge.type}
                    </span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                {/* アップロード者アバター */}
                <div
                  style={{
                    flexShrink: 0,
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "1px solid rgba(190,194,255,0.15)",
                    marginTop: 2,
                  }}
                >
                  <UploaderAvatar name={uploaderName} src={card.avatarSrc} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* タイトル: 常に2行分の高さを確保 */}
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: isHovered ? "#bec2ff" : "#e3e1ed",
                      margin: 0,
                      lineHeight: `${TITLE_LINE_HEIGHT}px`,
                      height: TITLE_HEIGHT,
                      // 2行で切り詰め
                      display: "-webkit-box",
                      WebkitLineClamp: TITLE_LINES,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      transition: "color 0.2s",
                      wordBreak: "break-word",
                    }}
                  >
                    {card.title}
                  </h3>

                  {/* ユーザー名 */}
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#c6c5d7",
                      margin: "4px 0 0",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {uploaderName}
                  </p>

                  {/* サイズ・時刻 */}
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#8f8fa0",
                      margin: "2px 0 0",
                    }}
                  >
                    {card.views}
                    {card.time && ` • ${card.time}`}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
