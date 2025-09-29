"use client";

import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  Cog,
  FileText,
  Home,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useAuth } from "../hooks/use-auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const RAW_ITEMS = [
  { icon: Home, label: "Dashboard", href: "/app" },
  { icon: Calculator, label: "Cálculos", href: "/app/calculations" },
  { icon: FileText, label: "Reportes", href: "/app/reports" },
  { icon: Sparkles, label: "Características", href: "/app/caracteristicas" },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, refresh } = useAuth();

  const menuItems = useMemo(() => RAW_ITEMS, []);
  const isActive = (href) =>
    location.pathname === href || location.pathname.startsWith(`${href}/`);

  const displayName = user?.name || (user?.email ? user.email.split("@")[0] : "Usuario");
  const email = user?.email || "—";
  const initial = (displayName?.[0] || "U").toUpperCase();
  const containerWidth = isCollapsed ? "w-16" : "w-64";

  async function handleLogout() {
    try {
      await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
    await refresh();
    navigate("/", { replace: true });
  }

  return (
    <Card className={`${containerWidth} transition-all duration-300 rounded-none border-r bg-sidebar border-sidebar-border`}>
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border p-4">
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
              onClick={() => setIsCollapsed((collapsed) => !collapsed)}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
              aria-label={isCollapsed ? "Expandir" : "Colapsar"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const activeClasses = isActive(item.href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "";
              const buttonClasses = [
                "w-full justify-start text-sidebar-foreground",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                activeClasses,
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <li key={item.href}>
                  <Button variant="ghost" className={buttonClasses} onClick={() => navigate(item.href)}>
                    <item.icon className="h-5 w-5" />
                    {!isCollapsed && <span className="ml-3">{item.label}</span>}
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>

        {!isCollapsed && (
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary">
                <span className="text-sm font-medium text-sidebar-primary-foreground">
                  {loading ? "…" : initial}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {loading ? "Cargando…" : displayName}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/70">{loading ? "" : email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-sidebar-foreground"
                onClick={handleLogout}
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
