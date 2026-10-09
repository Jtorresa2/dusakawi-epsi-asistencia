import { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton,
  Box, Typography, TextField, MenuItem, Divider, Autocomplete, Avatar,
} from "@mui/material";
import {
  CalendarDays, Clock, Sun, Moon, FileText, UserCheck, AlertCircle, ShieldAlert, X,
  Plus, Calendar, Info, Search,
} from "lucide-react";
import { crearNovedad } from "../novedad.api";
import { COLORES } from "../../../shared/constants/colores.js";
import { PALETA } from "../../../shared/constants/paleta.js";

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}

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

const labelSx = {
  fontSize: 12,
  fontWeight: 600,
  color: PALETA.grisTexto,
  mb: 0.5,
  display: "flex",
  alignItems: "center",
  gap: 0.5,
};

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

export default function NuevaNovedadModal({
  open,
  onClose,
  empleados = [],
  areas = [],
  onSaved,
  onNotificar,
}) {
  const [areaFiltro, setAreaFiltro] = useState("Todas");
  const [form, setForm] = useState({
    usuario_id: "",
    fecha_desde: "",
    fecha_hasta: "",
    motivo: "",
    tipo_novedad: "permission",
    modalidad: "full_day",
    hora_desde: "",
    hora_hasta: "",
  });
  const [errors, setErrors] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) {
      const hoy = new Date().toISOString().split("T")[0];
      setForm({
        usuario_id: "",
        fecha_desde: hoy,
        fecha_hasta: hoy,
        motivo: "",
        tipo_novedad: "permission",
        modalidad: "full_day",
        hora_desde: "",
        hora_hasta: "",
      });
      setAreaFiltro("Todas");
      setErrors({});
      setGuardando(false);
    }
  }, [open]);

  const empleadoAreaMap = useMemo(() => {
    return Object.fromEntries(
      empleados.map((emp) => [emp.id, emp.area || emp.area_nombre || ""])
    );
  }, [empleados]);

  const empleadosFiltrados = useMemo(() => {
    if (areaFiltro === "Todas") return empleados;
    return empleados.filter((emp) => empleadoAreaMap[emp.id] === areaFiltro);
  }, [empleados, areaFiltro, empleadoAreaMap]);

  const diasHabiles = useMemo(() => {
    return calcularDiasHabiles(form.fecha_desde, form.fecha_hasta);
  }, [form.fecha_desde, form.fecha_hasta]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    if (name === "tipo_novedad") {
      if (value !== "permission") {
        setForm((prev) => ({
          ...prev,
          tipo_novedad: value,
          modalidad: "full_day",
          hora_desde: "",
          hora_hasta: "",
        }));
      } else {
        setForm((prev) => ({ ...prev, tipo_novedad: value }));
      }
    } else if (name === "modalidad") {
      if (["morning", "afternoon"].includes(value)) {
        // En media jornada, fecha_hasta coincide con fecha_desde
        setForm((prev) => ({
          ...prev,
          modalidad: value,
          fecha_hasta: prev.fecha_desde,
          hora_desde: "",
          hora_hasta: "",
        }));
      } else {
        setForm((prev) => ({ ...prev, modalidad: value }));
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFechaDesdeChange = (e) => {
    const v = e.target.value;
    const hastaValido = form.fecha_hasta && form.fecha_hasta >= v;
    setForm((prev) => ({
      ...prev,
      fecha_desde: v,
      ...((!hastaValido || ["morning", "afternoon"].includes(prev.modalidad)) && { fecha_hasta: v }),
    }));
    if (errors.fecha_desde || errors.fecha_hasta) {
      setErrors((prev) => ({ ...prev, fecha_desde: undefined, fecha_hasta: undefined }));
    }
  };

  const validar = () => {
    const errs = {};
    if (!form.usuario_id) errs.usuario_id = "Selecciona un empleado";
    if (!form.fecha_desde) errs.fecha_desde = "Fecha requerida";
    if (!form.fecha_hasta) errs.fecha_hasta = "Fecha requerida";
    if (form.fecha_desde && form.fecha_hasta && form.fecha_desde > form.fecha_hasta) {
      errs.fecha_hasta = "No puede ser anterior a la fecha inicial";
    }
    if (form.modalidad === "hours") {
      if (!form.hora_desde) errs.hora_desde = "Hora requerida";
      if (!form.hora_hasta) errs.hora_hasta = "Hora requerida";
      if (form.hora_desde && form.hora_hasta && form.hora_desde >= form.hora_hasta) {
        errs.hora_hasta = "Debe ser posterior a la hora inicial";
      }
    }
    if (!form.motivo.trim()) errs.motivo = "El motivo o justificación es obligatorio";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGuardar = async () => {
    if (!validar()) return;
    setGuardando(true);
    try {
      const res = await crearNovedad(form);
      const tipoLabel =
        { full_day: "día completo", hours: "por horas", morning: "solo mañana", afternoon: "solo tarde" }[
          form.modalidad
        ] || "";
      const msg = `Novedad registrada (${tipoLabel})${
        res.dias_generados
          ? form.tipo_novedad === "commission"
            ? ` — ${res.dias_generados} día(s) en comisión`
            : ` — ${res.dias_generados} día(s) justificado(s)`
          : " — el empleado marca la otra mitad normalmente"
      }`;
      onNotificar?.(msg, "success");
      onSaved?.();
      onClose?.();
    } catch (err) {
      onNotificar?.(err.message || "Error al registrar la novedad", "error");
    } finally {
      setGuardando(false);
    }
  };

  const esMediaJornada = ["morning", "afternoon"].includes(form.modalidad);

  return (
    <Dialog
      open={open}
      onClose={guardando ? undefined : onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: "20px",
            bgcolor: COLORES.fondoBlanco,
            boxShadow: "0 24px 60px rgba(0,0,0,0.14)",
            overflow: "hidden",
          },
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          p: 2.5,
          pb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${PALETA.borde}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "12px",
              bgcolor: PALETA.verdeClaro,
              color: PALETA.verdeOscuro,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Calendar size={22} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 17, fontWeight: 700, color: PALETA.texto, lineHeight: 1.2 }}>
              Registrar Excepción de Asistencia
            </Typography>
            <Typography sx={{ fontSize: 12, color: PALETA.grisTexto, mt: 0.25 }}>
              Permisos, licencias, comisiones o incapacidades laborales
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} disabled={guardando} sx={{ color: PALETA.gris }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Sección 1: Empleado y Área */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "220px 1fr" }, gap: 2 }}>
          <Box>
            <Typography sx={labelSx}>Área (filtro)</Typography>
            <TextField
              select
              size="small"
              fullWidth
              value={areaFiltro}
              onChange={(e) => setAreaFiltro(e.target.value)}
              sx={fieldSx}
            >
              <MenuItem value="Todas">Todas las áreas</MenuItem>
              {areas.map((a) => (
                <MenuItem key={a.id} value={a.nombre}>
                  {a.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Box>
            <Typography sx={labelSx}>Empleado {asterisco}</Typography>
            <Autocomplete
              size="small"
              fullWidth
              options={empleadosFiltrados}
              value={empleados.find((e) => e.id === form.usuario_id) || null}
              onChange={(_, nuevo) => {
                setForm((prev) => ({ ...prev, usuario_id: nuevo ? nuevo.id : "" }));
                if (errors.usuario_id) {
                  setErrors((prev) => ({ ...prev, usuario_id: undefined }));
                }
              }}
              getOptionLabel={(opt) =>
                `${opt.nombre || ""} ${opt.apellido || ""}`.trim() || opt.documento || ""
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderOption={(props, emp) => (
                <Box
                  component="li"
                  {...props}
                  key={emp.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    py: 1,
                    px: 1.5,
                    "&:hover": { bgcolor: COLORES.fondoGris },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 30,
                      height: 30,
                      fontSize: 11,
                      fontWeight: 700,
                      bgcolor: PALETA.verdeClaro,
                      color: PALETA.verdeOscuro,
                    }}
                  >
                    {getInitials(`${emp.nombre || ""} ${emp.apellido || ""}`)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: PALETA.texto }} noWrap>
                      {emp.nombre} {emp.apellido}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: PALETA.grisTexto }} noWrap>
                      {emp.documento ? `CC ${emp.documento} · ` : ""}
                      {empleadoAreaMap[emp.id] || "Sin área"}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Buscar por nombre o documento..."
                  error={Boolean(errors.usuario_id)}
                  helperText={errors.usuario_id}
                  sx={fieldSx}
                />
              )}
              noOptionsText="No se encontraron empleados"
            />
          </Box>
        </Box>

        {/* Sección 2: Tipo de Novedad y Modalidad */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: form.tipo_novedad === "permission" ? "1fr 1fr" : "1fr" }, gap: 2 }}>
          <Box>
            <Typography sx={labelSx}>Tipo de novedad {asterisco}</Typography>
            <TextField
              select
              size="small"
              fullWidth
              name="tipo_novedad"
              value={form.tipo_novedad}
              onChange={handleChange}
              sx={fieldSx}
            >
              {TIPOS_NOVEDAD.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ color: PALETA.verdeOscuro, display: "flex" }}>{t.icon}</Box>
                    <span>{t.label}</span>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {form.tipo_novedad === "permission" && (
            <Box>
              <Typography sx={labelSx}>Modalidad del permiso</Typography>
              <TextField
                select
                size="small"
                fullWidth
                name="modalidad"
                value={form.modalidad}
                onChange={handleChange}
                sx={fieldSx}
              >
                {MODALIDADES.map((m) => (
                  <MenuItem key={m.value} value={m.value}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ color: PALETA.verdeOscuro, display: "flex" }}>{m.icon}</Box>
                      <span>{m.label}</span>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}
        </Box>

        {/* Sección 3: Fechas y Horas */}
        <Box
          sx={{
            p: 2,
            borderRadius: "14px",
            bgcolor: COLORES.fondoGris,
            border: `1px solid ${PALETA.borde}`,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 140px" }, gap: 2, alignItems: "center" }}>
            <Box>
              <Typography sx={labelSx}>Fecha desde {asterisco}</Typography>
              <TextField
                type="date"
                size="small"
                fullWidth
                name="fecha_desde"
                value={form.fecha_desde}
                onChange={handleFechaDesdeChange}
                error={Boolean(errors.fecha_desde)}
                helperText={errors.fecha_desde}
                sx={fieldSx}
              />
            </Box>
            <Box>
              <Typography sx={labelSx}>Fecha hasta {asterisco}</Typography>
              <TextField
                type="date"
                size="small"
                fullWidth
                name="fecha_hasta"
                value={form.fecha_hasta}
                onChange={handleChange}
                disabled={esMediaJornada}
                error={Boolean(errors.fecha_hasta)}
                helperText={errors.fecha_hasta}
                sx={{
                  ...fieldSx,
                  "& .MuiInputBase-root": { opacity: esMediaJornada ? 0.6 : 1 },
                }}
              />
            </Box>
            <Box
              sx={{
                p: 1.25,
                borderRadius: "12px",
                bgcolor: PALETA.verdeClaro,
                border: "1px solid rgba(27, 94, 32, 0.18)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 58,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CalendarDays size={13} color={PALETA.verdeOscuro} />
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: PALETA.verdeOscuro }}>
                  {form.modalidad === "hours" ? "Mismo día" : "Días hábiles"}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 20, fontWeight: 800, color: PALETA.verdeOscuro, lineHeight: 1.1 }}>
                {form.modalidad === "hours" ? "1" : diasHabiles}
              </Typography>
            </Box>
          </Box>

          {/* Horas condicionales */}
          {form.modalidad === "hours" && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, pt: 1, borderTop: `1px dashed ${PALETA.borde}` }}>
              <Box>
                <Typography sx={labelSx}>Hora inicio {asterisco}</Typography>
                <TextField
                  type="time"
                  size="small"
                  fullWidth
                  name="hora_desde"
                  value={form.hora_desde}
                  onChange={handleChange}
                  error={Boolean(errors.hora_desde)}
                  helperText={errors.hora_desde}
                  sx={fieldSx}
                  slotProps={{ htmlInput: { step: 300 } }}
                />
              </Box>
              <Box>
                <Typography sx={labelSx}>Hora fin {asterisco}</Typography>
                <TextField
                  type="time"
                  size="small"
                  fullWidth
                  name="hora_hasta"
                  value={form.hora_hasta}
                  onChange={handleChange}
                  error={Boolean(errors.hora_hasta)}
                  helperText={errors.hora_hasta}
                  sx={fieldSx}
                  slotProps={{ htmlInput: { step: 300 } }}
                />
              </Box>
            </Box>
          )}
        </Box>

        {/* Sección 4: Motivo */}
        <Box>
          <Typography sx={labelSx}>Motivo / Justificación {asterisco}</Typography>
          <TextField
            fullWidth
            multiline
            rows={2.5}
            name="motivo"
            value={form.motivo}
            onChange={handleChange}
            error={Boolean(errors.motivo)}
            helperText={errors.motivo}
            placeholder="Describe la justificación de la excepción laboral..."
            sx={fieldSx}
          />
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          p: 2.5,
          pt: 2,
          borderTop: `1px solid ${PALETA.borde}`,
          display: "flex",
          justifyContent: "flex-end",
          gap: 1.5,
        }}
      >
        <Button
          onClick={onClose}
          disabled={guardando}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            fontSize: 13,
            color: PALETA.grisTexto,
            px: 2.5,
            "&:hover": { bgcolor: COLORES.fondoGris },
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleGuardar}
          disabled={guardando}
          startIcon={<Plus size={16} />}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            fontSize: 13,
            height: 40,
            px: 3,
            bgcolor: PALETA.verdeOscuro,
            "&:hover": { bgcolor: PALETA.verde },
            boxShadow: "0 4px 12px rgba(27, 94, 32, 0.20)",
          }}
        >
          {guardando ? "Registrando..." : "Registrar novedad"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
