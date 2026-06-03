import { useState } from "react";
import VideoCard from "./VideoCard";
import type { VideoCardData } from "../../../data/videoAssets";

interface VideoGridProps {
  videos: VideoCardData[];
}

export default function VideoGrid({ videos }: VideoGridProps) {  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
      gap: "16px",
    }}>
      {videos.map((video) => (
        <div
          key={video.id}
          onMouseEnter={() => setHoveredCardId(video.id)}
          onMouseLeave={() => setHoveredCardId(null)}
        >
          <VideoCard video={video} isHovered={hoveredCardId === video.id} />
        </div>
      ))}
    </div>
  );
}