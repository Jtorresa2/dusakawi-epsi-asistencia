import { apiFetch } from "../../shared/api/api";

export const obtenerIndicadores = () => apiFetch("/reportes/indicadores");

export const obtenerTendencia = () => apiFetch("/reportes/tendencia");

export const obtenerReporteAsistencia = (p = {}) => { const q = new URLSearchParams(p).toString(); return apiFetch(`/reportes/asistencia${q ? `?${q}` : ""}`); };
export const obtenerReporteIncidencias = (p = {}) => { const q = new URLSearchParams(p).toString(); return apiFetch(`/reportes/incidencias${q ? `?${q}` : ""}`); };
export const obtenerReporteTardanzas = (p = {}) => { const q = new URLSearchParams(p).toString(); return apiFetch(`/reportes/tardanzas${q ? `?${q}` : ""}`); };
export const obtenerReporteAusencias = (p = {}) => { const q = new URLSearchParams(p).toString(); return apiFetch(`/reportes/ausencias${q ? `?${q}` : ""}`); };
export const obtenerReporteEmpleados = (p = {}) => { const q = new URLSearchParams(p).toString(); return apiFetch(`/reportes/empleados${q ? `?${q}` : ""}`); };
export const obtenerReporteMarcaciones = (p = {}) => { const q = new URLSearchParams(p).toString(); return apiFetch(`/reportes/marcaciones${q ? `?${q}` : ""}`); };

export const obtenerHistorial = () => apiFetch("/reportes/historial");
export const guardarHistorial = (d) => apiFetch("/reportes/historial", { method: "POST", body: JSON.stringify(d) });
