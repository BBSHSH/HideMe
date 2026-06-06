import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface AppSettings {
  // 表示
  collectionCardSize: "small" | "medium" | "large";
  animationsEnabled:  boolean;
  compactMode:        boolean;
  // プレイヤー・アップロード
  defaultVolume:      number;
  defaultResolution:  "1080p" | "720p" | "480p" | "240p";
  defaultFps:         24 | 30 | 60;
  // 通知
  uploadNotification: boolean;
  // チャット
  mentionNotification: boolean;
  muteServer:          boolean;
  messagePreview:      boolean;
  autoReadMessages:    boolean;
  // 音声
  inputDeviceId:       string;
  outputDeviceId:      string;
  inputVolume:         number;
  noiseSuppression:    boolean;
  echoCancellation:    boolean;
  voiceActivityDetect: boolean;
  soundEffects:        boolean;
}

const DEFAULTS: AppSettings = {
  collectionCardSize:  "medium",
  animationsEnabled:   true,
  compactMode:         false,
  defaultVolume:       100,
  defaultResolution:   "720p",
  defaultFps:          30,
  uploadNotification:  true,
  mentionNotification: true,
  muteServer:          false,
  messagePreview:      true,
  autoReadMessages:    true,
  inputDeviceId:       "default",
  outputDeviceId:      "default",
  inputVolume:         100,
  noiseSuppression:    true,
  echoCancellation:    true,
  voiceActivityDetect: true,
  soundEffects:        true,
};

const KEY = "hideme_settings";

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

interface SettingsContextType {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(load);

  // アニメーション・コンパクト・トランジションを CSS クラスで適用
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-animations", settings.animationsEnabled ? "true" : "false");
    root.setAttribute("data-compact",    settings.compactMode ? "true" : "false");
  }, [settings.animationsEnabled, settings.compactMode]);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  const reset = () => {
    localStorage.removeItem(KEY);
    setSettings({ ...DEFAULTS });
  };

  return (
    <SettingsContext.Provider value={{ settings, update, reset }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
