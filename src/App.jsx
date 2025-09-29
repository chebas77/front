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
import Caracteristicas from "./pages/Caracteristicas"; // <-- NUEVO
import CaracteristicasPublic from "./pages/CaracteristicasPublic"; // <-- nuevo
import CalculationsDemo from "./pages/CalculationsDemo";

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
            {/* Cálculos – técnica de relojes */}
            <Route path="calculations" element={<Calculations />} />
            <Route path="caracteristicas" element={<Caracteristicas />} />

            {/* NUEVO: Características */}
            <Route path="caracteristicas" element={<Caracteristicas />} />

            {/* Asistentes / wizards */}
            <Route path="alignment/new" element={<AlignmentWizard />} />
            <Route path="alignment/rim-face/new" element={<RimFaceWizard />} />

            {/* Otras secciones */}
            <Route path="reports" element={<Reports />} />

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
    <Route path="/" element={<Landing />} />

            {/* Calculadora pública en modo demo */}
           <Route path="/demo/calculations" element={<CalculationsDemo />} />
    {/* Página pública de características */}
    <Route path="/caracteristicas" element={<CaracteristicasPublic />} />  {/* <-- nuevo */}

    <Route
      path="/app/*"
      element={
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</BrowserRouter>

  );
}
