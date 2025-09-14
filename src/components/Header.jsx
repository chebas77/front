"use client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Bell, Search, User } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-foreground">Alineación de Motores Industriales</h2>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Buscar proyectos..." className="pl-10 w-64" />
          </div>

          <Button variant="ghost" size="sm"><Bell className="h-5 w-5" /></Button>
          <ThemeToggle />
          <Button variant="ghost" size="sm"><User className="h-5 w-5" /></Button>
        </div>
      </div>
    </header>
  );
}
