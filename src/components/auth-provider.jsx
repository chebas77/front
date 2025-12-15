import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../contexts/auth-context";
import { useLocation, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

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
    // Capturar token de la URL si viene del login con Google
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (token) {
      // Guardar el token en una cookie manualmente
      document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=None; Secure`;
      
      // Limpiar la URL
      params.delete('token');
      const newSearch = params.toString();
      navigate(location.pathname + (newSearch ? `?${newSearch}` : ''), { replace: true });
      
      // Recargar el usuario
      fetchMe();
    } else {
      fetchMe();
    }
  }, [location, navigate, fetchMe]);

  const value = useMemo(() => ({ user, loading, refresh: fetchMe }), [user, loading, fetchMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

