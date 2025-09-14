import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { ThemeToggle } from "../components/theme-toggle"
import { ArrowRight, ShieldCheck, Gauge, Wrench } from "lucide-react"

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold">A</div>
            <span className="font-bold">Industrial Alignment Pro</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/app">
              <Button variant="ghost">Entrar al demo</Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Alineación de motores industriales <span className="text-primary">precisa y sencilla</span>
            </h1>
            <p className="mt-4 text-muted-foreground text-lg">
              Registra proyectos, calcula con la técnica del reloj y genera reportes profesionales.
              Pensado para <strong>técnicos</strong> e <strong>ingenieros</strong>, pero lo entiende cualquiera.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              {/* Inicia OAuth en tu backend */}
              <a href={`${BACKEND_URL}/auth/google`} className="inline-block">
                <Button className="h-11 px-5 bg-primary text-primary-foreground hover:opacity-90">
                  {/* Google “G” simple en SVG para no depender de libs */}
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.3 29.3 35 24 35c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.3 0 6.3 1.2 8.6 3.3l5.7-5.7C34.3 3.1 29.4 1 24 1 11.8 1 2 10.8 2 23s9.8 22 22 22c12.1 0 21-8.5 21-21 0-1.4-.1-2.3-.4-3.5z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.4 18.8 13 24 13c3.3 0 6.3 1.2 8.6 3.3l5.7-5.7C34.3 6.1 29.4 4 24 4 15.5 4 8.5 9.1 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 45c5.2 0 10.1-1.8 13.9-5.1l-6.4-5.2C29.2 36.5 26.8 37 24 37c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C8.5 40.9 15.5 45 24 45z"/>
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 3.3-4.6 7-11.3 7-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C8.5 40.9 15.5 45 24 45c12.1 0 21-8.5 21-21 0-1.4-.1-2.3-.4-3.5z"/>
                  </svg>
                  Continuar con Google
                </Button>
              </a>

              <a href="#caracteristicas">
                <Button variant="outline" className="h-11 px-5">
                  Ver características <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </a>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Al continuar aceptas el uso de cookies para mantener tu sesión iniciada.
            </p>
          </div>

          {/* Mockup panel */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="h-8 w-32 rounded-md bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
              Demo en vivo
            </div>
            <div className="mt-4 aspect-video rounded-lg border border-border bg-gradient-to-br from-card to-muted" />
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                JWT seguro en cookie httpOnly
              </li>
              <li className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-primary" />
                Cálculos con técnica del reloj
              </li>
              <li className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                Reportes profesionales en 1 clic
              </li>
            </ul>
          </div>
        </section>

        {/* Features */}
        <section id="caracteristicas" className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-6">
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

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Industrial Alignment Pro</span>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Privacidad</a>
            <a href="#" className="hover:underline">Términos</a>
          </div>
        </div>
      </footer>
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
