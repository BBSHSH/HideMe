import AddCollectionCard from "./AddCollectionCard";
import CollectionCard from "./CollectionCard";
import { collections } from "../../data/files";

export default function CollectionGrid() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 20,
      }}
    >
      {collections.map((collection) => (
        <CollectionCard key={collection.id} {...collection} />
      ))}
      <AddCollectionCard />
    </div>
  );
}
