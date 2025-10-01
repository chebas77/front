"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Bell, Loader2, Search, User } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function fetchJsonSafe(url, signal) {
  try {
    const res = await fetch(url, { credentials: "include", signal });
    const ct = res.headers.get("content-type") || "";
    const isJson = ct.includes("application/json");
    const body = isJson ? await res.json().catch(() => null) : null;

    if (!res.ok) {
      const msg = body?.error || body?.message || `Error ${res.status} al consultar ${url}`;
      return { ok: false, error: msg, status: res.status };
    }

    // Normaliza posibles formatos
    const data = Array.isArray(body?.items)
      ? body.items
      : Array.isArray(body?.results)
      ? body.results
      : Array.isArray(body)
      ? body
      : [];

    return { ok: true, data };
  } catch (e) {
    if (e.name === "AbortError") return { ok: false, aborted: true };
    return { ok: false, error: e.message || "Fallo de red" };
  }
}

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState({ projects: [], reports: [] });
  const [open, setOpen] = useState(false);

  const searchRef = useRef(null);
  const abortRef = useRef(null);

  // Cierra el popup al click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset al cambiar de ruta
  useEffect(() => {
    setOpen(false);
    setTerm("");
    setResults({ projects: [], reports: [] });
    setError("");
  }, [location.pathname]);

  useEffect(() => {
    const trimmed = term.trim();

    // Cancelar petición previa
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    // Reglas de entrada
    if (!trimmed) {
      setLoading(false);
      setError("");
      setResults({ projects: [], reports: [] });
      return;
    }
    if (trimmed.length < 2) {
      setLoading(false);
      setError("");
      setResults({ projects: [], reports: [] });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const t = setTimeout(async () => {
      setLoading(true);
      setError("");

      const q = encodeURIComponent(trimmed);
      const endpoints = [
        { key: "projects", url: `${API}/projects/search?q=${q}` },
        { key: "reports",  url: `${API}/reports/search?q=${q}` },
      ];

      const settled = await Promise.allSettled(
        endpoints.map(({ key, url }) =>
          fetchJsonSafe(url, controller.signal).then((r) => ({ key, ...r }))
        )
      );

      // Armar resultados parciales
      const next = { projects: [], reports: [] };
      const errs = [];

      for (const s of settled) {
        if (s.status !== "fulfilled") {
          errs.push("Fallo de red");
          continue;
        }
        const { key, ok, data, error: errMsg, aborted } = s.value;
        if (aborted) continue; // efecto será limpiado
        if (ok) {
          if (key === "projects") next.projects = (data || []).map(normalizeProject).filter(Boolean);
          if (key === "reports")  next.reports  = (data || []).map(normalizeReport).filter(Boolean);
        } else {
          errs.push(`${key}: ${errMsg || "error"}`);
        }
      }

      // Si se abortó mientras esperábamos, no tocar estado
      if (controller.signal.aborted) return;

      setResults(next);
      setError(errs.length ? `Problemas con: ${errs.join(" | ")}` : "");
      setLoading(false);
      abortRef.current = null;
    }, 300);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [term]);

  const hasResults = useMemo(
    () => (results.projects?.length ?? 0) > 0 || (results.reports?.length ?? 0) > 0,
    [results]
  );

  const firstResult = useMemo(() => {
    if (results.projects && results.projects.length) return { type: "project", item: results.projects[0] };
    if (results.reports && results.reports.length) return { type: "report", item: results.reports[0] };
    return null;
  }, [results]);

  function normalizeProject(project) {
    if (!project || typeof project !== "object") return null;
    return {
      id: project.id ?? project.projectId ?? null,
      name: project.name ?? project.title ?? "Proyecto sin nombre",
      status: project.status ?? project.state ?? "EN_PROGRESO",
      updatedAt: project.updatedAt ?? project.updated_at ?? null,
    };
  }

  function normalizeReport(report) {
    if (!report || typeof report !== "object") return null;
    return {
      id: report.id ?? report.reportId ?? null,
      title: report.title ?? report.name ?? "Reporte sin título",
      method: report.method ?? report.type ?? null,
      createdAt: report.createdAt ?? report.created_at ?? null,
    };
  }

  function handleSelect(type, item) {
    if (!item) return;
    setOpen(false);
    setTerm("");
    setResults({ projects: [], reports: [] });
    if (type === "project") {
      item.id != null
        ? navigate(`/app/calculations?project=${encodeURIComponent(item.id)}`)
        : navigate("/app");
    } else if (type === "report") {
      item.id != null
        ? navigate(`/app/reports/${item.id}/print`)
        : navigate("/app/reports");
    }
  }

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-foreground">Alineación de Motores Industriales</h2>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar proyectos o reportes"
              className="pl-10 w-72"
              value={term}
              onChange={(e) => { setTerm(e.target.value); setOpen(true); }}
              onFocus={() => { if (term.trim().length >= 2) setOpen(true); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && firstResult) {
                  e.preventDefault();
                  handleSelect(firstResult.type, firstResult.item);
                }
                if (e.key === "Escape") setOpen(false);
              }}
            />
            {open && (
              <div className="absolute right-0 z-50 mt-2 w-[min(320px,80vw)] rounded-lg border border-border bg-card shadow-xl">
                <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border">
                  Resultados de búsqueda
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {loading && (
                    <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
                    </div>
                  )}

                  {!loading && error && (
                    <div className="px-4 py-3 text-sm text-destructive">{error}</div>
                  )}

                  {!loading && !error && !hasResults && (
                    <div className="px-4 py-3 text-sm text-muted-foreground">
                      {term.trim().length < 2
                        ? "Escribe al menos 2 caracteres para buscar."
                        : "Sin resultados para esta búsqueda."}
                    </div>
                  )}

                  {!loading && results.projects?.length > 0 && (
                    <div>
                      <div className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Proyectos
                      </div>
                      <ul className="py-1">
                        {results.projects.map((p) => (
                          <li key={`project-${p.id ?? p.name}`}>
                            <button
                              type="button"
                              className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                              onClick={() => handleSelect("project", p)}
                            >
                              <div className="font-medium text-card-foreground">{p.name}</div>
                              {p.status && (
                                <div className="text-xs text-muted-foreground">Estado: {p.status}</div>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!loading && results.reports?.length > 0 && (
                    <div>
                      <div className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Reportes
                      </div>
                      <ul className="py-1">
                        {results.reports.map((r) => (
                          <li key={`report-${r.id ?? r.title}`}>
                            <button
                              type="button"
                              className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                              onClick={() => handleSelect("report", r)}
                            >
                              <div className="font-medium text-card-foreground">{r.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {r.method ? `Método: ${r.method}` : "Reporte disponible"}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button variant="ghost" size="sm"><Bell className="h-5 w-5" /></Button>
          <ThemeToggle />
          <Button variant="ghost" size="sm"><User className="h-5 w-5" /></Button>
        </div>
      </div>
    </header>
  );
}
