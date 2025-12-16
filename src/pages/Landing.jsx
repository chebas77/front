import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { ThemeToggle } from "../components/theme-toggle"
import { ArrowRight, ShieldCheck, Gauge, Wrench } from "lucide-react"
import { SiteFooter } from "../components/site-footer";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold text-sm sm:text-base">A</div>
            <span className="font-bold text-sm sm:text-base hidden sm:inline">Industrial Alignment Pro</span>
            <span className="font-bold text-sm sm:hidden">Alignment Pro</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/demo/calculations">
  <Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-4">Demo</Button>
</Link>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
              Alineación de motores industriales <span className="text-primary">precisa y sencilla</span>
            </h1>
            <p className="mt-3 sm:mt-4 text-muted-foreground text-base sm:text-lg">
              Registra proyectos, calcula con la técnica del reloj y genera reportes profesionales.
              Pensado para <strong>técnicos</strong> e <strong>ingenieros</strong>, pero lo entiende cualquiera.
            </p>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
              {/* Inicia OAuth en tu backend */}
              <a href={`${BACKEND_URL}/auth/google`} className="inline-block w-full sm:w-auto">
                <Button className="h-10 sm:h-11 px-4 sm:px-5 w-full bg-primary text-primary-foreground hover:opacity-90">
                  {/* Google "G" simple en SVG para no depender de libs */}
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.3 29.3 35 24 35c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.3 0 6.3 1.2 8.6 3.3l5.7-5.7C34.3 3.1 29.4 1 24 1 11.8 1 2 10.8 2 23s9.8 22 22 22c12.1 0 21-8.5 21-21 0-1.4-.1-2.3-.4-3.5z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.4 18.8 13 24 13c3.3 0 6.3 1.2 8.6 3.3l5.7-5.7C34.3 6.1 29.4 4 24 4 15.5 4 8.5 9.1 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 45c5.2 0 10.1-1.8 13.9-5.1l-6.4-5.2C29.2 36.5 26.8 37 24 37c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C8.5 40.9 15.5 45 24 45z"/>
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 3.3-4.6 7-11.3 7-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C8.5 40.9 15.5 45 24 45c12.1 0 21-8.5 21-21 0-1.4-.1-2.3-.4-3.5z"/>
                  </svg>
                  <span className="text-sm sm:text-base">Continuar con Google</span>
                </Button>
              </a>

              {/* Ir a la página pública /caracteristicas */}
              <Link to="/caracteristicas" className="inline-block w-full sm:w-auto">
                <Button variant="outline" className="h-10 sm:h-11 px-4 sm:px-5 w-full">
                  <span className="text-sm sm:text-base">Ver características</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Al continuar aceptas el uso de cookies para mantener tu sesión iniciada.
            </p>
          </div>

          {/* Mockup panel */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
            <div className="h-7 sm:h-8 w-24 sm:w-32 rounded-md bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
              Demo en vivo
            </div>
            <div className="mt-4 aspect-video rounded-lg border border-border bg-gradient-to-br from-card to-muted" />
            <ul className="mt-4 sm:mt-6 space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span>JWT seguro en cookie httpOnly</span>
              </li>
              <li className="flex items-center gap-2">
                <Gauge className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span>Cálculos con técnica del reloj</span>
              </li>
              <li className="flex items-center gap-2">
                <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span>Reportes profesionales en 1 clic</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Features */}
        <section id="caracteristicas" className="border-t border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <Feature
              title="Registro y proyectos"
              desc="Guarda tus alineaciones, adjunta datos de máquina y controla versiones."
            />
            <Feature
              title="Cálculo asistido"
              desc="Ingreso guiado de lecturas 12–3–6–9 y ayuda visual para interpretar correcciones."
            />
            <Feature
              title="Reportes"
              desc="Genera PDF con resultados, tolerancias y recomendaciones."
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

function Feature({ title, desc }) {
  return (
    <div className="rounded-lg border border-border p-5 bg-card">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2">{desc}</p>
    </div>
  )
}
