import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type AuthUser = {
  token: string;
  username: string;
  role: "admin" | "member";
};

type AuthContextType = {
  user: AuthUser | null;
  isAdmin: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("hideme_auth");
    return stored ? JSON.parse(stored) : null;
  });

  const setUser = (u: AuthUser | null) => {
    setUserState(u);
    if (u) localStorage.setItem("hideme_auth", JSON.stringify(u));
    else localStorage.removeItem("hideme_auth");
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isAdmin: user?.role === "admin", setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}