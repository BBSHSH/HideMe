import { useCollections } from "../../hooks/useFiles";
import AddCollectionCard from "./AddCollectionCard";
import CollectionCard from "./CollectionCard";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export default function CollectionGrid() {
  const { collections, loading } = useCollections();

  if (loading) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 20,
      }}
    >
      {collections.map((col) => (
        <CollectionCard
          key={col.ID}
          title={col.Name}
          subtitle={col.Description}
          itemCount="0 items"
          badgeColor={col.Color}
          badgeBorder={col.Color}
          buttonColor={col.Color}
          imageSrc={col.ImageURL ? `${BASE_URL}/v1/files/${col.ImageURL}` : undefined}
          iconFallback={col.Icon || "folder"}
          iconBg="#34343d"
        />
      ))}
      <AddCollectionCard />
    </div>
  );
}