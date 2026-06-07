import { C, F } from "../../theme/tokens";
import { Icon } from "../../components/Icon";

function PlaceholderPage({ icon, label }: { icon: string; label: string }) {
  return (
    <div
      style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        height:         "100%",
        gap:            16,
        color:          C.onSurfaceVariant,
        fontFamily:     F.family,
      }}
    >
      <Icon name={icon} size={48} style={{ color: C.outlineVariant }} />
      <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 14, color: C.outline }}>Coming soon</p>
    </div>
  );
}

export function RecentPage()    { return <PlaceholderPage icon="schedule"           label="最近の項目" />; }
export function FavoritesPage() { return <PlaceholderPage icon="favorite"           label="お気に入り" />; }
export function CleanupPage()   { return <PlaceholderPage icon="auto_delete"        label="Cleanup"   />; }
export function ImagesPage()    { return <PlaceholderPage icon="image"              label="画像"      />; }
export function OthersPage()    { return <PlaceholderPage icon="insert_drive_file"  label="その他"    />; }
