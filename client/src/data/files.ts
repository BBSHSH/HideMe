export type Collection = {
  ID: string;
  Name: string;
  Description: string;
  Color: string;
  Icon: string;
  ImageURL?: string;
};
export type CollectionFile = {
  id: string;
  collection_id: string;
  collection_name: string;
  file_name: string;
  file_size: number;
  thumbnail_name: string;
  uploaded_by: string;
  uploaded_at: string;
};
export type SidebarItem = {
  id: string;
  icon: string;
  label: string;
};

export type FilterItem = {
  id: string;
  label: string;
  dotColor: string;
};

export type RecentFile = {
  id: string;
  icon: string;
  iconColor: string;
  name: string;
  meta: string;
};

export type StorageStats = {
  used: string;
  total: string;
  usedRatio: number;
  statusLabel: string;
  statusIcon: string;
  activeItems: string;
  viewMode: "list" | "grid";
};

export type VaultStatus = {
  label: string;
  lastSync: string;
};

// 静的マスターデータ
export const sidebarItems: SidebarItem[] = [
  { id: "all", icon: "grid_view", label: "すべて" },
  { id: "video", icon: "movie", label: "動画" },
  { id: "recent", icon: "schedule", label: "最近の項目" },
  { id: "favorite", icon: "favorite", label: "お気に入り" },
  { id: "cleanup", icon: "auto_delete", label: "Cleanup" },
];

export const filters: FilterItem[] = [
  { id: "gaming", label: "Gaming", dotColor: "#bec2ff" },
  { id: "personal", label: "Personal", dotColor: "#ffb689" },
  { id: "work", label: "Work", dotColor: "#c4c6ce" },
];

// NASから取得する実ファイル
export type FileItem = {
  name: string;
  size: number;
  modified: string; // ISO 8601 (RFC3339)
};

export type FileListResponse = {
  items: FileItem[];
};