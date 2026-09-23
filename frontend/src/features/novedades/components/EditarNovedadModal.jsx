import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton,
  Box, Typography, TextField, MenuItem, Snackbar, Divider,
} from "@mui/material";
import {
  CalendarDays, Clock, Sun, Moon, FileText, UserCheck, AlertCircle, ShieldAlert, X,
  UserRound, Save, Info,
} from "lucide-react";
import { actualizarNovedad } from "../novedad.api";
import { COLORES } from "../../../shared/constants/colores.js";
import { PALETA } from "../../../shared/constants/paleta.js";

const selectMenuSx = {
  slotProps: {
    paper: { sx: { bgcolor: COLORES.fondoBlanco, "& .MuiMenuItem-root": { borderRadius: 1, mx: 0.5 } } },
  },
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    bgcolor: COLORES.fondoBlanco,
    minHeight: 40,
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    "& fieldset": { borderColor: PALETA.bordeInput },
    "&:hover fieldset": { borderColor: PALETA.gris },
    "&.Mui-focused fieldset": { borderColor: PALETA.verdeOscuro },
    "&.Mui-focused": { boxShadow: "0 0 0 4px rgba(27, 94, 32, 0.10)" },
  },
  "& .MuiInputLabel-root": { fontSize: 12.5, color: PALETA.grisTexto },
  "& .MuiInputLabel-root.Mui-focused": { color: PALETA.verdeOscuro },
  "& .MuiInputBase-input": { fontSize: 13 },
};

const labelSx = { fontSize: 12, fontWeight: 600, color: PALETA.grisTexto, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 };
const asterisco = <span style={{ color: PALETA.rojo }}>*</span>;

const TIPOS_NOVEDAD = [
  { value: "permission", label: "Permiso", icon: <FileText size={15} /> },
  { value: "vacation", label: "Vacaciones", icon: <CalendarDays size={15} /> },
  { value: "sick_leave", label: "Incapacidad", icon: <AlertCircle size={15} /> },
  { value: "commission", label: "Comisión", icon: <UserCheck size={15} /> },
  { value: "license", label: "Licencia", icon: <FileText size={15} /> },
  { value: "suspension", label: "Suspensión", icon: <ShieldAlert size={15} /> },
];

const MODALIDADES = [
  { value: "full_day", label: "Día completo", icon: <CalendarDays size={15} /> },
  { value: "hours", label: "Por horas", icon: <Clock size={15} /> },
  { value: "morning", label: "Toda la mañana", icon: <Sun size={15} /> },
  { value: "afternoon", label: "Toda la tarde", icon: <Moon size={15} /> },
];

export default function EditarNovedadModal({ open, onClose, novedad, empleados, onSaved }) {
  const [form, setForm] = useState({
    usuario_id: "", fecha_desde: "", fecha_hasta: "", motivo: "", observaciones: "",
    tipo_novedad: "permission", modalidad: "full_day",
    hora_desde: "", hora_hasta: "",
  });
  const [formInicial, setFormInicial] = useState(null);
  const [errors, setErrors] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    if (novedad) {
      const inicial = {
        usuario_id: novedad.usuario_id ?? novedad.empleado_id ?? "",
        fecha_desde: novedad.fecha_desde ? new Date(novedad.fecha_desde).toISOString().split("T")[0] : "",
        fecha_hasta: novedad.fecha_hasta ? new Date(novedad.fecha_hasta).toISOString().split("T")[0] : "",
        motivo: novedad.motivo || "",
        observaciones: novedad.observaciones || "",
        tipo_novedad: novedad.tipo_novedad || "permission",
        modalidad: novedad.tipo || "full_day",
        hora_desde: novedad.hora_desde ? novedad.hora_desde.substring(0, 5) : "",
        hora_hasta: novedad.hora_hasta ? novedad.hora_hasta.substring(0, 5) : "",
      };
      setForm(inicial);
      setFormInicial(inicial);
      setErrors({});
    }
  }, [novedad]);

  const sinCambios = JSON.stringify(form) === JSON.stringify(formInicial);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "tipo_novedad") {
      if (value !== "permission") {
        setForm((prev) => ({ ...prev, tipo_novedad: value, modalidad: "full_day", hora_desde: "", hora_hasta: "" }));
      } else {
        setForm((prev) => ({ ...prev, tipo_novedad: value }));
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validar = () => {
    const e = {};
    if (!form.usuario_id) e.usuario_id = "Selecciona un empleado";
    if (!form.fecha_desde) e.fecha_desde = "Campo obligatorio";
    if (!form.fecha_hasta) e.fecha_hasta = "Campo obligatorio";
    if (!form.motivo.trim()) e.motivo = "El motivo es obligatorio";
    if (form.fecha_desde && form.fecha_hasta && form.fecha_desde > form.fecha_hasta) {
      e.fecha_hasta = "La fecha 'hasta' debe ser mayor o igual a 'desde'";
    }
    if (form.modalidad === "hours") {
      if (!form.hora_desde) e.hora_desde = "Campo obligatorio";
      if (!form.hora_hasta) e.hora_hasta = "Campo obligatorio";
      if (form.hora_desde && form.hora_hasta && form.hora_desde >= form.hora_hasta) {
        e.hora_hasta = "Debe ser posterior a la hora de inicio";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGuardar = async () => {
    if (!validar()) return;
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

  const tipoSel = TIPOS_NOVEDAD.find((t) => t.value === form.tipo_novedad) || TIPOS_NOVEDAD[0];
  const modSel = MODALIDADES.find((m) => m.value === form.modalidad) || MODALIDADES[0];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md"
      slotProps={{ paper: { sx: { borderRadius: "18px", position: "relative", boxShadow: "0 24px 70px rgba(0,0,0,0.25)", backgroundColor: COLORES.fondoBlanco, overflow: "hidden" } } }}
      sx={{ "& .MuiBackdrop-root": { bgcolor: "rgba(17, 24, 39, 0.5)", backdropFilter: "blur(4px)" } }}>
      {/* HEADER */}
      <DialogTitle sx={{ px: 3, py: 1.75, position: "relative", pb: 1.25, bgcolor: COLORES.fondoBlanco }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: "11px", bgcolor: PALETA.verdeClaro, color: PALETA.verdeOscuro,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <CalendarDays size={19} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: PALETA.texto, lineHeight: 1.2 }}>
              Editar novedad
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: PALETA.grisTexto, mt: 0.15 }}>
              Actualiza la información de la novedad laboral seleccionada.
            </Typography>
          </Box>
        </Box>
        <IconButton aria-label="Cerrar" onClick={onClose} size="small"
          sx={{ position: "absolute", top: 11, right: 11, color: PALETA.gris, bgcolor: PALETA.grisClaro, "&:hover": { color: PALETA.texto, bgcolor: PALETA.borde } }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <Divider />

      {/* CUERPO */}
      <DialogContent sx={{ px: 3, py: 1.75, bgcolor: COLORES.fondoBlanco }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {/* FILA 1 — Empleado + Tipo */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
            <Box>
              <Typography sx={labelSx}>Empleado {asterisco}</Typography>
              <TextField select size="small" name="usuario_id" value={form.usuario_id} onChange={handleChange}
                error={!!errors.usuario_id} helperText={errors.usuario_id}
                sx={{ width: "100%", ...fieldSx }}
                slotProps={{
                  input: { startAdornment: <UserRound size={15} style={{ color: PALETA.gris, marginRight: 6 }} /> },
                  formHelperText: { sx: { fontSize: 11 } },
                  menu: selectMenuSx,
                }}>
                <MenuItem value="">Seleccionar empleado</MenuItem>
                {(empleados || []).map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.nombre} {emp.apellido} — {emp.area || emp.area_nombre || "Sin área"}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box>
              <Typography sx={labelSx}>Tipo de novedad {asterisco}</Typography>
              <TextField select size="small" name="tipo_novedad" value={form.tipo_novedad} onChange={handleChange}
                sx={{ width: "100%", ...fieldSx }}
                slotProps={{
                  input: { startAdornment: <Box sx={{ color: PALETA.gris, marginRight: 6, display: "flex" }}>{tipoSel.icon}</Box> },
                  menu: selectMenuSx,
                }}>
                {TIPOS_NOVEDAD.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>{t.icon} {t.label}</Box>
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>

          {/* FILA 2 — Fechas */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
            <Box>
              <Typography sx={labelSx}>Fecha desde {asterisco}</Typography>
              <TextField type="date" size="small" name="fecha_desde" value={form.fecha_desde} onChange={handleChange}
                error={!!errors.fecha_desde} helperText={errors.fecha_desde}
                sx={{ width: "100%", ...fieldSx }} slotProps={{ inputLabel: { shrink: true } }}
                slotProps={{ formHelperText: { sx: { fontSize: 11 } } }} />
            </Box>
            <Box>
              <Typography sx={labelSx}>Fecha hasta {asterisco}</Typography>
              <TextField type="date" size="small" name="fecha_hasta" value={form.fecha_hasta} onChange={handleChange}
                error={!!errors.fecha_hasta} helperText={errors.fecha_hasta}
                sx={{ width: "100%", ...fieldSx }} slotProps={{ inputLabel: { shrink: true } }}
                slotProps={{ formHelperText: { sx: { fontSize: 11 } } }} />
            </Box>
          </Box>

          {/* FILA 2b — Modalidad (solo permiso) + Horario (solo horas) */}
          {form.tipo_novedad === "permission" && (
            form.modalidad === "hours" ? (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 1.5 }}>
                <Box>
                  <Typography sx={labelSx}>Modalidad {asterisco}</Typography>
                  <TextField select size="small" name="modalidad" value={form.modalidad} onChange={handleChange}
                    sx={{ width: "100%", ...fieldSx }}
                    slotProps={{ input: { startAdornment: <Box sx={{ color: PALETA.gris, marginRight: 6, display: "flex" }}>{modSel.icon}</Box> }, menu: selectMenuSx }}>
                    {MODALIDADES.map((m) => (
                      <MenuItem key={m.value} value={m.value}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>{m.icon} {m.label}</Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelSx}>Hora inicio {asterisco}</Typography>
                  <TextField type="time" size="small" name="hora_desde" value={form.hora_desde} onChange={handleChange}
                    error={!!errors.hora_desde} helperText={errors.hora_desde}
                    sx={{ width: "100%", ...fieldSx }} slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 300 }, formHelperText: { sx: { fontSize: 11 } } }} />
                </Box>
                <Box>
                  <Typography sx={labelSx}>Hora fin {asterisco}</Typography>
                  <TextField type="time" size="small" name="hora_hasta" value={form.hora_hasta} onChange={handleChange}
                    error={!!errors.hora_hasta} helperText={errors.hora_hasta}
                    sx={{ width: "100%", ...fieldSx }} slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 300 }, formHelperText: { sx: { fontSize: 11 } } }} />
                </Box>
              </Box>
            ) : (
              <Box>
                <Typography sx={labelSx}>Modalidad {asterisco}</Typography>
                <TextField select size="small" name="modalidad" value={form.modalidad} onChange={handleChange}
                  sx={{ maxWidth: 380, ...fieldSx }}
                  slotProps={{ input: { startAdornment: <Box sx={{ color: PALETA.gris, marginRight: 6, display: "flex" }}>{modSel.icon}</Box> }, menu: selectMenuSx }}>
                  {MODALIDADES.map((m) => (
                    <MenuItem key={m.value} value={m.value}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>{m.icon} {m.label}</Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            )
          )}

          {/* FILA 3 — Motivo (full width) */}
          <Box>
            <Typography sx={labelSx}>Motivo {asterisco}</Typography>
            <TextField size="small" name="motivo" value={form.motivo} onChange={handleChange}
              error={!!errors.motivo} helperText={errors.motivo}
              placeholder="Ej: Viaje a Medellín"
              sx={{ width: "100%", ...fieldSx }}
              slotProps={{ formHelperText: { sx: { fontSize: 11 } } }} />
          </Box>

          {/* FILA 4 — Observaciones (full width, textarea) */}
          <Box>
            <Typography sx={labelSx}>Observaciones</Typography>
            <TextField multiline rows={4} name="observaciones" value={form.observaciones} onChange={handleChange}
              placeholder="Agregar información adicional (opcional)"
              sx={{ width: "100%", ...fieldSx }} />
          </Box>

          {/* TARJETA INFORMATIVA */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, bgcolor: PALETA.grisClaro, borderRadius: "12px", px: 1.75, py: 1.25 }}>
            <Info size={15} style={{ color: PALETA.grisTexto, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 12, color: PALETA.grisTexto, lineHeight: 1.45 }}>
              Los cambios realizados serán registrados en el historial de novedades.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      {/* FOOTER */}
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1.5 }}>
        <Button onClick={onClose}
          sx={{ borderRadius: "9px", textTransform: "none", fontSize: 12.5, fontWeight: 600, color: PALETA.grisTexto, bgColor: COLORES.fondoBlanco, border: `1px solid ${PALETA.bordeInput}`, px: 3, py: 0.6, "&:hover": { bgcolor: PALETA.grisClaro } }}>
          Cancelar
        </Button>
        <Button variant="contained" startIcon={<Save size={15} />} onClick={handleGuardar} disabled={guardando || sinCambios}
          sx={{ borderRadius: "9px", textTransform: "none", fontSize: 12.5, fontWeight: 600, px: 3.5, py: 0.6, bgcolor: PALETA.verdeOscuro, "&:hover": { bgcolor: PALETA.verde } }}>
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
