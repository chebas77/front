// src/pages/Reports.jsx
import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { jsPDF } from "jspdf";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Filter } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ───────────────── helpers ─────────────────
function parseMaybeJSON(v) {
  if (v == null) return v;
  if (typeof v === "object") return v;
  try { return JSON.parse(v); } catch { return v; }
}
function normalizeReport(raw) {
  return {
    id: raw.id,
    method: raw.method ?? null,
    title: raw.title ?? null,
    description: raw.description ?? null,
    equipment_id: raw.equipment_id ?? raw.equipmentId ?? null,
    project_id: raw.project_id ?? raw.projectId ?? null,
    dims: parseMaybeJSON(raw.dims) ?? {},
    indicators: parseMaybeJSON(raw.indicators) ?? {},
    results: parseMaybeJSON(raw.results) ?? {},
    sag: Number(raw.sag ?? 0),
    created_at: raw.created_at ?? raw.createdAt ?? null,
    file_url: raw.file_url ?? raw.fileUrl ?? null,
    user_id: raw.user_id ?? raw.userId ?? null,
    user_name: raw.user_name ?? raw.userName ?? null,
    user_email: raw.user_email ?? raw.userEmail ?? null,
  };
}
function fmtNum(v) {
  if (v == null || v === "") return "N/A";
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : String(v);
}

// ───────────────── component ─────────────────
export default function Reports() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const projectFilter = searchParams.get("project");

  // Carga inicial de reportes
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API}/api/reports`, { credentials: "include" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || "Error al cargar reportes");
        if (!cancel) setItems((json.items || []).map(normalizeReport));
      } catch (e) {
        if (!cancel) setErr(e.message || "Error inesperado");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // Cargar proyectos para el selector
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(`${API}/projects`, { credentials: "include" });
        const json = await res.json();
        if (!cancel && json.items) {
          setProjects(json.items);
        }
      } catch (e) {
        console.error("Error cargando proyectos:", e);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // Filtrar reportes por proyecto si está seleccionado
  const filteredItems = projectFilter
    ? items.filter(item => String(item.project_id) === projectFilter)
    : items;

  // Asignar reporte a proyecto
  const handleAssignProject = async (reportId, projectId) => {
    try {
      const endpoint = projectId 
        ? `${API}/api/reports/${reportId}/assign-project`
        : `${API}/api/reports/${reportId}/unassign-project`;
      
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ projectId: projectId ? Number(projectId) : null }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Error al asignar proyecto");
      }

      // Actualizar estado local
      setItems(prev => prev.map(item => 
        item.id === reportId 
          ? { ...item, project_id: projectId ? Number(projectId) : null }
          : item
      ));
    } catch (error) {
      console.error("Error asignando proyecto:", error);
      alert(`No se pudo asignar el proyecto: ${error.message}`);
    }
  };

  // Eliminar reporte
  const handleDeleteReport = async (reportId, reportTitle) => {
    if (!confirm(`¿Estás seguro de eliminar el reporte "${reportTitle || `#${reportId}`}"?`)) {
      return;
    }

    try {
      const res = await fetch(`${API}/api/reports/${reportId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Error al eliminar reporte");
      }

      // Actualizar estado local eliminando el reporte
      setItems(prev => prev.filter(item => item.id !== reportId));
    } catch (error) {
      console.error("Error eliminando reporte:", error);
      alert(`No se pudo eliminar el reporte: ${error.message}`);
    }
  };

  // Editar reporte
  const handleEditReport = (reportId) => {
    navigate(`/app/calculations?edit=${reportId}`);
  };

  // PDF rápido (cliente)
  const generatePdf = useCallback((r) => {
    try {
      if (!r) return;
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      let y = 20;
      const left = 20, right = 190, width = right - left;
      const line = () => { doc.setLineWidth(0.5); doc.line(left, y, right, y); y += 5; };
      const newPageIfNeeded = (delta = 6) => {
        if (y + delta > 280) { doc.addPage(); y = 20; }
      };

      // Header
      doc.setFontSize(18); doc.setFont("helvetica", "bold");
      doc.text("Alignment Procedure Report", 105, y, { align: "center" }); y += 12;
      doc.setFontSize(12); doc.setFont("helvetica", "normal");
      doc.text(`Report Date: ${new Date(r.created_at).toLocaleString()}`, 105, y, { align: "center" }); y += 7;
      doc.text("Rim and Face Method", 105, y, { align: "center" }); y += 12;

      // Usuario + meta
      doc.setFontSize(11);
      doc.text(`User: ${r.user_name || r.user_email || "N/A"}`, left, y); y += 5;
      if (r.equipment_id) { doc.text(`Equipment ID: ${r.equipment_id}`, left, y); y += 5; }
      if (r.title) { doc.text(`Title: ${r.title}`, left, y); y += 7; }
      line();

      // Dimensiones
      const dims = r.dims || {};
      doc.setFontSize(12); doc.text("Equipment Measurements (inches):", left, y); y += 7;
      doc.setFontSize(10);
      ["H","D","E","F","G"].forEach((k) => {
        const label = ({
          H:"H (Swing diameter)", D:"D (Near feet → face)", E:"E (Feet spacing)",
          F:"F (Left front)", G:"G (Left back)"
        })[k];
        newPageIfNeeded();
        if (label) { doc.text(`${label}: ${dims?.[k] ?? "N/A"}`, left, y); y += 5; }
      });
      y += 2; line();

      // Indicadores
      const ind = r.indicators || {};
      doc.setFontSize(12); doc.text("Dial Indicator Readings:", left, y); y += 7;
      doc.setFontSize(10);
      newPageIfNeeded(); doc.text(`Rim — 90°: ${ind.R90 ?? "N/A"}, 180°: ${ind.R180 ?? "N/A"}, 270°: ${ind.R270 ?? "N/A"}`, left, y); y += 5;
      newPageIfNeeded(); doc.text(`Face — 90°: ${ind.F90 ?? "N/A"}, 180°: ${ind.F180 ?? "N/A"}, 270°: ${ind.F270 ?? "N/A"}`, left, y); y += 5;
      newPageIfNeeded(); doc.text(`Adjusted for SAG @90°: ${r.sag ?? "N/A"}`, left, y); y += 7;
      line();

      // Resultados
      const resMap = r.results || {};
      doc.setFontSize(12); doc.text("Calculated Results:", left, y); y += 7;
      doc.setFontSize(10);
      [
        ["Vertical — Near (VN)", fmtNum(resMap.VN)],
        ["Vertical — Far  (VF)", fmtNum(resMap.VF)],
        ["Horizontal — Near (HN)", fmtNum(resMap.HN)],
        ["Horizontal — Far  (HF)", fmtNum(resMap.HF)],
      ].forEach(([k, v]) => {
        newPageIfNeeded();
        doc.text(k, left, y);
        doc.text(String(v), right, y, { align: "right" });
        y += 6;
      });
      y += 1; line();

      // Notas
      if (r.description) {
        doc.setFontSize(12); doc.text("Notes:", left, y); y += 6;
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(String(r.description), width);
        lines.forEach((ln) => { newPageIfNeeded(); doc.text(ln, left, y); y += 5; });
      }

      doc.save(`${r.title || "report"}.pdf`);
    } catch (e) {
      console.error("[PDF] error:", e);
      alert("No se pudo generar el PDF.");
    }
  }, []);

  const currentProject = projectFilter 
    ? projects.find(p => String(p.id) === projectFilter)
    : null;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis reportes</h1>
          {currentProject && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{currentProject.name}</Badge>
              <button 
                className="text-xs text-muted-foreground hover:text-foreground underline"
                onClick={() => setSearchParams({})}
              >
                Ver todos los reportes
              </button>
            </div>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {loading ? "Cargando..." : `${filteredItems.length} reporte(s)`}
        </span>
      </div>

      {!projectFilter && projects.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">Filtrar por proyecto:</span>
          <select 
            className="flex-1 max-w-xs px-3 py-2 text-sm rounded-md border border-border bg-background"
            value={projectFilter || ""}
            onChange={(e) => {
              if (e.target.value) {
                setSearchParams({ project: e.target.value });
              } else {
                setSearchParams({});
              }
            }}
          >
            <option value="">Todos los proyectos</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {err && <div className="text-destructive text-sm">{err}</div>}

      {!loading && filteredItems.length === 0 && (
        <Card className="bg-card">
          <CardContent className="py-8">
            <p className="text-muted-foreground">
              {projectFilter 
                ? `No hay reportes en el proyecto "${currentProject?.name || 'seleccionado'}"` 
                : "Aún no tienes reportes. Crea uno desde Cálculos."
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* grid de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((r) => (
          <Card key={r.id} className="bg-card">
            <CardHeader>
              <CardTitle className="truncate text-card-foreground">
                {r.title || `Reporte #${r.id}`}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}
              </p>
            </CardHeader>

            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground line-clamp-3 italic">
                {r.description || "Sin descripción"}
              </p>

              {/* Selector de proyecto */}
              <div className="pt-2 border-t border-border">
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Proyecto asignado:
                </label>
                <select
                  className="w-full px-2 py-1.5 text-sm rounded border border-border bg-background"
                  value={r.project_id || ""}
                  onChange={(e) => handleAssignProject(r.id, e.target.value || null)}
                >
                  <option value="">Sin asignar</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-muted-foreground mt-4 space-y-1">
                <div><b>Usuario:</b> {r.user_name || r.user_email || r.user_id || "N/A"}</div>
                <div><b>Equipo:</b> {r.equipment_id || "N/A"}</div>
                <div>
                  <b>H:</b> {r.dims?.H ?? "N/A"}{" "}
                  <b>D:</b> {r.dims?.D ?? "N/A"}{" "}
                  <b>E:</b> {r.dims?.E ?? "N/A"}
                </div>
                <div>
                  <b>VN:</b> {fmtNum(r.results?.VN)}{" "}
                  <b>VF:</b> {fmtNum(r.results?.VF)}{" "}
                  <b>HN:</b> {fmtNum(r.results?.HN)}{" "}
                  <b>HF:</b> {fmtNum(r.results?.HF)}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={() => generatePdf(r)} 
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                   PDF
                </Button>
                <Button
                  onClick={() => navigate(`/app/reports/${r.id}/print`)}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                >
                   Imprimir
                </Button>
              </div>

              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline"
                  onClick={() => handleEditReport(r.id)}
                  className="flex-1 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 dark:text-blue-400"
                >
                   Editar
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleDeleteReport(r.id, r.title)}
                  className="flex-1 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:text-red-400"
                >
                   Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
