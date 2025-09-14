"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Calculator, FileText, FolderOpen, TrendingUp, Clock, CheckCircle, Plus } from "lucide-react";

export function Dashboard() {
  const stats = [
    { title: "Proyectos Activos", value: "12", description: "Proyectos en progreso", icon: FolderOpen, trend: "+2 esta semana" },
    { title: "Cálculos Realizados", value: "248", description: "Total de alineaciones", icon: Calculator, trend: "+15 este mes" },
    { title: "Reportes Generados", value: "89", description: "Documentos creados", icon: FileText, trend: "+8 esta semana" },
    { title: "Precisión Promedio", value: "98.5%", description: "Exactitud de mediciones", icon: TrendingUp, trend: "+0.3% mejora" },
  ];

  const recentProjects = [
    { name: "Motor Bomba Principal - Planta A", status: "En Progreso", lastUpdate: "2 horas", precision: "97.8%" },
    { name: "Compresor Industrial - Línea 3", status: "Completado", lastUpdate: "1 día", precision: "99.2%" },
    { name: "Ventilador Centrífugo - Área B", status: "Pendiente", lastUpdate: "3 días", precision: "-" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bienvenido al Dashboard</h1>
          <p className="text-muted-foreground mt-2">Gestiona tus proyectos de alineación de motores industriales</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <p className="text-xs text-primary mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Proyectos Recientes</CardTitle>
            <CardDescription>Últimos proyectos de alineación trabajados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-card-foreground">{project.name}</h4>
                    <p className="text-sm text-muted-foreground">Actualizado hace {project.lastUpdate}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        project.status === "Completado" ? "default" :
                        project.status === "En Progreso" ? "secondary" : "outline"
                      }
                      className={
                        project.status === "Completado" ? "bg-primary text-primary-foreground" :
                        project.status === "En Progreso" ? "bg-secondary text-secondary-foreground" : ""
                      }
                    >
                      {project.status}
                    </Badge>
                    <span className="text-sm font-medium text-card-foreground">{project.precision}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Acciones Rápidas</CardTitle>
            <CardDescription>Herramientas más utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent">
                <Clock className="h-6 w-6" />
                <span className="text-sm">Técnica del Reloj</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent">
                <Calculator className="h-6 w-6" />
                <span className="text-sm">Calculadora</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent">
                <FileText className="h-6 w-6" />
                <span className="text-sm">Generar Reporte</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent">
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
