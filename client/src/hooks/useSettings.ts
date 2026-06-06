import { useState } from "react";

export interface AppSettings {
  // 表示
  collectionCardSize: "small" | "medium" | "large";
  animationsEnabled: boolean;
  compactMode: boolean;
  // プレイヤー
  defaultVolume: number;        // 0–200
  autoplay: boolean;
  loopPlayback: boolean;
  // アップロードデフォルト
  defaultResolution: "1080p" | "720p" | "480p" | "240p";
  defaultFps: 24 | 30 | 60;
  // 通知
  uploadNotification: boolean;
}

const DEFAULTS: AppSettings = {
  collectionCardSize: "medium",
  animationsEnabled: true,
  compactMode: false,
  defaultVolume: 100,
  autoplay: false,
  loopPlayback: false,
  defaultResolution: "720p",
  defaultFps: 30,
  uploadNotification: true,
};

const KEY = "hideme_settings";

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(load);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettingsState((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  const reset = () => {
    localStorage.removeItem(KEY);
    setSettingsState(DEFAULTS);
  };

  return { settings, update, reset };
}
