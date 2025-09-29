"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Calculator, FileText, FolderOpen, Clock, CheckCircle, Plus } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);

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
        setRecentProjects(Array.isArray(p) ? p : []);
      } catch (e) {
        if (!alive) return;
        setError(e && e.message ? e.message : "No se pudo cargar el dashboard");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

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

  function go(path) {
    window.location.assign(path);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bienvenido al Dashboard</h1>
          <p className="text-muted-foreground mt-2">Gestiona tus proyectos de alineación de motores industriales</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:opacity-90" onClick={() => go("/projects/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <div key={project.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex-1">
                        <button onClick={() => go(`/projects/${project.id}`)} className="font-medium text-card-foreground hover:underline text-left">
                          {project.name}
                        </button>
                        <p className="text-sm text-muted-foreground">Actualizado hace {formatWhen(project.updatedAt)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={badge.variant} className={badge.className}>
                          {project.status === "EN_PROGRESO" ? "En Progreso" : project.status === "COMPLETADO" ? "Completado" : "Pendiente"}
                        </Badge>
                        <span className="text-sm font-medium text-card-foreground">
                          {project.precision != null ? `${Number(project.precision).toFixed(1)}%` : "-"}
                        </span>
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
                onClick={() => go("/technique/clock")}
              >
                <Clock className="h-6 w-6" />
                <span className="text-sm">Técnica del Reloj</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
                onClick={() => go("/calculations")}
              >
                <Calculator className="h-6 w-6" />
                <span className="text-sm">Calculadora</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
                onClick={() => go("/reports/new")}
              >
                <FileText className="h-6 w-6" />
                <span className="text-sm">Generar Reporte</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
                onClick={() => go("/data/validate")}
              >
                <CheckCircle className="h-6 w-6" />
                <span className="text-sm">Verificar Datos</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
