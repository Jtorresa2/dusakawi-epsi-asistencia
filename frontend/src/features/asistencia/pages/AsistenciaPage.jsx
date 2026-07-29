import { useState, useEffect } from "react";
import {
  Box, Button, Paper, TextField, Typography, Select, MenuItem, Autocomplete, Menu, Chip, IconButton,
  InputAdornment, Snackbar, Alert,
} from "@mui/material";
import {
  Search, Users, UserCheck, UserX, FileText, Download, Plus, Clock, X, Filter,
  CircleArrowOutUpRight, CircleCheckBig, Ban, Fingerprint, CalendarDays,
} from "lucide-react";
import * as XLSX from "xlsx";
import DataTable from "../../../shared/components/DataTable";
import Loading from "../../../shared/components/Loading";
import EmptyState from "../../../shared/components/EmptyState";
import PDFPreviewModal from "../../../shared/components/PDFPreviewModal";
import ConfirmDialog from "../../../shared/components/ConfirmDialog";
import { asistenciaColumns } from "../components/columns";
import { obtenerRegistros, registrarManual, justificarAusencia, eliminarRegistro, actualizarRegistro } from "../asistencia.api";
import { obtenerAreas } from "../../areas/area.api";

function minDesde(hora) {
  if (!hora) return 0;
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function calcTardanza(e1, e2) {
  let t = 0;
  if (e1) {
    const m = minDesde(e1);
    if (m > 430) t += m - 430;
  }
  if (e2) {
    const m = minDesde(e2);
    if (m > 850) t += m - 850;
  }
  return t;
}

function calcHoras(e1, s1, e2, s2) {
  let h = 0;
  if (e1 && s1) h += minDesde(s1) - minDesde(e1);
  if (e2 && s2) h += minDesde(s2) - minDesde(e2);
  return Math.round(h / 6) / 10;
}

function determinarEstado(e1, e2, justificado) {
  if (justificado) return "justificado";
  if (!e1 && !e2) return "ausente";
  const t = calcTardanza(e1, e2);
  return t > 0 ? "tardanza" : "puntual";
}

const AREAS_FALLBACK = [
  { nombre: "SIAU", piso: 1 }, { nombre: "PQR", piso: 1 }, { nombre: "Call Center", piso: 1 }, { nombre: "Aseguramiento", piso: 1 }, { nombre: "Autorización", piso: 1 }, { nombre: "Comunicación", piso: 1 }, { nombre: "Calidad", piso: 1 }, { nombre: "Jurídica", piso: 1 },
  { nombre: "Psicología", piso: 2 }, { nombre: "Recepción", piso: 2 }, { nombre: "Transporte", piso: 2 }, { nombre: "MIPRES", piso: 2 }, { nombre: "Portabilidad", piso: 2 }, { nombre: "Dirección de Riesgos", piso: 2 }, { nombre: "Gerencia", piso: 2 },
  { nombre: "Referencia", piso: 3 }, { nombre: "Auditoría de Cuentas Médicas", piso: 3 }, { nombre: "Radicación", piso: 3 }, { nombre: "Archivo", piso: 3 }, { nombre: "SARLAFT", piso: 3 }, { nombre: "Mediana y Alta Complejidad", piso: 3 }, { nombre: "Contratación", piso: 3 },
  { nombre: "Contabilidad", piso: 4 }, { nombre: "Presupuesto", piso: 4 }, { nombre: "Cartera", piso: 4 }, { nombre: "Recobro", piso: 4 }, { nombre: "Dirección Administrativa", piso: 4 }, { nombre: "PYM", piso: 4 }, { nombre: "Control Interno", piso: 4 },
  { nombre: "Estadística", piso: 5 }, { nombre: "Sistemas", piso: 5 }, { nombre: "Tesorería", piso: 5 }, { nombre: "Alto Costo", piso: 5 }, { nombre: "Baja Complejidad", piso: 5 }, { nombre: "Talento Humano", piso: 5 }, { nombre: "Intercultural", piso: 5 },
];
const ESTADOS = [{ value: "", label: "Todos" }, { value: "puntual", label: "Puntual" }, { value: "tardanza", label: "Tardanza" }, { value: "ausente", label: "Ausente" }, { value: "justificado", label: "Justificado" }];

export default function AsistenciaPage() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState("dia");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [fechaDesde, setFechaDesde] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d.toISOString().split("T")[0];
  });
  const [fechaHasta, setFechaHasta] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 5); return d.toISOString().split("T")[0];
  });
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [filtroArea, setFiltroArea] = useState("Todas las áreas");
  const [filtroPiso, setFiltroPiso] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [areas, setAreas] = useState([]);
  const pisosDisponibles = [...new Set(areas.map((a) => a.piso).filter(Boolean))].sort((a, b) => a - b);
  const areaPisoMap = Object.fromEntries(areas.map((a) => [a.nombre, a.piso]));
  const getPiso = (areaNombre) => areaPisoMap[areaNombre];
  const [openManual, setOpenManual] = useState(false);
  const [justificarRow, setJustificarRow] = useState(null);
  const [observacion, setObservacion] = useState("");
  const [detalleRow, setDetalleRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [exportAnchor, setExportAnchor] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [activoCard, setActivoCard] = useState("");
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [snack, setSnack] = useState({ open: false, mensaje: "", severity: "success" });

  useEffect(() => {
    (async () => {
      try {
        const data = await obtenerAreas();
        const lista = Array.isArray(data) ? data : data.areas || [];
        setAreas(lista.map((a) => {
          if (typeof a === "string") return { nombre: a, piso: null };
          return { nombre: a.nombre || a.name, piso: a.piso ?? null };
        }));
      } catch {
        setAreas(AREAS_FALLBACK);
      }
    })();
  }, []);

  function getDateParams() {
    if (vista === "dia") return { fecha };
    if (vista === "semana") return { fecha_desde: fechaDesde, fecha_hasta: fechaHasta };
    if (vista === "mes") {
      const desde = `${anio}-${String(mes).padStart(2, "0")}-01`;
      const hasta = new Date(anio, mes, 0).toISOString().split("T")[0];
      return { fecha_desde: desde, fecha_hasta: hasta };
    }
    if (vista === "rango") return { fecha_desde: fechaDesde, fecha_hasta: fechaHasta };
    return { fecha };
  }

  async function cargarRegistros() {
    try {
      setLoading(true);
      const data = await obtenerRegistros({ ...getDateParams(), area: filtroArea !== "Todas las áreas" ? filtroArea : "", piso: filtroPiso, estado: filtroEstado });
      const rows = (data.registros || []).map((r) => ({
        ...r,
        empleado: r.empleado || r.colaborador || "",
      }));
      setRegistros(rows);
    } catch {
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargarRegistros(); }, [vista, fecha, fechaDesde, fechaHasta, mes, anio, filtroArea, filtroPiso, filtroEstado]);

  function filtrar() { cargarRegistros(); }

  function limpiar() {
    setVista("dia");
    setFecha(new Date().toISOString().split("T")[0]);
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); setFechaDesde(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() - d.getDay() + 5); setFechaHasta(d.toISOString().split("T")[0]);
    setMes(new Date().getMonth() + 1);
    setAnio(new Date().getFullYear());
    setFiltroArea("Todas las áreas");
    setFiltroPiso("");
    setFiltroEstado("");
    setActivoCard("");
    cargarRegistros();
  }

  function exportarExcel() {
    setExportAnchor(null);
    const data = filtrados.map((r, i) => ({
      "#": i + 1,
      Empleado: r.colaborador || r.empleado || "",
      Documento: r.cedula || "",
      Área: r.area || "",
      Piso: r.piso || "",
      Fecha: r.fecha || "",
      "Entrada Mañana": r.entrada1 || "",
      "Salida Mañana": r.salida1 || "",
      "Entrada Tarde": r.entrada2 || "",
      "Salida Tarde": r.salida2 || "",
      "Horas Trabajadas": r.horas_trabajadas ? `${r.horas_trabajadas}h` : "",
      "Minutos Tardanza": r.minutos_tardanza || 0,
      "Horas Extra": r.horas_extra ? `${r.horas_extra}h` : "",
      Marcación: r.tipo_marcacion || "",
      Estado: r.estado || "",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    const colWidths = [
      { wch: 4 }, { wch: 28 }, { wch: 12 }, { wch: 18 }, { wch: 6 },
      { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
      { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 14 },
    ];
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Asistencia");

    const label = vista === "dia" ? fecha : vista === "semana" ? `sem${fechaDesde}` : vista === "mes" ? `${anio}_${mes}` : `${fechaDesde}_${fechaHasta}`;
    XLSX.writeFile(wb, `Asistencia_${label}.xlsx`);
  }

  function exportarPDF() {
    setExportAnchor(null);
    const params = new URLSearchParams();
    if (vista === "dia" && fecha) params.set("fecha", fecha);
    else if (fechaDesde && fechaHasta) { params.set("fecha_desde", fechaDesde); params.set("fecha_hasta", fechaHasta); }
    if (filtroArea !== "Todas las áreas") params.set("area", filtroArea);
    if (filtroPiso) params.set("piso", filtroPiso);
    if (filtroEstado) params.set("estado", filtroEstado);
    const qs = params.toString();
    window.open(`/api/pdf/asistencia${qs ? `?${qs}` : ""}`, "_blank");
  }

  function vistaPreviaPDF() {
    setExportAnchor(null);
    const params = new URLSearchParams();
    if (vista === "dia" && fecha) params.set("fecha", fecha);
    else if (fechaDesde && fechaHasta) { params.set("fecha_desde", fechaDesde); params.set("fecha_hasta", fechaHasta); }
    if (filtroArea !== "Todas las áreas") params.set("area", filtroArea);
    if (filtroPiso) params.set("piso", filtroPiso);
    if (filtroEstado) params.set("estado", filtroEstado);
    const qs = params.toString();
    setPdfPreviewUrl(`/api/pdf/asistencia${qs ? `?${qs}&preview=1` : "?preview=1"}`);
  }

  let filtrados = [...registros];

  if (filtroArea !== "Todas las áreas") {
    filtrados = filtrados.filter((r) => r.area === filtroArea);
  }
  if (filtroPiso !== "") {
    const areasEnPiso = new Set(areas.filter((a) => a.piso === Number(filtroPiso)).map((a) => a.nombre));
    filtrados = filtrados.filter((r) => areasEnPiso.has(r.area));
  }

  const baseCards = [...filtrados];

  if (filtroEstado !== "") {
    filtrados = filtrados.filter((r) => r.estado === filtroEstado);
  }

  const resumen = {
    total: baseCards.length,
    puntuales: baseCards.filter((r) => r.estado === "puntual").length,
    tardanzas: baseCards.filter((r) => r.estado === "tardanza").length,
    ausentes: baseCards.filter((r) => r.estado === "ausente").length,
    justificados: baseCards.filter((r) => r.estado === "justificado").length,
  };

  const cards = [
    { icon: <Users size={20} />, value: resumen.total, label: "Total registros", estadoKey: "", color: "#1B5E20", bg: "#E8F5E9" },
    { icon: <UserCheck size={20} />, value: resumen.puntuales, label: "Puntuales", estadoKey: "puntual", color: "#065F46", bg: "#ECFDF5" },
    { icon: <Clock size={20} />, value: resumen.tardanzas, label: "Tardanzas", estadoKey: "tardanza", color: "#D97706", bg: "#FFFBEB" },
    { icon: <UserX size={20} />, value: resumen.ausentes, label: "Ausentes", estadoKey: "ausente", color: "#DC2626", bg: "#FEF2F2" },
    { icon: <FileText size={20} />, value: resumen.justificados, label: "Justificados", estadoKey: "justificado", color: "#1E40AF", bg: "#EFF6FF" },
  ];

  function handleCardClick(estadoKey) {
    if (activoCard === estadoKey) {
      setActivoCard("");
      setFiltroEstado("");
    } else {
      setActivoCard(estadoKey);
      setFiltroEstado(estadoKey);
    }
  }

  const handleEliminar = async () => {
    if (!confirmEliminar) return;
    try {
      await eliminarRegistro(confirmEliminar.id);
      setSnack({ open: true, mensaje: "Registro eliminado correctamente", severity: "success" });
      setConfirmEliminar(null);
      cargarRegistros();
    } catch {
      setSnack({ open: true, mensaje: "Error al eliminar el registro", severity: "error" });
    }
  };

  if (loading) return <Loading />;

  return (
    <Box sx={{ p: 3, bgcolor: "#F5F7F8", minHeight: "100vh" }}>
      {/* 1. ENCABEZADO */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
        <Box>
          <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>
            Inicio / Operación / Asistencia
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => setOpenManual(true)}
          sx={{
            bgcolor: "#1B5E20", borderRadius: "12px", textTransform: "none",
            fontWeight: 600, fontSize: 14, px: 3.5, py: 1.2, height: 44,
            "&:hover": { bgcolor: "#2E7D32" },
          }}
        >
          Registro manual
        </Button>
      </Box>

      {/* 2. TARJETAS RESUMEN */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" }, gap: 2, mb: 3.5 }}>
        {cards.map((card, i) => (
          <Paper key={i} elevation={0} onClick={() => handleCardClick(card.estadoKey)}
            sx={{ p: 2, borderRadius: "16px", border: "1px solid #ECECEC", display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", transition: "all .25s ease", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 15px rgba(0,0,0,.06)" } }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>
              {card.icon}
            </Box>
            <Box>
              <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.03em" }}>{card.label}</Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 700, color: card.color, lineHeight: 1.2 }}>{card.value}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* 3. BARRA DE FILTROS */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: "14px", border: "1px solid #E5E7EB", mb: 2.5 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1.5 }}>
          <Filter size={16} color="#1B5E20" />
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}></Typography>
        </Box>

        {/* Row 1 — Select filters with CSS Grid */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 1.5, mb: 1.5 }}>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#6B7280", mb: 0.4 }}>Vista</Typography>
            <Select value={vista} onChange={(e) => setVista(e.target.value)} size="small" fullWidth
              sx={{ borderRadius: "8px", fontSize: 13, height: 36, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#E5E7EB" } }}>
              <MenuItem value="dia">Día</MenuItem>
              <MenuItem value="semana">Semana</MenuItem>
              <MenuItem value="mes">Mes</MenuItem>
              <MenuItem value="rango">Rango</MenuItem>
            </Select>
          </Box>
          {vista === "mes" && (
            <>
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#6B7280", mb: 0.4 }}>Mes</Typography>
                <Select value={mes} onChange={(e) => setMes(Number(e.target.value))} size="small" fullWidth
                  sx={{ borderRadius: "8px", fontSize: 13, height: 36, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#E5E7EB" } }}>
                  {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((m, i) => (
                    <MenuItem key={i} value={i + 1}>{m}</MenuItem>
                  ))}
                </Select>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#6B7280", mb: 0.4 }}>Año</Typography>
                <Select value={anio} onChange={(e) => setAnio(Number(e.target.value))} size="small" fullWidth
                  sx={{ borderRadius: "8px", fontSize: 13, height: 36, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#E5E7EB" } }}>
                  {[2024, 2025, 2026].map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                </Select>
              </Box>
            </>
          )}
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#6B7280", mb: 0.4 }}>Área</Typography>
            <Select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} size="small" fullWidth
              sx={{ borderRadius: "8px", fontSize: 13, height: 36, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#E5E7EB" } }}>
              {[{ nombre: "Todas las áreas" }, ...areas].map((a) => <MenuItem key={a.nombre} value={a.nombre}>{a.nombre}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#6B7280", mb: 0.4 }}>Piso</Typography>
            <Select value={filtroPiso} onChange={(e) => setFiltroPiso(e.target.value)} size="small" fullWidth
              sx={{ borderRadius: "8px", fontSize: 13, height: 36, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#E5E7EB" } }}>
              <MenuItem value="">Todos</MenuItem>
              {pisosDisponibles.map((p) => <MenuItem key={p} value={p}>Piso {p}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#6B7280", mb: 0.4 }}>Estado</Typography>
            <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} size="small" fullWidth
              sx={{ borderRadius: "8px", fontSize: 13, height: 36, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#E5E7EB" } }}>
              {ESTADOS.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
            </Select>
          </Box>
        </Box>

        {/* Row 2 — Date range + action buttons */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" }, gap: 1.5, alignItems: "end" }}>
          {vista === "dia" && (
            <TextField label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
              slotProps={{
                inputLabel: { shrink: true, sx: { fontSize: 12, color: "#6B7280", fontWeight: 500 } },
                input: { startAdornment: <InputAdornment position="start"><CalendarDays size={14} color="#9CA3AF" /></InputAdornment>, sx: { borderRadius: "8px", fontSize: 13, height: 36, bgcolor: "#F9FAFB" } },
              }} />
          )}
          {(vista === "semana" || vista === "rango") && (
            <TextField label="Fecha desde" type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}
              slotProps={{
                inputLabel: { shrink: true, sx: { fontSize: 12, color: "#6B7280", fontWeight: 500 } },
                input: { startAdornment: <InputAdornment position="start"><CalendarDays size={14} color="#9CA3AF" /></InputAdornment>, sx: { borderRadius: "8px", fontSize: 13, height: 36, bgcolor: "#F9FAFB" } },
              }} />
          )}
          {(vista === "semana" || vista === "rango") && (
            <TextField label="Fecha hasta" type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}
              slotProps={{
                inputLabel: { shrink: true, sx: { fontSize: 12, color: "#6B7280", fontWeight: 500 } },
                input: { startAdornment: <InputAdornment position="start"><CalendarDays size={14} color="#9CA3AF" /></InputAdornment>, sx: { borderRadius: "8px", fontSize: 13, height: 36, bgcolor: "#F9FAFB" } },
              }} />
          )}
          {vista === "mes" && <Box />}
          {vista === "mes" && <Box />}
          <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", justifySelf: { xs: "start", md: "end" }, alignSelf: "end" }}>
            <Button variant="outlined" onClick={limpiar} startIcon={<X size={14} />}
              sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, fontSize: 12, height: 36, px: 2, color: "#6B7280", borderColor: "#E5E7EB", bgcolor: "#fff", "&:hover": { borderColor: "#DC2626", color: "#DC2626" }, whiteSpace: "nowrap" }}>
              Limpiar
            </Button>
            <Button variant="outlined" startIcon={<Download size={14} />} onClick={(e) => setExportAnchor(e.currentTarget)}
              sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, fontSize: 12, height: 36, px: 2, color: "#6B7280", borderColor: "#E5E7EB", bgcolor: "#fff", "&:hover": { borderColor: "#1B5E20", color: "#1B5E20" }, whiteSpace: "nowrap" }}>
              Exportar
            </Button>
            <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}
              transformOrigin={{ horizontal: "right", vertical: "top" }} anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              PaperProps={{ sx: { borderRadius: "12px", mt: 0.5, minWidth: 150, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } }}>
              <MenuItem onClick={exportarExcel} sx={{ borderRadius: "8px", mx: 0.5, fontSize: 13, gap: 1 }}>
                <FileText size={16} /> Exportar Excel
              </MenuItem>
              <MenuItem onClick={vistaPreviaPDF} sx={{ borderRadius: "8px", mx: 0.5, fontSize: 13, gap: 1 }}>
                <FileText size={16} /> Vista previa PDF
              </MenuItem>
              <MenuItem onClick={exportarPDF} sx={{ borderRadius: "8px", mx: 0.5, fontSize: 13, gap: 1 }}>
                <Download size={16} /> Exportar PDF
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Paper>

      {/* 4. TABLA */}
      <Paper elevation={0} sx={{ borderRadius: "20px", border: "1px solid #ECECEC", overflow: "hidden" }}>
        {filtrados.length === 0 ? (
          <EmptyState mensaje="No hay registros para los filtros seleccionados" />
        ) : (
          <DataTable
            rows={filtrados}
            columns={asistenciaColumns({
              onJustificar: (row) => { setJustificarRow(row); setObservacion(""); },
              getPiso, onDetalle: (row) => setDetalleRow(row),
              onEditar: (row) => setEditRow(row),
              onEliminar: (row) => setConfirmEliminar(row),
            })}
            loading={loading}
          />
        )}
      </Paper>

      {/* 5. MODAL DETALLE ASISTENCIA */}
      <DetalleAsistenciaModal
        open={Boolean(detalleRow)}
        onClose={() => setDetalleRow(null)}
        row={detalleRow}
      />

      {/* 5b. MODAL EDITAR ASISTENCIA */}
      <EditarAsistenciaModal
        open={Boolean(editRow)}
        onClose={() => setEditRow(null)}
        row={editRow}
        onGuardar={async (data) => {
          try {
            await actualizarRegistro(editRow.id, data);
            setEditRow(null);
            setSnack({ open: true, mensaje: "Registro actualizado correctamente", severity: "success" });
            cargarRegistros();
          } catch (err) {
            setSnack({ open: true, mensaje: "Error al actualizar el registro", severity: "error" });
          }
        }}
      />

      {/* 6. MODAL REGISTRO MANUAL */}
      <RegistroManualModal
        open={openManual}
        onClose={() => setOpenManual(false)}
        areas={areas}
        onGuardar={async (data) => {
          try {
            await registrarManual(data);
            setOpenManual(false);
            cargarRegistros();
          } catch (err) { console.error(err); }
        }}
      />

      {/* 6. MODAL JUSTIFICAR */}
      <JustificarModal
        open={Boolean(justificarRow)}
        onClose={() => setJustificarRow(null)}
        empleado={justificarRow?.empleado}
        observacion={observacion}
        onChangeObservacion={setObservacion}
        onGuardar={async () => {
          try {
            await justificarAusencia(justificarRow.id, { observacion });
            setJustificarRow(null);
            setObservacion("");
            cargarRegistros();
          } catch (err) { console.error(err); }
        }}
      />

      {/* 7. MODAL VISTA PREVIA PDF */}
      <PDFPreviewModal
        open={Boolean(pdfPreviewUrl)}
        onClose={() => setPdfPreviewUrl(null)}
        url={pdfPreviewUrl}
        titulo="Vista previa - Asistencia"
      />

      {/* 8. CONFIRMAR ELIMINAR */}
      <ConfirmDialog
        open={!!confirmEliminar}
        titulo="Eliminar registro"
        mensaje={`¿Estás seguro de eliminar el registro de "${confirmEliminar?.empleado}" del ${confirmEliminar?.fecha || "esta fecha"}? Esta acción no se puede deshacer.`}
        onConfirm={handleEliminar}
        onClose={() => setConfirmEliminar(null)}
      />

      {/* 9. SNACKBAR FEEDBACK */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} variant="filled" sx={{ borderRadius: "10px" }}>
          {snack.mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function DetalleAsistenciaModal({ open, onClose, row }) {
  if (!open || !row) return null;

  const badgeColors = {
    puntual: { bg: "#D1FAE5", color: "#065F46" },
    tardanza: { bg: "#FEF3C7", color: "#92400E" },
    ausente: { bg: "#FEE2E2", color: "#991B1B" },
    justificado: { bg: "#DBEAFE", color: "#1E40AF" },
  };
  const ec = badgeColors[row.estado] || { bg: "#F3F4F6", color: "#6B7280" };

  const esLyM = row.dia_semana && (row.dia_semana === 1 || row.dia_semana === 2);
  const salidaTardeEsperada = esLyM ? "18:00" : "17:00";
  const turnos = [
    { label: "Mañana", entrada: row.entrada1, salida: row.salida1, esperadoE: "07:00", esperadoS: "12:00", color: "#1B5E20", bg: "#F0FFF4" },
    { label: "Tarde", entrada: row.entrada2, salida: row.salida2, esperadoE: "14:00", esperadoS: salidaTardeEsperada, color: "#D97706", bg: "#FFF7ED" },
  ];

  const tipoIconMap = {
    huella: <Fingerprint size={18} />,
    facial: <CircleArrowOutUpRight size={18} />,
    tarjeta: <CircleCheckBig size={18} />,
    manual: <Ban size={18} />,
  };

  const calculos = [
    { label: "Horas trabajadas", value: row.horas_trabajadas ? `${row.horas_trabajadas}h` : "—" },
    { label: "Minutos de tardanza", value: row.minutos_tardanza > 0 ? `${row.minutos_tardanza} min` : "0 min", color: row.minutos_tardanza > 0 ? "#B45309" : "#065F46" },
    { label: "Horas extra", value: row.horas_extra > 0 ? `${row.horas_extra}h` : "—", color: row.horas_extra > 0 ? "#7C3AED" : "#9CA3AF" },
  ];

  return (
    <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <Paper elevation={0} sx={{ borderRadius: "20px", p: 3, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2.5}>
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{row.empleado}</Typography>
            <Typography sx={{ fontSize: 13, color: "#6B7280", mt: 0.3 }}>{row.area || "—"} · Piso {row.piso || "—"}</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, px: 1.2, py: 0.4, borderRadius: "8px", bgcolor: ec.bg, color: ec.color, textTransform: "capitalize" }}>
              {row.estado}
            </Typography>
            <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", color: "#9CA3AF" }}>✕</button>
          </Box>
        </Box>

        {/* Marcaciones */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
          {turnos.map((t) => {
            const tieneEntrada = !!t.entrada;
            const tieneSalida = !!t.salida;
            return (
              <Paper key={t.label} elevation={0} sx={{ p: 2, borderRadius: "14px", bgcolor: t.bg, border: "1px solid #ECECEC" }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: t.color, mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {t.label}
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 2, alignItems: "center" }}>
                  <Box>
                    <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", mb: 0.3 }}>Esperado</Typography>
                    <Typography sx={{ fontSize: 13, color: "#6B7280" }}>{t.esperadoE} → {t.esperadoS}</Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", mb: 0.3 }}>vs</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", mb: 0.3 }}>Real</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: tieneEntrada || tieneSalida ? "#111827" : "#9CA3AF" }}>
                      {tieneEntrada || tieneSalida ? `${t.entrada || "—"} → ${t.salida || "—"}` : "Sin registro"}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>

        {/* Resumen de cálculos */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 3 }}>
          {calculos.map((c, i) => (
            <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: "12px", border: "1px solid #ECECEC", textAlign: "center" }}>
              <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", mb: 0.5 }}>{c.label}</Typography>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: c.color || "#111827" }}>{c.value}</Typography>
            </Paper>
          ))}
        </Box>

        {/* Marcación */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5, borderTop: "1px solid #F3F4F6" }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}>
            {tipoIconMap[row.tipo_marcacion] || <CircleCheckBig size={18} />}
          </Box>
          <Box>
            <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" }}>Tipo de marcación</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#111827", textTransform: "capitalize" }}>{row.tipo_marcacion || "—"}</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

// ── MODAL EDITAR ASISTENCIA ──────────────────────
function EditarAsistenciaModal({ open, onClose, row, onGuardar }) {
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (row) {
      setForm({
        fecha: row.fecha || "",
        entrada1: row.entrada1 || "",
        salida1: row.salida1 || "",
        entrada2: row.entrada2 || "",
        salida2: row.salida2 || "",
        tipo_marcacion: row.tipo_marcacion || "manual",
        estado: row.estado || "puntual",
        observacion: row.observacion || "",
      });
    }
  }, [row]);

  if (!open || !row) return null;

  const inputSx = { borderRadius: "10px", fontSize: 13, height: 40, py: 0, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#ECECEC" } };

  return (
    <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <Paper elevation={0} sx={{ position: "relative", borderRadius: "20px", p: 3, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <IconButton onClick={onClose} size="small" sx={{ position: "absolute", top: 12, right: 12, color: "#9CA3AF", "&:hover": { color: "#6B7280", bgcolor: "#F3F4F6" } }}>
          <X size={18} />
        </IconButton>
        <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#111827", mb: 2.5 }}>Editar registro de asistencia</Typography>

        <Typography sx={{ fontSize: 13, color: "#6B7280", mb: 2 }}>
          {row.empleado} — {row.area || ""} · {row.fecha || ""}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Fecha</Typography>
            <TextField type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} fullWidth slotProps={{ input: { sx: inputSx } }} />
          </Box>

          {/* TURNO MAÑANA */}
          <Box sx={{ bgcolor: "#F0FFF4", borderRadius: "12px", p: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1B5E20", mb: 1.5 }}>Turno mañana</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Entrada</Typography>
                <TextField type="time" value={form.entrada1} onChange={(e) => setForm({ ...form, entrada1: e.target.value })} fullWidth slotProps={{ input: { sx: inputSx } }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Salida</Typography>
                <TextField type="time" value={form.salida1} onChange={(e) => setForm({ ...form, salida1: e.target.value })} fullWidth slotProps={{ input: { sx: inputSx } }} />
              </Box>
            </Box>
          </Box>

          {/* TURNO TARDE */}
          <Box sx={{ bgcolor: "#FFF7ED", borderRadius: "12px", p: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#D97706", mb: 1.5 }}>Turno tarde</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Entrada</Typography>
                <TextField type="time" value={form.entrada2} onChange={(e) => setForm({ ...form, entrada2: e.target.value })} fullWidth slotProps={{ input: { sx: inputSx } }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Salida</Typography>
                <TextField type="time" value={form.salida2} onChange={(e) => setForm({ ...form, salida2: e.target.value })} fullWidth slotProps={{ input: { sx: inputSx } }} />
              </Box>
            </Box>
          </Box>

          {/* ESTADO */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Estado</Typography>
            <Select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} size="small" fullWidth sx={inputSx}>
              <MenuItem value="puntual">Puntual</MenuItem>
              <MenuItem value="tardanza">Tardanza</MenuItem>
              <MenuItem value="ausente">Ausente</MenuItem>
              <MenuItem value="justificado">Justificado</MenuItem>
            </Select>
          </Box>

          {/* TIPO MARCACIÓN */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Tipo de marcación</Typography>
            <Select value={form.tipo_marcacion} onChange={(e) => setForm({ ...form, tipo_marcacion: e.target.value })} size="small" fullWidth sx={inputSx}>
              <MenuItem value="manual">Manual</MenuItem>
              <MenuItem value="huella">Huella</MenuItem>
              <MenuItem value="facial">Facial</MenuItem>
              <MenuItem value="tarjeta">Tarjeta</MenuItem>
            </Select>
          </Box>

          {/* OBSERVACIÓN */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Observación</Typography>
            <TextField multiline rows={2} value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} fullWidth slotProps={{ input: { sx: { ...inputSx, height: "auto", py: 1 } } }} />
          </Box>

          <Box display="flex" gap={1} justifyContent="flex-end" mt={1}>
            <Button onClick={onClose} variant="outlined" sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 3, color: "#6B7280", borderColor: "#ECECEC", "&:hover": { borderColor: "#1B5E20" } }}>
              Cancelar
            </Button>
            <Button
              disabled={guardando}
              onClick={async () => {
                setGuardando(true);
                await onGuardar(form);
                setGuardando(false);
              }}
              variant="contained"
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 3, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

function RegistroManualModal({ open, onClose, onGuardar, areas = [] }) {
  const [form, setForm] = useState({
    empleado_id: "", fecha: new Date().toISOString().split("T")[0],
    entrada1: "07:00", salida1: "12:00", entrada2: "14:00", salida2: "17:00",
    tipo_marcacion: "manual", observacion: "",
  });
  const [empleados, setEmpleados] = useState([]);
  const [filtroArea, setFiltroArea] = useState("Todas");

  const empleadosFiltrados = filtroArea === "Todas"
    ? empleados
    : empleados.filter((e) => (e.area || e.area_nombre) === filtroArea);

  useEffect(() => {
    if (!open) return;
    setForm({ empleado_id: "", fecha: new Date().toISOString().split("T")[0], entrada1: "07:00", salida1: "12:00", entrada2: "14:00", salida2: "17:00", tipo_marcacion: "manual", observacion: "" });
    setFiltroArea("Todas");
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/empleados", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setEmpleados(data.empleados || []);
      } catch { setEmpleados([]); }
    })();
  }, [open]);

  if (!open) return null;

  const inputSx = { borderRadius: "10px", fontSize: 13, height: 40, py: 0, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#ECECEC" } };

  return (
    <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <Paper elevation={0} sx={{ position: "relative", borderRadius: "20px", p: 3, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <IconButton onClick={onClose} size="small" sx={{ position: "absolute", top: 12, right: 12, color: "#9CA3AF", "&:hover": { color: "#6B7280", bgcolor: "#F3F4F6" } }}>
          <X size={18} />
        </IconButton>
        <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#111827", mb: 2.5 }}>Registro manual</Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Filtrar por área</Typography>
            <Select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} size="small" fullWidth sx={inputSx}>
              {[{ nombre: "Todas" }, ...areas].map((a) => <MenuItem key={a.nombre} value={a.nombre}>{a.nombre}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Empleado</Typography>
            <Autocomplete
              options={empleadosFiltrados}
              getOptionLabel={(e) => `${e.nombre} ${e.apellido || ""} — ${e.cedula}`}
              isOptionEqualToValue={(e, v) => e.id === v.id}
              onChange={(_, value) => setForm({ ...form, empleado_id: value?.id || "" })}
              noOptionsText="Sin resultados"
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Buscar por nombre o cédula..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <Search size={16} style={{ color: "#9CA3AF", marginRight: 4 }} />,
                    sx: { borderRadius: "10px", fontSize: 13, height: 40, py: 0, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#ECECEC" } },
                  }}
                />
              )}
            />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Fecha</Typography>
            <TextField type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} fullWidth slotProps={{ input: { sx: inputSx } }} />
          </Box>

          {/* TURNO MAÑANA */}
          <Box sx={{ bgcolor: "#F0FFF4", borderRadius: "12px", p: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1B5E20", mb: 1.5 }}>
              Turno mañana
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Entrada</Typography>
                <TextField type="time" value={form.entrada1} onChange={(e) => setForm({ ...form, entrada1: e.target.value })} fullWidth slotProps={{ input: { sx: inputSx } }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Salida</Typography>
                <TextField type="time" value={form.salida1} onChange={(e) => setForm({ ...form, salida1: e.target.value })} fullWidth slotProps={{ input: { sx: inputSx } }} />
              </Box>
            </Box>
          </Box>

          {/* TURNO TARDE */}
          <Box sx={{ bgcolor: "#FFF7ED", borderRadius: "12px", p: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#D97706", mb: 1.5 }}>
              Turno tarde
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Entrada</Typography>
                <TextField type="time" value={form.entrada2} onChange={(e) => setForm({ ...form, entrada2: e.target.value })} fullWidth slotProps={{ input: { sx: inputSx } }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Salida</Typography>
                <TextField type="time" value={form.salida2} onChange={(e) => setForm({ ...form, salida2: e.target.value })} fullWidth slotProps={{ input: { sx: inputSx } }} />
              </Box>
            </Box>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Tipo de marcación</Typography>
            <Select value={form.tipo_marcacion} onChange={(e) => setForm({ ...form, tipo_marcacion: e.target.value })} size="small" fullWidth sx={inputSx}>
              <MenuItem value="manual">Manual</MenuItem>
              <MenuItem value="huella">Huella</MenuItem>
              <MenuItem value="facial">Facial</MenuItem>
              <MenuItem value="tarjeta">Tarjeta</MenuItem>
            </Select>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Observación</Typography>
            <TextField multiline rows={2} value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} placeholder="Motivo del registro manual..." fullWidth slotProps={{ input: { sx: { ...inputSx, height: "auto", py: 1, resize: "vertical" } } }} />
          </Box>
          <Box display="flex" gap={1} justifyContent="flex-end" mt={1}>
            <Button onClick={onClose} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 3, color: "#6B7280", borderColor: "#ECECEC", "&:hover": { borderColor: "#1B5E20" } }} variant="outlined">
              Cancelar
            </Button>
            <Button onClick={() => onGuardar(form)} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 3, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }} variant="contained">
              Guardar
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

function JustificarModal({ open, onClose, empleado, observacion, onChangeObservacion, onGuardar }) {
  if (!open) return null;

  return (
    <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <Paper elevation={0} sx={{ borderRadius: "20px", p: 3, width: "100%", maxWidth: 420, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
          <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>Justificar ausencia</Typography>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", color: "#9CA3AF" }}>✕</button>
        </Box>
        {empleado && (
          <Typography sx={{ fontSize: 13, color: "#6B7280", mb: 2 }}>
            Empleado: <strong style={{ color: "#111827" }}>{empleado}</strong>
          </Typography>
        )}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Motivo de justificación</Typography>
            <TextField multiline rows={4} value={observacion} onChange={(e) => onChangeObservacion(e.target.value)} placeholder="Describe el motivo de la ausencia..." fullWidth
              slotProps={{ input: { sx: { borderRadius: "10px", fontSize: 13, py: 1, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#ECECEC" }, resize: "vertical" } } }} />
          </Box>
          <Box display="flex" gap={1} justifyContent="flex-end" mt={1}>
            <Button onClick={onClose} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 3, color: "#6B7280", borderColor: "#ECECEC", "&:hover": { borderColor: "#1B5E20" } }} variant="outlined">
              Cancelar
            </Button>
            <Button onClick={onGuardar} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 3, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }} variant="contained">
              Justificar
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
