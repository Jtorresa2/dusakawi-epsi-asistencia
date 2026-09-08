import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, TextField, Button, MenuItem, Chip, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import {
  FileText, CalendarCheck, UserCheck, Plus, CalendarDays, Clock, Sun, Moon,
  Eye, Pencil, Trash2, AlertCircle, ShieldAlert,
} from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import Loading from "../../../shared/components/Loading";
import { obtenerNovedades, crearNovedad, eliminarNovedad } from "../novedad.api";
import { obtenerPersonal } from "../../personal/personal.api";
import { obtenerAreas } from "../../areas/area.api";
import NovedadDetailModal from "../components/NovedadDetailModal";
import EditarNovedadModal from "../components/EditarNovedadModal";
import { COLORES } from "../../../shared/constants/colores.js";

const estiloBtn = {
  width: 30, height: 30, borderRadius: "8px", border: "none",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", flexShrink: 0, transition: "all .2s ease",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    background: COLORES.fondoBlanco,
    "& fieldset": { borderColor: COLORES.textoPrimario },
    "&:hover fieldset": { borderColor: COLORES.textoPrimario },
    "&.Mui-focused fieldset": { borderColor: COLORES.textoPrimario },
  },
  "& .MuiInputLabel-root": { fontSize: 13, color: COLORES.textoTerciario },
  "& .MuiInputBase-input": { fontSize: 13 },
};

export default function NovedadesPage() {
  const [novedades, setNovedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empleados, setEmpleados] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areaFiltro, setAreaFiltro] = useState("Todas");
  const [busqueda, setBusqueda] = useState("");

  const [form, setForm] = useState({ usuario_id: "", fecha_desde: "", fecha_hasta: "", motivo: "", tipo_novedad: "permiso", modalidad: "dia_completo", hora_desde: "", hora_hasta: "" });
  const [guardando, setGuardando] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const [novedadSeleccionada, setNovedadSeleccionada] = useState(null);
  const [openDetalle, setOpenDetalle] = useState(false);
  const [editModalNovedad, setEditModalNovedad] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  useEffect(() => {
    obtenerNovedades().then((p) => setNovedades(p.novedades || [])).catch(() => {});
    obtenerPersonal().then((e) => setEmpleados(e.empleados || e || [])).catch(() => {});
    obtenerAreas().then((a) => setAreas(Array.isArray(a) ? a : a?.areas || [])).catch(() => {});
    setLoading(false);
  }, []);

  const empleadoAreaMap = Object.fromEntries(
    (empleados).map((emp) => [emp.id, emp.area || emp.area_nombre || ""])
  );

  const empleadosFiltrados = areaFiltro === "Todas"
    ? empleados
    : empleados.filter((emp) => empleadoAreaMap[emp.id] === areaFiltro);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "tipo_novedad") {
      if (value !== "permiso") {
        setForm({ ...form, tipo_novedad: value, modalidad: "dia_completo", hora_desde: "", hora_hasta: "" });
      } else {
        setForm({ ...form, tipo_novedad: value });
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleGuardar = async () => {
    if (!form.usuario_id || !form.fecha_desde || !form.fecha_hasta || !form.motivo.trim()) {
      setSnack({ open: true, msg: "Todos los campos son obligatorios", severity: "error" });
      return;
    }
    if (form.fecha_desde > form.fecha_hasta) {
      setSnack({ open: true, msg: "La fecha 'hasta' debe ser mayor o igual a 'desde'", severity: "error" });
      return;
    }
    if (form.modalidad === "horas" && (!form.hora_desde || !form.hora_hasta)) {
      setSnack({ open: true, msg: "Indicá las horas desde y hasta para la novedad por horas", severity: "error" });
      return;
    }
    if (form.modalidad === "horas" && form.hora_desde >= form.hora_hasta) {
      setSnack({ open: true, msg: "La hora 'hasta' debe ser posterior a 'desde'", severity: "error" });
      return;
    }
    setGuardando(true);
    try {
      const tipoLabel = { dia_completo: "día completo", horas: "por horas", manana: "solo mañana", tarde: "solo tarde" }[form.modalidad] || "";
      const res = await crearNovedad(form);
      setSnack({
        open: true, severity: "success",
        msg: `Novedad registrada (${tipoLabel})${res.dias_generados ? form.tipo_novedad === "comision" ? ` — ${res.dias_generados} día(s) en comisión` : ` — ${res.dias_generados} día(s) justificado(s)` : " — el empleado marca la otra mitad normalmente"}`,
      });
      setForm({ usuario_id: "", fecha_desde: "", fecha_hasta: "", motivo: "", tipo_novedad: "permiso", modalidad: "dia_completo", hora_desde: "", hora_hasta: "" });
      const updated = await obtenerNovedades();
      setNovedades(updated.novedades || []);
    } catch {
      setSnack({ open: true, msg: "Error al registrar la novedad", severity: "error" });
    }
    setGuardando(false);
  };

  const handleEliminar = async () => {
    if (!eliminando) return;
    try {
      await eliminarNovedad(eliminando);
      setSnack({ open: true, msg: "Novedad eliminada", severity: "success" });
      setEliminando(null);
      const updated = await obtenerNovedades();
      setNovedades(updated.novedades || []);
    } catch {
      setSnack({ open: true, msg: "Error al eliminar la novedad", severity: "error" });
    }
  };

  const totalMes = novedades.filter((p) => {
    const d = new Date(p.creado_en);
    const ahora = new Date();
    return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
  }).length;

  const activosHoy = novedades.filter((p) => {
    const hoy = new Date().toISOString().split("T")[0];
    return p.fecha_desde <= hoy && p.fecha_hasta >= hoy;
  }).length;

  const programados = novedades.filter((p) => {
    const hoy = new Date().toISOString().split("T")[0];
    return p.fecha_desde > hoy;
  }).length;

  const proximos7 = novedades.filter((p) => {
    const hoy = new Date().toISOString().split("T")[0];
    const dentroDe7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    return p.fecha_desde <= dentroDe7 && p.fecha_hasta >= hoy;
  }).length;

  const cols = [
    { field: "empleado_nombre", headerName: "Empleado", width: 160,
      renderCell: ({ row }) => `${row.empleado_nombre || ""} ${row.empleado_apellido || ""}`.trim() || "—" },
    { field: "fecha_desde", headerName: "Desde", width: 100, valueFormatter: (v) => v ? new Date(v).toLocaleDateString("es-CO") : "—" },
    { field: "fecha_hasta", headerName: "Hasta", width: 100, valueFormatter: (v) => v ? new Date(v).toLocaleDateString("es-CO") : "—" },
    { field: "motivo", headerName: "Motivo", width: 200 },
    { field: "tipo_novedad", headerName: "Tipo", width: 140,
      renderCell: ({ row }) => {
        const t = row.tipo_novedad || "permiso";
        const cfg = {
          permiso: { label: "Permiso", color: COLORES.primario, bg: COLORES.primarioClaro2, icon: <FileText size={12} /> },
          vacaciones: { label: "Vacaciones", color: COLORES.primario, bg: COLORES.primarioClaro, icon: <CalendarDays size={12} /> },
          incapacidad: { label: "Incapacidad", color: COLORES.danger, bg: COLORES.dangerFondo, icon: <AlertCircle size={12} /> },
          comision: { label: "Comisión", color: COLORES.danger, bg: COLORES.dangerFondo2, icon: <UserCheck size={12} /> },
          licencia: { label: "Licencia", color: COLORES.verdeTexto, bg: COLORES.successClaro, icon: <FileText size={12} /> },
          suspension: { label: "Suspensión", color: COLORES.textoTerciario, bg: COLORES.fondoGris2, icon: <ShieldAlert size={12} /> },
        }[t] || cfg.permiso;
        return <Chip icon={cfg.icon} label={cfg.label} size="small" sx={{ fontWeight: 600, fontSize: 11, bgcolor: cfg.bg, color: cfg.color, borderRadius: "8px" }} />;
      },
    },
    { field: "tipo", headerName: "Modalidad", width: 120,
      renderCell: ({ row }) => {
        const t = row.tipo || "dia_completo";
        const cfg = {
          dia_completo: { label: "Día completo", color: COLORES.primarioOscuro, bg: COLORES.primarioClaro, icon: <CalendarDays size={12} /> },
          manana: { label: "Jornada mañana", color: COLORES.warningOscuro, bg: COLORES.warningFondo, icon: <Sun size={12} /> },
          tarde: { label: "Jornada tarde", color: COLORES.primarioOscuro, bg: COLORES.primarioClaro, icon: <Moon size={12} /> },
          horas: { label: "Por horas", color: COLORES.primario, bg: COLORES.primarioClaro2, icon: <Clock size={12} /> },
        }[t];
        return <Chip icon={cfg?.icon} label={cfg?.label || t} size="small" sx={{ fontWeight: 600, fontSize: 11, bgcolor: cfg?.bg || COLORES.fondoGris2, color: cfg?.color || COLORES.textoPrimario, borderRadius: "8px" }} />;
      },
    },
    { field: "horario", headerName: "Horario", width: 110,
      renderCell: ({ row }) => {
        if (row.tipo !== "horas" || !row.hora_desde) return "—";
        return `${(row.hora_desde || "").substring(0, 5)} – ${(row.hora_hasta || "").substring(0, 5)}`;
      },
    },
    { field: "dias", headerName: "Días", width: 70, renderCell: ({ row }) => {
      if (!row.fecha_desde || !row.fecha_hasta) return "—";
      const ini = new Date(row.fecha_desde), fin = new Date(row.fecha_hasta);
      let count = 0;
      for (let d = new Date(ini); d <= fin; d.setDate(d.getDate() + 1)) {
        const ds = d.getDay();
        if (ds !== 0 && ds !== 6) count++;
      }
      return <Chip label={count} size="small" sx={{ fontWeight: 600, fontSize: 11, bgcolor: COLORES.primarioClaro, color: COLORES.primarioOscuro, borderRadius: "8px" }} />;
    } },
    { field: "registrado_por_nombre", headerName: "Registrado por", width: 150 },
    { field: "creado_en", headerName: "Fecha registro", width: 120, valueFormatter: (v) => v ? new Date(v).toLocaleDateString("es-CO") : "—" },
    { field: "acciones", headerName: "Acciones", width: 110, sortable: false, renderCell: ({ row }) => (
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
        <Box sx={{ ...estiloBtn, bgcolor: COLORES.primarioClaro, color: COLORES.primario, "&:hover": { bgcolor: COLORES.primarioClaro2 } }} title="Ver detalle"
          onClick={(e) => { e.stopPropagation(); setNovedadSeleccionada(row); setOpenDetalle(true); }}>
          <Eye size={14} />
        </Box>
        <Box sx={{ ...estiloBtn, bgcolor: COLORES.primarioClaro, color: COLORES.primario, "&:hover": { bgcolor: COLORES.primarioClaro2 } }} title="Editar"
          onClick={(e) => { e.stopPropagation(); setEditModalNovedad(row); }}>
          <Pencil size={14} />
        </Box>
        <Box sx={{ ...estiloBtn, bgcolor: COLORES.dangerFondo, color: COLORES.danger, "&:hover": { bgcolor: COLORES.dangerBorde } }} title="Eliminar"
          onClick={(e) => { e.stopPropagation(); setEliminando(row.id); }}>
          <Trash2 size={14} />
        </Box>
      </Box>
    )},
  ];

  if (loading) return <Loading texto="Cargando novedades..." />;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Typography sx={{ fontSize: 13, color: COLORES.textoMuted }}>Inicio / Gestión / Novedades Laborales</Typography>

      {/* Tarjetas resumen */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
        {[
          { icon: <FileText size={20} />, value: totalMes, label: "Este mes", color: COLORES.primarioOscuro, bg: COLORES.primarioClaro },
          { icon: <CalendarCheck size={20} />, value: activosHoy, label: "Con novedad hoy", color: COLORES.primarioOscuro, bg: COLORES.primarioClaro },
          { icon: <CalendarDays size={20} />, value: programados, label: "Programados", color: COLORES.warningOscuro, bg: COLORES.warningFondo },
          { icon: <UserCheck size={20} />, value: proximos7, label: "Próximos 7 días", color: COLORES.primario, bg: COLORES.primarioClaro },
        ].map((card, i) => (
          <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>
              {card.icon}
            </Box>
            <Box>
              <Typography sx={{ fontSize: 10, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase" }}>{card.label}</Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 700, color: card.color, lineHeight: 1.2, textTransform: "capitalize" }}>{card.value}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Formulario registro */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}` }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario, mb: 2 }}>
          Registrar excepción de asistencia
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "end" }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Área (filtro)</Typography>
            <TextField select size="small" value={areaFiltro} onChange={(e) => setAreaFiltro(e.target.value)}
              sx={{ minWidth: 150, ...fieldSx }}>
              <MenuItem value="Todas">Todas las áreas</MenuItem>
              {areas.map((a) => <MenuItem key={a.id} value={a.nombre}>{a.nombre}</MenuItem>)}
            </TextField>
          </Box>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Empleado</Typography>
            <TextField select size="small" name="usuario_id" value={form.usuario_id} onChange={handleChange}
              sx={{ width: "100%", ...fieldSx }}>
              <MenuItem value="">Seleccionar empleado</MenuItem>
              {empleadosFiltrados.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>{emp.nombre} {emp.apellido} — {empleadoAreaMap[emp.id] || "Sin área"}</MenuItem>
              ))}
            </TextField>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Desde</Typography>
            <TextField type="date" size="small" name="fecha_desde" value={form.fecha_desde}
              onChange={(e) => {
                const v = e.target.value;
                // Autocompleta fecha_hasta con fecha_desde salvo que ya exista
                // un rango válido (hasta >= desde). Evita pisar rangos reales
                // de varios días (ej. vacaciones) y ahorra el segundo tipeo
                // cuando el rango es de un solo día.
                const hastaValido = form.fecha_hasta && form.fecha_hasta >= v;
                setForm({ ...form, fecha_desde: v, ...(!hastaValido && { fecha_hasta: v }) });
              }}
              sx={{ width: 160, ...fieldSx }} slotProps={{ inputLabel: { shrink: true } }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Hasta</Typography>
            <TextField type="date" size="small" name="fecha_hasta" value={form.fecha_hasta}
              onChange={handleChange}
              disabled={["manana", "tarde"].includes(form.modalidad)}
              sx={{ width: 160, ...fieldSx, "& .MuiInputBase-root": { opacity: ["manana", "tarde"].includes(form.modalidad) ? 0.6 : 1 } }}
              slotProps={{ inputLabel: { shrink: true } }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Tipo de novedad</Typography>
            <TextField select size="small" name="tipo_novedad" value={form.tipo_novedad} onChange={handleChange}
              sx={{ width: 180, ...fieldSx }}>
              <MenuItem value="permiso"><Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}><FileText size={14} /> Permiso</Box></MenuItem>
              <MenuItem value="vacaciones"><Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}><CalendarDays size={14} /> Vacaciones</Box></MenuItem>
              <MenuItem value="incapacidad"><Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}><AlertCircle size={14} /> Incapacidad</Box></MenuItem>
              <MenuItem value="comision"><Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}><UserCheck size={14} /> Comisión</Box></MenuItem>
              <MenuItem value="licencia"><Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}><FileText size={14} /> Licencia</Box></MenuItem>
              <MenuItem value="suspension"><Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}><ShieldAlert size={14} /> Suspensión</Box></MenuItem>
            </TextField>
          </Box>
          {form.tipo_novedad === "permiso" && (
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Modalidad</Typography>
              <TextField select size="small" name="modalidad" value={form.modalidad} onChange={handleChange}
                sx={{ width: 160, ...fieldSx }}>
                <MenuItem value="dia_completo"><Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}><CalendarDays size={14} /> Día completo</Box></MenuItem>
                <MenuItem value="horas"><Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}><Clock size={14} /> Por horas</Box></MenuItem>
                <MenuItem value="manana"><Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}><Sun size={14} />  Jornada mañana </Box></MenuItem>
                <MenuItem value="tarde"><Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}><Moon size={14} />  Jornada tarde </Box></MenuItem>
              </TextField>
            </Box>
          )}
          {form.modalidad === "horas" && (
            <>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Hora inicio</Typography>
                <TextField type="time" size="small" name="hora_desde" value={form.hora_desde} onChange={handleChange}
                  sx={{ width: 130, ...fieldSx }} slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 300 } }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Hora fin</Typography>
                <TextField type="time" size="small" name="hora_hasta" value={form.hora_hasta} onChange={handleChange}
                  sx={{ width: 130, ...fieldSx }} slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 300 } }} />
              </Box>
            </>
          )}
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Motivo</Typography>
            <TextField size="small" name="motivo" value={form.motivo} onChange={handleChange}
              placeholder="Ej: Descripción" sx={{ width: "100%", ...fieldSx }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>&nbsp;</Typography>
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={handleGuardar} disabled={guardando}
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 3, bgcolor: COLORES.primarioOscuro, "&:hover": { bgcolor: COLORES.primario } }}>
              {guardando ? "Guardando..." : "Registrar novedad"}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Tabla historial */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}` }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario }}>Historial de novedades</Typography>
          <TextField size="small" placeholder="Buscar empleado..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            sx={{ width: 220, "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13 } }} />
        </Box>
        <DataTable
          rows={novedades.filter((p) => {
            if (!busqueda) return true;
            const nom = `${p.empleado_nombre || ""} ${p.empleado_apellido || ""}`.toLowerCase();
            return nom.includes(busqueda.toLowerCase()) || (p.motivo || "").toLowerCase().includes(busqueda.toLowerCase());
          })}
          columns={cols}
          entityLabel="novedades"
          getRowId={(r) => r.id}
          pageSize={10}
        />
      </Paper>

      {/* Confirmación eliminar */}
      <Dialog open={!!eliminando} onClose={() => setEliminando(null)}
        slotProps={{ paper: { sx: { borderRadius: "16px", maxWidth: 400 } } }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: COLORES.textoPrimario, pb: 0 }}>
          Eliminar novedad
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ fontSize: 14, color: COLORES.textoTerciario }}>
            ¿Estás seguro? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0, gap: 1 }}>
          <Button onClick={() => setEliminando(null)}
            sx={{ textTransform: "none", fontWeight: 600, fontSize: 13, color: COLORES.textoTerciario, borderRadius: "10px", px: 3 }}>
            Cancelar
          </Button>
          <Button onClick={handleEliminar} variant="contained"
            sx={{ textTransform: "none", fontWeight: 600, fontSize: 13, borderRadius: "10px", px: 3, bgcolor: COLORES.danger, "&:hover": { bgcolor: COLORES.dangerOscuro2 } }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        message={snack.msg}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        ContentProps={{ sx: { borderRadius: "10px", fontWeight: 500, fontSize: 13 } }}
      />

      <NovedadDetailModal
        open={openDetalle}
        onClose={() => { setOpenDetalle(false); setNovedadSeleccionada(null); }}
        novedad={novedadSeleccionada}
      />

      <EditarNovedadModal
        open={!!editModalNovedad}
        onClose={() => setEditModalNovedad(null)}
        novedad={editModalNovedad}
        empleados={empleados}
        onSaved={async () => {
          const updated = await obtenerNovedades();
          setNovedades(updated.novedades || []);
        }}
      />
    </Box>
  );
}
