import { lazy, Suspense } from "react";
import { ThemeProvider } from "@mui/material/styles";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import theme from "./styles/theme";

import LoginPage from "./pages/login/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import AsistenciaPage from "./pages/asistencia/AsistenciaPage";
import ReportesPage from "./pages/reportes/ReportesPage";
import UsuariosPage from "./pages/usuarios/UsuariosPage";
import CargosPage from "./pages/cargos/CargosPage";
import EmpleadosPage from "./pages/empleados/EmpleadosPage";
import HorariosPage from "./pages/horarios/HorariosPage";
import IncidenciasPage from "./pages/incidencias/IncidenciasPage";
import IndicadoresPage from "./pages/indicadores/IndicadoresPage";
import ConfiguracionPage from "./pages/configuracion/ConfiguracionPage";
import MiPerfilPage from "./pages/miperfil/MiPerfilPage";
import MisSolicitudesPage from "./pages/misSolicitudes/MisSolicitudesPage";
import IntegracionesPage from "./pages/integraciones/IntegracionesPage";
import ReportarIncidenciaPage from "./pages/reportarIncidencia/ReportarIncidenciaPage";
import Layout from "./components/shared/Layout";
import RoleRoute from "./components/auth/RoleRoute";
import ErrorBoundary from "./components/shared/ErrorBoundary";

const MiAsistenciaPage = lazy(() => import("./pages/miAsistencia/MiAsistenciaPage"));

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function R({ children, roles }) {
  return (
    <ProtectedRoute>
      <RoleRoute roles={roles}>
        <Layout>{children}</Layout>
      </RoleRoute>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* General */}
        <Route path="/dashboard" element={<R roles={["admin", "talento_humano", "empleado"]}><DashboardPage /></R>} />

        {/* Gestión */}
        <Route path="/empleados" element={<R roles={["admin", "talento_humano"]}><EmpleadosPage /></R>} />
        <Route path="/cargos" element={<R roles={["admin", "talento_humano"]}><CargosPage /></R>} />
        <Route path="/horarios" element={<R roles={["admin"]}><HorariosPage /></R>} />
        <Route path="/incidencias" element={<R roles={["admin", "talento_humano"]}><IncidenciasPage /></R>} />

        {/* Operación */}
        <Route path="/asistencia" element={<R roles={["admin", "talento_humano"]}><AsistenciaPage /></R>} />
        <Route path="/indicadores" element={<R roles={["admin", "talento_humano"]}><IndicadoresPage /></R>} />
        <Route path="/reportes" element={<R roles={["admin", "talento_humano"]}><ReportesPage /></R>} />

        {/* Administración */}
        <Route path="/usuarios" element={<R roles={["admin"]}><UsuariosPage /></R>} />
        <Route path="/configuracion" element={<R roles={["admin"]}><ConfiguracionPage /></R>} />
        <Route path="/integraciones" element={<R roles={["admin"]}><IntegracionesPage /></R>} />

        {/* Empleado */}
        <Route path="/mi-asistencia" element={<ErrorBoundary><Suspense fallback={<div style={{padding:40,textAlign:"center",color:"#9CA3AF"}}>Cargando...</div>}><R roles={["empleado"]}><MiAsistenciaPage /></R></Suspense></ErrorBoundary>} />
        <Route path="/reportar-incidencia" element={<ErrorBoundary><R roles={["empleado"]}><ReportarIncidenciaPage /></R></ErrorBoundary>} />
        <Route path="/perfil" element={<ErrorBoundary><R roles={["empleado"]}><MiPerfilPage /></R></ErrorBoundary>} />

        {/* Otras */}
        <Route path="/mis-solicitudes" element={<R roles={["admin", "talento_humano", "empleado"]}><MisSolicitudesPage /></R>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
    </ThemeProvider>
  );
}