import { useEffect } from "react"
import { useAuth } from "./auth-provider"

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/"  // vuelve a landing si no hay sesión
    }
  }, [loading, user])

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground">
        <div className="text-sm text-muted-foreground">Verificando sesión...</div>
      </div>
    )
  }

  return children
}
