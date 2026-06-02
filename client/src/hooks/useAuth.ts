import { useState } from "react";
import { login as apiLogin } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export function useLogin() {
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiLogin(username, password);
      setUser(res);
      return true;
    } catch {
      setError("ユーザー名またはパスワードが違います");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}