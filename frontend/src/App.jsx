import { lazy, Suspense } from "react";
import { ThemeProvider } from "@mui/material/styles";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import theme from "./shared/theme";

import LoginPage from "./features/login/pages/LoginPage";
import DashboardPage from "./features/dashboard/pages/DashboardPage";
import AsistenciaPage from "./features/asistencia/pages/AsistenciaPage";
import ReportesPage from "./features/reportes/pages/ReportesPage";
import UsuariosPage from "./features/usuarios/pages/UsuariosPage";
import CargosPage from "./features/cargos/pages/CargosPage";
import EmpleadosPage from "./features/empleados/pages/EmpleadosPage";
import HorariosPage from "./features/horarios/pages/HorariosPage";
import IncidenciasPage from "./features/incidencias/pages/IncidenciasPage";
import AreasPage from "./features/areas/pages/AreasPage";
import IndicadoresPage from "./features/indicadores/pages/IndicadoresPage";
import ConfiguracionPage from "./features/configuracion/pages/ConfiguracionPage";
import MiPerfilPage from "./features/miperfil/pages/MiPerfilPage";
import MisSolicitudesPage from "./features/misSolicitudes/pages/MisSolicitudesPage";
import IntegracionesPage from "./features/integraciones/pages/IntegracionesPage";
import ReportarIncidenciaPage from "./features/reportarIncidencia/pages/ReportarIncidenciaPage";
import RegistroPage from "./features/registro/pages/RegistroPage";
import Layout from "./shared/components/Layout";
import RoleRoute from "./shared/components/RoleRoute";
import ErrorBoundary from "./shared/components/ErrorBoundary";

const MiAsistenciaPage = lazy(() => import("./features/miAsistencia/pages/MiAsistenciaPage"));

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
        <Route path="/registro" element={<RegistroPage />} />

        {/* General */}
        <Route path="/dashboard" element={<R roles={["admin", "talento_humano", "empleado"]}><DashboardPage /></R>} />

        {/* Gestión */}
        <Route path="/empleados" element={<R roles={["admin", "talento_humano"]}><EmpleadosPage /></R>} />
        <Route path="/cargos" element={<R roles={["admin", "talento_humano"]}><CargosPage /></R>} />
        <Route path="/horarios" element={<R roles={["admin"]}><HorariosPage /></R>} />
        <Route path="/areas" element={<R roles={["admin", "talento_humano"]}><AreasPage /></R>} />
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