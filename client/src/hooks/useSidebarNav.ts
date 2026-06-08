import { useState, useEffect, useCallback } from "react";

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

export const DEFAULT_STORAGE_TAB = "/file";
const LOCAL_NAV_KEY = "hideme_member_nav";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

function getToken() {
  return JSON.parse(localStorage.getItem("hideme_auth") || "{}").token ?? "";
}

function mergeWithDefaults(saved: NavItemConfig[]): NavItemConfig[] {
  const savedIds = new Set(saved.map((i) => i.id));
  return [
    ...saved,
    ...DEFAULT_NAV_ITEMS.filter((d) => !savedIds.has(d.id)),
  ];
}

export type AppSettings = {
  sidebarNav: NavItemConfig[];
  storageDefaultTab: string;
  memberCanCustomize: boolean;
};

// グローバルキャッシュ
let serverSettings: AppSettings | null = null;
let fetchPromise: Promise<AppSettings> | null = null; // 重複リクエスト防止
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

async function doFetch(): Promise<AppSettings> {
  try {
    const res = await fetch(`${BASE_URL}/v1/app-settings`);
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();

    let sidebarNav = DEFAULT_NAV_ITEMS;
    if (data.sidebar_nav) {
      try {
        const parsed: NavItemConfig[] = JSON.parse(data.sidebar_nav);
        sidebarNav = mergeWithDefaults(parsed);
      } catch { /* ignore */ }
    }

    serverSettings = {
      sidebarNav,
      storageDefaultTab: data.storage_default_tab || DEFAULT_STORAGE_TAB,
      memberCanCustomize: Boolean(data.member_can_customize),
    };
    notifyListeners();
    return serverSettings;
  } catch {
    if (!serverSettings) {
      serverSettings = { sidebarNav: DEFAULT_NAV_ITEMS, storageDefaultTab: DEFAULT_STORAGE_TAB, memberCanCustomize: false };
    }
    return serverSettings;
  } finally {
    fetchPromise = null;
  }
}

export function fetchAppSettings(): Promise<AppSettings> {
  // 同時リクエストを1本に集約
  if (!fetchPromise) fetchPromise = doFetch();
  return fetchPromise;
}

async function pushToServer(body: Record<string, unknown>) {
  try {
    await fetch(`${BASE_URL}/v1/app-settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    });
  } catch { /* ignore — UI already updated optimistically */ }
}

// member 個人設定
function loadLocalNav(): NavItemConfig[] | null {
  try {
    const raw = localStorage.getItem(LOCAL_NAV_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveLocalNav(items: NavItemConfig[]) {
  localStorage.setItem(LOCAL_NAV_KEY, JSON.stringify(items));
}

function clearLocalNav() {
  localStorage.removeItem(LOCAL_NAV_KEY);
}

export function useSidebarNav(isAdmin = false) {
  const [settings, setSettings] = useState<AppSettings>(
    serverSettings ?? { sidebarNav: DEFAULT_NAV_ITEMS, storageDefaultTab: DEFAULT_STORAGE_TAB, memberCanCustomize: false }
  );
  const [localNav, setLocalNav] = useState<NavItemConfig[] | null>(() => loadLocalNav());

  useEffect(() => {
    const update = () => {
      if (serverSettings) setSettings({ ...serverSettings });
    };
    listeners.add(update);
    // キャッシュの有無に関わらず常にサーバーから最新を取得
    fetchAppSettings().then(update);
    return () => { listeners.delete(update); };
  }, []);

  const canCustomize = isAdmin || settings.memberCanCustomize;

  const items: NavItemConfig[] = (!isAdmin && settings.memberCanCustomize && localNav)
    ? mergeWithDefaults(localNav)
    : settings.sidebarNav;

  // 管理者: サーバー保存 + グローバルキャッシュ更新（楽観的）
  // メンバー: localStorage保存
  const setEnabled = useCallback((id: string, enabled: boolean) => {
    const next = items.map((i) => i.id === id ? { ...i, enabled } : i);
    if (isAdmin) {
      // 楽観的更新
      serverSettings = { ...(serverSettings ?? settings), sidebarNav: next };
      setSettings({ ...serverSettings });
      notifyListeners();
      pushToServer({ sidebar_nav: JSON.stringify(next) });
    } else if (settings.memberCanCustomize) {
      saveLocalNav(next);
      setLocalNav(next);
    }
  }, [isAdmin, items, settings]);

  const reorder = useCallback((from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    if (isAdmin) {
      serverSettings = { ...(serverSettings ?? settings), sidebarNav: next };
      setSettings({ ...serverSettings });
      notifyListeners();
      pushToServer({ sidebar_nav: JSON.stringify(next) });
    } else if (settings.memberCanCustomize) {
      saveLocalNav(next);
      setLocalNav(next);
    }
  }, [isAdmin, items, settings]);

  const setStorageDefaultTab = useCallback((tab: string) => {
    if (!isAdmin) return;
    serverSettings = { ...(serverSettings ?? settings), storageDefaultTab: tab };
    setSettings({ ...serverSettings });
    notifyListeners();
    pushToServer({ storage_default_tab: tab });
  }, [isAdmin, settings]);

  const setMemberCanCustomize = useCallback((val: boolean) => {
    if (!isAdmin) return;
    serverSettings = { ...(serverSettings ?? settings), memberCanCustomize: val };
    setSettings({ ...serverSettings });
    notifyListeners();
    pushToServer({ member_can_customize: val });
  }, [isAdmin, settings]);

  const reset = useCallback(() => {
    if (isAdmin) {
      serverSettings = { ...(serverSettings ?? settings), sidebarNav: DEFAULT_NAV_ITEMS, storageDefaultTab: DEFAULT_STORAGE_TAB };
      setSettings({ ...serverSettings });
      notifyListeners();
      pushToServer({ sidebar_nav: JSON.stringify(DEFAULT_NAV_ITEMS), storage_default_tab: DEFAULT_STORAGE_TAB });
    } else {
      clearLocalNav();
      setLocalNav(null);
    }
  }, [isAdmin, settings]);

  return {
    items,
    storageDefaultTab: settings.storageDefaultTab,
    memberCanCustomize: settings.memberCanCustomize,
    canCustomize,
    setEnabled,
    reorder,
    setStorageDefaultTab,
    setMemberCanCustomize,
    reset,
  };
}
