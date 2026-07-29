import { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, Chip, Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import { ChevronRight, FileText, Eye, Download, X } from "lucide-react";
import { exportarExcel } from "../../../shared/utils/exportarExcel";
import Loading from "../../../shared/components/Loading";
import DataTable from "../../../shared/components/DataTable";
import ReporteView from "../components/ReporteView";
import { obtenerIndicadores, obtenerTendencia, obtenerReporteAsistencia, obtenerReporteIncidencias, obtenerReporteTardanzas, obtenerReporteAusencias, obtenerReporteEmpleados, obtenerReporteMarcaciones, obtenerReportePorEmpleado, guardarHistorial, obtenerHistorial } from "../reportes.api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MESES = [
  {v:1,l:"Enero"},{v:2,l:"Febrero"},{v:3,l:"Marzo"},{v:4,l:"Abril"},{v:5,l:"Mayo"},{v:6,l:"Junio"},
  {v:7,l:"Julio"},{v:8,l:"Agosto"},{v:9,l:"Septiembre"},{v:10,l:"Octubre"},{v:11,l:"Noviembre"},{v:12,l:"Diciembre"},
];

const CARD_DATA = [
  { id: "porEmpleado", icon: "👤", titulo: "Reporte por Empleado", desc: "Resumen mensual de asistencia, tardanzas, ausencias y horas de un empleado.", color: "#0D9488" },
  { id: "asistencia", icon: "📊", titulo: "Reporte de Asistencia", desc: "Resumen de asistencia de los empleados por fechas.", color: "#2E7D32" },
  { id: "incidencias", icon: "📄", titulo: "Reporte de Incidencias", desc: "Incidencias registradas y su estado actual.", color: "#DC2626" },
  { id: "tardanzas", icon: "⏰", titulo: "Reporte de Tardanzas", desc: "Tardanzas registradas por los empleados.", color: "#D97706" },
  { id: "ausencias", icon: "🚫", titulo: "Reporte de Ausencias", desc: "Ausencias y novedades registradas.", color: "#0891B2" },
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

const API_FNS = { obtenerReporteAsistencia, obtenerReporteIncidencias, obtenerReporteTardanzas, obtenerReporteAusencias, obtenerReporteEmpleados, obtenerReporteMarcaciones, obtenerReportePorEmpleado };
const NOMBRES = { porEmpleado: "Reporte por Empleado", asistencia: "Reporte de Asistencia", incidencias: "Reporte de Incidencias", tardanzas: "Reporte de Tardanzas", ausencias: "Reporte de Ausencias", empleados: "Reporte de Empleados", marcaciones: "Reporte de Marcaciones" };
const NOMBRES_REV = Object.fromEntries(Object.entries(NOMBRES).map(([k, v]) => [v, k]));

export default function ReportesPage() {
  const [tipoActivo, setTipoActivo] = useState(null);
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

  const buildPdfUrl = (tipo, f) => {
    const p = new URLSearchParams();
    const token = localStorage.getItem("token");
    if (token) p.append("token", token);
    if (f.fecha_desde) p.append("fecha_desde", f.fecha_desde);
    if (f.fecha_hasta) p.append("fecha_hasta", f.fecha_hasta);
    if (f.empleado_id) p.append("empleado_id", f.empleado_id);
    if (f.area_id) p.append("area_id", f.area_id);
    if (f.cargo_id) p.append("cargo_id", f.cargo_id);
    if (f.estado) p.append("estado", f.estado);
    if (f.estado_incidencia) p.append("estado", f.estado_incidencia);
    if (f.tipo_incidencia) p.append("tipo", f.tipo_incidencia);
    if (f.estado_empleado) p.append("activo", f.estado_empleado);
    if (f.mes) p.append("mes", f.mes);
    if (f.anio) p.append("anio", f.anio);
    return `/api/pdf/${tipo}?${p.toString()}`;
  };

  const handlePDF = (tipo, f) => {
    if (tipo === "porEmpleado") return; // endpoint aún no implementado
    const url = buildPdfUrl(tipo, f);
    setPdfPreview(url);
    guardarHistorial({ tipo_reporte: NOMBRES[tipo], formato: "PDF", filtros: f, total_registros: 0 }).catch(() => {});
  };

  const handleExcel = (tipo, registros) => {
    if (!registros?.length) return;
    let datos = registros;
    if (tipo === "incidencias") {
      const ESTADO_MAPA = { pendiente: "Pendiente", aprobado: "Aprobado", rechazado: "Rechazado" };
      datos = registros.map(r => ({
        ID: r.id, Empleado: r.empleado, Cédula: r.cedula, Área: r.area,
        Tipo: r.tipo, Descripción: r.descripcion, Fecha: r.fecha,
        Estado: ESTADO_MAPA[r.estado] || r.estado, Motivo: r.motivo_rechazo || "",
      }));
    } else if (tipo === "porEmpleado") {
      // Exporta el detalle diario más el resumen como primeras filas
      const { empleado, periodo, resumen, permisos, incidencias, detalle } = registros;
      if (detalle?.length) {
        datos = [
          { "": `Reporte: ${empleado?.nombre} ${empleado?.apellido || ""}`, "": "", "": "", "": "", "": "", "": "" },
          { "": `Periodo: ${MESES.find(m=>m.v===periodo?.mes)?.l || ""} ${periodo?.anio || ""}`, "": "", "": "", "": "", "": "", "": "" },
          { "": "", "": "", "": "", "": "", "": "", "": "" },
          { "Días hábiles": periodo?.diasHabiles||0, "Festivos": periodo?.festivos||0, "Asistencia %": `${resumen?.porcentaje_asistencia||0}%`, "Puntuales": resumen?.puntuales||0, "Tardanzas": resumen?.tardanzas||0, "Ausentes": resumen?.ausentes||0, "Horas total": resumen?.horas_trabajadas||0, "Horas extra": resumen?.horas_extra||0, "Permisos": permisos?.total||0, "Incidencias": incidencias?.total||0 },
          { "": "", "": "", "": "", "": "", "": "", "": "" },
          ...detalle.map(d => ({
            Fecha: d.fecha ? new Date(d.fecha).toLocaleDateString("es-CO") : "—",
            "Ent. Mañana": d.entrada1||"—",
            "Sal. Mañana": d.salida1||"—",
            "Ent. Tarde": d.entrada2||"—",
            "Sal. Tarde": d.salida2||"—",
            Horas: d.horas_trabajadas ? `${d.horas_trabajadas}h` : "—",
            Estado: d.estado||"—",
            Festivo: d.esFestivo ? "Sí" : "No",
          })),
        ];
      } else {
        datos = [{ "": "No hay detalle diario disponible para este período." }];
      }
    }
    exportarExcel(datos, (NOMBRES[tipo] || tipo).replace(/\s+/g, "_"));
    guardarHistorial({ tipo_reporte: NOMBRES[tipo], formato: "Excel", filtros: {}, total_registros: registros.length }).catch(() => {});
  };

  if (cargando) return <Loading texto="Cargando centro de reportes..." />;

  return (
    <>
    <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>
                Inicio / Operación / Incidencias
      </Typography>

      {tipoActivo ? (
        <ReporteView tipoReporte={tipoActivo} apiFns={API_FNS} filtrosIniciales={filtrosIniciales} onVolver={() => { setTipoActivo(null); setFiltrosIniciales(null); }} onExportarPDF={handlePDF} onExportarExcel={handleExcel} />
      ) : (
        <>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #ECECEC" }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#111827", mb: 2 }}></Typography>
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
                { field: "acciones", headerName: "Acciones", width: 100, sortable: false, renderCell: ({ row }) => {
                  const estiloBtn = { width: 30, height: 30, borderRadius: "8px", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all .2s ease" };
                  const key = NOMBRES_REV[row.tipo_reporte];
                  return (
                    <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                      <Box sx={{ ...estiloBtn, bgcolor: "#EFF6FF", color: "#1565C0", "&:hover": { bgcolor: "#DBEAFE" } }} title="Ver reporte"
                        onClick={(e) => { e.stopPropagation(); if (key) { let filtros = row.filtros; try { filtros = typeof filtros === "string" ? JSON.parse(filtros) : filtros; } catch {} setFiltrosIniciales(filtros || {}); setTipoActivo(key); } }}>
                        <Eye size={14} />
                      </Box>
                      <Box sx={{ ...estiloBtn, bgcolor: "#E8F5E9", color: "#2E7D32", "&:hover": { bgcolor: "#C8E6C9" } }} title="Descargar"
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

      <Dialog open={!!pdfPreview} onClose={() => setPdfPreview(null)} maxWidth="xl" fullWidth PaperProps={{ sx: { borderRadius: "16px", height: "95vh", maxWidth: "95vw" } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, px: 2.5 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Vista previa</Typography>
          <IconButton onClick={() => setPdfPreview(null)} sx={{ color: "#6B7280" }}><X size={20} /></IconButton>
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
