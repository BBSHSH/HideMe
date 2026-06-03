interface Category {
  label: string;
  value: string;
}

interface CategoryChipsProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryChips({ 
  categories, 
  activeCategory, 
  onCategoryChange 
}: CategoryChipsProps) {
  return (
    <div className="category-scroll" style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "24px",
      overflowX: "auto",
      paddingBottom: "8px",
    }}>
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onCategoryChange(cat.value)}
          style={{
            padding: "4px 16px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            border: activeCategory === cat.value ? "none" : "1px solid rgba(190, 194, 255, 0.1)",
            background: activeCategory === cat.value ? "#5865f2" : "rgba(31, 31, 39, 0.4)",
            color: activeCategory === cat.value ? "#fffdff" : "#c6c5d7",
            backdropFilter: activeCategory === cat.value ? undefined : "blur(20px)",
            boxShadow: activeCategory === cat.value ? "0 10px 20px rgba(88, 101, 242, 0.2)" : "none",
            transition: "all 0.2s",
          }}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}