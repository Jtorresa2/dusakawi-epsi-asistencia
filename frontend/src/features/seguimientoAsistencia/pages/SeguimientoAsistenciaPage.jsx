import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, Button, Chip, Menu, MenuItem, FormControl, Select,
  Popover, TextField,
} from "@mui/material";
import {
  Users, CalendarX2, Sunrise, Sunset, LogOut, Clock3, Search, Download,
  FileText, Info, FilterX,
} from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import { exportarExcel } from "../../../shared/utils/exportarExcel";
import { COLORES } from "../../../shared/constants/colores.js";
import { obtenerSeguimiento, descargarPdfSeguimiento } from "../seguimientoAsistencia.api";
import { obtenerAreas } from "../../areas/area.api";
import { seguimientoColumns } from "../components/columns";
import SeguimientoDetalleModal from "../components/SeguimientoDetalleModal";

const SITUACION_OPTIONS = [
  { value: "", label: "Todas las situaciones" },
  { value: "ausencia", label: "Ausencia" },
  { value: "falta_manana", label: "Falta mañana" },
  { value: "falta_tarde", label: "Falta tarde" },
  { value: "salida_no_registrada", label: "Salida no registrada" },
  { value: "jornada_abierta", label: "Jornada abierta" },
];

const STAT_CARDS = [
  { key: "total", label: "Total situaciones", icon: <Users size={20} />, color: COLORES.primarioOscuro, bg: COLORES.primarioClaro },
  { key: "ausencia", label: "Ausencias", icon: <CalendarX2 size={20} />, color: COLORES.dangerOscuro, bg: COLORES.dangerFondo },
  { key: "falta_manana", label: "Falta mañana", icon: <Sunrise size={20} />, color: COLORES.warningOscuro, bg: COLORES.warningFondo },
  { key: "falta_tarde", label: "Falta tarde", icon: <Sunset size={20} />, color: COLORES.warningOscuro2, bg: "#FEF3C7" },
  { key: "salida_no_registrada", label: "Salida no reg.", icon: <LogOut size={20} />, color: COLORES.textoMuted, bg: COLORES.fondoGris2 },
  { key: "jornada_abierta", label: "Jornada abierta", icon: <Clock3 size={20} />, color: COLORES.verdeTexto, bg: COLORES.successFondo },
];

const KPIS_DEFAULT = {
  total: 0, ausencia: 0, falta_manana: 0, falta_tarde: 0,
  salida_no_registrada: 0, jornada_abierta: 0,
};

/** 'YYYY-MM-DD' en zona local (no toISOString, que desplaza el día). */
function fmtLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rangoDefault() {
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  return { fecha_desde: fmtLocal(ayer), fecha_hasta: fmtLocal(hoy) };
}

export default function SeguimientoAsistenciaPage() {
  const navigate = useNavigate();
  const { fecha_desde: fdInit, fecha_hasta: fhInit } = rangoDefault();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [kpis, setKpis] = useState(KPIS_DEFAULT);
  const [areas, setAreas] = useState([]);
  const [detalleRow, setDetalleRow] = useState(null);
  const [exportAnchor, setExportAnchor] = useState(null);
  const [fechaAnchor, setFechaAnchor] = useState(null);
  const [exportando, setExportando] = useState(false);
  const [errorExport, setErrorExport] = useState("");

  const [filtros, setFiltros] = useState({
    fecha_desde: fdInit,
    fecha_hasta: fhInit,
    area: "",
    piso: "",
    situacion: "",
    busqueda: "",
  });

  const pisos = [...new Set(areas.map((a) => a.piso).filter((p) => p !== null && p !== undefined))].sort((a, b) => a - b);

  const cargar = async (f) => {
    try {
      setLoading(true);
      const data = await obtenerSeguimiento({ ...f, page: 1, pageSize: 100 });
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setTotal(data.total ?? 0);
      setKpis(data.kpis ? { ...KPIS_DEFAULT, ...data.kpis } : KPIS_DEFAULT);
    } catch {
      setRows([]);
      setTotal(0);
      setKpis(KPIS_DEFAULT);
    } finally {
      setLoading(false);
    }
  };

  const montado = useRef(false);
  useEffect(() => {
    if (!montado.current) { montado.current = true; cargar(filtros); return; }
    const timer = setTimeout(() => cargar(filtros), 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  useEffect(() => {
    obtenerAreas()
      .then((data) => setAreas(Array.isArray(data) ? data : data?.areas || []))
      .catch(() => setAreas([]));
  }, []);

  const handleChangeFiltro = (key, val) => setFiltros((prev) => ({ ...prev, [key]: val }));

  const limpiarFiltros = () => {
    const r = rangoDefault();
    setFiltros({ fecha_desde: r.fecha_desde, fecha_hasta: r.fecha_hasta, area: "", piso: "", situacion: "", busqueda: "" });
    setFechaAnchor(null);
    setExportAnchor(null);
  };

  const contarActivos = () =>
    (filtros.area ? 1 : 0) + (filtros.piso ? 1 : 0) + (filtros.situacion ? 1 : 0) +
    (filtros.busqueda ? 1 : 0) + (filtros.fecha_desde !== fdInit || filtros.fecha_hasta !== fhInit ? 1 : 0);

  function exportarExcelVisible() {
    setExportAnchor(null);
    const data = rows.map((r, i) => ({
      "#": i + 1,
      Empleado: r.empleado,
      Cédula: r.cedula || "",
      Área: r.area || "",
      Piso: r.piso || "",
      Fecha: r.fecha || "",
      Situación: SITUACION_OPTIONS.find((s) => s.value === r.situacion)?.label || r.situacion,
      Tramo: r.tramo || "",
      Incidencia: r.tiene_incidencia ? (r.incidencia_estado || "Vinculada") : "—",
    }));
    if (data.length === 0) return;
    exportarExcel(data, `Seguimiento_Asistencia_${filtros.fecha_desde}_a_${filtros.fecha_hasta}`);
  }

  async function exportarPDF() {
    setExportAnchor(null);
    setErrorExport("");
    setExportando(true);
    try {
      await descargarPdfSeguimiento(filtros);
    } catch (e) {
      setErrorExport(e?.message || "No se pudo generar el PDF. Verifique su sesión.");
    } finally {
      setExportando(false);
    }
  }

  const verIncidencia = (row) => navigate(`/incidencias/${row.incidencia_id}`);

  const filtrosActivos = contarActivos();

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Typography sx={{ fontSize: 13, color: COLORES.textoMuted }}>
        Inicio / Gestión del personal / Seguimiento de Asistencia
      </Typography>

      {/* COPY SOLO LECTURA (REQ-11) */}
      <Paper elevation={0} sx={{ px: 2, py: 1.4, borderRadius: "14px", border: `1px solid ${COLORES.primarioClaro2}`, bgcolor: COLORES.primarioClaro, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Info size={18} style={{ color: COLORES.primarioOscuro, flexShrink: 0 }} />
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORES.primarioOscuro }}>
            Solo lectura — Use Incidencias para gestionar
          </Typography>
          <Typography sx={{ fontSize: 12, color: COLORES.textoTerciario }}>
            Aquí se consolidan las situaciones de asistencia detectadas. Las aprobaciones, correcciones y registros se hacen desde el módulo de Incidencias.
          </Typography>
        </Box>
      </Paper>

      {/* STAT CARDS (REQ-07): total + 5 situaciones */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)", xl: "repeat(6, 1fr)" }, gap: 2 }}>
        {STAT_CARDS.map((card) => {
          const valor = Number(kpis[card.key]) || 0;
          return (
            <Paper key={card.key} elevation={0} sx={{ p: 2, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", alignItems: "center", gap: 1.5, transition: "all .25s ease", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 15px rgba(0,0,0,.06)" } }}>
              <Box sx={{ width: 40, height: 40, borderRadius: "12px", bgcolor: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>
                {card.icon}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 10, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>{card.label}</Typography>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: card.color, lineHeight: 1.2 }}>{valor}</Typography>
              </Box>
            </Paper>
          );
        })}
      </Box>

      {/* TABLA CON FILTROS */}
      <Paper elevation={0} sx={{ borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}`, overflow: "hidden" }}>
        {/* BARRA DE FILTROS (REQ-09) */}
        <Box sx={{ px: 2, py: 1.4, borderBottom: `1px solid ${COLORES.grisContorno}`, display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <Button onClick={(e) => setFechaAnchor(e.currentTarget)}
            sx={{ borderRadius: "8px", textTransform: "none", fontSize: 12, fontWeight: 500, height: 40, px: 1.5, color: COLORES.textoTerciario, border: `1px solid ${COLORES.borde}`, bgcolor: COLORES.fondoBlanco, whiteSpace: "nowrap", "&:hover": { borderColor: COLORES.primarioOscuro, color: COLORES.primarioOscuro } }}>
            📅 {filtros.fecha_desde || "—"} al {filtros.fecha_hasta || "—"}
          </Button>

          <FormControl size="small" sx={{ minWidth: 140, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12, height: 40, bgcolor: COLORES.fondoBlanco } }}>
            <Select value={filtros.area} displayEmpty onChange={(e) => handleChangeFiltro("area", e.target.value)}
              renderValue={(v) => v || "Área"}
              sx={{ fontSize: 12, "& .MuiSelect-select": { py: "3px 6px" } }}>
              <MenuItem value=""><em>Todas las áreas</em></MenuItem>
              {areas.map((a) => <MenuItem key={a.id ?? a.nombre} value={a.nombre}>{a.nombre}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 100, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12, height: 40, bgcolor: COLORES.fondoBlanco } }}>
            <Select value={filtros.piso} displayEmpty onChange={(e) => handleChangeFiltro("piso", e.target.value)}
              renderValue={(v) => (v ? `Piso ${v}` : "Piso")}
              sx={{ fontSize: 12, "& .MuiSelect-select": { py: "3px 6px" } }}>
              <MenuItem value=""><em>Todos los pisos</em></MenuItem>
              {pisos.map((p) => <MenuItem key={p} value={String(p)}>Piso {p}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12, height: 40, bgcolor: COLORES.fondoBlanco } }}>
            <Select value={filtros.situacion} displayEmpty onChange={(e) => handleChangeFiltro("situacion", e.target.value)}
              renderValue={(v) => SITUACION_OPTIONS.find((s) => s.value === v)?.label || "Situaciones"}
              sx={{ fontSize: 12, "& .MuiSelect-select": { py: "3px 6px" } }}>
              {SITUACION_OPTIONS.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </Select>
          </FormControl>

          <TextField size="small" placeholder="Buscar empleado o cédula..." value={filtros.busqueda}
            onChange={(e) => handleChangeFiltro("busqueda", e.target.value)}
            sx={{ flex: "1 1 200px", minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12, height: 40, bgcolor: COLORES.fondoBlanco }, "& .MuiOutlinedInput-input": { py: "3px 6px" } }}
            slotProps={{ input: { startAdornment: <Search size={13} style={{ color: COLORES.textoSuave, marginRight: 4 }} /> } }} />

          {filtrosActivos > 0 && (
            <Button onClick={limpiarFiltros} startIcon={<FilterX size={14} />}
              sx={{ borderRadius: "8px", textTransform: "none", fontSize: 11, fontWeight: 600, height: 40, px: 1.2, color: COLORES.textoTerciario, border: `1px solid ${COLORES.borde}`, bgcolor: COLORES.fondoBlanco, whiteSpace: "nowrap", "&:hover": { borderColor: COLORES.danger, color: COLORES.danger } }}>
              Limpiar ({filtrosActivos})
            </Button>
          )}
        </Box>

        {/* HEADER TABLA + EXPORT (REQ-12/13) */}
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${COLORES.grisContorno}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario }}>
            Situaciones de asistencia
            <Typography component="span" sx={{ fontSize: 12, color: COLORES.textoSuave, ml: 1, fontWeight: 400 }}>
              ({total} en la ventana)
            </Typography>
          </Typography>
          <Button variant="outlined" startIcon={<Download size={16} />} onClick={(e) => setExportAnchor(e.currentTarget)}
            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, fontSize: 12, height: 40, px: 2, color: COLORES.textoTerciario, borderColor: COLORES.borde, "&:hover": { borderColor: COLORES.primarioOscuro, color: COLORES.primarioOscuro, bgcolor: COLORES.fondoGris } }}>
            Exportar
          </Button>
        </Box>

        <DataTable
          rows={rows}
          columns={seguimientoColumns({
            onDetalle: (row) => setDetalleRow(row),
            onVerIncidencia: verIncidencia,
          })}
          loading={loading}
          pageSize={10}
          getRowId={(r) => `${r.usuario_id}-${r.fecha}`}
          entityLabel="situaciones"
        />
      </Paper>

      {/* MENU EXPORT */}
      <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }} anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{ paper: { sx: { borderRadius: "12px", mt: 0.5, minWidth: 180, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } } }}>
        <MenuItem onClick={exportarExcelVisible} sx={{ borderRadius: "8px", mx: 0.5, fontSize: 13, gap: 1 }} disabled={rows.length === 0}>
          <FileText size={16} /> Exportar Excel
        </MenuItem>
        <MenuItem onClick={exportarPDF} sx={{ borderRadius: "8px", mx: 0.5, fontSize: 13, gap: 1 }} disabled={exportando}>
          <Download size={16} /> {exportando ? "Generando PDF..." : "Exportar PDF"}
        </MenuItem>
        {errorExport && (
          <Typography sx={{ px: 1.5, pb: 1, fontSize: 11, color: COLORES.danger }}>{errorExport}</Typography>
        )}
      </Menu>

      {/* POPOVER RANGO DE FECHAS */}
      <Popover open={Boolean(fechaAnchor)} anchorEl={fechaAnchor} onClose={() => setFechaAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { borderRadius: "12px", mt: 0.5, p: 1.5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } } }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, minWidth: 220 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario }}>Rango de fechas</Typography>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 500, color: COLORES.textoTerciario, mb: 0.3 }}>Desde</Typography>
            <input type="date" value={filtros.fecha_desde}
              onChange={(e) => handleChangeFiltro("fecha_desde", e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: `1px solid ${COLORES.borde2}`, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 500, color: COLORES.textoTerciario, mb: 0.3 }}>Hasta</Typography>
            <input type="date" value={filtros.fecha_hasta}
              onChange={(e) => handleChangeFiltro("fecha_hasta", e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: `1px solid ${COLORES.borde2}`, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </Box>
          <Button size="small" variant="contained" fullWidth onClick={() => setFechaAnchor(null)}
            sx={{ borderRadius: "8px", textTransform: "none", fontSize: 12, bgcolor: COLORES.primarioOscuro, "&:hover": { bgcolor: COLORES.primario } }}>
            Aplicar
          </Button>
        </Box>
      </Popover>

      {/* MODAL DETALLE (REQ-10) */}
      <SeguimientoDetalleModal open={Boolean(detalleRow)} onClose={() => setDetalleRow(null)} row={detalleRow} />

      {/* CHIP "X situaciones activas" de apoyo visual */}
      {filtros.situacion && (
        <Chip
          label={`Mostrando: ${SITUACION_OPTIONS.find((s) => s.value === filtros.situacion)?.label || filtros.situacion}`}
          onDelete={() => handleChangeFiltro("situacion", "")}
          sx={{ position: "fixed", bottom: 16, right: 16, zIndex: 1300, bgcolor: COLORES.primarioOscuro, color: "#fff", borderRadius: "10px", fontWeight: 600, fontSize: 12 }}
        />
      )}
    </Box>
  );
}
