"use client";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Dialog } from "./ui/dialog";
import { Calculator, FileText, FolderOpen, Clock, CheckCircle, Plus } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [r1, r2] = await Promise.all([
          fetch(`${API}/stats`, { credentials: "include" }),
          fetch(`${API}/projects/recent`, { credentials: "include" }),
        ]);
        if (!r1.ok) throw new Error(`Error /stats: ${r1.status}`);
        if (!r2.ok) throw new Error(`Error /projects/recent: ${r2.status}`);
        const s = await r1.json();
        const p = await r2.json();
        if (!alive) return;
        setStats(s);
        setRecentProjects(Array.isArray(p) ? p.map((item) => normalizeProject(item)).filter(Boolean) : []);
      } catch (e) {
        if (!alive) return;
        setError(e && e.message ? e.message : "No se pudo cargar el dashboard");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [refreshTick]);

  const handleReload = () => setRefreshTick((tick) => tick + 1);

  const cards = useMemo(() => {
    return [
      {
        title: "Proyectos Activos",
        value: stats && stats.activeProjects != null ? stats.activeProjects : 0,
        description: "Proyectos en progreso",
        icon: FolderOpen,
        trend: stats && stats.deltas ? stats.deltas.projects : undefined,
        trendSuffix: " esta semana",
      },
      {
        title: "Cálculos Realizados",
        value: stats && stats.totalCalculations != null ? stats.totalCalculations : 0,
        description: "Total de alineaciones",
        icon: Calculator,
        trend: stats && stats.deltas ? stats.deltas.calculations : undefined,
        trendSuffix: " este mes",
      },
      {
        title: "Reportes Generados",
        value: stats && stats.generatedReports != null ? stats.generatedReports : 0,
        description: "Documentos creados",
        icon: FileText,
        trend: stats && stats.deltas ? stats.deltas.reports : undefined,
        trendSuffix: " esta semana",
      }
    ];
  }, [stats]);

  function formatWhen(iso) {
    try {
      const d = new Date(iso);
      const diff = Date.now() - d.getTime();
      const mins = Math.round(diff / 60000);
      if (mins < 60) return `${mins} min`;
      const hrs = Math.round(mins / 60);
      if (hrs < 24) return `${hrs} h`;
      const days = Math.round(hrs / 24);
      return `${days} d`;
    } catch (error) {
      console.error("No se pudo formatear la fecha", error);
      return "-";
    }
  }

  function statusBadge(projectStatus) {
    const s = (projectStatus || "").toUpperCase();
    if (s === "COMPLETADO") return { variant: "default", className: "bg-primary text-primary-foreground" };
    if (s === "EN_PROGRESO") return { variant: "secondary", className: "bg-secondary text-secondary-foreground" };
    return { variant: "outline", className: "" };
  }

  function go(path, options = {}) {
    navigate(path, options);
  }

  function normalizeProject(project) {
    if (!project || typeof project !== "object") return null;
    return {
      id: project.id ?? project.projectId ?? null,
      name: project.name ?? project.title ?? "Proyecto sin nombre",
      status: project.status ?? project.state ?? "EN_PROGRESO",
      updatedAt: project.updatedAt ?? project.updated_at ?? project.createdAt ?? project.created_at ?? new Date().toISOString(),
      precision:
        project.precision ??
        project.progress ??
        (project.metrics && project.metrics.precision != null ? project.metrics.precision : null),
    };
  }

  async function handleCreateProject(e) {
    e?.preventDefault();
    if (createLoading) return;
    const name = createName.trim();
    const description = createDescription.trim();
    if (!name) {
      setCreateError("Asigna un nombre al proyecto.");
      return;
    }

    setCreateLoading(true);
    setCreateError("");

    try {
      const res = await fetch(`${API}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          description: description || undefined,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const payload = isJson ? await res.json() : null;

      if (!res.ok) {
        const msg = payload?.error || payload?.message || `No se pudo crear el proyecto (${res.status})`;
        throw new Error(msg);
      }

      const created = normalizeProject(payload?.project ?? payload);
      if (created?.id == null) {
        throw new Error("El servidor no devolvió el proyecto creado.");
      }

      setCreateOpen(false);
      setCreateName("");
      setCreateDescription("");
      setRecentProjects((projects) => {
        const normalized = created ? [created, ...projects] : projects;
        return normalized.filter(Boolean).slice(0, 6);
      });
      setStats((prev) =>
        prev
          ? {
              ...prev,
              activeProjects: (prev.activeProjects ?? 0) + 1,
            }
          : prev
      );
      handleReload();
      go(`/app/calculations?project=${encodeURIComponent(created.id)}`);
    } catch (err) {
      console.error("[Dashboard] create project error", err);
      setCreateError(err?.message || "Error inesperado al crear el proyecto.");
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bienvenido al Dashboard</h1>
          <p className="text-muted-foreground mt-2">Gestiona tus proyectos de alineación de motores industriales</p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:opacity-90"
          onClick={() => {
            setCreateOpen(true);
            setCreateError("");
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"></CardHeader>
                <CardContent></CardContent>
              </Card>
            ))
          : cards.map((c) => (
              <Card key={c.title} className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">{c.title}</CardTitle>
                  <c.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-card-foreground">{c.value}</div>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                  {typeof c.trend === "number" && (
                    <p className={`text-xs mt-1 ${c.trend >= 0 ? "text-primary" : "text-destructive"}`}>
                      {c.trend >= 0 ? "+" : ""}{c.trend}
                      {c.trendSuffix}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
      </div>

      {error && (
        <div className="text-sm text-destructive border border-destructive/30 rounded-md p-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proyectos recientes */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Proyectos Recientes</CardTitle>
            <CardDescription>Últimos proyectos de alineación trabajados</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-3 border border-border rounded-lg"></div>
                ))}
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="text-sm text-muted-foreground">No hay proyectos recientes.</div>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => {
                  const badge = statusBadge(project.status);
                  return (
                    <div key={project.id ?? project.name} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex-1">
                        <button
                          onClick={() => go(`/app/calculations?project=${encodeURIComponent(project.id ?? "")}`)}
                          className="font-medium text-card-foreground hover:underline text-left"
                        >
                          {project.name}
                        </button>
                        <p className="text-sm text-muted-foreground">Actualizado hace {formatWhen(project.updatedAt)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={badge.variant} className={badge.className}>
                          {project.status === "EN_PROGRESO" ? "En Progreso" : project.status === "COMPLETADO" ? "Completado" : "Pendiente"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Acciones Rápidas</CardTitle>
            <CardDescription>Herramientas más utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
                onClick={() => go("/app/alignment/new")}
              >
                <Clock className="h-6 w-6" />
                <span className="text-sm">Técnica del Reloj</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
                onClick={() => go("/app/calculations")}
              >
                <Calculator className="h-6 w-6" />
                <span className="text-sm">Calculadora</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
                onClick={() => go("/app/reports")}
              >
                <FileText className="h-6 w-6" />
                <span className="text-sm">Generar Reporte</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
                onClick={() => go("/app/alignment/rim-face/new")}
              >
                <CheckCircle className="h-6 w-6" />
                <span className="text-sm">Verificar Datos</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={createOpen}
        onClose={() => {
          if (!createLoading) {
            setCreateOpen(false);
          }
        }}
        title="Nuevo proyecto"
        footer={
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!createLoading) {
                  setCreateOpen(false);
                }
              }}
              disabled={createLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="create-project-form"
              disabled={createLoading}
            >
              {createLoading ? "Creando..." : "Crear proyecto"}
            </Button>
          </div>
        }
      >
        <form id="create-project-form" className="space-y-4" onSubmit={handleCreateProject}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground" htmlFor="project-name">
              Nombre del proyecto
            </label>
            <Input
              id="project-name"
              name="projectName"
              placeholder="Ej. Alineación Motor #4"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              disabled={createLoading}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground" htmlFor="project-description">
              Descripción (opcional)
            </label>
            <textarea
              id="project-description"
              name="projectDescription"
              className="w-full min-h-[96px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              placeholder="Agrega notas, alcance del proyecto o responsables."
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              disabled={createLoading}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Al crear un proyecto podrás agrupar cálculos y reportes relacionados para mantener un control ordenado del proceso de alineación.
          </p>
          {createError && <p className="text-sm text-destructive">{createError}</p>}
        </form>
      </Dialog>
    </div>
  );
}
