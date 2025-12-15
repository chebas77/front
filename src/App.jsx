import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Páginas
import Landing from "./pages/Landing";
import Calculations from "./pages/Calculations";
import CalculationsDemo from "./pages/CalculationsDemo";
import Caracteristicas from "./pages/Caracteristicas";
import CaracteristicasPublic from "./pages/CaracteristicasPublic";
import AlignmentWizard from "./pages/AlignmentWizard";
import RimFaceWizard from "./pages/RimFaceWizard";
import Reports from "./pages/Reports";
import ReportPrint from "./pages/ReportPrint.jsx";
import Projects from "./pages/Projects";
import Profile from "./pages/Profile";

// Componentes de layout
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import ProtectedRoute from "./components/protected-route";

function AppShell() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          <Routes>
            {/* Dashboard principal */}
            <Route index element={<Dashboard />} />

            {/* Cálculos */}
            <Route path="calculations" element={<Calculations />} />

            {/* Proyectos */}
            <Route path="projects" element={<Projects />} />

            {/* Características */}
            <Route path="caracteristicas" element={<Caracteristicas />} />

            {/* Asistentes (wizards) */}
            <Route path="alignment/new" element={<AlignmentWizard />} />
            <Route path="alignment/rim-face/new" element={<RimFaceWizard />} />

            {/* Reportes */}
            <Route path="reports" element={<Reports />} />
            <Route path="reports/:id/print" element={<ReportPrint />} />

            {/* Perfil */}
            <Route path="profile" element={<Profile />} />

            {/* Fallback: redirigir a dashboard */}
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
        {/* Página pública principal */}
        <Route path="/" element={<Landing />} />

        {/* Demo pública de calculadora */}
        <Route path="/demo/calculations" element={<CalculationsDemo />} />

        {/* Página pública de características */}
        <Route path="/caracteristicas" element={<CaracteristicasPublic />} />

        {/* Área protegida (requiere login) */}
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        />

        {/* Fallback: redirigir al landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
