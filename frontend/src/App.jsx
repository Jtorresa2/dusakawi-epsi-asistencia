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
import OlvideContrasenaPage from "./features/login/pages/OlvideContrasenaPage";
import RestablecerContrasenaPage from "./features/login/pages/RestablecerContrasenaPage";
import DashboardPage from "./features/dashboard/pages/DashboardPage";
import AsistenciaPage from "./features/asistencia/pages/AsistenciaPage";
import ReportesPage from "./features/reportes/pages/ReportesPage";
import CargosPage from "./features/cargos/pages/CargosPage";
import PersonalPage from "./features/personal/pages/PersonalPage";
import HorariosPage from "./features/horarios/pages/HorariosPage";
import NovedadesPage from "./features/novedades/pages/NovedadesPage";
import IncidenciasPage from "./features/incidencias/pages/IncidenciasPage";
import IncidenciaExpedientePage from "./features/incidencias/pages/IncidenciaExpedientePage";
import AreasPage from "./features/areas/pages/AreasPage";
import FestivosPage from "./features/festivos/pages/FestivosPage";
import ConfiguracionPage from "./features/configuracion/pages/ConfiguracionPage";
import RolesPage from "./features/roles/pages/RolesPage";
import CopiasSeguridadPage from "./features/copiasSeguridad/pages/CopiasSeguridadPage";
import MiPerfilPage from "./features/miperfil/pages/MiPerfilPage";
import MiHorarioPage from "./features/miHorario/pages/MiHorarioPage";
import MisSolicitudesPage from "./features/misSolicitudes/pages/MisSolicitudesPage";
import IntegracionesPage from "./features/integraciones/pages/IntegracionesPage";
import ReportarIncidenciaPage from "./features/reportarIncidencia/pages/ReportarIncidenciaPage";
import CambiarPasswordPage from "./features/cambiarPassword/pages/CambiarPasswordPage";
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
        <Route path="/cambiar-password" element={<CambiarPasswordPage />} />
        <Route path="/olvide-contrasena" element={<OlvideContrasenaPage />} />
        <Route path="/restablecer-contrasena" element={<RestablecerContrasenaPage />} />

        {/* General */}
        <Route path="/dashboard" element={<R roles={["admin", "talento_humano", "empleado"]}><DashboardPage /></R>} />

        {/* Gestion */}
        <Route path="/personal" element={<R roles={["admin", "talento_humano"]}><PersonalPage /></R>} />
        <Route path="/empleados" element={<Navigate to="/personal" replace />} />
        <Route path="/cargos" element={<R roles={["admin", "talento_humano"]}><CargosPage /></R>} />
        <Route path="/horarios" element={<R roles={["admin", "talento_humano"]}><HorariosPage /></R>} />
        <Route path="/novedades" element={<R roles={["admin", "talento_humano"]}><NovedadesPage /></R>} />
        <Route path="/areas" element={<R roles={["admin", "talento_humano"]}><AreasPage /></R>} />
        <Route path="/incidencias" element={<R roles={["admin", "talento_humano"]}><IncidenciasPage /></R>} />
<Route path="/incidencias/:id" element={<R roles={["admin", "talento_humano", "empleado"]}><IncidenciaExpedientePage /></R>} />

        {/* Operacion */}
        <Route path="/asistencia" element={<R roles={["admin", "talento_humano"]}><AsistenciaPage /></R>} />
        <Route path="/reportes" element={<R roles={["admin", "talento_humano"]}><ReportesPage /></R>} />

        {/* Administracion */}
        <Route path="/usuarios" element={<Navigate to="/personal" replace />} />
        <Route path="/configuracion" element={<R roles={["admin"]}><ConfiguracionPage /></R>} />
        <Route path="/roles" element={<R roles={["admin"]}><RolesPage /></R>} />
        <Route path="/copias-seguridad" element={<R roles={["admin"]}><CopiasSeguridadPage /></R>} />
        <Route path="/festivos" element={<R roles={["admin", "talento_humano"]}><FestivosPage /></R>} />
        <Route path="/integraciones" element={<R roles={["admin"]}><IntegracionesPage /></R>} />

        {/* Empleado */}
        <Route path="/mi-asistencia" element={<ErrorBoundary><Suspense fallback={<div style={{padding:40,textAlign:"center",color:"#9CA3AF"}}>Cargando...</div>}><R roles={["empleado"]}><MiAsistenciaPage /></R></Suspense></ErrorBoundary>} />
        <Route path="/mi-horario" element={<R roles={["admin", "talento_humano", "empleado"]}><MiHorarioPage /></R>} />
        <Route path="/reportar-incidencia" element={<ErrorBoundary><R roles={["empleado"]}><ReportarIncidenciaPage /></R></ErrorBoundary>} />
        <Route path="/perfil" element={<ErrorBoundary><R roles={["admin", "talento_humano", "empleado"]}><MiPerfilPage /></R></ErrorBoundary>} />

        {/* Otras */}
        <Route path="/mis-solicitudes" element={<R roles={["admin", "talento_humano", "empleado"]}><MisSolicitudesPage /></R>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
    </ThemeProvider>
  );
}
