import Caracteristicas from "./Caracteristicas";

export default function CaracteristicasPublic() {
  return (
    <div className="min-h-screen bg-background">
      {/* Cabecera simple de la landing; usa la que ya tengas */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold">Industrial Alignment Pro</div>
          <a href="/app" className="text-sm opacity-80 hover:opacity-100">
            Entrar al demo
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Caracteristicas />
      </main>
    </div>
  );
}
