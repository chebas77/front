import { useEffect, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { User, Mail, Calendar, FileText, FolderOpen, Activity, Save, Loader2 } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Profile() {
  const { user, refresh } = useAuth();
  const [stats, setStats] = useState({ totalCalculations: 0, totalProjects: 0, recentReports: [] });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name || "", email: user.email || "" });
      fetchUserStats();
    }
  }, [user]);

  async function fetchUserStats() {
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const [reportsRes, projectsRes] = await Promise.all([
        fetch(`${API}/api/reports`, { credentials: "include", headers }),
        fetch(`${API}/projects?pageSize=100`, { credentials: "include", headers })
      ]);

      const reportsData = await reportsRes.json();
      const projectsData = await projectsRes.json();

      setStats({
        totalCalculations: reportsData?.items?.length || 0,
        totalProjects: projectsData?.items?.length || 0,
        recentReports: (reportsData?.items || []).slice(0, 5)
      });
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { "Content-Type": "application/json" };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API}/api/me/update`, {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify({ name: formData.name })
      });

      if (res.ok) {
        await refresh();
        setEditing(false);
      } else {
        alert("Error al actualizar perfil");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar perfil");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }) : "Reciente";

  return (
    <div className="container mx-auto p-3 sm:p-6 max-w-7xl">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Mi Perfil</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Gestiona tu información y revisa tu actividad</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Información del Usuario */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-primary" />
              </div>

              {editing ? (
                <div className="w-full space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block text-left">Nombre</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving} className="flex-1">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      Guardar
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setEditing(false);
                      setFormData({ name: user.name || "", email: user.email || "" });
                    }}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-2">{user?.name || "Usuario"}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-6">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Miembro desde {memberSince}</span>
                  </div>
                  <Button onClick={() => setEditing(true)} className="w-full">
                    Editar Perfil
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Estadísticas y Actividad */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjetas de Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cálculos Totales</p>
                  <p className="text-2xl font-bold">{stats.totalCalculations}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <FolderOpen className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Proyectos</p>
                  <p className="text-2xl font-bold">{stats.totalProjects}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-500/10">
                  <Activity className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actividad</p>
                  <p className="text-2xl font-bold">
                    {stats.recentReports.length > 0 ? "Activo" : "Inactivo"}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Últimos Cálculos */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Últimos Cálculos</h3>
            {stats.recentReports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay cálculos registrados</p>
                <p className="text-sm">Crea tu primer cálculo de alineamiento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-primary/10">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {report.title || report.equipment_id || `Cálculo #${report.id}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = `/app/reports/${report.id}/print`}
                    >
                      Ver
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
