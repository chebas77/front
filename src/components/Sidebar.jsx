"use client";
import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Calculator, FileText, FolderOpen, Settings, Home, ChevronLeft, ChevronRight, Cog, LogOut, Sparkles } from "lucide-react";

import { useAuth } from "./auth-provider";

const RAW_ITEMS = [
  { icon: Home,        label: "Dashboard",      href: "/app" },
  { icon: Calculator,  label: "Cálculos",       href: "/app/calculations" },
  { icon: FileText,    label: "Reportes",       href: "/app/reports" },
  { icon: Sparkles,    label: "Características", href: "/app/caracteristicas" }, // <-- NUEVO
];
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, refresh } = useAuth();

  const menuItems = useMemo(() => RAW_ITEMS, []);
  const isActive = (href) =>
    location.pathname === href || location.pathname.startsWith(href + "/");

  const displayName = user?.name || (user?.email ? user.email.split("@")[0] : "Usuario");
  const email = user?.email || "—";
  const initial = (displayName?.[0] || "U").toUpperCase();

  async function handleLogout() {
    try {
      await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {}
    await refresh();
    navigate("/", { replace: true });
  }

  return (
    <Card className={`${isCollapsed ? "w-16" : "w-64"} transition-all duration-300 bg-sidebar border-sidebar-border rounded-none border-r`}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <Cog className="h-8 w-8 text-sidebar-primary" />
                <h1 className="text-lg font-bold text-sidebar-foreground">Alignment Pro</h1>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
              aria-label={isCollapsed ? "Expandir" : "Colapsar"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                    isActive(item.href) ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                  }`}
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className="h-5 w-5" />
                  {!isCollapsed && <span className="ml-3">{item.label}</span>}
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        {!isCollapsed && (
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-sidebar-primary-foreground">
                  {loading ? "…" : initial}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {loading ? "Cargando…" : displayName}
                </p>
                <p className="text-xs text-sidebar-foreground/70 truncate">{loading ? "" : email}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-sidebar-foreground" onClick={handleLogout} title="Cerrar sesión">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
    