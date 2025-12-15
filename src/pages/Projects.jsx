import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog } from "../components/ui/dialog";
import { Clock, FolderOpen, Loader2, Plus, MoreVertical, CheckCircle, Circle, Clock4 } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

function normalizeProject(project) {
  if (!project || typeof project !== "object") return null;
  return {
    id: project.id ?? project.projectId ?? null,
    name: project.name ?? project.title ?? "Proyecto sin nombre",
    description: project.description ?? project.notes ?? "",
    status: project.status ?? project.state ?? "EN_PROGRESO",
    createdAt: project.createdAt ?? project.created_at ?? null,
    updatedAt:
      project.updatedAt ?? project.updated_at ?? project.createdAt ?? project.created_at ?? null,
    owner: project.owner ?? project.ownerName ?? project.user ?? null,
    machines: project.machines ?? project.assets ?? null,
  };
}

function statusBadge(projectStatus) {
  const s = (projectStatus || "").toUpperCase();
  if (s === "COMPLETADO") return { label: "Completado", variant: "default", className: "bg-primary text-primary-foreground" };
  if (s === "EN_PROGRESO") return { label: "En Progreso", variant: "secondary", className: "bg-secondary text-secondary-foreground" };
  return { label: "Pendiente", variant: "outline", className: "" };
}

function formatDate(value) {
  if (!value) return "-";
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch (err) {
    console.error("No se pudo formatear la fecha", err);
    return "-";
  }
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const [statusMenuOpen, setStatusMenuOpen] = useState(null); // ID del proyecto con menu abierto
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/projects`, { credentials: "include" });
        if (!res.ok) {
          throw new Error(`Error ${res.status} al cargar proyectos`);
        }
        const body = await res.json().catch(() => []);
        const list = Array.isArray(body?.items)
          ? body.items
          : Array.isArray(body?.projects)
          ? body.projects
          : Array.isArray(body)
          ? body
          : [];
        const normalized = list.map(normalizeProject).filter(Boolean);
        if (active) setProjects(normalized);
      } catch (e) {
        if (active) setError(e?.message || "No se pudieron cargar los proyectos");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProjects();

    return () => {
      active = false;
    };
  }, [refreshTick]);

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesTerm = !term
        || project.name.toLowerCase().includes(term)
        || project.description.toLowerCase().includes(term)
        || (project.owner ? String(project.owner).toLowerCase().includes(term) : false);
      const matchesStatus = statusFilter === "TODOS"
        || (statusFilter === "EN_PROGRESO" && project.status?.toUpperCase() === "EN_PROGRESO")
        || (statusFilter === "COMPLETADO" && project.status?.toUpperCase() === "COMPLETADO")
        || (statusFilter === "PENDIENTE" && project.status?.toUpperCase() === "PENDIENTE");
      return matchesTerm && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  function handleOpenProject(projectId) {
    if (projectId == null) return;
    navigate(`/app/reports?project=${encodeURIComponent(projectId)}`);
  }

  function handleReload() {
    setRefreshTick((tick) => tick + 1);
  }

  async function handleChangeStatus(projectId, newStatus) {
    try {
      const res = await fetch(`${API}/projects/${projectId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }

      // Actualizar el estado local
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, status: newStatus } : p
        )
      );
      setStatusMenuOpen(null);
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      alert(`No se pudo actualizar el estado: ${error.message}`);
    }
  }

  async function handleCreateProject(event) {
    event?.preventDefault();
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
      if (!created) {
        throw new Error("El servidor no devolvió el proyecto creado.");
      }

      setProjects((prev) => [created, ...prev]);
      setCreateOpen(false);
      setCreateName("");
      setCreateDescription("");
      handleReload();
      navigate(`/app/calculations?project=${encodeURIComponent(created.id ?? "")}`);
    } catch (err) {
      console.error("[Projects] create error", err);
      setCreateError(err?.message || "No se pudo crear el proyecto");
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FolderOpen className="h-7 w-7" />
            Mis proyectos
          </h1>
          <p className="text-muted-foreground mt-1">
            Consulta el estado de tus proyectos de alineación y accede rápidamente a sus cálculos.
          </p>
        </div>
        <Button
          className="self-start bg-primary text-primary-foreground hover:opacity-90"
          onClick={() => {
            setCreateOpen(true);
            setCreateError("");
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo proyecto
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <Input
          placeholder="Buscar por nombre, responsable o descripción"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="md:col-span-1"
        />
        <div className="flex items-center gap-2">
          {["TODOS", "EN_PROGRESO", "COMPLETADO", "PENDIENTE"].map((option) => (
            <Button
              key={option}
              variant={statusFilter === option ? "default" : "outline"}
              onClick={() => setStatusFilter(option)}
            >
              {option === "TODOS"
                ? "Todos"
                : option === "EN_PROGRESO"
                ? "En progreso"
                : option === "COMPLETADO"
                ? "Completados"
                : "Pendientes"}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive border border-destructive/30 rounded-md p-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando proyectos...
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="bg-card">
          <CardContent className="py-12 text-center space-y-2">
            <Clock className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {projects.length === 0
                ? "Aún no tienes proyectos registrados."
                : "No se encontraron proyectos que coincidan con los filtros actuales."}
            </p>
            <Button variant="outline" onClick={() => { setStatusFilter("TODOS"); setSearch(""); handleReload(); }}>
              Actualizar lista
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => {
            const badge = statusBadge(project.status);
            const isMenuOpen = statusMenuOpen === project.id;
            return (
              <Card key={project.id ?? project.name} className="bg-card border-border">
                <CardHeader className="space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg text-card-foreground leading-tight">
                        {project.name}
                      </CardTitle>
                      {project.owner && (
                        <p className="text-xs text-muted-foreground mt-1">Responsable: {project.owner}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={badge.variant} className={badge.className}>
                        {badge.label}
                      </Badge>
                      <div className="relative">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => setStatusMenuOpen(isMenuOpen ? null : project.id)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        {isMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setStatusMenuOpen(null)}
                            />
                            <div className="absolute right-0 top-10 z-20 w-48 rounded-md border border-border bg-popover shadow-lg">
                              <div className="p-2 space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground px-2 py-1">
                                  Cambiar estado
                                </p>
                                <button
                                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent flex items-center gap-2"
                                  onClick={() => handleChangeStatus(project.id, "PENDIENTE")}
                                >
                                  <Circle className="h-4 w-4" />
                                  Pendiente
                                </button>
                                <button
                                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent flex items-center gap-2"
                                  onClick={() => handleChangeStatus(project.id, "EN_PROGRESO")}
                                >
                                  <Clock4 className="h-4 w-4" />
                                  En progreso
                                </button>
                                <button
                                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent flex items-center gap-2"
                                  onClick={() => handleChangeStatus(project.id, "COMPLETADO")}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Completado
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Actualizado {formatDate(project.updatedAt)}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Sin descripción registrada.
                    </p>
                  )}
                  {Array.isArray(project.machines) && project.machines.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-card-foreground">Equipos:</span>{" "}
                      {project.machines.join(", ")}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" onClick={() => handleOpenProject(project.id)}>
                      Ver cálculos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={createOpen}
        onClose={() => {
          if (!createLoading) setCreateOpen(false);
        }}
        title="Nuevo proyecto"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={createLoading}
              onClick={() => {
                if (!createLoading) setCreateOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" form="create-project-form" disabled={createLoading}>
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
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              placeholder="Ej. Alineación Motor #7"
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
              className="w-full min-h-[100px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              placeholder="Agrega notas, alcance del proyecto o responsables."
              value={createDescription}
              onChange={(event) => setCreateDescription(event.target.value)}
              disabled={createLoading}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Los proyectos te ayudan a agrupar cálculos y reportes relacionados con cada alineación.
          </p>
          {createError && <p className="text-sm text-destructive">{createError}</p>}
        </form>
      </Dialog>
    </div>
  );
}
