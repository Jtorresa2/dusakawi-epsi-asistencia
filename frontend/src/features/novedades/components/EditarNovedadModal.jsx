import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton,
  Box, Typography, TextField, MenuItem, Snackbar,
} from "@mui/material";
import {
  CalendarDays, Clock, Sun, Moon, FileText, UserCheck, AlertCircle, ShieldAlert, X,
} from "lucide-react";
import { actualizarNovedad } from "../novedad.api";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    background: "#fff",
    "& fieldset": { borderColor: "#E5E7EB" },
    "&:hover fieldset": { borderColor: "#2E7D32" },
    "&.Mui-focused fieldset": { borderColor: "#1B5E20" },
  },
  "& .MuiInputLabel-root": { fontSize: 13, color: "#6B7280" },
  "& .MuiInputBase-input": { fontSize: 13 },
};

const tipoNovedadConfig = {
  permiso: { label: "Permiso", color: "#2563EB", bg: "#DBEAFE" },
  vacaciones: { label: "Vacaciones", color: "#7C3AED", bg: "#F3E8FF" },
  incapacidad: { label: "Incapacidad", color: "#DC2626", bg: "#FEE2E2" },
  comision: { label: "Comisión", color: "#C62828", bg: "#FFEBEE" },
  licencia: { label: "Licencia", color: "#0891B2", bg: "#ECFEFF" },
  suspension: { label: "Suspensión", color: "#6B7280", bg: "#F3F4F6" },
};

const TIPOS_NOVEDAD = [
  { value: "permiso", label: "Permiso", icon: <FileText size={14} /> },
  { value: "vacaciones", label: "Vacaciones", icon: <CalendarDays size={14} /> },
  { value: "incapacidad", label: "Incapacidad", icon: <AlertCircle size={14} /> },
  { value: "comision", label: "Comisión", icon: <UserCheck size={14} /> },
  { value: "licencia", label: "Licencia", icon: <FileText size={14} /> },
  { value: "suspension", label: "Suspensión", icon: <ShieldAlert size={14} /> },
];

const MODALIDADES = [
  { value: "dia_completo", label: "Día completo", icon: <CalendarDays size={14} /> },
  { value: "horas", label: "Por horas", icon: <Clock size={14} /> },
  { value: "manana", label: "Toda la mañana", icon: <Sun size={14} /> },
  { value: "tarde", label: "Toda la tarde", icon: <Moon size={14} /> },
];

export default function EditarNovedadModal({ open, onClose, novedad, empleados, onSaved }) {
  const [form, setForm] = useState({
    empleado_id: "", fecha_desde: "", fecha_hasta: "", motivo: "",
    tipo_novedad: "permiso", modalidad: "dia_completo",
    hora_desde: "", hora_hasta: "",
  });
  const [guardando, setGuardando] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    if (novedad) {
      setForm({
        empleado_id: novedad.empleado_id ?? "",
        fecha_desde: novedad.fecha_desde ? new Date(novedad.fecha_desde).toISOString().split("T")[0] : "",
        fecha_hasta: novedad.fecha_hasta ? new Date(novedad.fecha_hasta).toISOString().split("T")[0] : "",
        motivo: novedad.motivo || "",
        tipo_novedad: novedad.tipo_novedad || "permiso",
        modalidad: novedad.tipo || "dia_completo",
        hora_desde: novedad.hora_desde ? novedad.hora_desde.substring(0, 5) : "",
        hora_hasta: novedad.hora_hasta ? novedad.hora_hasta.substring(0, 5) : "",
      });
    }
  }, [novedad]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "tipo_novedad") {
      if (value !== "permiso") {
        setForm((prev) => ({ ...prev, tipo_novedad: value, modalidad: "dia_completo", hora_desde: "", hora_hasta: "" }));
      } else {
        setForm((prev) => ({ ...prev, tipo_novedad: value }));
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleGuardar = async () => {
    if (!form.empleado_id || !form.fecha_desde || !form.fecha_hasta || !form.motivo.trim()) {
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
      await actualizarNovedad(novedad.id, form);
      onSaved?.();
      onClose();
    } catch {
      setSnack({ open: true, msg: "Error al actualizar la novedad", severity: "error" });
    }
    setGuardando(false);
  };

  const empleadoNombre = novedad
    ? `${novedad.empleado_nombre || ""} ${novedad.empleado_apellido || ""}`.trim()
    : "";
  const tipoCfg = tipoNovedadConfig[form.tipo_novedad] || tipoNovedadConfig.permiso;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"
      PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}>
      <Box sx={{ height: 4, bgcolor: tipoCfg.color }} />

      <DialogTitle sx={{ pb: 0, pr: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>
              Editar novedad
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#6B7280", mt: 0.3 }}>
              {empleadoNombre}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: "#9CA3AF", mt: 0.5 }}>
            <X size={18} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, pb: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Empleado */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Empleado</Typography>
            <TextField select size="small" name="empleado_id" value={form.empleado_id} onChange={handleChange}
              sx={{ width: "100%", ...fieldSx }}>
              <MenuItem value="">Seleccionar empleado</MenuItem>
              {(empleados || []).map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.nombre} {emp.apellido} — {emp.area || emp.area_nombre || "Sin área"}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Fechas */}
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Desde</Typography>
              <TextField type="date" size="small" name="fecha_desde" value={form.fecha_desde} onChange={handleChange}
                sx={{ width: "100%", ...fieldSx }} InputLabelProps={{ shrink: true }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Hasta</Typography>
              <TextField type="date" size="small" name="fecha_hasta" value={form.fecha_hasta} onChange={handleChange}
                sx={{ width: "100%", ...fieldSx }} InputLabelProps={{ shrink: true }} />
            </Box>
          </Box>

          {/* Tipo de novedad */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Tipo de novedad</Typography>
            <TextField select size="small" name="tipo_novedad" value={form.tipo_novedad} onChange={handleChange}
              sx={{ width: "100%", ...fieldSx }}>
              {TIPOS_NOVEDAD.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>{t.icon} {t.label}</Box>
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Modalidad (solo permiso) */}
          {form.tipo_novedad === "permiso" && (
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Modalidad</Typography>
              <TextField select size="small" name="modalidad" value={form.modalidad} onChange={handleChange}
                sx={{ width: "100%", ...fieldSx }}>
                {MODALIDADES.map((m) => (
                  <MenuItem key={m.value} value={m.value}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>{m.icon} {m.label}</Box>
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}

          {/* Horario (solo horas) */}
          {form.modalidad === "horas" && (
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Hora inicio</Typography>
                <TextField type="time" size="small" name="hora_desde" value={form.hora_desde} onChange={handleChange}
                  sx={{ width: "100%", ...fieldSx }} InputLabelProps={{ shrink: true }} inputProps={{ step: 300 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Hora fin</Typography>
                <TextField type="time" size="small" name="hora_hasta" value={form.hora_hasta} onChange={handleChange}
                  sx={{ width: "100%", ...fieldSx }} InputLabelProps={{ shrink: true }} inputProps={{ step: 300 }} />
              </Box>
            </Box>
          )}

          {/* Motivo */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Motivo</Typography>
            <TextField size="small" name="motivo" value={form.motivo} onChange={handleChange}
              placeholder="Ej: Viaje a Medellín" sx={{ width: "100%", ...fieldSx }} />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1, gap: 1 }}>
        <Button onClick={onClose}
          sx={{ textTransform: "none", fontWeight: 600, fontSize: 13, color: "#6B7280", px: 3, borderRadius: "10px" }}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleGuardar} disabled={guardando}
          sx={{ textTransform: "none", fontWeight: 600, fontSize: 13, borderRadius: "10px", px: 3,
            bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}>
          {guardando ? "Guardando..." : "Guardar cambios"}
        </Button>
      </DialogActions>

      <Snackbar
        open={snack.open} autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        message={snack.msg}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        ContentProps={{ sx: { borderRadius: "10px", fontWeight: 500, fontSize: 13 } }}
      />
    </Dialog>
  );
}
