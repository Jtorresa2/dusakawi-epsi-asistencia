import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Typography, Paper, Button, Chip, Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import { ChevronRight, FileText, Eye, Download, X } from "lucide-react";
import Loading from "../../../shared/components/Loading";
import DataTable from "../../../shared/components/DataTable";
import ReporteView from "../components/ReporteView";
import { obtenerIndicadores, obtenerTendencia, obtenerReporteAsistencia, obtenerReporteIncidencias, obtenerReporteTardanzas, obtenerReporteAusencias, obtenerReporteEmpleados, obtenerReporteMarcaciones, obtenerReportePorEmpleado, obtenerHistorial } from "../reportes.api";
import { exportarPDF, handleExcel, NOMBRES } from "../reportes.export";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { COLORES } from "../../../shared/constants/colores.js";

const CARD_DATA = [
  { id: "porEmpleado", icon: "👤", titulo: "Reporte por Empleado", desc: "Resumen mensual de asistencia, tardanzas, ausencias y horas de un empleado.", color: COLORES.success },
  { id: "asistencia", icon: "📊", titulo: "Reporte de Asistencia", desc: "Resumen de asistencia de los empleados por fechas.", color: COLORES.primario },
  { id: "incidencias", icon: "📄", titulo: "Reporte de Incidencias", desc: "Incidencias registradas y su estado actual.", color: COLORES.danger },
  { id: "tardanzas", icon: "⏰", titulo: "Reporte de Tardanzas", desc: "Tardanzas registradas por los empleados.", color: COLORES.warning },
  { id: "ausencias", icon: "🚫", titulo: "Reporte de Ausencias", desc: "Ausencias y novedades registradas.", color: COLORES.verdeTexto },
  { id: "empleados", icon: "👥", titulo: "Reporte de Empleados", desc: "Información general de empleados.", color: COLORES.primarioOscuro },
  { id: "marcaciones", icon: "📍", titulo: "Reporte de Marcaciones", desc: "Marcaciones de entrada y salida con detalle.", color: COLORES.primario },
];

const IND_META = [
  { key: "empleados_activos", icon: "👥", label: "Empleados activos", color: COLORES.primarioOscuro, bg: COLORES.successClaro },
  { key: "asistencia_mes", icon: "🟢", label: "Asistencia del mes", color: COLORES.primarioOscuro, bg: COLORES.primarioClaro },
  { key: "tardanzas_mes", icon: "🟡", label: "Tardanzas registradas", color: COLORES.warningOscuro, bg: COLORES.warningFondo },
  { key: "incidencias_abiertas", icon: "🔴", label: "Incidencias abiertas", color: COLORES.danger, bg: COLORES.dangerFondo },
  { key: "ausencias_mes", icon: "🔵", label: "Ausencias registradas", color: COLORES.verdeTexto, bg: COLORES.successClaro },
  { key: "reportes_mes", icon: "📄", label: "Reportes este mes", color: COLORES.primario, bg: COLORES.primarioClaro },
];

const API_FNS = { obtenerReporteAsistencia, obtenerReporteIncidencias, obtenerReporteTardanzas, obtenerReporteAusencias, obtenerReporteEmpleados, obtenerReporteMarcaciones, obtenerReportePorEmpleado };
const NOMBRES_REV = Object.fromEntries(Object.entries(NOMBRES).map(([k, v]) => [v, k]));

export default function ReportesPage() {
  const [searchParams] = useSearchParams();
  // ?tipo=<id> abre directo ese reporte (ej. /reportes?tipo=asistencia)
  const tipoQuery = searchParams.get("tipo");
  const tipoInicial = CARD_DATA.some((r) => r.id === tipoQuery) ? tipoQuery : null;
  const [tipoActivo, setTipoActivo] = useState(tipoInicial);
  const [indicadores, setIndicadores] = useState(null);
  const [tendencia, setTendencia] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [filtrosIniciales, setFiltrosIniciales] = useState(null);

  useEffect(() => {
    Promise.all([obtenerIndicadores(), obtenerTendencia(), obtenerHistorial()])
      .then(([ind, ten, his]) => { setIndicadores(ind); setTendencia(ten.tendencia || []); setHistorial(his.historial || []); })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const handlePDF = (tipo, f) => exportarPDF(tipo, f, setPdfPreview);

  if (cargando) return <Loading texto="Cargando centro de reportes..." />;

  return (
    <>
    <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Typography sx={{ fontSize: 13, color: COLORES.textoMuted }}>
                Inicio / Gestión de reportes / Incidencias
      </Typography>

      {tipoActivo ? (
        <ReporteView tipoReporte={tipoActivo} apiFns={API_FNS} filtrosIniciales={filtrosIniciales} onVolver={() => { setTipoActivo(null); setFiltrosIniciales(null); }} onExportarPDF={handlePDF} onExportarExcel={handleExcel} />
      ) : (
        <>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}` }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: COLORES.textoPrimario, mb: 2 }}></Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
              {CARD_DATA.map((r) => (
                <Paper key={r.id} elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", flexDirection: "column", transition: "all .25s ease", "&:hover": { transform: "translateY(-3px)", boxShadow: "0 8px 25px rgba(0,0,0,.07)" } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: "12px", background: `${r.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{r.icon}</Box>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario }}>{r.titulo}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 12, color: COLORES.textoTerciario, mb: 2, lineHeight: 1.5, flex: 1, minHeight: 36 }}>{r.desc}</Typography>
                  <Button variant="contained" onClick={() => setTipoActivo(r.id)} sx={{ borderRadius: "10px", textTransform: "none", fontSize: 12, fontWeight: 600, py: 1, background: COLORES.primario, "&:hover": { background: COLORES.primarioOscuro } }}>Generar reporte</Button>
                </Paper>
              ))}
            </Box>
          </Paper>

          <Box sx={{ display: "flex", gap: 2.5, flexDirection: { xs: "column", md: "row" } }}>
            <Box sx={{ flex: 1 }}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}` }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario, mb: 1.5 }}>Resumen de Indicadores</Typography>
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  {IND_META.map((m) => {
                    const item = indicadores?.[m.key] || { valor: 0, variacion: 0 };
                    const v = Number(item.variacion) || 0;
                    return (
                      <Box key={m.key} sx={{ flex: "1 1 140px", minWidth: 130, p: 1.5, borderRadius: "14px", border: `1px solid ${COLORES.grisContorno}`, background: COLORES.fondoBlanco, display: "flex", alignItems: "center", gap: 1.5, "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,.06)" } }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: "10px", background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{m.icon}</Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Box sx={{ fontSize: 10, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase", letterSpacing: "0.03em", mb: 0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.label}</Box>
                          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                            <Box sx={{ fontSize: 18, fontWeight: 700, color: COLORES.textoPrimario, lineHeight: 1 }}>{item.valor}</Box>
                            <Box sx={{ fontSize: 10, fontWeight: 500, color: v >= 0 ? COLORES.success : COLORES.danger }}>{v > 0 ? "▲" : v < 0 ? "▼" : "—"} {Math.abs(v)}</Box>
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
                <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}` }}>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: COLORES.textoPrimario, mb: 1.5 }}>Tendencia de Asistencia (Últimos 6 meses)</Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={tendencia}>
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORES.fondoGris2} />
                      <XAxis dataKey="mes" tick={{ fontSize: 11, fill: COLORES.textoSuave }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: COLORES.textoSuave }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: `1px solid ${COLORES.borde}`, fontSize: 12 }} formatter={v => `${v}%`} />
                      <Line type="monotone" dataKey="porcentaje" stroke={COLORES.primarioOscuro} strokeWidth={2.5} dot={{ r: 4, fill: COLORES.primarioOscuro }} name="Asistencia" />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              )}
            </Box>
          </Box>

          {historial.length > 0 && (
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}` }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: COLORES.textoPrimario }}>Reportes recientes</Typography>
                <Button endIcon={<ChevronRight size={16} />} sx={{ textTransform: "none", fontSize: 12, fontWeight: 600, color: COLORES.primarioOscuro, "&:hover": { background: "transparent", color: COLORES.primario } }}>Ver todos →</Button>
              </Box>
              <DataTable rows={historial} columns={[
                { field: "tipo_reporte", headerName: "Reporte", width: 180 },
                { field: "usuario_nombre", headerName: "Usuario", width: 150 },
                { field: "fecha_generacion", headerName: "Fecha y hora", width: 150, valueFormatter: v => v ? `${new Date(v).toLocaleDateString("es-CO")} · ${new Date(v).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}` : "—" },
                { field: "formato", headerName: "Formato", width: 100, renderCell: p => { const c = { PDF: { bg: COLORES.dangerFondo, color: COLORES.dangerOscuro }, Excel: { bg: COLORES.successFondo, color: COLORES.verdeTexto }, Pantalla: { bg: COLORES.fondoGris2, color: COLORES.textoSecundario } }; const cl = c[p.value] || c.Pantalla; return <Chip label={p.value || "Pantalla"} size="small" sx={{ fontWeight: 600, fontSize: 11, background: cl.bg, color: cl.color, borderRadius: "8px" }} />; } },
                { field: "acciones", headerName: "Acciones", width: 100, sortable: false, renderCell: ({ row }) => {
                  const estiloBtn = { width: 30, height: 30, borderRadius: "8px", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all .2s ease" };
                  const key = NOMBRES_REV[row.tipo_reporte];
                  return (
                    <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                      <Box sx={{ ...estiloBtn, bgcolor: COLORES.primarioClaro, color: COLORES.primario, "&:hover": { bgcolor: COLORES.primarioClaro2 } }} title="Ver reporte"
                        onClick={(e) => { e.stopPropagation(); if (key) { let filtros = row.filtros; try { filtros = typeof filtros === "string" ? JSON.parse(filtros) : filtros; } catch {} setFiltrosIniciales(filtros || {}); setTipoActivo(key); } }}>
                        <Eye size={14} />
                      </Box>
                      <Box sx={{ ...estiloBtn, bgcolor: COLORES.primarioClaro, color: COLORES.primario, "&:hover": { bgcolor: COLORES.primarioClaro2 } }} title="Descargar"
                        onClick={(e) => { e.stopPropagation(); if (key) { let filtros = row.filtros; try { filtros = typeof filtros === "string" ? JSON.parse(filtros) : filtros; } catch {} handlePDF(key, filtros || {}); } }}>
                        <Download size={14} />
                      </Box>
                    </Box>
                  );
                } },
              ]} entityLabel="reportes" getRowId={r => r.id} pageSize={5} />
            </Paper>
          )}
        </>
      )}
    </Box>

      <Dialog open={!!pdfPreview} onClose={() => setPdfPreview(null)} maxWidth="xl" fullWidth slotProps={{ paper: { sx: { borderRadius: "16px", height: "95vh", maxWidth: "95vw" } } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, px: 2.5 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario }}>Vista previa</Typography>
          <IconButton aria-label="Cerrar vista previa PDF" onClick={() => setPdfPreview(null)} sx={{ color: COLORES.textoTerciario }}><X size={20} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: "calc(95vh - 64px)" }}>
          {pdfPreview && (
            <iframe src={pdfPreview} style={{ width: "100%", height: "100%", border: "none" }} title="Vista previa PDF" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
