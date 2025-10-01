"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Bell, Loader2, Search, User } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

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

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
    setTerm("");
    setResults({ projects: [], reports: [] });
  }, [location.pathname]);

  useEffect(() => {
    if (!term.trim()) {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      setLoading(false);
      setError("");
      setResults({ projects: [], reports: [] });
      return;
    }

    if (term.trim().length < 2) {
      setError("");
      setResults({ projects: [], reports: [] });
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const timeout = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const query = encodeURIComponent(term.trim());
        const endpoints = [
          { key: "projects", url: `${API}/projects/search?q=${query}` },
          { key: "reports", url: `${API}/reports/search?q=${query}` },
        ];

        const settled = await Promise.all(
          endpoints.map(async ({ key, url }) => {
            const res = await fetch(url, { credentials: "include", signal: controller.signal });
            const contentType = res.headers.get("content-type") || "";
            const isJson = contentType.includes("application/json");
            const payload = isJson ? await res.json() : null;
            if (!res.ok) {
              const message = payload?.error || payload?.message || `Error al buscar ${key}`;
              throw new Error(message);
            }
            const data = Array.isArray(payload?.items)
              ? payload.items
              : Array.isArray(payload?.results)
              ? payload.results
              : Array.isArray(payload)
              ? payload
              : [];
            return { key, data };
          })
        );

        const nextResults = { projects: [], reports: [] };
        for (const item of settled) {
          if (!item) continue;
          if (item.key === "projects") nextResults.projects = item.data.map(normalizeProject).filter(Boolean);
          if (item.key === "reports") nextResults.reports = item.data.map(normalizeReport).filter(Boolean);
        }
        setResults(nextResults);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("[Header] search error", err);
        setError(err?.message || "No se pudo realizar la búsqueda.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          abortRef.current = null;
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [term]);

  const hasResults = useMemo(() => {
    return (results.projects?.length ?? 0) > 0 || (results.reports?.length ?? 0) > 0;
  }, [results]);

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
      if (item.id != null) {
        navigate(`/app/calculations?project=${encodeURIComponent(item.id)}`);
      } else {
        navigate("/app");
      }
    } else if (type === "report") {
      if (item.id != null) {
        navigate(`/app/reports/${item.id}/print`);
      } else {
        navigate("/app/reports");
      }
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
              onChange={(event) => {
                setTerm(event.target.value);
                setOpen(true);
              }}
              onFocus={() => {
                if (term.length >= 2) setOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && firstResult) {
                  event.preventDefault();
                  handleSelect(firstResult.type, firstResult.item);
                }
                if (event.key === "Escape") {
                  setOpen(false);
                }
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
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Buscando...
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
                  {!loading && !error && results.projects?.length > 0 && (
                    <div>
                      <div className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Proyectos
                      </div>
                      <ul className="py-1">
                        {results.projects.map((project) => (
                          <li key={`project-${project.id ?? project.name}`}>
                            <button
                              type="button"
                              className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                              onClick={() => handleSelect("project", project)}
                            >
                              <div className="font-medium text-card-foreground">{project.name}</div>
                              {project.status && (
                                <div className="text-xs text-muted-foreground">Estado: {project.status}</div>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {!loading && !error && results.reports?.length > 0 && (
                    <div>
                      <div className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Reportes
                      </div>
                      <ul className="py-1">
                        {results.reports.map((report) => (
                          <li key={`report-${report.id ?? report.title}`}>
                            <button
                              type="button"
                              className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                              onClick={() => handleSelect("report", report)}
                            >
                              <div className="font-medium text-card-foreground">{report.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {report.method ? `Método: ${report.method}` : "Reporte disponible"}
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

          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="sm">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
