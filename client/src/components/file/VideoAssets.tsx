import { useState } from "react";
import CategoryChips from "./VideoAssets/CategoryChips";
import VideoGrid from "./VideoAssets/VideoGrid";
import { videoAssetData, categoryData } from "../../data/videoAssets";

export default function VideoAssets() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredVideos = activeCategory === "All" 
    ? videoAssetData 
    : videoAssetData.filter(v => v.category === activeCategory);

  return (
    <div style={{ flex: 1, marginLeft: "256px", padding: "16px 24px", boxSizing: "border-box" }}>
      <CategoryChips 
        categories={categoryData} 
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <VideoGrid videos={filteredVideos} />
    </div>
  );
}