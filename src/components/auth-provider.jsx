import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../contexts/auth-context";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/me`, { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUser(data.user || null);
    } catch (error) {
      console.error("Error al cargar el usuario", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const value = useMemo(() => ({ user, loading, refresh: fetchMe }), [user, loading, fetchMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
