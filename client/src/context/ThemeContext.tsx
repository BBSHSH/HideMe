import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { DARK, LIGHT } from "../theme/tokens";

export type ThemeMode = "dark" | "light";

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function applyTheme(theme: ThemeMode) {
  const colors = theme === "dark" ? DARK : LIGHT;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  // トークン定義のキーをそのまま CSS 変数に反映
  (Object.entries(colors) as [string, string][]).forEach(([k, v]) => {
    root.style.setProperty(`--c-${k}`, v);
  });
  root.style.setProperty("color-scheme", theme);
  document.body.style.background = colors.background;
  document.body.style.color = colors.onSurface;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem("hideme_theme") as ThemeMode) ?? "dark";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // 初回マウント時にも即適用
  useEffect(() => { applyTheme(theme); }, []);

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem("hideme_theme", t);
  };

  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/** 現在テーマの実色を返す（rgba計算が必要な場所で使用） */
export function useColors(): Record<string, string> {
  const { theme } = useTheme();
  return (theme === "dark" ? DARK : LIGHT) as Record<string, string>;
}
