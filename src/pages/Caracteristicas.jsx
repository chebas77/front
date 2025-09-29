import { ClipboardList, Calculator, FileText, BarChart3, Settings, CloudDownload, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

export default function Caracteristicas() {
  const features = [
    {
      icon: ClipboardList,
      title: "Registro y gestión de proyectos",
      desc: "Guarda tus alineaciones, adjunta datos de la máquina, controla versiones y organiza el historial de tus trabajos.",
    },
    {
      icon: Calculator,
      title: "Cálculo asistido",
      desc: "Ingreso guiado de lecturas 12–3–6–9 con la técnica del reloj y ayuda visual para interpretar correcciones.",
    },
    {
      icon: FileText,
      title: "Reportes profesionales",
      desc: "Genera reportes PDF/Excel con resultados claros, tolerancias y recomendaciones listas para entregar.",
    },
    {
      icon: BarChart3,
      title: "Análisis y trazabilidad",
      desc: "Consulta métricas clave, revisa alineaciones pasadas y garantiza la trazabilidad completa de cada proyecto.",
    },
    {
      icon: Settings,
      title: "Configuración flexible",
      desc: "Ajusta parámetros de tolerancia y personaliza las unidades de medida según los requerimientos del taller o cliente.",
    },
    {
      icon: CloudDownload,
      title: "Acceso desde cualquier lugar",
      desc: "Sistema basado en la web: accede a tus proyectos y reportes desde el taller, la oficina o en campo.",
    },
  ];

  return (
    <section className="p-8 space-y-10 max-w-6xl mx-auto">
      {/* Botón regresar */}
      <div className="flex justify-start">
        <Link to="/">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Regresar a inicio
          </Button>
        </Link>
      </div>

      {/* Encabezado */}
      <header className="space-y-2 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Características principales
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Todo lo que necesitas para realizar alineaciones de motores industriales
          de manera <span className="font-semibold text-primary">precisa, sencilla y profesional</span>.
        </p>
      </header>

      {/* Lista de características */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <Icon className="h-8 w-8 text-primary mb-4" />
            <h2 className="font-semibold text-lg">{title}</h2>
            <p className="text-sm text-muted-foreground mt-2">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
