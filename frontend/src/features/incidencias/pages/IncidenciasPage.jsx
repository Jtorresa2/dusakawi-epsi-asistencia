import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, TextField, Select, MenuItem,
  Menu, Avatar, FormControl, Tabs, Tab, Popover,
} from "@mui/material";
import {
  AlertTriangle, CheckCircle, XCircle, Clock, Search, Download, FileText,
  Eye, ChevronRight, Filter, X, AlertOctagon, Zap, ArrowRight,
} from "lucide-react";
import * as XLSX from "xlsx";
import { obtenerIncidencias, obtenerStatsIncidencias, obtenerActividadIncidencias } from "../incidencia.api";
import { obtenerAreas } from "../../areas/area.api";
import Loading from "../../../shared/components/Loading";
import PDFPreviewModal from "../../../shared/components/PDFPreviewModal";

const TIPOS = { falla_biometrica: "Falla biométrica", tardanza_justificada: "Tardanza justificada", otro: "Otro" };
const ESTADO_STYLES = {
  pendiente: { bg: "#FEF3C7", color: "#92400E", label: "Pendiente" },
  en_revision: { bg: "#EFF6FF", color: "#1565C0", label: "En revisión" },
  aprobado: { bg: "#D1FAE5", color: "#065F46", label: "Aprobada" },
  rechazado: { bg: "#FEE2E2", color: "#991B1B", label: "Rechazada" },
};
const PRIORIDAD_STYLES = {
  alta: { bg: "#FEE2E2", color: "#991B1B", label: "Alta" },
  media: { bg: "#FEF3C7", color: "#92400E", label: "Media" },
  baja: { bg: "#F3F4F6", color: "#6B7280", label: "Baja" },
};
const TIPO_OPTIONS = Object.entries(TIPOS);
const TAB_MAP = ["", "aprobado", "rechazado"];

const STAT_CARDS = [
  { key: "pendientes", label: "Incidencias pendientes", icon: <Clock size={22} />, color: "#D97706", bg: "#FEF3C7" },
  { key: "aprobadas", label: "Incidencias aprobadas", icon: <CheckCircle size={22} />, color: "#16A34A", bg: "#D1FAE5" },
  { key: "rechazadas", label: "Incidencias rechazadas", icon: <XCircle size={22} />, color: "#DC2626", bg: "#FEE2E2" },
  { key: "total", label: "Total registradas", icon: <AlertTriangle size={22} />, color: "#1565C0", bg: "#EFF6FF" },
];

function formatFecha(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

function formatHora(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

export default function IncidenciasPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pendientes: 0, aprobadas: 0, rechazadas: 0 });
  const [incidencias, setIncidencias] = useState([]);
  const [actividad, setActividad] = useState([]);
  const [areas, setAreas] = useState([]);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [exportAnchor, setExportAnchor] = useState(null);
  const [fechaAnchor, setFechaAnchor] = useState(null);
  const [masFiltrosAnchor, setMasFiltrosAnchor] = useState(null);
  const [tabEstado, setTabEstado] = useState(0);

  const [filtros, setFiltros] = useState({
    busqueda: "", estado: "", tipo: "", prioridad: "", area_id: "",
    fecha_desde: "", fecha_hasta: "",
  });

  const cargarTodo = async (f) => {
    try {
      setLoading(true);
      const [statsRes, incidenciasRes, actividadRes] = await Promise.all([
        obtenerStatsIncidencias(),
        obtenerIncidencias(f),
        obtenerActividadIncidencias(),
      ]);
      setStats(statsRes);
      setIncidencias(Array.isArray(incidenciasRes) ? incidenciasRes : []);
      setActividad(Array.isArray(actividadRes) ? actividadRes : []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    obtenerAreas().then(setAreas).catch(() => setAreas([]));
  }, []);

  const montado = useRef(false);
  const bandejaRef = useRef(null);
  const solicitudesRef = useRef(null);

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  useEffect(() => {
    if (!montado.current) { montado.current = true; cargarTodo(filtros); return; }
    const timer = setTimeout(() => cargarTodo(filtros), 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  const handleChangeFiltro = (key, val) => {
    setFiltros((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "estado") {
        const idx = TAB_MAP.indexOf(val);
        if (idx !== tabEstado) setTabEstado(idx >= 0 ? idx : 0);
      }
      return next;
    });
  };

  const handleTabChange = (_, newValue) => {
    setTabEstado(newValue);
    setFiltros((prev) => ({ ...prev, estado: TAB_MAP[newValue] }));
  };

  const limpiarFiltros = () => {
    setFiltros({ busqueda: "", estado: "", tipo: "", prioridad: "", area_id: "", fecha_desde: "", fecha_hasta: "" });
    setTabEstado(0);
    setMasFiltrosAnchor(null);
    setFechaAnchor(null);
  };

  const contarActivos = () => {
    let n = 0;
    if (filtros.tipo) n++;
    if (filtros.area_id) n++;
    if (filtros.prioridad) n++;
    if (filtros.fecha_desde || filtros.fecha_hasta) n++;
    if (filtros.busqueda) n++;
    return n;
  };

  function exportarExcel() {
    setExportAnchor(null);
    const data = incidencias.map((r, i) => ({
      "#": i + 1,
      Código: r.id,
      Empleado: `${r.empleado_nombre || ""} ${r.apellido || ""}`.trim(),
      Tipo: TIPOS[r.tipo] || r.tipo,
      Fecha: r.fecha ? r.fecha.split("T")[0] : "",
      Estado: r.estado || "",
      Prioridad: r.prioridad || "—",
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Incidencias");
    XLSX.writeFile(wb, `Incidencias_${new Date().toISOString().split("T")[0]}.xlsx`);
  }

  function exportarPDF() { setExportAnchor(null); window.open("/api/pdf/incidencias", "_blank"); }
  function vistaPreviaPDF() { setExportAnchor(null); setPdfPreviewUrl("/api/pdf/incidencias?preview=1"); }

  const total = Number(stats.pendientes) + Number(stats.aprobadas) + Number(stats.rechazadas);
  const filtrosActivos = contarActivos();
  const alertasAltas = incidencias.filter((i) => i.prioridad === "alta" && i.estado !== "aprobado" && i.estado !== "rechazado");
  const solicitudesPendientes = incidencias.filter((i) => i.estado === "pendiente" || i.estado === "en_revision");
  const incidenciasBandeja = incidencias.filter((i) => i.estado === "aprobado" || i.estado === "rechazado");

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>
          Inicio / Gestión / Incidencias
      </Typography>

      {/* STAT CARDS */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
        {STAT_CARDS.map((card) => {
          const valor = card.key === "total" ? total : (Number(stats[card.key]) || 0);
          return (
            <Paper key={card.key} elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid #ECECEC", display: "flex", alignItems: "center", gap: 1.5, transition: "all .25s ease", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 15px rgba(0,0,0,.06)" } }}>
              <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>
                {card.icon}
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.03em" }}>{card.label}</Typography>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: card.color, lineHeight: 1.2 }}>{valor}</Typography>
              </Box>
            </Paper>
          );
        })}
      </Box>

      {/* GRID PRINCIPAL: BANDEJA + INFO */}
      <Box ref={bandejaRef} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "3fr 1.2fr" }, gap: 2.5, alignItems: "start" }}>
        {/* LEFT: Bandeja + Solicitudes */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Paper elevation={0} sx={{ borderRadius: "16px", border: "1px solid #ECECEC", overflow: "hidden" }}>
        {/* PESTAÑAS */}
        <Box sx={{ borderBottom: "1px solid #ECECEC", px: 1 }}>
          <Tabs value={tabEstado} onChange={handleTabChange} variant="scrollable" scrollButtons={false}
            sx={{
              minHeight: 38,
              "& .MuiTab-root": { minHeight: 38, py: 0.5, px: 2, fontSize: 12, fontWeight: 600, color: "#6B7280", textTransform: "none", "&.Mui-selected": { color: "#1B5E20" } },
              "& .MuiTabs-indicator": { bgcolor: "#1B5E20", height: 2.5, borderRadius: "4px 4px 0 0" },
            }}>
            <Tab label="Todas" />
            <Tab label="Aprobadas" />
            <Tab label="Rechazadas" />
          </Tabs>
        </Box>

        {/* BARRA DE FILTROS — inline con Más para chips */}
        <Box sx={{ px: 2, py: 1, borderBottom: "1px solid #ECECEC", display: "flex", gap: 1, alignItems: "center", flexWrap: "nowrap", overflowX: "auto" }}>
          <Button onClick={(e) => setFechaAnchor(e.currentTarget)}
            sx={{ borderRadius: "8px", textTransform: "none", fontSize: 12, fontWeight: 500, height: 30, px: 1.5, color: filtros.fecha_desde || filtros.fecha_hasta ? "#1B5E20" : "#6B7280", border: "1px solid #E5E7EB", bgcolor: "#fff", whiteSpace: "nowrap", flexShrink: 0, minWidth: 60, justifyContent: "center", "&:hover": { borderColor: "#1B5E20", color: "#1B5E20" } }}>
            📅 Fecha
          </Button>

          <FormControl size="small" sx={{ flexShrink: 0, width: 120, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12, height: 30, bgcolor: "#fff" } }}>
            <Select value={filtros.tipo} displayEmpty onChange={(e) => handleChangeFiltro("tipo", e.target.value)}
              renderValue={(v) => v ? TIPOS[v] : "Tipo"}
              sx={{ fontSize: 12, "& .MuiSelect-select": { py: "3px 6px" } }}>
              <MenuItem value=""><em>Todos</em></MenuItem>
              {TIPO_OPTIONS.map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ flexShrink: 0, width: 130, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12, height: 30, bgcolor: "#fff" } }}>
            <Select value={filtros.area_id} displayEmpty onChange={(e) => handleChangeFiltro("area_id", e.target.value)}
              renderValue={(v) => v ? (areas.find((a) => String(a.id) === v)?.nombre || "Área") : "Área"}
              sx={{ fontSize: 12, "& .MuiSelect-select": { py: "3px 6px" } }}>
              <MenuItem value=""><em>Todas</em></MenuItem>
              {areas.map((a) => <MenuItem key={a.id} value={String(a.id)}>{a.nombre}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ flexShrink: 0, width: 110, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12, height: 30, bgcolor: "#fff" } }}>
            <Select value={filtros.prioridad} displayEmpty onChange={(e) => handleChangeFiltro("prioridad", e.target.value)}
              renderValue={(v) => v ? PRIORIDAD_STYLES[v]?.label : "Prioridad"}
              sx={{ fontSize: 12, "& .MuiSelect-select": { py: "3px 6px" } }}>
              <MenuItem value=""><em>Todas</em></MenuItem>
              {Object.entries(PRIORIDAD_STYLES).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
            </Select>
          </FormControl>

          <TextField size="small" placeholder="Buscar..." value={filtros.busqueda}
            onChange={(e) => handleChangeFiltro("busqueda", e.target.value)}
            sx={{ flex: "0 0 auto", width: 130, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12, height: 30, bgcolor: "#fff" }, "& .MuiOutlinedInput-input": { py: "3px 6px" } }}
            slotProps={{ input: { startAdornment: <Search size={13} style={{ color: "#9CA3AF", marginRight: 4 }} /> } }} />

          <Button onClick={(e) => setMasFiltrosAnchor(e.currentTarget)}
            sx={{ borderRadius: "8px", textTransform: "none", fontSize: 11, fontWeight: 600, height: 30, minWidth: 30, width: 30, px: 0, color: "#6B7280", border: "1px solid #E5E7EB", bgcolor: "#fff", flexShrink: 0, "&:hover": { borderColor: "#1B5E20", color: "#1B5E20", bgcolor: "#F9FAFB" } }}>
            <Filter size={13} />
            {filtrosActivos > 0 && (
              <Chip label={filtrosActivos} size="small" sx={{ position: "absolute", top: -6, right: -6, height: 16, minWidth: 16, fontSize: 9, fontWeight: 700, bgcolor: "#1B5E20", color: "#fff", borderRadius: "50%", "& .MuiChip-label": { px: 0.2 } }} />
            )}
          </Button>
        </Box>

        {/* HEADER BANDEJA + EXPORT */}
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid #ECECEC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
            Bandeja de incidencias
            <Typography component="span" sx={{ fontSize: 12, color: "#9CA3AF", ml: 1, fontWeight: 400 }}>({incidenciasBandeja.length} decisiones)</Typography>
          </Typography>
          <Button variant="outlined" startIcon={<Download size={16} />} onClick={(e) => setExportAnchor(e.currentTarget)}
            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, fontSize: 12, height: 34, px: 2, color: "#6B7280", borderColor: "#E5E7EB", "&:hover": { borderColor: "#1B5E20", color: "#1B5E20", bgcolor: "#F9FAFB" } }}>
            Exportar
          </Button>
        </Box>

        {/* TABLA BANDEJA */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><Loading texto="Cargando incidencias..." /></Box>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  {["Empleado", "Tipo", "Fecha", "Estado", "Prioridad", "Acciones"].map((h) => (
                    <TableCell key={h} sx={{
                      fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", borderBottom: "1px solid #F3F4F6", py: 1.5, whiteSpace: "nowrap",
                      display: h === "Tipo" ? { xs: "none", md: "table-cell" } : h === "Prioridad" ? { xs: "none", sm: "table-cell" } : h === "Acciones" ? { xs: "none", sm: "table-cell" } : undefined,
                    }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {incidenciasBandeja.length === 0 ? (
                  <TableRow><TableCell colSpan={6} sx={{ textAlign: "center", py: 6, color: "#9CA3AF", fontSize: 13 }}>No hay decisiones registradas</TableCell></TableRow>
                ) : incidenciasBandeja.map((inc) => {
                  const ec = ESTADO_STYLES[inc.estado] || { bg: "#F3F4F6", color: "#374151", label: inc.estado };
                  const pc = PRIORIDAD_STYLES[inc.prioridad] || { bg: "#F3F4F6", color: "#6B7280", label: inc.prioridad || "—" };
                  return (
                    <TableRow key={inc.id} sx={{ cursor: "pointer", "&:hover": { bgcolor: "#F9FAFB" } }} onClick={() => navigate(`/incidencias/${inc.id}`)}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: 10, bgcolor: "#E8F5E9", color: "#1B5E20", fontWeight: 700 }}>
                            {(inc.empleado_nombre?.[0] || "?").toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{inc.empleado_nombre} {inc.apellido}</Typography>
                            <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>{inc.cargo || ""}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}><Chip label={TIPOS[inc.tipo] || inc.tipo} size="small" sx={{ borderRadius: "8px", fontSize: 11, fontWeight: 600, bgcolor: "#F3F4F6", color: "#374151" }} /></TableCell>
                      <TableCell sx={{ fontSize: 13, color: "#6B7280", whiteSpace: "nowrap" }}>{formatFecha(inc.fecha)}</TableCell>
                      <TableCell><Chip label={ec.label} size="small" sx={{ borderRadius: "8px", fontSize: 11, fontWeight: 600, bgcolor: ec.bg, color: ec.color }} /></TableCell>
                      <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}><Chip label={pc.label} size="small" sx={{ borderRadius: "8px", fontSize: 11, fontWeight: 600, bgcolor: pc.bg, color: pc.color }} /></TableCell>
                      <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                        <Box sx={{ display: "flex", gap: 0.5 }} onClick={(ev) => ev.stopPropagation()}>
                          <IconButton size="small" onClick={() => navigate(`/incidencias/${inc.id}`)} sx={{ color: "#1565C0", bgcolor: "#EFF6FF", borderRadius: "8px", width: 32, height: 32 }}><Eye size={15} /></IconButton>
                          <IconButton size="small" onClick={() => navigate(`/incidencias/${inc.id}`)} sx={{ color: "#1B5E20", bgcolor: "#E8F5E9", borderRadius: "8px", width: 32, height: 32 }}><Search size={15} /></IconButton>
                          <IconButton size="small" onClick={(ev) => { ev.stopPropagation(); const t = localStorage.getItem("token"); window.open(`/api/pdf/incidencias/${inc.id}/plantilla?token=${t}`, "_blank"); }} sx={{ color: "#7C3AED", bgcolor: "#F5F3FF", borderRadius: "8px", width: 32, height: 32 }}><Download size={15} /></IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

          {tabEstado === 0 && (/* SOLICITUDES RECIBIDAS */
          <Paper ref={solicitudesRef} elevation={0} sx={{ borderRadius: "16px", border: "1px solid #ECECEC", overflow: "hidden" }}>
            <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid #ECECEC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Solicitudes recibidas</Typography>
                <Typography sx={{ fontSize: 12, color: "#9CA3AF", mt: 0.2 }}>Bandeja de entrada de Recursos Humanos</Typography>
              </Box>
              <Chip label={`${solicitudesPendientes.length} pendientes`} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: "#E8F5E9", color: "#1B5E20", borderRadius: "8px" }} />
            </Box>
            <TableContainer sx={{ maxHeight: 420, overflowX: "auto" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {["Empleado", "Tipo", "Creado", "Estado", "Acción"].map((h) => (
                      <TableCell key={h} sx={{
                        fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", bgcolor: "#fff", borderBottom: "1px solid #F3F4F6", py: 1.2, whiteSpace: "nowrap",
                        display: h === "Tipo" ? { xs: "none", md: "table-cell" } : undefined,
                      }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                    {solicitudesPendientes.length === 0 ? (
                    <TableRow><TableCell colSpan={5} sx={{ textAlign: "center", py: 5, color: "#9CA3AF", fontSize: 13 }}>No hay solicitudes pendientes</TableCell></TableRow>
                  ) : solicitudesPendientes.map((inc) => {
                    const ec = ESTADO_STYLES[inc.estado] || { bg: "#F3F4F6", color: "#374151", label: inc.estado };
                    return (
                      <TableRow key={inc.id} sx={{ "&:hover": { bgcolor: "#F9FAFB" }, cursor: "pointer" }} onClick={() => navigate(`/incidencias/${inc.id}`)}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 10, bgcolor: "#E8F5E9", color: "#1B5E20", fontWeight: 700 }}>
                              {(inc.empleado_nombre?.[0] || "?").toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{inc.empleado_nombre} {inc.apellido}</Typography>
                              <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>{inc.cedula}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                          <Chip label={TIPOS[inc.tipo] || inc.tipo} size="small" sx={{ borderRadius: "8px", fontSize: 11, fontWeight: 600, bgcolor: "#F3F4F6", color: "#374151" }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>
                          {formatFecha(inc.fecha)} <Typography component="span" sx={{ fontSize: 11, color: "#9CA3AF" }}>· {formatHora(inc.created_at)}</Typography>
                        </TableCell>
                        <TableCell><Chip label={ec.label} size="small" sx={{ borderRadius: "8px", fontSize: 11, fontWeight: 600, bgcolor: ec.bg, color: ec.color }} /></TableCell>
                        <TableCell>
                          <Button size="small" endIcon={<ChevronRight size={13} />}
                            sx={{ borderRadius: "8px", textTransform: "none", fontSize: 12, fontWeight: 600, color: inc.estado === "aprobado" || inc.estado === "rechazado" ? "#6B7280" : "#1B5E20", p: 0, minWidth: "auto", "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}>
                            {inc.estado === "aprobado" || inc.estado === "rechazado" ? "Ver detalle" : "Revisar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ px: 2.5, py: 1.2, borderTop: "1px solid #ECECEC" }}>
              <Button endIcon={<ArrowRight size={14} />} onClick={() => navigate("/incidencias")}
                sx={{ textTransform: "none", fontSize: 12, fontWeight: 600, color: "#1B5E20", p: 0, "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}>
                Ver todas las solicitudes →
              </Button>
            </Box>
          </Paper>
          )}
        </Box>

        {/* RIGHT: Tarjetas informativas */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Pendientes del día */}
          <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid #ECECEC" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", color: "#D97706" }}>
                <Clock size={18} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" }}>Pendientes del día</Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{Number(stats.pendientes) || 0}</Typography>
              </Box>
            </Box>
            <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
              {Number(stats.pendientes) === 0 ? "No hay incidencias pendientes" : `${stats.pendientes} incidencia(s) esperando revisión`}
            </Typography>
          </Paper>

          {/* Alertas importantes */}
          <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", border: alertasAltas.length > 0 ? "1px solid #FECACA" : "1px solid #ECECEC" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: alertasAltas.length > 0 ? "#FEE2E2" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", color: alertasAltas.length > 0 ? "#DC2626" : "#9CA3AF" }}>
                <AlertOctagon size={18} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" }}>Alertas importantes</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: alertasAltas.length > 0 ? "#DC2626" : "#111827" }}>
                  {alertasAltas.length > 0 ? `${alertasAltas.length} prioridad alta` : "Sin alertas"}
                </Typography>
              </Box>
            </Box>
            {alertasAltas.length > 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {alertasAltas.slice(0, 3).map((a) => (
                  <Box key={a.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.3 }}>
                    <Typography sx={{ fontSize: 11, color: "#6B7280" }}>{a.empleado_nombre} {a.apellido}</Typography>
                    <Chip label={TIPOS[a.tipo] || a.tipo} size="small" sx={{ height: 18, fontSize: 9, fontWeight: 600, bgcolor: "#FEE2E2", color: "#991B1B", borderRadius: "4px" }} />
                  </Box>
                ))}
              </Box>
            )}
          </Paper>

          {/* Acciones rápidas */}
          <Paper elevation={0} sx={{ borderRadius: "16px", border: "1px solid #ECECEC", overflow: "hidden" }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", px: 2, py: 1.5, borderBottom: "1px solid #ECECEC" }}>
              <Zap size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
              Acciones rápidas
            </Typography>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, px: 2, py: 1.5, cursor: "pointer", "&:hover": { bgcolor: "#F9FAFB" }, transition: "background-color 0.15s ease" }}
              onClick={exportarExcel}>
              <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", color: "#1B5E20", flexShrink: 0 }}>
                <Download size={18} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1B5E20" }}>Descargar reporte de incidencias</Typography>
                <Typography sx={{ fontSize: 11, color: "#9CA3AF", mt: 0.2, lineHeight: 1.4 }}>Generar y descargar reportes del período seleccionado.</Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>



      {/* POPOVERS */}
      <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }} anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{ sx: { borderRadius: "12px", mt: 0.5, minWidth: 150, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } }}>
        <MenuItem onClick={exportarExcel} sx={{ borderRadius: "8px", mx: 0.5, fontSize: 13, gap: 1 }}><FileText size={16} /> Exportar Excel</MenuItem>
        <MenuItem onClick={vistaPreviaPDF} sx={{ borderRadius: "8px", mx: 0.5, fontSize: 13, gap: 1 }}><FileText size={16} /> Vista previa PDF</MenuItem>
        <MenuItem onClick={exportarPDF} sx={{ borderRadius: "8px", mx: 0.5, fontSize: 13, gap: 1 }}><Download size={16} /> Exportar PDF</MenuItem>
      </Menu>

      {/* Popover de Fecha (Desde/Hasta) */}
      <Popover open={Boolean(fechaAnchor)} anchorEl={fechaAnchor} onClose={() => setFechaAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{ sx: { borderRadius: "12px", mt: 0.5, p: 1.5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, minWidth: 220 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>Rango de fechas</Typography>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#6B7280", mb: 0.3 }}>Desde</Typography>
            <input type="date" value={filtros.fecha_desde}
              onChange={(e) => handleChangeFiltro("fecha_desde", e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #C4C4C4", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#6B7280", mb: 0.3 }}>Hasta</Typography>
            <input type="date" value={filtros.fecha_hasta}
              onChange={(e) => handleChangeFiltro("fecha_hasta", e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #C4C4C4", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </Box>
        </Box>
      </Popover>

      {/* Popover de Más (chips activos + limpiar) */}
      <Popover open={Boolean(masFiltrosAnchor)} anchorEl={masFiltrosAnchor} onClose={() => setMasFiltrosAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { borderRadius: "12px", mt: 0.5, minWidth: 220, p: 1.5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 1 }}>Filtros activos</Typography>
        {filtrosActivos === 0 ? (
          <Typography sx={{ fontSize: 12, color: "#9CA3AF", mb: 1.5 }}>No hay filtros aplicados</Typography>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
            {filtros.tipo && <Chip label={`Tipo: ${TIPOS[filtros.tipo]}`} size="small" onDelete={() => handleChangeFiltro("tipo", "")} sx={{ height: 22, fontSize: 11, borderRadius: "6px" }} />}
            {filtros.area_id && <Chip label={`Área: ${areas.find((a) => String(a.id) === filtros.area_id)?.nombre || filtros.area_id}`} size="small" onDelete={() => handleChangeFiltro("area_id", "")} sx={{ height: 22, fontSize: 11, borderRadius: "6px" }} />}
            {filtros.prioridad && <Chip label={`Prioridad: ${PRIORIDAD_STYLES[filtros.prioridad]?.label}`} size="small" onDelete={() => handleChangeFiltro("prioridad", "")} sx={{ height: 22, fontSize: 11, borderRadius: "6px" }} />}
            {(filtros.fecha_desde || filtros.fecha_hasta) && <Chip label="Fecha" size="small" onDelete={() => { handleChangeFiltro("fecha_desde", ""); handleChangeFiltro("fecha_hasta", ""); }} sx={{ height: 22, fontSize: 11, borderRadius: "6px" }} />}
          </Box>
        )}
        <Button size="small" fullWidth startIcon={<X size={14} />} onClick={limpiarFiltros}
          sx={{ borderRadius: "8px", textTransform: "none", fontSize: 12, color: "#6B7280", bgcolor: "#F3F4F6", "&:hover": { bgcolor: "#E5E7EB" } }}>
          Limpiar todos los filtros
        </Button>
      </Popover>

      <PDFPreviewModal open={Boolean(pdfPreviewUrl)} onClose={() => setPdfPreviewUrl(null)} url={pdfPreviewUrl} titulo="Vista previa - Incidencias" />
    </Box>
  );
}
