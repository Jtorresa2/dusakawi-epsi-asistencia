import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import {
  ChevronRight,
  FileText,
  Eye,
  Download,
  X,
  Users,
  CheckCircle2,
  Clock,
  UserX,
  Building2,
  MapPin,
  ClipboardCheck,
  TrendingUp,
  History,
  ArrowRight,
  User,
} from "lucide-react";
import Loading from "../../../shared/components/Loading";
import DataTable from "../../../shared/components/DataTable";
import ReporteView from "../components/ReporteView";
import {
  obtenerIndicadores,
  obtenerTendencia,
  obtenerReporteAsistencia,
  obtenerReporteTardanzas,
  obtenerReporteAusencias,
  obtenerReportePorAreas,
  obtenerReporteMarcaciones,
  obtenerReportePorEmpleado,
  obtenerHistorial,
} from "../reportes.api";
import { exportarPDF, handleExcel, NOMBRES } from "../reportes.export";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { COLORES } from "../../../shared/constants/colores.js";

const CARD_DATA = [
  {
    id: "porEmpleado",
    icon: User,
    titulo: "Reporte por Empleado",
    desc: "Resumen mensual de asistencia, puntualidad, tardanzas, ausencias y horas trabajadas de un funcionario específico.",
    color: COLORES.verdeTexto,
    bg: COLORES.successClaro,
  },
  {
    id: "asistencia",
    icon: ClipboardCheck,
    titulo: "Reporte de Asistencia",
    desc: "Consolidado detallado de cumplimiento de jornada, registros de entrada y salida filtrados por fechas y dependencias.",
    color: COLORES.primarioOscuro,
    bg: COLORES.primarioClaro,
  },
  {
    id: "tardanzas",
    icon: Clock,
    titulo: "Reporte de Tardanzas",
    desc: "Acumulado de minutos y frecuencias de retraso en ingresos de mañana y tarde con identificación de reincidencias.",
    color: COLORES.warningOscuro,
    bg: COLORES.warningFondo,
  },
  {
    id: "ausencias",
    icon: UserX,
    titulo: "Reporte de Ausencias",
    desc: "Registro de inasistencias laborales, novedades y justificaciones del personal en el período seleccionado.",
    color: COLORES.danger,
    bg: COLORES.dangerFondo,
  },
  {
    id: "porAreas",
    icon: Building2,
    titulo: "Reporte por Áreas",
    desc: "Métricas organizacionales por dependencia: días laborados, porcentaje de puntualidad y balance de horas efectivas.",
    color: COLORES.primarioOscuro,
    bg: COLORES.primarioClaro,
  },
  {
    id: "marcaciones",
    icon: MapPin,
    titulo: "Reporte de Marcaciones",
    desc: "Trazabilidad completa y auditoría de todas las marcaciones registradas en los dispositivos biométricos.",
    color: COLORES.primario,
    bg: COLORES.primarioClaro2,
  },
];

const IND_META = [
  { key: "empleados_activos", icon: Users, label: "Empleados activos", color: COLORES.primarioOscuro, bg: COLORES.successClaro },
  { key: "asistencia_mes", icon: CheckCircle2, label: "Asistencia del mes", color: COLORES.primarioOscuro, bg: COLORES.primarioClaro, isPercent: true },
  { key: "tardanzas_mes", icon: Clock, label: "Tardanzas del mes", color: COLORES.warningOscuro, bg: COLORES.warningFondo },
  { key: "ausencias_mes", icon: UserX, label: "Ausencias del mes", color: COLORES.danger, bg: COLORES.dangerFondo },
  { key: "reportes_mes", icon: FileText, label: "Reportes generados", color: COLORES.primario, bg: COLORES.primarioClaro },
];

const API_FNS = {
  obtenerReporteAsistencia,
  obtenerReporteTardanzas,
  obtenerReporteAusencias,
  obtenerReportePorAreas,
  obtenerReporteMarcaciones,
  obtenerReportePorEmpleado,
};
const NOMBRES_REV = Object.fromEntries(Object.entries(NOMBRES).map(([k, v]) => [v, k]));

export default function ReportesPage() {
  const [searchParams] = useSearchParams();
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
      .then(([ind, ten, his]) => {
        setIndicadores(ind);
        setTendencia(ten.tendencia || []);
        setHistorial(his.historial || []);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const handlePDF = (tipo, f) => exportarPDF(tipo, f, setPdfPreview);

  if (cargando) return <Loading texto="Cargando centro de reportes..." />;

  return (
    <>
      <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Breadcrumb y Encabezado */}
        <Box>
          <Typography sx={{ fontSize: 13, color: COLORES.textoMuted, mb: 0.5 }}>
            Inicio / Gestión de reportes / Centro de reportes
          </Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: COLORES.textoPrimario }}>
            Centro de Reportes y Análisis
          </Typography>
          <Typography sx={{ fontSize: 13, color: COLORES.textoTerciario, mt: 0.3 }}>
            Genera, consulta y exporta consolidados institucionales de asistencia, puntualidad y cumplimiento.
          </Typography>
        </Box>

        {tipoActivo ? (
          <ReporteView
            tipoReporte={tipoActivo}
            apiFns={API_FNS}
            filtrosIniciales={filtrosIniciales}
            onVolver={() => {
              setTipoActivo(null);
              setFiltrosIniciales(null);
            }}
            onExportarPDF={handlePDF}
            onExportarExcel={handleExcel}
          />
        ) : (
          <>
            {/* 1. RESUMEN DE INDICADORES (A ancho completo sin huecos) */}
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario, mb: 1.5 }}>
                Resumen de Indicadores
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                    lg: "repeat(5, 1fr)",
                  },
                  gap: 2,
                }}
              >
                {IND_META.map((m) => {
                  const item = indicadores?.[m.key] || { valor: 0, variacion: 0 };
                  const v = Number(item.variacion) || 0;
                  const IconComponent = m.icon;
                  const isNegativeBad = m.key === "tardanzas_mes" || m.key === "ausencias_mes";
                  return (
                    <Paper
                      key={m.key}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: "16px",
                        border: `1px solid ${COLORES.grisContorno}`,
                        bgcolor: COLORES.fondoBlanco,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: 1.5,
                        transition: "all .2s ease",
                        "&:hover": {
                          boxShadow: "0 6px 18px rgba(0,0,0,.04)",
                          borderColor: COLORES.borde2,
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: "10px",
                            bgcolor: m.bg,
                            color: m.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <IconComponent size={19} />
                        </Box>
                        {v !== 0 && (
                          <Chip
                            label={`${v > 0 ? "+" : ""}${v}${m.isPercent ? "%" : ""}`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: 10.5,
                              fontWeight: 700,
                              bgcolor:
                                v > 0
                                  ? isNegativeBad
                                    ? COLORES.dangerFondo
                                    : COLORES.successFondo
                                  : isNegativeBad
                                  ? COLORES.successFondo
                                  : COLORES.dangerFondo,
                              color:
                                v > 0
                                  ? isNegativeBad
                                    ? COLORES.danger
                                    : COLORES.verdeTexto
                                  : isNegativeBad
                                  ? COLORES.verdeTexto
                                  : COLORES.danger,
                            }}
                          />
                        )}
                      </Box>

                      <Box>
                        <Typography sx={{ fontSize: 24, fontWeight: 700, color: COLORES.textoPrimario, lineHeight: 1.1 }}>
                          {item.valor}
                          {m.isPercent ? "%" : ""}
                        </Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 500, color: COLORES.textoSuave, mt: 0.5 }}>
                          {m.label}
                        </Typography>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            </Box>

            {/* 2. TENDENCIA DE ASISTENCIA (Solo si existen datos, sin dejar huecos laterales) */}
            {tendencia.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "16px",
                  border: `1px solid ${COLORES.grisContorno}`,
                  bgcolor: COLORES.fondoBlanco,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <TrendingUp size={18} color={COLORES.primarioOscuro} />
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario }}>
                    Tendencia de Asistencia (Últimos 6 meses)
                  </Typography>
                </Box>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={tendencia}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORES.fondoGris2} />
                    <XAxis
                      dataKey="mes"
                      tick={{ fontSize: 11, fill: COLORES.textoSuave }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: COLORES.textoSuave }}
                      axisLine={false}
                      tickLine={false}
                      unit="%"
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: `1px solid ${COLORES.borde}`,
                        fontSize: 12,
                      }}
                      formatter={(v) => `${v}%`}
                    />
                    <Line
                      type="monotone"
                      dataKey="porcentaje"
                      stroke={COLORES.primarioOscuro}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: COLORES.primarioOscuro }}
                      name="Asistencia"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            )}

            {/* 3. TIPOS DE REPORTE (Grid uniforme de 6 tarjetas) */}
            <Box>
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: COLORES.textoPrimario }}>
                  Tipos de Reporte
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: COLORES.textoSuave }}>
                  Selecciona el informe que deseas consultar, filtrar o exportar
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                  gap: 2,
                }}
              >
                {CARD_DATA.map((r) => {
                  const IconComponent = r.icon;
                  return (
                    <Paper
                      key={r.id}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: "16px",
                        border: `1px solid ${COLORES.grisContorno}`,
                        bgcolor: COLORES.fondoBlanco,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        transition: "all .2s ease",
                        "&:hover": {
                          transform: "translateY(-3px)",
                          boxShadow: "0 8px 24px rgba(0,0,0,.06)",
                          borderColor: COLORES.borde2,
                        },
                      }}
                    >
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                          <Box
                            sx={{
                              width: 42,
                              height: 42,
                              borderRadius: "12px",
                              bgcolor: r.bg,
                              color: r.color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <IconComponent size={20} />
                          </Box>
                          <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario }}>
                            {r.titulo}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: 12.5, color: COLORES.textoTerciario, lineHeight: 1.5, mb: 2.5 }}>
                          {r.desc}
                        </Typography>
                      </Box>

                      <Button
                        variant="contained"
                        endIcon={<ArrowRight size={15} />}
                        onClick={() => setTipoActivo(r.id)}
                        sx={{
                          borderRadius: "10px",
                          textTransform: "none",
                          fontSize: 12.5,
                          fontWeight: 600,
                          py: 1,
                          bgcolor: COLORES.primarioOscuro,
                          "&:hover": { bgcolor: COLORES.primario },
                        }}
                      >
                        Generar reporte
                      </Button>
                    </Paper>
                  );
                })}
              </Box>
            </Box>

            {/* 4. HISTORIAL DE REPORTES GENERADOS */}
            {historial.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "16px",
                  border: `1px solid ${COLORES.grisContorno}`,
                  bgcolor: COLORES.fondoBlanco,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <History size={18} color={COLORES.primarioOscuro} />
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario }}>
                    Historial de Reportes Generados
                  </Typography>
                </Box>
                <DataTable
                  rows={historial}
                  columns={[
                    { field: "tipo_reporte", headerName: "Reporte", width: 220 },
                    { field: "usuario_nombre", headerName: "Usuario", width: 170 },
                    {
                      field: "fecha_generacion",
                      headerName: "Fecha y hora",
                      width: 170,
                      valueFormatter: (v) =>
                        v
                          ? `${new Date(v).toLocaleDateString("es-CO")} · ${new Date(v).toLocaleTimeString("es-CO", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          : "—",
                    },
                    {
                      field: "formato",
                      headerName: "Formato",
                      width: 110,
                      renderCell: (p) => {
                        const c = {
                          PDF: { bg: COLORES.dangerFondo, color: COLORES.dangerOscuro },
                          Excel: { bg: COLORES.successFondo, color: COLORES.verdeTexto },
                          Pantalla: { bg: COLORES.fondoGris2, color: COLORES.textoSecundario },
                        };
                        const cl = c[p.value] || c.Pantalla;
                        return (
                          <Chip
                            label={p.value || "Pantalla"}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: 11,
                              background: cl.bg,
                              color: cl.color,
                              borderRadius: "8px",
                            }}
                          />
                        );
                      },
                    },
                    {
                      field: "acciones",
                      headerName: "Acciones",
                      width: 110,
                      sortable: false,
                      renderCell: ({ row }) => {
                        const estiloBtn = {
                          width: 32,
                          height: 32,
                          borderRadius: "8px",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          flexShrink: 0,
                          transition: "all .2s ease",
                        };
                        const key = NOMBRES_REV[row.tipo_reporte];
                        return (
                          <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
                            <Box
                              sx={{
                                ...estiloBtn,
                                bgcolor: COLORES.primarioClaro,
                                color: COLORES.primarioOscuro,
                                "&:hover": { bgcolor: COLORES.primarioClaro2 },
                              }}
                              title="Ver reporte"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (key) {
                                  let filtros = row.filtros;
                                  try {
                                    filtros = typeof filtros === "string" ? JSON.parse(filtros) : filtros;
                                  } catch {}
                                  setFiltrosIniciales(filtros || {});
                                  setTipoActivo(key);
                                }
                              }}
                            >
                              <Eye size={15} />
                            </Box>
                            <Box
                              sx={{
                                ...estiloBtn,
                                bgcolor: COLORES.primarioClaro,
                                color: COLORES.primarioOscuro,
                                "&:hover": { bgcolor: COLORES.primarioClaro2 },
                              }}
                              title="Descargar PDF"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (key) {
                                  let filtros = row.filtros;
                                  try {
                                    filtros = typeof filtros === "string" ? JSON.parse(filtros) : filtros;
                                  } catch {}
                                  handlePDF(key, filtros || {});
                                }
                              }}
                            >
                              <Download size={15} />
                            </Box>
                          </Box>
                        );
                      },
                    },
                  ]}
                  entityLabel="reportes"
                  getRowId={(r) => r.id}
                  pageSize={5}
                />
              </Paper>
            )}
          </>
        )}
      </Box>

      {/* MODAL DE PREVISUALIZACIÓN DE PDF */}
      <Dialog
        open={!!pdfPreview}
        onClose={() => setPdfPreview(null)}
        maxWidth="xl"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: "16px", height: "95vh", maxWidth: "95vw" },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 1.5,
            px: 2.5,
            borderBottom: `1px solid ${COLORES.borde}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FileText size={18} color={COLORES.danger} />
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario }}>
              Vista previa del reporte en PDF
            </Typography>
          </Box>
          <IconButton onClick={() => setPdfPreview(null)} size="small">
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: "100%", bgcolor: COLORES.fondoGris }}>
          {pdfPreview && (
            <iframe
              src={pdfPreview}
              title="Vista previa PDF"
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
