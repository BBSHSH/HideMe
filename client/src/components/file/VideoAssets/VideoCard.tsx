import type { VideoCardData } from "../../../data/videoAssets";

interface VideoCardProps {
  video: VideoCardData;
  isHovered: boolean;
}

export default function VideoCard({ video, isHovered }: VideoCardProps) {  return (
    <div style={{ cursor: "pointer" }}>
      {/* Thumbnail */}
      <div style={{
        position: "relative",
        borderRadius: "12px",
        overflow: "hidden",
        aspectRatio: "16 / 9",
        marginBottom: "8px",
        background: "rgba(31, 31, 39, 0.4)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${isHovered ? "rgba(190, 194, 255, 0.3)" : "rgba(190, 194, 255, 0.1)"}`,
        boxShadow: isHovered 
          ? "0 0 35px rgba(88, 101, 242, 0.4)" 
          : "0 0 20px rgba(88, 101, 242, 0.15)",
        transition: "all 0.3s ease",
      }}>
        <img
          src={video.imgSrc}
          alt={video.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: isHovered ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.5s ease",
          }}
        />

        {/* Duration Badge */}
        <div style={{
          position: "absolute",
          bottom: "8px",
          right: "8px",
          background: "rgba(18, 19, 27, 0.8)",
          backdropFilter: "blur(6px)",
          padding: "2px 8px",
          borderRadius: "4px",
          fontSize: "10px",
          fontWeight: 700,
          color: "#bec2ff",
          border: "1px solid rgba(190, 194, 255, 0.2)",
        }}>
          {video.duration}
        </div>

        {/* Security Badge */}
        {video.badge && (
          <div style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            backdropFilter: "blur(6px)",
            padding: "2px 8px",
            borderRadius: "9999px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            border: "1px solid",
            ...video.badge.style,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
              {video.badge.icon}
            </span>
            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em" }}>
              {video.badge.type}
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div style={{ display: "flex", gap: "16px" }}>
        <div style={{
          flexShrink: 0,
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "#33343d",
          border: "1px solid rgba(69, 70, 85, 0.2)",
          overflow: "hidden",
        }}>
          <img 
            src={video.avatarSrc} 
            alt="Channel avatar" 
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h3 style={{
            fontSize: "16px",
            fontWeight: 700,
            color: isHovered ? "#bec2ff" : "#e3e1ed",
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            transition: "color 0.2s",
          }}>
            {video.title}
          </h3>
          <p style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#c6c5d7",
            margin: "4px 0 0 0",
          }}>
            {video.channel}
          </p>
          <p style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#8f8fa0",
            margin: "2px 0 0 0",
          }}>
            {video.views} {video.time && `• ${video.time}`}
          </p>
        </div>
      </div>
    </div>
  );
}