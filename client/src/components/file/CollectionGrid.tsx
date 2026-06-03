import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../../theme/tokens";
import { useCollections } from "../../hooks/useFiles";
import CreateCollectionModal from "./CreateCollectionModal";
import CollectionCard from "./CollectionCard";
import AddCollectionCard from "./AddCollectionCard";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

interface CollectionGridProps {
  columns?: 1 | 2 | 3 | 4;
  cardSize?: "small" | "medium" | "large";
  showAddButton?: boolean;  
}

export default function CollectionGrid({ 
  cardSize = "medium",
  showAddButton = true 
}: CollectionGridProps) {
  const { collections, loading, error } = useCollections();
  const [showModal, setShowModal] = useState(false);
  const [, forceRefresh] = useState(0);
  const navigate = useNavigate();

  const handleCreated = () => forceRefresh((n) => n + 1);

  const sizeConfig = {
    small: 180,
    medium: 240,
    large: 300,
  };

  const minWidth = sizeConfig[cardSize];

  if (loading) return (
    <div style={{ color: C.outlineVariant, padding: 32, textAlign: "center" }}>Loading...</div>
  );

  if (error) return (
    <div style={{ color: "#f87171", padding: 32, textAlign: "center" }}>Failed to load collections</div>
  );

  return (
    <>
      {showModal && (
        <CreateCollectionModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`, gap: 20 }}>
        {collections.map((col) => (
          <div
            key={col.ID}
            onClick={() => navigate(`/file/collection/${col.ID}`)}
            style={{ cursor: "pointer" }}
          >
            <CollectionCard
              title={col.Name}
              subtitle={col.Description}
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
              size={cardSize}
            />
          </div>
        ))}
        {showAddButton && <AddCollectionCard onClick={() => setShowModal(true)} />}
      </div>
    </>
  );
}