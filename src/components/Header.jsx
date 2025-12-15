"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Bell, Loader2, Search, User, X, Check } from "lucide-react";
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

  // Estados de notificaciones
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const abortRef = useRef(null);

  // Cierra el popup al click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset al cambiar de ruta
  useEffect(() => {
    setOpen(false);
    setNotifOpen(false);
    setTerm("");
    setResults({ projects: [], reports: [] });
    setError("");
  }, [location.pathname]);

  // Cargar notificaciones
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Actualizar cada 30s
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    try {
      const res = await fetch(`${API}/api/notifications?limit=20`, { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      if (json.ok) {
        setNotifications(json.notifications || []);
        setUnreadCount(json.unreadCount || 0);
      }
    } catch (e) {
      console.error("Error cargando notificaciones:", e);
    }
  }

  async function markAsRead(id) {
    try {
      const res = await fetch(`${API}/api/notifications/${id}/read`, {
        method: "PUT",
        credentials: "include"
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error("Error marcando notificación:", e);
    }
  }

  async function markAllAsRead() {
    try {
      setNotifLoading(true);
      const res = await fetch(`${API}/api/notifications/read-all`, {
        method: "PUT",
        credentials: "include"
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error("Error marcando todas:", e);
    } finally {
      setNotifLoading(false);
    }
  }

  async function deleteNotification(id) {
    try {
      const res = await fetch(`${API}/api/notifications/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        const notif = notifications.find(n => n.id === id);
        if (notif && !notif.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (e) {
      console.error("Error eliminando notificación:", e);
    }
  }


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

          {/* Botón de notificaciones */}
          <div className="relative" ref={notifRef}>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {notifOpen && (
              <div className="absolute right-0 z-50 mt-2 w-96 max-w-[90vw] rounded-lg border border-border bg-card shadow-xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="font-semibold text-card-foreground">Notificaciones</h3>
                  {notifications.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={markAllAsRead}
                      disabled={notifLoading || unreadCount === 0}
                      className="text-xs"
                    >
                      {notifLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Marcar todas"}
                    </Button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No hay notificaciones
                    </div>
                  ) : (
                    <ul>
                      {notifications.map((notif) => (
                        <li 
                          key={notif.id}
                          className={`px-4 py-3 border-b border-border last:border-0 transition-colors ${
                            !notif.is_read ? 'bg-blue-50 dark:bg-blue-950/20' : 'hover:bg-muted'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`inline-block w-2 h-2 rounded-full ${
                                  notif.type === 'success' ? 'bg-green-500' :
                                  notif.type === 'info' ? 'bg-blue-500' :
                                  notif.type === 'warning' ? 'bg-orange-500' :
                                  'bg-gray-500'
                                }`} />
                                <p className="font-medium text-sm text-card-foreground truncate">
                                  {notif.title}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {notif.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(notif.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {!notif.is_read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notif.id)}
                                  className="h-7 w-7 p-0"
                                  title="Marcar como leída"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notif.id)}
                                className="h-7 w-7 p-0 text-destructive"
                                title="Eliminar"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          <ThemeToggle />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/app/profile")}
            title="Mi Perfil"
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
