import { useState, useEffect } from "react";

export type HeaderNavItem = {
  id:      string;
  icon:    string;
  label:   string;
  path:    string;
  enabled: boolean;
};

export const DEFAULT_HEADER_NAV: HeaderNavItem[] = [
  { id: "dashboard", icon: "dashboard",     label: "Dash",    path: "/",         enabled: true },
  { id: "messages",  icon: "forum",          label: "Chat",    path: "/chat",     enabled: true },
  { id: "storage",   icon: "folder_shared",  label: "Storage", path: "/file",     enabled: true },
  { id: "editor",    icon: "video_settings", label: "Editor",  path: "/editor",   enabled: true },
  { id: "settings",  icon: "settings",       label: "Config",  path: "/settings", enabled: true },
];

const STORAGE_KEY = "hideme_header_nav";

function load(): HeaderNavItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_HEADER_NAV;
    const saved: HeaderNavItem[] = JSON.parse(raw);
    const savedIds = new Set(saved.map((i) => i.id));
    return [
      ...saved,
      ...DEFAULT_HEADER_NAV.filter((d) => !savedIds.has(d.id)),
    ];
  } catch {
    return DEFAULT_HEADER_NAV;
  }
}

export function useHeaderNav() {
  const [items, setItems] = useState<HeaderNavItem[]>(load);

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

  const reset = () => setItems(DEFAULT_HEADER_NAV);

  return { items, setEnabled, reorder, reset };
}
