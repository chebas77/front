import {
  ArrowLeft,
  BarChart3,
  Calculator,
  ClipboardList,
  CloudDownload,
  FileText,
  Settings,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

const FEATURES = [
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

export default function Caracteristicas() {
  return (
    <section className="mx-auto max-w-6xl space-y-10 p-8">
      <div className="flex justify-start">
        <Link to="/">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Regresar a inicio
          </Button>
        </Link>
      </div>

      <header className="space-y-2 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Características principales</h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Todo lo que necesitas para realizar alineaciones de motores industriales de manera
          <span className="font-semibold text-primary"> precisa, sencilla y profesional</span>.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon, title, desc }) => {
          const FeatureIcon = icon;

          return (
            <div
              key={title}
              className="rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <FeatureIcon className="mb-4 h-8 w-8 text-primary" />
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
