import { SiteFooter } from "../components/site-footer";
import { ThemeToggle } from "../components/theme-toggle";
import Calculations from "./Calculations";

export default function CalculationsDemo() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header público simple */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold">A</div>
            <span className="font-bold">Industrial Alignment Pro</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Banner de aviso demo */}
          <div className="mb-6 rounded-lg border border-yellow-400/30 bg-yellow-500/10 p-4">
            <p className="text-sm">
              <strong>Modo demo:</strong> puedes realizar el <em>cálculo completo</em>, pero
              <strong> no se guardarán</strong> datos ni podrás <strong>exportar a PDF</strong>.
            </p>
          </div>

          {/* Tu calculadora, en modo demo */}
          <Calculations demo />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
