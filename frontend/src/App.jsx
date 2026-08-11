import { lazy, Suspense } from "react";
import { ThemeProvider } from "@mui/material/styles";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { COLORES } from './shared/constants/colores.js';
import theme from "./shared/theme";

import LoginPage from "./features/login/pages/LoginPage";
import Layout from "./shared/components/Layout";
import RoleRoute from "./shared/components/RoleRoute";
import ErrorBoundary from "./shared/components/ErrorBoundary";

// Route-level code splitting: cada página se descarga bajo demanda,
// el chunk inicial solo lleva login + núcleo MUI.
const CambiarPasswordPage = lazy(() => import("./features/cambiarPassword/pages/CambiarPasswordPage"));
const OlvideContrasenaPage = lazy(() => import("./features/login/pages/OlvideContrasenaPage"));
const RestablecerContrasenaPage = lazy(() => import("./features/login/pages/RestablecerContrasenaPage"));
const DashboardPage = lazy(() => import("./features/dashboard/pages/DashboardPage"));
const AsistenciaPage = lazy(() => import("./features/asistencia/pages/AsistenciaPage"));
const ReportesPage = lazy(() => import("./features/reportes/pages/ReportesPage"));
const CargosPage = lazy(() => import("./features/cargos/pages/CargosPage"));
const PersonalPage = lazy(() => import("./features/personal/pages/PersonalPage"));
const HorariosPage = lazy(() => import("./features/horarios/pages/HorariosPage"));
const NovedadesPage = lazy(() => import("./features/novedades/pages/NovedadesPage"));
const IncidenciasPage = lazy(() => import("./features/incidencias/pages/IncidenciasPage"));
const IncidenciaExpedientePage = lazy(() => import("./features/incidencias/pages/IncidenciaExpedientePage"));
const AreasPage = lazy(() => import("./features/areas/pages/AreasPage"));
const FestivosPage = lazy(() => import("./features/festivos/pages/FestivosPage"));
const ConfiguracionPage = lazy(() => import("./features/configuracion/pages/ConfiguracionPage"));
const RolesPage = lazy(() => import("./features/roles/pages/RolesPage"));
const CopiasSeguridadPage = lazy(() => import("./features/copiasSeguridad/pages/CopiasSeguridadPage"));
const MiPerfilPage = lazy(() => import("./features/miperfil/pages/MiPerfilPage"));
const MiHorarioPage = lazy(() => import("./features/miHorario/pages/MiHorarioPage"));
const MisSolicitudesPage = lazy(() => import("./features/misSolicitudes/pages/MisSolicitudesPage"));
const IntegracionesPage = lazy(() => import("./features/integraciones/pages/IntegracionesPage"));
const ReportarIncidenciaPage = lazy(() => import("./features/reportarIncidencia/pages/ReportarIncidenciaPage"));
const MiAsistenciaPage = lazy(() => import("./features/miAsistencia/pages/MiAsistenciaPage"));

const routeFallback = (
  <div style={{ padding: 40, textAlign: "center", color: COLORES.textoSuave }}>Cargando...</div>
);

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function R({ children, roles }) {
  return (
    <ProtectedRoute>
      <RoleRoute roles={roles}>
        <Layout>
          <Suspense fallback={routeFallback}>{children}</Suspense>
        </Layout>
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
        <Route path="/cambiar-password" element={<Suspense fallback={routeFallback}><CambiarPasswordPage /></Suspense>} />
        <Route path="/olvide-contrasena" element={<Suspense fallback={routeFallback}><OlvideContrasenaPage /></Suspense>} />
        <Route path="/restablecer-contrasena" element={<Suspense fallback={routeFallback}><RestablecerContrasenaPage /></Suspense>} />

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
        <Route path="/mi-asistencia" element={<ErrorBoundary><R roles={["empleado"]}><MiAsistenciaPage /></R></ErrorBoundary>} />
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
