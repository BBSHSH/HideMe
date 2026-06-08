import { useState, useEffect } from "react";

export type NavItemConfig = {
  id:      string;
  icon:    string;
  label:   string;
  to:      string;
  enabled: boolean;
};

export const DEFAULT_NAV_ITEMS: NavItemConfig[] = [
  { id: "all",       icon: "grid_view",          label: "すべて",     to: "/file",            enabled: true  },
  { id: "videos",    icon: "movie",              label: "動画",       to: "/file/videos",     enabled: true  },
  { id: "shorts",    icon: "play_circle",        label: "Shorts",     to: "/file/shorts",     enabled: true  },
  { id: "images",    icon: "image",              label: "画像",       to: "/file/images",     enabled: true  },
  { id: "others",    icon: "insert_drive_file",  label: "その他",     to: "/file/others",     enabled: true  },
  { id: "favorites", icon: "favorite",           label: "お気に入り", to: "/file/favorites",  enabled: true  },
  { id: "recent",    icon: "schedule",           label: "最近の項目", to: "/file/recent",     enabled: false },
  { id: "cleanup",   icon: "auto_delete",        label: "Cleanup",    to: "/file/cleanup",    enabled: false },
];

const STORAGE_KEY = "hideme_sidebar_nav";

function load(): NavItemConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NAV_ITEMS;
    const saved: NavItemConfig[] = JSON.parse(raw);
    // 新しいアイテムがデフォルトに追加された場合にマージ
    const savedIds = new Set(saved.map((i) => i.id));
    const merged = [
      ...saved,
      ...DEFAULT_NAV_ITEMS.filter((d) => !savedIds.has(d.id)),
    ];
    return merged;
  } catch {
    return DEFAULT_NAV_ITEMS;
  }
}

export function useSidebarNav() {
  const [items, setItems] = useState<NavItemConfig[]>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const setEnabled = (id: string, enabled: boolean) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, enabled } : i));
  };

  const reorder = (from: number, to: number) => {
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const reset = () => setItems(DEFAULT_NAV_ITEMS);

  return { items, setEnabled, reorder, reset };
}
