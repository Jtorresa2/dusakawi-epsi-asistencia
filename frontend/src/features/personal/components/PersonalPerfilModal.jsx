import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, Box, Paper, Typography, Avatar, Chip,
  TextField, IconButton, Switch, FormControl, InputLabel, Select, MenuItem,
  Snackbar, Alert, Divider, Tooltip
} from "@mui/material";
import {
  User, Mail, Phone, Calendar, FileText, Briefcase, MapPin,
  Clock, Edit2, Save, X, Building2, Layers, AlertTriangle, XCircle, ShieldCheck
} from "lucide-react";
import { obtenerPersonalPorId, actualizarPersonal } from "../personal.api";
import { obtenerAreas } from "../../areas/area.api";
import { obtenerCargos } from "../../cargos/cargo.api";
import { obtenerHorarios, asignarHorario, desasignarHorario } from "../../horarios/horario.api";
import { onlyDigits } from "../../../shared/validators";
import { COLORES } from "../../../shared/constants/colores.js";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const parts = String(dateStr).slice(0, 10).split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return `${day} de ${MONTHS[month] || ""} de ${year}`;
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "—" : `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

const selectSx = {
  borderRadius: "10px",
  fontSize: 13.5,
  background: COLORES.fondoBlanco,
  minHeight: 40,
  "& fieldset": { borderColor: COLORES.borde2 },
  "&:hover fieldset": { borderColor: COLORES.textoSuave },
  "&.Mui-focused fieldset": { borderColor: COLORES.primarioOscuro },
};

const selectMenuSx = {
  slotProps: {
    paper: {
      sx: {
        bgcolor: COLORES.fondoBlanco,
        borderRadius: "12px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        "& .MuiMenuItem-root": { borderRadius: 1, mx: 0.5, fontSize: 13.5 }
      }
    },
  },
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    fontSize: 13.5,
    background: COLORES.fondoBlanco,
    minHeight: 40,
    "& fieldset": { borderColor: COLORES.borde2 },
    "&:hover fieldset": { borderColor: COLORES.textoSuave },
    "&.Mui-focused fieldset": { borderColor: COLORES.primarioOscuro },
    "&.Mui-focused": { boxShadow: "0 0 0 3px rgba(27, 94, 32, 0.08)" },
  },
  "& .MuiInputLabel-root": { fontSize: 12.5, color: COLORES.textoTerciario },
  "& .MuiInputLabel-root.Mui-focused": { color: COLORES.primarioOscuro },
};

export default function PersonalPerfilModal({ open, id, onClose, onSaved }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [areas, setAreas] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [snack, setSnack] = useState(null);

  useEffect(() => {
    if (!open || !id) return;
    setLoading(true);
    Promise.all([
      obtenerPersonalPorId(id),
      obtenerAreas().catch(() => []),
      obtenerCargos().catch(() => []),
      obtenerHorarios().catch(() => []),
    ]).then(([emp, areasRes, cargosRes, horariosRes]) => {
      setData(emp);
      setAreas(areasRes || []);
      setCargos(cargosRes || []);
      setHorarios(horariosRes || []);
      setEditando(null);
      setForm({});
    }).catch(() => {}).finally(() => setLoading(false));
  }, [open, id]);

  const initials = data
    ? `${data.primer_nombre || data.nombre || ""} ${data.primer_apellido || data.apellido || ""}`
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";

  const handleEdit = (section) => {
    setEditando(section);
    if (section === "personal") {
      setForm({
        primer_nombre: data.primer_nombre || data.nombre || "",
        segundo_nombre: data.segundo_nombre || "",
        primer_apellido: data.primer_apellido || data.apellido || "",
        segundo_apellido: data.segundo_apellido || "",
        cedula: data.cedula || "",
        correo: data.correo || "",
        telefono: data.telefono || "",
        fecha_nacimiento: data.fecha_nacimiento ? String(data.fecha_nacimiento).slice(0, 10) : "",
      });
    } else {
      setForm({
        cargo_id: data.cargo_id ? String(data.cargo_id) : "",
        area_id: data.area_id ? String(data.area_id) : "",
        horario_id: (data.horario_id || data.schedule_id) ? String(data.horario_id || data.schedule_id) : "",
      });
    }
  };

  const handleCancel = () => {
    setEditando(null);
    setForm({});
  };

  const handleSave = async () => {
    setGuardando(true);
    try {
      const payload = { ...form };
      let horarioAsignado = null;

      if (editando === "laboral") {
        payload.area_id = form.area_id || null;
        payload.cargo_id = form.cargo_id || null;
        delete payload.horario_id;

        const currentHorario = data?.horario_id || data?.schedule_id;
        if (form.horario_id && String(form.horario_id) !== String(currentHorario)) {
          await asignarHorario({
            usuario_id: id,
            horario_id: form.horario_id,
            motivo: "Asignación desde perfil",
          });
          horarioAsignado = true;
        } else if (!form.horario_id && currentHorario) {
          await desasignarHorario(id);
          horarioAsignado = true;
        }
      }

      await actualizarPersonal(id, payload);
      const updated = await obtenerPersonalPorId(id);
      setData(updated);
      setEditando(null);
      if (onSaved) onSaved();
      setSnack({
        tipo: "ok",
        msg: horarioAsignado
          ? "Perfil y horario actualizados correctamente"
          : "Información actualizada correctamente"
      });
    } catch (e) {
      setSnack({ tipo: "err", msg: e.message || "Error al guardar los cambios" });
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleEstado = async () => {
    const nuevo = data.activo === 1 || data.activo === true ? 0 : 1;
    setGuardando(true);
    try {
      await actualizarPersonal(id, { activo: nuevo });
      const updated = await obtenerPersonalPorId(id);
      setData(updated);
      if (onSaved) onSaved();
      setSnack({ tipo: "ok", msg: nuevo === 1 ? "Colaborador activado" : "Colaborador desactivado" });
    } catch {
      setSnack({ tipo: "err", msg: "Error al cambiar estado" });
    } finally {
      setGuardando(false);
    }
  };

  const isActive = data?.activo === 1 || data?.activo === true;
  const currentHorarioId = data?.horario_id || data?.schedule_id;
  const horarioObj = horarios.find((h) => String(h.id) === String(currentHorarioId));
  const horarioNombre = horarioObj?.nombre || data?.horario || "Sin horario asignado";

  const inasistenciasTotal = data?.inasistencias ?? 0;
  const tardanzasTotal = data?.llegadas_tardias ?? data?.tardanzas ?? 0;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        sx={{
          "& .MuiBackdrop-root": { backgroundColor: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(4px)" },
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px",
              maxHeight: "92vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 24px 64px -12px rgba(0, 0, 0, 0.25)",
              bgcolor: COLORES.fondoBlanco,
              border: `1px solid ${COLORES.grisContorno}`,
            },
          },
        }}
      >
        {/* BOTÓN CERRAR SUPERIOR */}
        <IconButton
          aria-label="Cerrar"
          onClick={onClose}
          size="small"
          sx={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 3,
            color: COLORES.textoSuave,
            bgcolor: COLORES.fondoGris2,
            transition: "all .15s ease",
            "&:hover": { color: COLORES.textoPrimario, bgcolor: COLORES.borde2, transform: "scale(1.05)" },
          }}
        >
          <X size={18} />
        </IconButton>

        {loading ? (
          <DialogContent sx={{ py: 12, textAlign: "center", color: COLORES.textoSuave, fontSize: 15 }}>
            <Box sx={{ display: "inline-block", p: 2, borderRadius: "50%", bgcolor: COLORES.fondoGris2, mb: 1.5 }}>
              <Clock size={28} className="animate-spin" style={{ color: COLORES.primario }} />
            </Box>
            <Typography sx={{ fontWeight: 600, color: COLORES.textoSecundario }}>Cargando expediente del colaborador...</Typography>
          </DialogContent>
        ) : data ? (
          <>
            {/* ── HEADER BANNER INTEGRADO ── */}
            <Box
              sx={{
                p: { xs: 2.5, sm: 3 },
                pb: 2.5,
                bgcolor: COLORES.fondoGris,
                borderBottom: `1px solid ${COLORES.grisContorno}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                {/* LADO IZQ: Avatar + Identidad */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, minWidth: 260 }}>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: COLORES.primarioClaro,
                      color: COLORES.primarioOscuro,
                      fontSize: 22,
                      fontWeight: 700,
                      border: `2px solid ${COLORES.fondoBlanco}`,
                      boxShadow: "0 4px 14px rgba(27, 94, 32, 0.15)",
                    }}
                  >
                    {initials}
                  </Avatar>
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography sx={{ fontSize: 20, fontWeight: 700, color: COLORES.textoPrimario, lineHeight: 1.2 }}>
                        {data.empleado || `${data.primer_nombre || data.nombre || ""} ${data.primer_apellido || data.apellido || ""}`.trim()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.6, flexWrap: "wrap" }}>
                      <Chip
                        icon={<FileText size={13} style={{ color: "inherit" }} />}
                        label={`CC ${data.cedula || "—"}`}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: 12,
                          fontWeight: 600,
                          bgcolor: COLORES.fondoBlanco,
                          color: COLORES.textoSecundario,
                          border: `1px solid ${COLORES.borde2}`,
                        }}
                      />
                      <Chip
                        label={isActive ? "Activo" : "Inactivo"}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: 12,
                          fontWeight: 700,
                          bgcolor: isActive ? COLORES.primarioClaro : COLORES.dangerFondo,
                          color: isActive ? COLORES.primarioOscuro : COLORES.danger,
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* LADO DER: KPIs de Asistencia + Switch Estado */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: "auto" }}>
                  {/* KPI Inasistencias */}
                  <Tooltip title="Total de inasistencias no justificadas">
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.2,
                        px: 1.75,
                        py: 0.85,
                        borderRadius: "12px",
                        bgcolor: inasistenciasTotal > 0 ? COLORES.dangerFondo : COLORES.fondoBlanco,
                        border: `1px solid ${inasistenciasTotal > 0 ? "rgba(239, 68, 68, 0.25)" : COLORES.borde2}`,
                      }}
                    >
                      <XCircle size={18} style={{ color: inasistenciasTotal > 0 ? COLORES.danger : COLORES.textoSuave }} />
                      <Box>
                        <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: COLORES.textoTerciario, lineHeight: 1 }}>
                          Inasist.
                        </Typography>
                        <Typography sx={{ fontSize: 15, fontWeight: 700, color: inasistenciasTotal > 0 ? COLORES.danger : COLORES.textoPrimario, lineHeight: 1.15 }}>
                          {inasistenciasTotal}
                        </Typography>
                      </Box>
                    </Box>
                  </Tooltip>

                  {/* KPI Tardanzas */}
                  <Tooltip title="Total de llegadas tardías registradas">
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.2,
                        px: 1.75,
                        py: 0.85,
                        borderRadius: "12px",
                        bgcolor: tardanzasTotal > 0 ? COLORES.warningFondo : COLORES.fondoBlanco,
                        border: `1px solid ${tardanzasTotal > 0 ? "rgba(245, 158, 11, 0.3)" : COLORES.borde2}`,
                      }}
                    >
                      <Clock size={18} style={{ color: tardanzasTotal > 0 ? COLORES.warningOscuro : COLORES.textoSuave }} />
                      <Box>
                        <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: COLORES.textoTerciario, lineHeight: 1 }}>
                          Tardanzas
                        </Typography>
                        <Typography sx={{ fontSize: 15, fontWeight: 700, color: tardanzasTotal > 0 ? COLORES.warningOscuro : COLORES.textoPrimario, lineHeight: 1.15 }}>
                          {tardanzasTotal}
                        </Typography>
                      </Box>
                    </Box>
                  </Tooltip>

                  {/* Switch Activar/Desactivar */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      pl: 1,
                      borderLeft: `1px solid ${COLORES.borde2}`,
                    }}
                  >
                    <Tooltip title={isActive ? "Desactivar colaborador" : "Activar colaborador"}>
                      <Switch
                        checked={isActive}
                        onChange={handleToggleEstado}
                        disabled={guardando}
                        size="small"
                        color="success"
                      />
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* ── CUERPO BALANCEADO (2 COLUMNAS DE IGUAL ALTURA) ── */}
            <DialogContent sx={{ p: { xs: 2, sm: 3 }, overflowY: "auto", bgcolor: COLORES.fondoBlanco }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" },
                  gap: 2.5,
                  alignItems: "stretch",
                }}
              >
                {/* ══ TARJETA 1: DATOS PERSONALES (Grid 2 columnas internas) ══ */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: "16px",
                    border: `1px solid ${COLORES.grisContorno}`,
                    bgcolor: COLORES.fondoGris,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Encabezado sección */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, pb: 1, borderBottom: `1px solid ${COLORES.borde2}` }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: COLORES.primarioClaro, color: COLORES.primarioOscuro, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <User size={15} />
                      </Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORES.textoPrimario }}>
                        Datos Personales
                      </Typography>
                    </Box>

                    {editando === "personal" ? (
                      <Box sx={{ display: "flex", gap: 0.75 }}>
                        <IconButton
                          aria-label="Guardar"
                          size="small"
                          onClick={handleSave}
                          disabled={guardando}
                          sx={{ bgcolor: COLORES.primarioOscuro, color: COLORES.fondoBlanco, borderRadius: "8px", width: 28, height: 28, "&:hover": { bgcolor: COLORES.primario } }}
                        >
                          <Save size={15} />
                        </IconButton>
                        <IconButton
                          aria-label="Cancelar"
                          size="small"
                          onClick={handleCancel}
                          sx={{ bgcolor: COLORES.fondoGris2, color: COLORES.textoSecundario, borderRadius: "8px", width: 28, height: 28, "&:hover": { bgcolor: COLORES.borde2 } }}
                        >
                          <X size={15} />
                        </IconButton>
                      </Box>
                    ) : (
                      <IconButton
                        aria-label="Editar datos personales"
                        size="small"
                        onClick={() => handleEdit("personal")}
                        sx={{ bgcolor: COLORES.fondoBlanco, color: COLORES.primarioOscuro, border: `1px solid ${COLORES.borde2}`, borderRadius: "8px", width: 28, height: 28, "&:hover": { bgcolor: COLORES.primarioClaro } }}
                      >
                        <Edit2 size={14} />
                      </IconButton>
                    )}
                  </Box>

                  {/* Campos de datos personales en 2 columnas internas */}
                  {editando === "personal" ? (
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, flex: 1 }}>
                      <TextField
                        size="small" label="Primer Nombre" required
                        value={form.primer_nombre}
                        onChange={(e) => setForm({ ...form, primer_nombre: e.target.value })}
                        sx={inputSx}
                      />
                      <TextField
                        size="small" label="Segundo Nombre"
                        value={form.segundo_nombre}
                        onChange={(e) => setForm({ ...form, segundo_nombre: e.target.value })}
                        sx={inputSx}
                      />
                      <TextField
                        size="small" label="Primer Apellido" required
                        value={form.primer_apellido}
                        onChange={(e) => setForm({ ...form, primer_apellido: e.target.value })}
                        sx={inputSx}
                      />
                      <TextField
                        size="small" label="Segundo Apellido"
                        value={form.segundo_apellido}
                        onChange={(e) => setForm({ ...form, segundo_apellido: e.target.value })}
                        sx={inputSx}
                      />
                      <TextField
                        size="small" label="Cédula" required
                        value={form.cedula}
                        onChange={(e) => setForm({ ...form, cedula: onlyDigits(e.target.value) })}
                        slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 15 } }}
                        sx={inputSx}
                      />
                      <TextField
                        size="small" label="Fecha de Nacimiento" type="date"
                        value={form.fecha_nacimiento}
                        onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={inputSx}
                      />
                      <Box sx={{ gridColumn: "span 2" }}>
                        <TextField
                          fullWidth size="small" label="Correo electrónico" type="email"
                          value={form.correo}
                          onChange={(e) => setForm({ ...form, correo: e.target.value })}
                          sx={inputSx}
                        />
                      </Box>
                      <Box sx={{ gridColumn: "span 2" }}>
                        <TextField
                          fullWidth size="small" label="Teléfono"
                          value={form.telefono}
                          onChange={(e) => setForm({ ...form, telefono: onlyDigits(e.target.value) })}
                          slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 15 } }}
                          sx={inputSx}
                        />
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, flex: 1, alignContent: "start" }}>
                      {/* Primer Nombre */}
                      <Box sx={{ p: 1.25, borderRadius: "10px", bgcolor: COLORES.fondoBlanco, border: `1px solid ${COLORES.borde2}` }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORES.textoTerciario, textTransform: "uppercase" }}>Primer Nombre</Typography>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: COLORES.textoPrimario, mt: 0.2 }}>
                          {data.primer_nombre || data.nombre?.split(" ")?.[0] || "—"}
                        </Typography>
                      </Box>

                      {/* Segundo Nombre */}
                      <Box sx={{ p: 1.25, borderRadius: "10px", bgcolor: COLORES.fondoBlanco, border: `1px solid ${COLORES.borde2}` }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORES.textoTerciario, textTransform: "uppercase" }}>Segundo Nombre</Typography>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: data.segundo_nombre ? COLORES.textoPrimario : COLORES.textoSuave, mt: 0.2 }}>
                          {data.segundo_nombre || "—"}
                        </Typography>
                      </Box>

                      {/* Primer Apellido */}
                      <Box sx={{ p: 1.25, borderRadius: "10px", bgcolor: COLORES.fondoBlanco, border: `1px solid ${COLORES.borde2}` }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORES.textoTerciario, textTransform: "uppercase" }}>Primer Apellido</Typography>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: COLORES.textoPrimario, mt: 0.2 }}>
                          {data.primer_apellido || data.apellido?.split(" ")?.[0] || "—"}
                        </Typography>
                      </Box>

                      {/* Segundo Apellido */}
                      <Box sx={{ p: 1.25, borderRadius: "10px", bgcolor: COLORES.fondoBlanco, border: `1px solid ${COLORES.borde2}` }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORES.textoTerciario, textTransform: "uppercase" }}>Segundo Apellido</Typography>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: data.segundo_apellido ? COLORES.textoPrimario : COLORES.textoSuave, mt: 0.2 }}>
                          {data.segundo_apellido || "—"}
                        </Typography>
                      </Box>

                      {/* Cédula */}
                      <Box sx={{ p: 1.25, borderRadius: "10px", bgcolor: COLORES.fondoBlanco, border: `1px solid ${COLORES.borde2}` }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORES.textoTerciario, textTransform: "uppercase" }}>Cédula</Typography>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: COLORES.textoPrimario, mt: 0.2 }}>
                          {data.cedula || "—"}
                        </Typography>
                      </Box>

                      {/* Fecha Nacimiento */}
                      <Box sx={{ p: 1.25, borderRadius: "10px", bgcolor: COLORES.fondoBlanco, border: `1px solid ${COLORES.borde2}` }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORES.textoTerciario, textTransform: "uppercase" }}>Fecha de Nacimiento</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: COLORES.textoPrimario, mt: 0.2 }}>
                          {formatDate(data.fecha_nacimiento)}
                        </Typography>
                      </Box>

                      {/* Correo Electrónico (Full row) */}
                      <Box sx={{ gridColumn: "span 2", p: 1.25, borderRadius: "10px", bgcolor: COLORES.fondoBlanco, border: `1px solid ${COLORES.borde2}` }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <Mail size={13} style={{ color: COLORES.primarioOscuro }} />
                          <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORES.textoTerciario, textTransform: "uppercase" }}>Correo Electrónico</Typography>
                        </Box>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: COLORES.textoPrimario, mt: 0.2, wordBreak: "break-all" }}>
                          {data.correo || data.email || "—"}
                        </Typography>
                      </Box>

                      {/* Teléfono (Full row) */}
                      <Box sx={{ gridColumn: "span 2", p: 1.25, borderRadius: "10px", bgcolor: COLORES.fondoBlanco, border: `1px solid ${COLORES.borde2}` }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <Phone size={13} style={{ color: COLORES.primarioOscuro }} />
                          <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORES.textoTerciario, textTransform: "uppercase" }}>Teléfono de Contacto</Typography>
                        </Box>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: COLORES.textoPrimario, mt: 0.2 }}>
                          {data.telefono || data.phone || "—"}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Paper>

                {/* ══ TARJETA 2: INFORMACIÓN LABORAL Y HORARIO ══ */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: "16px",
                    border: `1px solid ${COLORES.grisContorno}`,
                    bgcolor: COLORES.fondoGris,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Encabezado sección */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, pb: 1, borderBottom: `1px solid ${COLORES.borde2}` }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: COLORES.primarioClaro, color: COLORES.primarioOscuro, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Briefcase size={15} />
                      </Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORES.textoPrimario }}>
                        Puesto y Asignación
                      </Typography>
                    </Box>

                    {editando === "laboral" ? (
                      <Box sx={{ display: "flex", gap: 0.75 }}>
                        <IconButton
                          aria-label="Guardar"
                          size="small"
                          onClick={handleSave}
                          disabled={guardando}
                          sx={{ bgcolor: COLORES.primarioOscuro, color: COLORES.fondoBlanco, borderRadius: "8px", width: 28, height: 28, "&:hover": { bgcolor: COLORES.primario } }}
                        >
                          <Save size={15} />
                        </IconButton>
                        <IconButton
                          aria-label="Cancelar"
                          size="small"
                          onClick={handleCancel}
                          sx={{ bgcolor: COLORES.fondoGris2, color: COLORES.textoSecundario, borderRadius: "8px", width: 28, height: 28, "&:hover": { bgcolor: COLORES.borde2 } }}
                        >
                          <X size={15} />
                        </IconButton>
                      </Box>
                    ) : (
                      <IconButton
                        aria-label="Editar información laboral"
                        size="small"
                        onClick={() => handleEdit("laboral")}
                        sx={{ bgcolor: COLORES.fondoBlanco, color: COLORES.primarioOscuro, border: `1px solid ${COLORES.borde2}`, borderRadius: "8px", width: 28, height: 28, "&:hover": { bgcolor: COLORES.primarioClaro } }}
                      >
                        <Edit2 size={14} />
                      </IconButton>
                    )}
                  </Box>

                  {/* Campos laborales */}
                  {editando === "laboral" ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                      {/* Cargo Select */}
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ fontSize: 12.5, color: COLORES.textoTerciario }}>Cargo</InputLabel>
                        <Select
                          value={form.cargo_id || ""}
                          label="Cargo"
                          sx={selectSx}
                          slotProps={{ menu: selectMenuSx }}
                          onChange={(e) => setForm({ ...form, cargo_id: e.target.value })}
                        >
                          <MenuItem value=""><em>Sin cargo</em></MenuItem>
                          {cargos.filter((c) => c.estado !== "inactivo").map((c) => (
                            <MenuItem key={c.id} value={String(c.id)}>{c.nombre}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {/* Área Select */}
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ fontSize: 12.5, color: COLORES.textoTerciario }}>Área</InputLabel>
                        <Select
                          value={form.area_id || ""}
                          label="Área"
                          sx={selectSx}
                          slotProps={{ menu: selectMenuSx }}
                          onChange={(e) => setForm({ ...form, area_id: e.target.value })}
                        >
                          <MenuItem value=""><em>Sin área</em></MenuItem>
                          {areas.map((a) => (
                            <MenuItem key={a.id} value={String(a.id)}>
                              {a.nombre}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {(() => {
                        const selArea = areas.find((a) => String(a.id) === String(form.area_id));
                        if (!selArea?.piso) return null;
                        const limpio = String(selArea.piso).replace(/^piso\s*/i, "").trim();
                        return (
                          <Typography sx={{ fontSize: 11.5, color: COLORES.primarioOscuro, mt: -1.2, ml: 0.5, fontWeight: 600 }}>
                            ✓ Ubicación automática: <strong>Piso {limpio}</strong>
                          </Typography>
                        );
                      })()}

                      {/* Horario Select */}
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ fontSize: 12.5, color: COLORES.textoTerciario }}>Horario de Trabajo</InputLabel>
                        <Select
                          value={form.horario_id || ""}
                          label="Horario de Trabajo"
                          sx={selectSx}
                          slotProps={{ menu: selectMenuSx }}
                          onChange={(e) => setForm({ ...form, horario_id: e.target.value })}
                        >
                          <MenuItem value=""><em>Sin horario asignado</em></MenuItem>
                          {horarios.map((h) => (
                            <MenuItem key={h.id} value={String(h.id)}>{h.nombre}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flex: 1, justifyContent: "space-between" }}>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        {/* Cargo */}
                        <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: COLORES.fondoBlanco, border: `1px solid ${COLORES.borde2}` }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25 }}>
                            <Briefcase size={13} style={{ color: COLORES.primarioOscuro }} />
                            <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORES.textoTerciario, textTransform: "uppercase" }}>Cargo / Posición</Typography>
                          </Box>
                          <Typography sx={{ fontSize: 14, fontWeight: 600, color: COLORES.textoPrimario }}>
                            {data.cargo || "—"}
                          </Typography>
                        </Box>

                        {/* Área y Piso */}
                        <Box sx={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 1.25 }}>
                          <Box sx={{ p: 1.25, borderRadius: "10px", bgcolor: COLORES.fondoBlanco, border: `1px solid ${COLORES.borde2}` }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25 }}>
                              <Building2 size={13} style={{ color: COLORES.primarioOscuro }} />
                              <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORES.textoTerciario, textTransform: "uppercase" }}>Área</Typography>
                            </Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORES.textoPrimario }}>
                              {data.area || "—"}
                            </Typography>
                          </Box>

                          <Box sx={{ p: 1.25, borderRadius: "10px", bgcolor: COLORES.fondoBlanco, border: `1px solid ${COLORES.borde2}` }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25 }}>
                              <Layers size={13} style={{ color: COLORES.primarioOscuro }} />
                              <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORES.textoTerciario, textTransform: "uppercase" }}>Piso</Typography>
                            </Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORES.textoPrimario }}>
                              {data.piso ? (String(data.piso).toLowerCase().startsWith("piso") ? data.piso : `Piso ${data.piso}`) : "—"}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Tarjeta de Horario Asignado (Visual & Limpia) */}
                      <Box
                        sx={{
                          p: 1.75,
                          borderRadius: "12px",
                          bgcolor: currentHorarioId ? COLORES.primarioClaro : COLORES.fondoBlanco,
                          border: `1px solid ${currentHorarioId ? "rgba(27, 94, 32, 0.2)" : COLORES.borde2}`,
                          mt: 1,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                            <Clock size={15} style={{ color: currentHorarioId ? COLORES.primarioOscuro : COLORES.textoSuave }} />
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: currentHorarioId ? COLORES.primarioOscuro : COLORES.textoTerciario, textTransform: "uppercase" }}>
                              Jornada Asignada
                            </Typography>
                          </Box>
                          <Chip
                            label={currentHorarioId ? "Asignado" : "Sin horario"}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: 10.5,
                              fontWeight: 700,
                              bgcolor: currentHorarioId ? COLORES.primarioOscuro : COLORES.fondoGris2,
                              color: currentHorarioId ? COLORES.fondoBlanco : COLORES.textoSuave,
                            }}
                          />
                        </Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORES.textoPrimario, mt: 0.5 }}>
                          {horarioNombre}
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, color: COLORES.textoTerciario, mt: 0.25 }}>
                          {currentHorarioId ? "Turno activo para registro y validación biométrica" : "Configure un horario para medir inasistencias y tardanzas"}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Paper>
              </Box>
            </DialogContent>
          </>
        ) : (
          <DialogContent sx={{ p: 8, textAlign: "center", color: COLORES.textoSuave }}>
            No se pudo cargar la información del colaborador.
          </DialogContent>
        )}
      </Dialog>

      {/* SNACKBAR FEEDBACK */}
      <Snackbar
        open={!!snack}
        autoHideDuration={3500}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack?.tipo === "err" ? "error" : "success"}
          variant="filled"
          sx={{ borderRadius: "10px", fontWeight: 600, fontSize: 13 }}
        >
          {snack?.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
