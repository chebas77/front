import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import { Sidebar } from "./components/sidebar";
import { Header } from "./components/header";
import { Dashboard } from "./components/dashboard";
import ProtectedRoute from "./components/protected-route";
import Calculations from "./pages/Calculations";
import AlignmentWizard from "./pages/AlignmentWizard";
import RimFaceWizard from "./pages/RimFaceWizard";
import Reports from "./pages/Reports";

function AppShell() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          <Routes>
            {/* Dashboard principal de la app */}
            <Route index element={<Dashboard />} />

            {/* Página de cálculos – técnica de relojes */}
            <Route path="calculations" element={<Calculations />} />

            {/* Rutas de ejemplo para las demás secciones */}
            import AlignmentWizard from "./pages/AlignmentWizard";
// ...
<Route path="alignment/new" element={<AlignmentWizard />} />
 <Route path="reports" element={<Reports />} />
<Route path="alignment/rim-face/new" element={<RimFaceWizard />} />
            <Route path="reports" element={<div>Reportes</div>} />
            <Route path="projects" element={<div>Proyectos</div>} />
            <Route path="settings" element={<div>Configuración</div>} />

            {/* Cualquier ruta desconocida dentro de /app redirige al dashboard */}
            <Route path="*" element={<Navigate to="." replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing pública */}
        <Route path="/" element={<Landing />} />

        {/* Área protegida de la aplicación */}
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        />

        {/* Rutas no reconocidas fuera de /app redirigen a landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
