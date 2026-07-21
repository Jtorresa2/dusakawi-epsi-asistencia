import { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, Chip } from "@mui/material";
import { ChevronRight, FileText, Eye, Download } from "lucide-react";
import { exportarExcel } from "../../../shared/utils/exportarExcel";
import Loading from "../../../shared/components/Loading";
import DataTable from "../../../shared/components/DataTable";
import ReporteView from "../components/ReporteView";
import { obtenerIndicadores, obtenerTendencia, obtenerReporteAsistencia, obtenerReporteIncidencias, obtenerReporteTardanzas, obtenerReporteAusencias, obtenerReporteEmpleados, obtenerReporteMarcaciones, guardarHistorial, obtenerHistorial } from "../reportes.api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CARD_DATA = [
  { id: "asistencia", icon: "📊", titulo: "Reporte de Asistencia", desc: "Resumen de asistencia de los empleados por fechas.", color: "#2E7D32" },
  { id: "incidencias", icon: "📄", titulo: "Reporte de Incidencias", desc: "Incidencias registradas y su estado actual.", color: "#DC2626" },
  { id: "tardanzas", icon: "⏰", titulo: "Reporte de Tardanzas", desc: "Tardanzas registradas por los empleados.", color: "#D97706" },
  { id: "ausencias", icon: "🚫", titulo: "Reporte de Ausencias", desc: "Ausencias y permisos registrados.", color: "#0891B2" },
  { id: "empleados", icon: "👥", titulo: "Reporte de Empleados", desc: "Información general de empleados.", color: "#1565C0" },
  { id: "marcaciones", icon: "📍", titulo: "Reporte de Marcaciones", desc: "Marcaciones de entrada y salida con detalle.", color: "#7C3AED" },
];

const IND_META = [
  { key: "empleados_activos", icon: "👥", label: "Empleados activos", color: "#1B5E20", bg: "#F0FDF4" },
  { key: "asistencia_mes", icon: "🟢", label: "Asistencia del mes", color: "#1565C0", bg: "#EFF6FF" },
  { key: "tardanzas_mes", icon: "🟡", label: "Tardanzas registradas", color: "#D97706", bg: "#FEF3C7" },
  { key: "incidencias_abiertas", icon: "🔴", label: "Incidencias abiertas", color: "#DC2626", bg: "#FEE2E2" },
  { key: "ausencias_mes", icon: "🔵", label: "Ausencias registradas", color: "#0891B2", bg: "#ECFEFF" },
  { key: "reportes_mes", icon: "📄", label: "Reportes este mes", color: "#7C3AED", bg: "#F5F3FF" },
];

const API_FNS = { obtenerReporteAsistencia, obtenerReporteIncidencias, obtenerReporteTardanzas, obtenerReporteAusencias, obtenerReporteEmpleados, obtenerReporteMarcaciones };
const NOMBRES = { asistencia: "Reporte de Asistencia", incidencias: "Reporte de Incidencias", tardanzas: "Reporte de Tardanzas", ausencias: "Reporte de Ausencias", empleados: "Reporte de Empleados", marcaciones: "Reporte de Marcaciones" };

export default function ReportesPage() {
  const [tipoActivo, setTipoActivo] = useState(null);
  const [indicadores, setIndicadores] = useState(null);
  const [tendencia, setTendencia] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([obtenerIndicadores(), obtenerTendencia(), obtenerHistorial()])
      .then(([ind, ten, his]) => { setIndicadores(ind); setTendencia(ten.tendencia || []); setHistorial(his.historial || []); })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const handlePDF = (tipo, f) => {
    const p = new URLSearchParams();
    if (f.fecha_desde) p.append("fecha_desde", f.fecha_desde);
    if (f.fecha_hasta) p.append("fecha_hasta", f.fecha_hasta);
    if (f.empleado_id) p.append("empleado_id", f.empleado_id);
    if (f.area_id) p.append("area_id", f.area_id);
    if (f.cargo_id) p.append("cargo_id", f.cargo_id);
    if (f.estado) p.append("estado", f.estado);
    if (f.estado_incidencia) p.append("estado", f.estado_incidencia);
    if (f.tipo_incidencia) p.append("tipo", f.tipo_incidencia);
    if (f.estado_empleado) p.append("activo", f.estado_empleado);
    window.open(`/api/pdf/${tipo}?${p.toString()}`, "_blank");
    guardarHistorial({ tipo_reporte: NOMBRES[tipo], formato: "PDF", filtros: f, total_registros: 0 }).catch(() => {});
  };

  const handleExcel = (tipo, registros) => {
    if (!registros?.length) return;
    exportarExcel(registros, (NOMBRES[tipo] || tipo).replace(/\s+/g, "_"));
    guardarHistorial({ tipo_reporte: NOMBRES[tipo], formato: "Excel", filtros: {}, total_registros: registros.length }).catch(() => {});
  };

  if (cargando) return <Loading texto="Cargando centro de reportes..." />;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: "22px", background: "linear-gradient(135deg, #1B5E20 0%, #388E3C 50%, #43A047 100%)", color: "#fff" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: "14px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={24} /></Box>
          <Box>
            <Typography sx={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2 }}>Reportes</Typography>
            <Typography sx={{ mt: 0.3, fontSize: 14, opacity: 0.85 }}>Centro de reportes e indicadores del sistema</Typography>
          </Box>
        </Box>
      </Paper>

      {tipoActivo ? (
        <ReporteView tipoReporte={tipoActivo} apiFns={API_FNS} onVolver={() => setTipoActivo(null)} onExportarPDF={handlePDF} onExportarExcel={handleExcel} />
      ) : (
        <>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #ECECEC" }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#111827", mb: 2 }}>Centro de Reportes</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
              {CARD_DATA.map((r) => (
                <Paper key={r.id} elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #ECECEC", display: "flex", flexDirection: "column", transition: "all .25s ease", "&:hover": { transform: "translateY(-3px)", boxShadow: "0 8px 25px rgba(0,0,0,.07)" } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: "12px", background: `${r.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{r.icon}</Box>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{r.titulo}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 12, color: "#6B7280", mb: 2, lineHeight: 1.5, flex: 1, minHeight: 36 }}>{r.desc}</Typography>
                  <Button variant="contained" onClick={() => setTipoActivo(r.id)} sx={{ borderRadius: "10px", textTransform: "none", fontSize: 12, fontWeight: 600, py: 1, background: r.color, "&:hover": { background: "#1B5E20" } }}>Generar reporte</Button>
                </Paper>
              ))}
            </Box>
          </Paper>

          <Box sx={{ display: "flex", gap: 2.5, flexDirection: { xs: "column", md: "row" } }}>
            <Box sx={{ flex: 1 }}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid #ECECEC" }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#111827", mb: 1.5 }}>Resumen de Indicadores</Typography>
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  {IND_META.map((m) => {
                    const item = indicadores?.[m.key] || { valor: 0, variacion: 0 };
                    const v = Number(item.variacion) || 0;
                    return (
                      <Box key={m.key} sx={{ flex: "1 1 140px", minWidth: 130, p: 1.5, borderRadius: "14px", border: "1px solid #ECECEC", background: "#fff", display: "flex", alignItems: "center", gap: 1.5, "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,.06)" } }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: "10px", background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{m.icon}</Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Box sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.03em", mb: 0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.label}</Box>
                          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                            <Box sx={{ fontSize: 18, fontWeight: 700, color: "#111827", lineHeight: 1 }}>{item.valor}</Box>
                            <Box sx={{ fontSize: 10, fontWeight: 500, color: v >= 0 ? "#16A34A" : "#DC2626" }}>{v > 0 ? "▲" : v < 0 ? "▼" : "—"} {Math.abs(v)}</Box>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            </Box>
            <Box sx={{ flex: 1 }}>
              {tendencia.length > 0 && (
                <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid #ECECEC" }}>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827", mb: 1.5 }}>Tendencia de Asistencia (Últimos 6 meses)</Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={tendencia}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: 12 }} formatter={v => `${v}%`} />
                      <Line type="monotone" dataKey="porcentaje" stroke="#1B5E20" strokeWidth={2.5} dot={{ r: 4, fill: "#1B5E20" }} name="Asistencia" />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              )}
            </Box>
          </Box>

          {historial.length > 0 && (
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #ECECEC" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Reportes recientes</Typography>
                <Button endIcon={<ChevronRight size={16} />} sx={{ textTransform: "none", fontSize: 12, fontWeight: 600, color: "#1B5E20", "&:hover": { background: "transparent", color: "#2E7D32" } }}>Ver todos →</Button>
              </Box>
              <DataTable rows={historial} columns={[
                { field: "tipo_reporte", headerName: "Reporte", width: 180 },
                { field: "usuario_nombre", headerName: "Usuario", width: 150 },
                { field: "fecha_generacion", headerName: "Fecha", width: 120, valueFormatter: v => v ? new Date(v).toLocaleDateString("es-CO") : "—" },
                { field: "fecha_generacion_hora", headerName: "Hora", width: 80, valueFormatter: v => v ? new Date(v).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "—" },
                { field: "formato", headerName: "Formato", width: 100, renderCell: p => { const c = { PDF: { bg: "#FEE2E2", color: "#991B1B" }, Excel: { bg: "#D1FAE5", color: "#065F46" }, Pantalla: { bg: "#F3F4F6", color: "#374151" } }; const cl = c[p.value] || c.Pantalla; return <Chip label={p.value || "Pantalla"} size="small" sx={{ fontWeight: 600, fontSize: 11, background: cl.bg, color: cl.color, borderRadius: "8px" }} />; } },
                { field: "acciones", headerName: "Acciones", width: 140, sortable: false, renderCell: () => <Box sx={{ display: "flex", gap: 0.5 }}><Chip icon={<Eye size={14} />} label="Ver" size="small" variant="outlined" sx={{ borderRadius: "8px", fontSize: 11, cursor: "pointer" }} /><Chip icon={<Download size={14} />} label="Descargar" size="small" variant="outlined" sx={{ borderRadius: "8px", fontSize: 11, cursor: "pointer" }} /></Box> },
              ]} entityLabel="reportes" getRowId={r => r.id} pageSize={5} />
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}
