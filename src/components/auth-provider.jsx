import { createContext, useContext, useEffect, useState } from "react"

const AuthCtx = createContext({ user: null, loading: true, refresh: () => {} })
const API = import.meta.env.VITE_API_URL || "http://localhost:4000"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchMe() {
    try {
      const res = await fetch(`${API}/api/me`, { credentials: "include" })
      if (!res.ok) { setUser(null); setLoading(false); return }
      const data = await res.json()
      setUser(data.user || null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMe() }, [])

  const value = { user, loading, refresh: fetchMe }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() { return useContext(AuthCtx) }
