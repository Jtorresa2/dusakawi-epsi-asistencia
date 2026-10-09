import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box, Paper, Typography, TextField, Button, MenuItem, Chip, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Tooltip, IconButton,
  InputAdornment,
} from "@mui/material";
import {
  FileText, CalendarCheck, UserCheck, Plus, CalendarDays, Clock, Sun, Moon,
  Eye, Edit3, Trash2, AlertCircle, ShieldAlert, Search, Filter, Calendar,
  TrendingUp, Users,
} from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import Loading from "../../../shared/components/Loading";
import IconBox from "../../../shared/components/IconBox";
import { obtenerNovedades, eliminarNovedad } from "../novedad.api";
import { obtenerPersonal } from "../../personal/personal.api";
import { obtenerAreas } from "../../areas/area.api";
import NovedadDetailModal from "../components/NovedadDetailModal";
import EditarNovedadModal from "../components/EditarNovedadModal";
import NuevaNovedadModal from "../components/NuevaNovedadModal";
import PageBreadcrumbs from "../../../shared/components/PageBreadcrumbs";
import { COLORES } from "../../../shared/constants/colores.js";
import { PALETA } from "../../../shared/constants/paleta.js";

const inputSx = {
  borderRadius: "10px",
  fontSize: 13,
  height: 40,
  bgcolor: COLORES.fondoGris,
  "& fieldset": { borderColor: PALETA.bordeInput },
  "&:hover fieldset": { borderColor: PALETA.gris },
  "&.Mui-focused fieldset": { borderColor: PALETA.verdeOscuro },
};

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}

function calcularDiasHabiles(desde, hasta) {
  if (!desde || !hasta) return 0;
  const ini = new Date(desde), fin = new Date(hasta);
  if (ini > fin) return 0;
  let count = 0;
  for (let d = new Date(ini); d <= fin; d.setDate(d.getDate() + 1)) {
    const ds = d.getDay();
    if (ds !== 0 && ds !== 6) count++;
  }
  return count;
}

export default function NovedadesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tipoQuery = searchParams.get("tipo") || "todos";
  const areaQuery = searchParams.get("area") || "Todas";
  const detalleQuery = searchParams.get("detalle");

  const [novedades, setNovedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empleados, setEmpleados] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areaFiltro, setAreaFiltro] = useState(() => areaQuery);
  const [tipoFiltro, setTipoFiltro] = useState(() => tipoQuery);
  const [busqueda, setBusqueda] = useState("");

  const [openNuevo, setOpenNuevo] = useState(false);
  const [novedadSeleccionada, setNovedadSeleccionada] = useState(null);
  const [openDetalle, setOpenDetalle] = useState(false);
  const [editModalNovedad, setEditModalNovedad] = useState(null);
  const [eliminando, setEliminando] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const abrirDetalleNovedad = (row) => {
    setNovedadSeleccionada(row);
    setOpenDetalle(true);
    const next = new URLSearchParams(searchParams);
    next.set("detalle", String(row.id));
    setSearchParams(next, { replace: true });
  };

  const cerrarDetalleNovedad = () => {
    setOpenDetalle(false);
    setNovedadSeleccionada(null);
    const next = new URLSearchParams(searchParams);
    next.delete("detalle");
    setSearchParams(next, { replace: true });
  };

  const cambiarTipoFiltro = (nuevo) => {
    setTipoFiltro(nuevo);
    const next = new URLSearchParams(searchParams);
    if (nuevo && nuevo !== "todos") next.set("tipo", nuevo);
    else next.delete("tipo");
    setSearchParams(next, { replace: true });
  };

  const cambiarAreaFiltro = (nuevo) => {
    setAreaFiltro(nuevo);
    const next = new URLSearchParams(searchParams);
    if (nuevo && nuevo !== "Todas") next.set("area", nuevo);
    else next.delete("area");
    setSearchParams(next, { replace: true });
  };

  const cargarDatos = async () => {
    try {
      const [resNov, resEmp, resAreas] = await Promise.all([
        obtenerNovedades().catch(() => ({ novedades: [] })),
        obtenerPersonal().catch(() => []),
        obtenerAreas().catch(() => []),
      ]);
      const novs = resNov.novedades || [];
      setNovedades(novs);
      setEmpleados(resEmp.empleados || resEmp || []);
      setAreas(Array.isArray(resAreas) ? resAreas : resAreas?.areas || []);

      if (detalleQuery) {
        const found = novs.find((n) => String(n.id) === String(detalleQuery));
        if (found) {
          setNovedadSeleccionada(found);
          setOpenDetalle(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const empleadoAreaMap = useMemo(() => {
    return Object.fromEntries(
      empleados.map((emp) => [emp.id, emp.area || emp.area_nombre || ""])
    );
  }, [empleados]);

  const handleEliminar = async () => {
    if (!eliminando) return;
    try {
      await eliminarNovedad(eliminando);
      setSnack({ open: true, msg: "Novedad eliminada correctamente", severity: "success" });
      setEliminando(null);
      const updated = await obtenerNovedades();
      setNovedades(updated.novedades || []);
    } catch (err) {
      setSnack({ open: true, msg: err.message || "Error al eliminar la novedad", severity: "error" });
    }
  };

  // KPIs
  const hoyStr = new Date().toISOString().split("T")[0];
  const ahora = new Date();

  const totalMes = useMemo(() => {
    return novedades.filter((p) => {
      const d = new Date(p.creado_en);
      return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
    }).length;
  }, [novedades, ahora]);

  const activosHoy = useMemo(() => {
    return novedades.filter((p) => p.fecha_desde <= hoyStr && p.fecha_hasta >= hoyStr).length;
  }, [novedades, hoyStr]);

  const programados = useMemo(() => {
    return novedades.filter((p) => p.fecha_desde > hoyStr).length;
  }, [novedades, hoyStr]);

  const incapacidadesMes = useMemo(() => {
    return novedades.filter((p) => {
      const d = new Date(p.creado_en);
      return (
        p.tipo_novedad === "sick_leave" &&
        d.getMonth() === ahora.getMonth() &&
        d.getFullYear() === ahora.getFullYear()
      );
    }).length;
  }, [novedades, ahora]);

  // Filtrado de la tabla
  const novedadesFiltradas = useMemo(() => {
    return novedades.filter((p) => {
      // Filtro área
      if (areaFiltro !== "Todas") {
        const areaEmp = empleadoAreaMap[p.usuario_id] || p.area || "";
        if (areaEmp !== areaFiltro) return false;
      }

      // Filtro tipo
      if (tipoFiltro !== "todos") {
        if (tipoFiltro === "otros") {
          if (["permission", "vacation", "sick_leave", "commission"].includes(p.tipo_novedad)) {
            return false;
          }
        } else if (p.tipo_novedad !== tipoFiltro) {
          return false;
        }
      }

      // Buscador
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const nom = `${p.empleado_nombre || ""} ${p.empleado_apellido || ""}`.toLowerCase();
        const mot = (p.motivo || "").toLowerCase();
        const reg = (p.registrado_por_nombre || "").toLowerCase();
        return nom.includes(q) || mot.includes(q) || reg.includes(q);
      }

      return true;
    });
  }, [novedades, areaFiltro, tipoFiltro, busqueda, empleadoAreaMap]);

  // Columnas para DataTable
  const cols = [
    {
      field: "empleado_nombre",
      headerName: "Empleado",
      width: 220,
      renderCell: ({ row }) => {
        const nombreCompleto = `${row.empleado_nombre || ""} ${row.empleado_apellido || ""}`.trim() || "—";
        const area = empleadoAreaMap[row.usuario_id] || row.area || "";
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 0.5 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: 11.5,
                fontWeight: 700,
                bgcolor: PALETA.verdeClaro,
                color: PALETA.verdeOscuro,
              }}
            >
              {getInitials(nombreCompleto)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: PALETA.texto,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {nombreCompleto}
              </Typography>
              {area && (
                <Typography sx={{ fontSize: 11, color: PALETA.grisTexto, lineHeight: 1.1 }}>
                  {area}
                </Typography>
              )}
            </Box>
          </Box>
        );
      },
    },
    {
      field: "tipo_novedad",
      headerName: "Tipo de excepción",
      width: 150,
      renderCell: ({ row }) => {
        const t = row.tipo_novedad || "permission";
        const cfg = {
          permission: { label: "Permiso", color: COLORES.primario, bg: COLORES.primarioClaro2, icon: <FileText size={12} /> },
          vacation: { label: "Vacaciones", color: PALETA.verdeOscuro, bg: PALETA.verdeClaro, icon: <CalendarDays size={12} /> },
          sick_leave: { label: "Incapacidad", color: PALETA.rojo, bg: COLORES.dangerFondo, icon: <AlertCircle size={12} /> },
          commission: { label: "Comisión", color: COLORES.warningOscuro, bg: COLORES.warningFondo, icon: <UserCheck size={12} /> },
          license: { label: "Licencia", color: COLORES.verdeTexto, bg: COLORES.successClaro, icon: <FileText size={12} /> },
          suspension: { label: "Suspensión", color: PALETA.grisTexto, bg: PALETA.grisClaro, icon: <ShieldAlert size={12} /> },
        }[t] || { label: t, color: PALETA.texto, bg: PALETA.grisClaro, icon: <FileText size={12} /> };
        return (
          <Chip
            icon={cfg.icon}
            label={cfg.label}
            size="small"
            sx={{ fontWeight: 600, fontSize: 11, bgcolor: cfg.bg, color: cfg.color, borderRadius: "8px" }}
          />
        );
      },
    },
    {
      field: "tipo",
      headerName: "Modalidad",
      width: 135,
      renderCell: ({ row }) => {
        const t = row.tipo || "full_day";
        const cfg = {
          full_day: { label: "Día completo", color: PALETA.texto, bg: COLORES.fondoGris, icon: <CalendarDays size={12} /> },
          morning: { label: "Mañana", color: COLORES.warningOscuro, bg: COLORES.warningFondo, icon: <Sun size={12} /> },
          afternoon: { label: "Tarde", color: COLORES.primarioOscuro, bg: COLORES.primarioClaro, icon: <Moon size={12} /> },
          hours: { label: "Por horas", color: COLORES.primario, bg: COLORES.primarioClaro2, icon: <Clock size={12} /> },
        }[t];
        return (
          <Chip
            icon={cfg?.icon}
            label={cfg?.label || t}
            size="small"
            sx={{ fontWeight: 600, fontSize: 11, bgcolor: cfg?.bg || COLORES.fondoGris, color: cfg?.color || PALETA.texto, borderRadius: "8px" }}
          />
        );
      },
    },
    {
      field: "vigencia",
      headerName: "Período / Vigencia",
      width: 190,
      renderCell: ({ row }) => {
        const d1 = row.fecha_desde ? new Date(row.fecha_desde).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—";
        const d2 = row.fecha_hasta ? new Date(row.fecha_hasta).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—";
        const dias = calcularDiasHabiles(row.fecha_desde, row.fecha_hasta);
        const horarioHoras = row.tipo === "hours" && row.hora_desde ? `${(row.hora_desde || "").substring(0, 5)} - ${(row.hora_hasta || "").substring(0, 5)}` : null;

        return (
          <Box sx={{ py: 0.5 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: PALETA.texto }}>
              {d1 === d2 ? d1 : `${d1} al ${d2}`}
            </Typography>
            <Typography sx={{ fontSize: 11, color: PALETA.grisTexto }}>
              {horarioHoras ? horarioHoras : `${dias} día(s) hábil(es)`}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "motivo",
      headerName: "Motivo / Justificación",
      width: 220,
      renderCell: ({ row }) => (
        <Tooltip title={row.motivo || ""} arrow placement="top">
          <Typography
            sx={{
              fontSize: 12.5,
              color: PALETA.texto,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {row.motivo || "—"}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: "registrado_por_nombre",
      headerName: "Registrado por",
      width: 150,
      renderCell: ({ row }) => (
        <Typography sx={{ fontSize: 12, color: PALETA.grisTexto }}>
          {row.registrado_por_nombre || "Sistema"}
        </Typography>
      ),
    },
    {
      field: "acciones",
      headerName: "Acciones",
      width: 115,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
          <Tooltip title="Ver detalle">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                abrirDetalleNovedad(row);
              }}
              sx={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                bgcolor: PALETA.verdeClaro,
                color: PALETA.verdeOscuro,
                "&:hover": { bgcolor: COLORES.primarioClaro2 },
              }}
            >
              <Eye size={14} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setEditModalNovedad(row);
              }}
              sx={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                bgcolor: COLORES.fondoGris2,
                color: COLORES.textoSecundario,
                "&:hover": { bgcolor: COLORES.borde2 },
              }}
            >
              <Edit3 size={14} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setEliminando(row.id);
              }}
              sx={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                bgcolor: COLORES.dangerFondo,
                color: PALETA.rojo,
                "&:hover": { bgcolor: COLORES.dangerBorde },
              }}
            >
              <Trash2 size={14} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (loading) return <Loading texto="Cargando novedades laborales..." />;

  const tabsFiltro = [
    { id: "todos", label: "Todas", count: novedades.length },
    { id: "permission", label: "Permisos", count: novedades.filter((n) => n.tipo_novedad === "permission").length },
    { id: "vacation", label: "Vacaciones", count: novedades.filter((n) => n.tipo_novedad === "vacation").length },
    { id: "sick_leave", label: "Incapacidades", count: novedades.filter((n) => n.tipo_novedad === "sick_leave").length },
    { id: "commission", label: "Comisiones", count: novedades.filter((n) => n.tipo_novedad === "commission").length },
    { id: "otros", label: "Otros", count: novedades.filter((n) => !["permission", "vacation", "sick_leave", "commission"].includes(n.tipo_novedad)).length },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: COLORES.grisAzulado, minHeight: "100vh", display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <PageBreadcrumbs
          items={["Gestión del personal", "Novedades Laborales"]}
          sx={{ mb: 0 }}
        />
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={() => setOpenNuevo(true)}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            fontSize: 13,
            height: 40,
            px: 2.5,
            bgcolor: PALETA.verdeOscuro,
            "&:hover": { bgcolor: PALETA.verde },
            boxShadow: "0 4px 12px rgba(27, 94, 32, 0.20)",
          }}
        >
          Nueva novedad
        </Button>
      </Box>

      {/* Tarjetas resumen KPI */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2 }}>
        {[
          { icon: <CalendarCheck size={18} />, value: activosHoy, label: "Con novedad", color: PALETA.verdeOscuro, bg: PALETA.verdeClaro },
          { icon: <FileText size={18} />, value: totalMes, label: "Registradas", color: COLORES.primario, bg: COLORES.primarioClaro },
          { icon: <CalendarDays size={18} />, value: programados, label: "Programadas", color: COLORES.warningOscuro, bg: COLORES.warningFondo },
          { icon: <AlertCircle size={18} />, value: incapacidadesMes, label: "Incapacidades", color: PALETA.rojo, bg: COLORES.dangerFondo },
        ].map((card, i) => (
          <Paper
            key={i}
            elevation={0}
            sx={{
              py: 1.25,
              px: 2,
              borderRadius: "14px",
              border: `1px solid ${PALETA.borde}`,
              bgcolor: COLORES.fondoBlanco,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                bgcolor: card.bg,
                color: card.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {card.icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: PALETA.grisTexto, textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1.1 }}>
                {card.label}
              </Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: PALETA.texto, lineHeight: 1.15, mt: 0.25 }}>
                {card.value}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Contenedor Principal: Filtros y Tabla */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "18px",
          border: `1px solid ${PALETA.borde}`,
          bgcolor: COLORES.fondoBlanco,
          p: 2.5,
          boxShadow: "0 2px 14px rgba(0,0,0,0.03)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* Barra superior de filtros */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
          {/* Pestañas de tipo */}
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              bgcolor: COLORES.fondoGris,
              p: 0.5,
              borderRadius: "12px",
              border: `1px solid ${PALETA.borde}`,
              overflowX: "auto",
              maxWidth: "100%",
            }}
          >
            {tabsFiltro.map((tab) => {
              const sel = tipoFiltro === tab.id;
              return (
                <Button
                  key={tab.id}
                  size="small"
                  onClick={() => cambiarTipoFiltro(tab.id)}
                  sx={{
                    py: 0.5,
                    px: 1.5,
                    fontSize: 12,
                    fontWeight: sel ? 700 : 500,
                    textTransform: "none",
                    borderRadius: "8px",
                    bgcolor: sel ? COLORES.fondoBlanco : "transparent",
                    color: sel ? PALETA.verdeOscuro : PALETA.grisTexto,
                    boxShadow: sel ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
                    whiteSpace: "nowrap",
                    "&:hover": { bgcolor: sel ? COLORES.fondoBlanco : PALETA.grisClaro },
                  }}
                >
                  {tab.label} ({tab.count})
                </Button>
              );
            })}
          </Box>

          {/* Buscador y Área */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", ml: "auto" }}>
            <TextField
              select
              size="small"
              value={areaFiltro}
              onChange={(e) => cambiarAreaFiltro(e.target.value)}
              sx={{ minWidth: 160, ...inputSx }}
            >
              <MenuItem value="Todas">Todas las áreas</MenuItem>
              {areas.map((a) => (
                <MenuItem key={a.id} value={a.nombre}>
                  {a.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              placeholder="Buscar empleado o motivo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              sx={{ width: { xs: "100%", sm: 240 }, ...inputSx }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={15} color={PALETA.gris} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        </Box>

        {/* Tabla DataTable */}
        <DataTable
          rows={novedadesFiltradas}
          columns={cols}
          entityLabel="novedades"
          getRowId={(r) => r.id}
          pageSize={10}
        />
      </Paper>

      {/* Modal Registrar Nueva Novedad */}
      <NuevaNovedadModal
        open={openNuevo}
        onClose={() => setOpenNuevo(false)}
        empleados={empleados}
        areas={areas}
        onSaved={async () => {
          const updated = await obtenerNovedades();
          setNovedades(updated.novedades || []);
        }}
        onNotificar={(msg, sev = "success") => setSnack({ open: true, msg, severity: sev })}
      />

      {/* Modal Detalle de Novedad */}
      <NovedadDetailModal
        open={openDetalle}
        onClose={cerrarDetalleNovedad}
        novedad={novedadSeleccionada}
      />

      {/* Modal Editar Novedad */}
      <EditarNovedadModal
        open={Boolean(editModalNovedad)}
        onClose={() => setEditModalNovedad(null)}
        novedad={editModalNovedad}
        empleados={empleados}
        onSaved={async () => {
          const updated = await obtenerNovedades();
          setNovedades(updated.novedades || []);
          setSnack({ open: true, msg: "Novedad actualizada correctamente", severity: "success" });
        }}
      />

      {/* Dialog Confirmar Eliminación */}
      <Dialog
        open={Boolean(eliminando)}
        onClose={() => setEliminando(null)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "18px",
              maxWidth: 420,
              p: 1,
              bgcolor: COLORES.fondoBlanco,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: PALETA.texto, pb: 0.5 }}>
          Eliminar excepción laboral
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Typography sx={{ fontSize: 13.5, color: PALETA.grisTexto }}>
            ¿Estás seguro de que deseas eliminar este registro de novedad? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
          <Button
            onClick={() => setEliminando(null)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: 13,
              color: PALETA.grisTexto,
              borderRadius: "10px",
              px: 2.5,
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleEliminar}
            variant="contained"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: 13,
              borderRadius: "10px",
              px: 2.5,
              bgcolor: PALETA.rojo,
              "&:hover": { bgcolor: COLORES.dangerOscuro2 },
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notificaciones Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
        message={snack.msg}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        ContentProps={{
          sx: {
            borderRadius: "12px",
            fontWeight: 600,
            fontSize: 13,
            bgcolor: snack.severity === "error" ? PALETA.rojo : PALETA.verdeOscuro,
            color: COLORES.fondoBlanco,
            boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
          },
        }}
      />
    </Box>
  );
}
