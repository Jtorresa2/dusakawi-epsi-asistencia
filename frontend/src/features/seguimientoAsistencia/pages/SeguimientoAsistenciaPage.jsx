import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, Button, Chip, Menu, MenuItem, FormControl, Select,
  Popover, TextField, Tooltip,
} from "@mui/material";
import {
  Users, CalendarX2, Sunrise, Sunset, LogOut, Clock3, Search, Download,
  FileText, Info, FilterX, CalendarDays, Check,
} from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import { exportarExcel } from "../../../shared/utils/exportarExcel";
import { COLORES } from "../../../shared/constants/colores.js";
import { PALETA } from "../../../shared/constants/paleta.js";
import { obtenerSeguimiento, descargarPdfSeguimiento } from "../seguimientoAsistencia.api";
import { obtenerAreas } from "../../areas/area.api";
import { seguimientoColumns } from "../components/columns";
import SeguimientoDetalleModal from "../components/SeguimientoDetalleModal";
import PageBreadcrumbs from "../../../shared/components/PageBreadcrumbs";
import useRol from "../../../shared/hooks/useRol";

const SITUACION_OPTIONS = [
  { value: "", label: "Todas las situaciones" },
  { value: "absence", label: "Ausencia" },
  { value: "missing_morning", label: "Falta mañana" },
  { value: "missing_afternoon", label: "Falta tarde" },
  { value: "unregistered_exit", label: "Salida no registrada" },
  { value: "open_day", label: "Jornada abierta" },
];

const STAT_CARDS = [
  { key: "total", label: "Total situaciones", icon: <Users size={19} />, color: PALETA.verdeOscuro, bg: PALETA.verdeClaro },
  { key: "absence", label: "Ausencias", icon: <CalendarX2 size={19} />, color: COLORES.dangerOscuro, bg: COLORES.dangerFondo },
  { key: "missing_morning", label: "Falta mañana", icon: <Sunrise size={19} />, color: COLORES.warningOscuro, bg: COLORES.warningFondo },
  { key: "missing_afternoon", label: "Falta tarde", icon: <Sunset size={19} />, color: COLORES.warningOscuro2, bg: "#FEF3C7" },
  { key: "unregistered_exit", label: "Salida no reg.", icon: <LogOut size={19} />, color: COLORES.textoMuted, bg: COLORES.fondoGris2 },
  { key: "open_day", label: "Jornada abierta", icon: <Clock3 size={19} />, color: COLORES.verdeTexto, bg: COLORES.successFondo },
];

const KPIS_DEFAULT = {
  total: 0,
  absence: 0,
  missing_morning: 0,
  missing_afternoon: 0,
  unregistered_exit: 0,
  open_day: 0,
};

/** 'YYYY-MM-DD' en zona local */
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
  const { puede } = useRol();
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
    if (!montado.current) {
      montado.current = true;
      cargar(filtros);
      return;
    }
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

  const handleCardClick = (cardKey) => {
    if (cardKey === "total") {
      handleChangeFiltro("situacion", "");
    } else {
      handleChangeFiltro("situacion", filtros.situacion === cardKey ? "" : cardKey);
    }
  };

  const limpiarFiltros = () => {
    const r = rangoDefault();
    setFiltros({
      fecha_desde: r.fecha_desde,
      fecha_hasta: r.fecha_hasta,
      area: "",
      piso: "",
      situacion: "",
      busqueda: "",
    });
    setFechaAnchor(null);
    setExportAnchor(null);
  };

  const contarActivos = () =>
    (filtros.area ? 1 : 0) +
    (filtros.piso ? 1 : 0) +
    (filtros.situacion ? 1 : 0) +
    (filtros.busqueda ? 1 : 0) +
    (filtros.fecha_desde !== fdInit || filtros.fecha_hasta !== fhInit ? 1 : 0);

  const aplicarShortcutFecha = (tipo) => {
    const hoy = new Date();
    if (tipo === "hoy") {
      const f = fmtLocal(hoy);
      setFiltros((prev) => ({ ...prev, fecha_desde: f, fecha_hasta: f }));
    } else if (tipo === "ayer") {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const f = fmtLocal(ayer);
      setFiltros((prev) => ({ ...prev, fecha_desde: f, fecha_hasta: f }));
    } else if (tipo === "7dias") {
      const hace7 = new Date();
      hace7.setDate(hace7.getDate() - 6);
      setFiltros((prev) => ({ ...prev, fecha_desde: fmtLocal(hace7), fecha_hasta: fmtLocal(hoy) }));
    } else if (tipo === "mes") {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      setFiltros((prev) => ({ ...prev, fecha_desde: fmtLocal(primerDia), fecha_hasta: fmtLocal(hoy) }));
    }
    setFechaAnchor(null);
  };

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

  const filtrosActivos = contarActivos();

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* BREADCRUMB */}
      <PageBreadcrumbs
        items={["Gestión del personal", "Seguimiento de Asistencia"]}
        sx={{ mb: 0 }}
      />

      {/* BANNER INFORMATIVO */}
      <Paper
        elevation={0}
        sx={{
          px: 2.25,
          py: 1.5,
          borderRadius: "14px",
          border: `1px solid ${COLORES.primarioClaro2}`,
          bgcolor: COLORES.primarioClaro,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Info size={19} style={{ color: PALETA.verdeOscuro, flexShrink: 0 }} />
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.verdeOscuro }}>
            Monitoreo y Control de Jornadas
          </Typography>
          <Typography sx={{ fontSize: 12, color: PALETA.grisTexto, mt: 0.15 }}>
            Consolidado en tiempo real de incidencias de asistencia (ausencias, faltas en jornada y salidas pendientes).
            Haz clic en cualquiera de las tarjetas de métricas para filtrar al instante.
          </Typography>
        </Box>
      </Paper>

      {/* STAT CARDS INTERACTIVAS COMO FILTROS RÁPIDOS */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)", xl: "repeat(6, 1fr)" },
          gap: 1.75,
        }}
      >
        {STAT_CARDS.map((card) => {
          const valor = Number(kpis[card.key]) || 0;
          const esActivo = card.key === "total" ? !filtros.situacion : filtros.situacion === card.key;

          return (
            <Tooltip
              key={card.key}
              title={
                card.key === "total"
                  ? "Ver todas las situaciones"
                  : `Filtrar por: ${card.label} (clic para alternar)`
              }
              arrow
            >
              <Paper
                elevation={0}
                onClick={() => handleCardClick(card.key)}
                sx={{
                  p: 1.75,
                  borderRadius: "14px",
                  border: esActivo ? `2px solid ${card.color}` : `1.5px solid ${COLORES.grisContorno}`,
                  bgcolor: esActivo ? card.bg : COLORES.fondoBlanco,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "all .2s ease",
                  boxShadow: esActivo ? `0 4px 14px ${card.color}25` : "none",
                  transform: esActivo ? "translateY(-2px)" : "none",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    borderColor: card.color,
                    boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: "10px",
                    bgcolor: esActivo ? COLORES.fondoBlanco : card.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: card.color,
                    flexShrink: 0,
                    boxShadow: esActivo ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {card.icon}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: esActivo ? card.color : COLORES.textoSuave,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                      whiteSpace: "nowrap",
                    }}
                    noWrap
                  >
                    {card.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: card.color,
                      lineHeight: 1.15,
                    }}
                  >
                    {valor}
                  </Typography>
                </Box>
              </Paper>
            </Tooltip>
          );
        })}
      </Box>

      {/* TABLA CON FILTROS */}
      <Paper elevation={0} sx={{ borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}`, overflow: "hidden" }}>
        {/* BARRA DE FILTROS */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: `1px solid ${COLORES.grisContorno}`,
            display: "flex",
            gap: 1,
            alignItems: "center",
            flexWrap: "wrap",
            bgcolor: COLORES.fondoGris,
          }}
        >
          {/* Botón Selector de Fecha */}
          <Button
            onClick={(e) => setFechaAnchor(e.currentTarget)}
            startIcon={<CalendarDays size={15} color={PALETA.verdeOscuro} />}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontSize: 12,
              fontWeight: 600,
              height: 38,
              px: 1.5,
              color: PALETA.texto,
              border: `1px solid ${PALETA.bordeInput}`,
              bgcolor: COLORES.fondoBlanco,
              whiteSpace: "nowrap",
              "&:hover": { borderColor: PALETA.verdeOscuro, bgcolor: COLORES.fondoBlanco },
            }}
          >
            {filtros.fecha_desde || "—"} al {filtros.fecha_hasta || "—"}
          </Button>

          {/* Filtro Área */}
          <FormControl
            size="small"
            sx={{
              minWidth: 140,
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                fontSize: 12,
                height: 38,
                bgcolor: COLORES.fondoBlanco,
                "& fieldset": { borderColor: PALETA.bordeInput },
                "&:hover fieldset": { borderColor: PALETA.gris },
                "&.Mui-focused fieldset": { borderColor: PALETA.verdeOscuro },
              },
            }}
          >
            <Select
              value={filtros.area}
              displayEmpty
              onChange={(e) => handleChangeFiltro("area", e.target.value)}
              renderValue={(v) => v || "Área"}
              sx={{ fontSize: 12 }}
            >
              <MenuItem value=""><em>Todas las áreas</em></MenuItem>
              {areas.map((a) => (
                <MenuItem key={a.id ?? a.nombre} value={a.nombre}>
                  {a.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Filtro Piso */}
          <FormControl
            size="small"
            sx={{
              minWidth: 100,
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                fontSize: 12,
                height: 38,
                bgcolor: COLORES.fondoBlanco,
                "& fieldset": { borderColor: PALETA.bordeInput },
                "&:hover fieldset": { borderColor: PALETA.gris },
                "&.Mui-focused fieldset": { borderColor: PALETA.verdeOscuro },
              },
            }}
          >
            <Select
              value={filtros.piso}
              displayEmpty
              onChange={(e) => handleChangeFiltro("piso", e.target.value)}
              renderValue={(v) => (v ? `Piso ${v}` : "Piso")}
              sx={{ fontSize: 12 }}
            >
              <MenuItem value=""><em>Todos los pisos</em></MenuItem>
              {pisos.map((p) => (
                <MenuItem key={p} value={String(p)}>
                  Piso {p}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Filtro Situación */}
          <FormControl
            size="small"
            sx={{
              minWidth: 190,
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                fontSize: 12,
                height: 38,
                bgcolor: COLORES.fondoBlanco,
                "& fieldset": { borderColor: PALETA.bordeInput },
                "&:hover fieldset": { borderColor: PALETA.gris },
                "&.Mui-focused fieldset": { borderColor: PALETA.verdeOscuro },
              },
            }}
          >
            <Select
              value={filtros.situacion}
              displayEmpty
              onChange={(e) => handleChangeFiltro("situacion", e.target.value)}
              renderValue={(v) => SITUACION_OPTIONS.find((s) => s.value === v)?.label || "Situaciones"}
              sx={{ fontSize: 12 }}
            >
              {SITUACION_OPTIONS.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Buscador libre */}
          <TextField
            size="small"
            placeholder="Buscar por empleado o documento..."
            value={filtros.busqueda}
            onChange={(e) => handleChangeFiltro("busqueda", e.target.value)}
            sx={{
              flex: "1 1 200px",
              minWidth: 200,
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                fontSize: 12.5,
                height: 38,
                bgcolor: COLORES.fondoBlanco,
                "& fieldset": { borderColor: PALETA.bordeInput },
                "&:hover fieldset": { borderColor: PALETA.gris },
                "&.Mui-focused fieldset": { borderColor: PALETA.verdeOscuro },
              },
            }}
            slotProps={{
              input: {
                startAdornment: <Search size={14} style={{ color: PALETA.gris, marginRight: 6 }} />,
              },
            }}
          />

          {/* Limpiar filtros */}
          {filtrosActivos > 0 && (
            <Button
              onClick={limpiarFiltros}
              startIcon={<FilterX size={14} />}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontSize: 11.5,
                fontWeight: 600,
                height: 38,
                px: 1.5,
                color: PALETA.rojo,
                border: `1px solid ${PALETA.rojoBg}`,
                bgcolor: PALETA.rojoBg,
                whiteSpace: "nowrap",
                "&:hover": { borderColor: PALETA.rojo, bgcolor: "#FEE2E2" },
              }}
            >
              Limpiar ({filtrosActivos})
            </Button>
          )}
        </Box>

        {/* HEADER TABLA + EXPORT */}
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            borderBottom: `1px solid ${COLORES.grisContorno}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario }}>
              Situaciones de asistencia
              <Typography component="span" sx={{ fontSize: 12, color: COLORES.textoSuave, ml: 1, fontWeight: 400 }}>
                ({total} en la ventana)
              </Typography>
            </Typography>

            {/* Chip de filtro activo integrado (no flotante) */}
            {filtros.situacion && (
              <Chip
                label={`Filtro: ${SITUACION_OPTIONS.find((s) => s.value === filtros.situacion)?.label || filtros.situacion}`}
                onDelete={() => handleChangeFiltro("situacion", "")}
                size="small"
                sx={{
                  bgcolor: PALETA.verdeClaro,
                  color: PALETA.verdeOscuro,
                  fontWeight: 600,
                  fontSize: 11.5,
                  borderRadius: "8px",
                  "& .MuiChip-deleteIcon": { color: PALETA.verdeOscuro },
                }}
              />
            )}
          </Box>

          {puede("seguimiento", "exportar") && (
            <Button
              variant="outlined"
              startIcon={<Download size={15} />}
              onClick={(e) => setExportAnchor(e.currentTarget)}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: 12.5,
                height: 38,
                px: 2,
                color: PALETA.texto,
                borderColor: PALETA.bordeInput,
                bgcolor: COLORES.fondoBlanco,
                "&:hover": {
                  borderColor: PALETA.verdeOscuro,
                  color: PALETA.verdeOscuro,
                  bgcolor: PALETA.verdeMuySuave,
                },
              }}
            >
              Exportar
            </Button>
          )}
        </Box>

        <DataTable
          rows={rows}
          columns={seguimientoColumns({
            onDetalle: (row) => setDetalleRow(row),
          })}
          loading={loading}
          pageSize={10}
          getRowId={(r) => `${r.usuario_id}-${r.fecha}`}
          entityLabel="situaciones"
        />
      </Paper>

      {/* MENU EXPORT */}
      <Menu
        anchorEl={exportAnchor}
        open={Boolean(exportAnchor)}
        onClose={() => setExportAnchor(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "14px",
              mt: 0.5,
              minWidth: 180,
              boxShadow: "0 10px 25px rgba(0,0,0,0.10)",
              p: 0.5,
            },
          },
        }}
      >
        <MenuItem
          onClick={exportarExcelVisible}
          sx={{ borderRadius: "8px", fontSize: 13, gap: 1 }}
          disabled={rows.length === 0}
        >
          <FileText size={16} /> Exportar Excel (.xlsx)
        </MenuItem>
        <MenuItem
          onClick={exportarPDF}
          sx={{ borderRadius: "8px", fontSize: 13, gap: 1 }}
          disabled={exportando}
        >
          <Download size={16} /> {exportando ? "Generando PDF..." : "Exportar PDF"}
        </MenuItem>
        {errorExport && (
          <Typography sx={{ px: 1.5, pb: 1, fontSize: 11, color: COLORES.danger }}>
            {errorExport}
          </Typography>
        )}
      </Menu>

      {/* POPOVER RANGO DE FECHAS CON SHORTCUTS */}
      <Popover
        open={Boolean(fechaAnchor)}
        anchorEl={fechaAnchor}
        onClose={() => setFechaAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "16px",
              mt: 0.75,
              p: 2,
              boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
              minWidth: 260,
            },
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto }}>
            Rango de fechas
          </Typography>

          {/* Accesos rápidos */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75 }}>
            <Button
              size="small"
              onClick={() => aplicarShortcutFecha("hoy")}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontSize: 11.5,
                bgcolor: COLORES.fondoGris,
                color: PALETA.texto,
                "&:hover": { bgcolor: PALETA.verdeClaro, color: PALETA.verdeOscuro },
              }}
            >
              Hoy
            </Button>
            <Button
              size="small"
              onClick={() => aplicarShortcutFecha("ayer")}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontSize: 11.5,
                bgcolor: COLORES.fondoGris,
                color: PALETA.texto,
                "&:hover": { bgcolor: PALETA.verdeClaro, color: PALETA.verdeOscuro },
              }}
            >
              Ayer
            </Button>
            <Button
              size="small"
              onClick={() => aplicarShortcutFecha("7dias")}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontSize: 11.5,
                bgcolor: COLORES.fondoGris,
                color: PALETA.texto,
                "&:hover": { bgcolor: PALETA.verdeClaro, color: PALETA.verdeOscuro },
              }}
            >
              Últimos 7 días
            </Button>
            <Button
              size="small"
              onClick={() => aplicarShortcutFecha("mes")}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontSize: 11.5,
                bgcolor: COLORES.fondoGris,
                color: PALETA.texto,
                "&:hover": { bgcolor: PALETA.verdeClaro, color: PALETA.verdeOscuro },
              }}
            >
              Este mes
            </Button>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: PALETA.grisTexto, mb: 0.3 }}>
                Fecha desde
              </Typography>
              <TextField
                type="date"
                size="small"
                fullWidth
                value={filtros.fecha_desde}
                onChange={(e) => handleChangeFiltro("fecha_desde", e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    fontSize: 12.5,
                    height: 36,
                    "& fieldset": { borderColor: PALETA.bordeInput },
                    "&.Mui-focused fieldset": { borderColor: PALETA.verdeOscuro },
                  },
                }}
              />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: PALETA.grisTexto, mb: 0.3 }}>
                Fecha hasta
              </Typography>
              <TextField
                type="date"
                size="small"
                fullWidth
                value={filtros.fecha_hasta}
                onChange={(e) => handleChangeFiltro("fecha_hasta", e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    fontSize: 12.5,
                    height: 36,
                    "& fieldset": { borderColor: PALETA.bordeInput },
                    "&.Mui-focused fieldset": { borderColor: PALETA.verdeOscuro },
                  },
                }}
              />
            </Box>
          </Box>

          <Button
            size="small"
            variant="contained"
            fullWidth
            onClick={() => setFechaAnchor(null)}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontSize: 12.5,
              fontWeight: 600,
              bgcolor: PALETA.verdeOscuro,
              "&:hover": { bgcolor: PALETA.verde },
            }}
          >
            Aplicar rango
          </Button>
        </Box>
      </Popover>

      {/* MODAL DETALLE */}
      <SeguimientoDetalleModal
        open={Boolean(detalleRow)}
        onClose={() => setDetalleRow(null)}
        row={detalleRow}
      />
    </Box>
  );
}
