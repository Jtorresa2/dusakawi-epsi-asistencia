import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, TextField, Button, MenuItem, IconButton,
  Select, Switch, Divider, InputAdornment, Chip, Tooltip,
  CircularProgress, Alert,
} from "@mui/material";
import {
  X, Plus, Trash2, Clock, Timer, CheckCircle2, CalendarClock,
  Info, Copy, RotateCcw, AlertTriangle, Sparkles, Sun, Moon,
  SlidersHorizontal, Check,
} from "lucide-react";
import { crearHorario } from "../horario.api";
import { COLORES } from "../../../shared/constants/colores.js";
import { PALETA } from "../../../shared/constants/paleta.js";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const FINES_DE_SEMANA = ["Sábado", "Domingo"];

const modalFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    bgcolor: COLORES.fondoBlanco,
    minHeight: 38,
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    "& fieldset": { borderColor: PALETA.bordeInput },
    "&:hover fieldset": { borderColor: PALETA.gris },
    "&.Mui-focused fieldset": { borderColor: PALETA.verdeOscuro },
    "&.Mui-focused": { boxShadow: "0 0 0 4px rgba(27, 94, 32, 0.10)" },
  },
  "& .MuiInputLabel-root": { fontSize: 12, color: PALETA.grisTexto },
  "& .MuiInputLabel-root.Mui-focused": { color: PALETA.verdeOscuro },
  "& .MuiInputBase-input": { fontSize: 12.5 },
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

// Tarjeta seleccionable sin layout shift
const tarjetaOpcion = (seleccionada) => ({
  border: `2px solid ${seleccionada ? PALETA.verdeOscuro : PALETA.borde}`,
  bgcolor: seleccionada ? PALETA.verdeMuySuave : COLORES.fondoBlanco,
  borderRadius: "12px",
  p: 1.5,
  cursor: "pointer",
  transition: "all 0.18s ease-in-out",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  "&:hover": {
    borderColor: seleccionada ? PALETA.verdeOscuro : PALETA.gris,
    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  },
});

const diaVacio = (dia) => ({
  dia_semana: dia,
  hora_entrada_manana: "",
  hora_salida_manana: "",
  hora_entrada_tarde: "",
  hora_salida_tarde: "",
  bloque2: false,
});

export default function NuevoHorarioModal({ open, onClose, onNotificar, onReload }) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [activo, setActivo] = useState(true);
  const [tipoJornada, setTipoJornada] = useState("fixed"); // "fixed" | "by_hours"
  const [controlarTardanzas, setControlarTardanzas] = useState(true);
  const [toleranciaMinutos, setToleranciaMinutos] = useState("10");
  const [toleranciaSalidaMinutos, setToleranciaSalidaMinutos] = useState("0");
  const [horasEsperadas, setHorasEsperadas] = useState("");
  const [dias, setDias] = useState([]);
  const [errors, setErrors] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) {
      setNombre("");
      setDescripcion("");
      setActivo(true);
      setTipoJornada("fixed");
      setControlarTardanzas(true);
      setToleranciaMinutos("10");
      setToleranciaSalidaMinutos("0");
      setHorasEsperadas("");
      // Inicializar con L-V con horario administrativo estándar y Sáb-Dom vacíos
      setDias(
        DIAS.map((dia, idx) => {
          if (idx <= 4) {
            return {
              dia_semana: dia,
              hora_entrada_manana: "08:00",
              hora_salida_manana: "12:00",
              hora_entrada_tarde: "14:00",
              hora_salida_tarde: "18:00",
              bloque2: true,
            };
          }
          return diaVacio(dia);
        })
      );
      setErrors({});
      setGuardando(false);
    }
  }, [open]);

  const cambiarDia = (idx, campo, valor) => {
    setDias((prev) => prev.map((d, i) => (i === idx ? { ...d, [campo]: valor } : d)));
    if (errors.dias) {
      setErrors((prev) => ({ ...prev, dias: undefined }));
    }
  };

  // Copiar la configuración del Lunes a Martes, Miércoles, Jueves y Viernes
  const aplicarLunesALunVie = () => {
    const lunes = dias[0];
    const tieneConfig = lunes.hora_entrada_manana || lunes.hora_salida_manana;
    const base = tieneConfig
      ? {
          hora_entrada_manana: lunes.hora_entrada_manana,
          hora_salida_manana: lunes.hora_salida_manana,
          hora_entrada_tarde: lunes.hora_entrada_tarde,
          hora_salida_tarde: lunes.hora_salida_tarde,
          bloque2: lunes.bloque2,
        }
      : {
          hora_entrada_manana: "08:00",
          hora_salida_manana: "12:00",
          hora_entrada_tarde: "14:00",
          hora_salida_tarde: "18:00",
          bloque2: true,
        };

    setDias((prev) =>
      prev.map((d, idx) => {
        if (idx <= 4) {
          return { ...d, ...base };
        }
        return d;
      })
    );
    if (errors.dias) {
      setErrors((prev) => ({ ...prev, dias: undefined }));
    }
    onNotificar?.("Horario aplicado de Lunes a Viernes", "success");
  };

  // Turno continuo de 8 horas (08:00 a 17:00 con 1h almuerzo o 08:00 a 16:00 continuo)
  const aplicarContinuoLunVie = () => {
    setDias((prev) =>
      prev.map((d, idx) => {
        if (idx <= 4) {
          return {
            dia_semana: d.dia_semana,
            hora_entrada_manana: "08:00",
            hora_salida_manana: "17:00",
            hora_entrada_tarde: "",
            hora_salida_tarde: "",
            bloque2: false,
          };
        }
        return d;
      })
    );
    if (errors.dias) {
      setErrors((prev) => ({ ...prev, dias: undefined }));
    }
    onNotificar?.("Turno continuo (08:00 - 17:00) aplicado a Lun-Vie", "success");
  };

  // Limpiar todos los días
  const limpiarSemana = () => {
    setDias(DIAS.map(diaVacio));
  };

  const validar = () => {
    const nuevosErrores = {};
    if (!nombre.trim()) {
      nuevosErrores.nombre = "El nombre del horario es obligatorio";
    }

    if (tipoJornada === "by_hours") {
      if (!horasEsperadas || Number(horasEsperadas) <= 0) {
        nuevosErrores.horasEsperadas = "Ingresa las horas de trabajo requeridas (ej: 8)";
      }
    } else if (tipoJornada === "fixed") {
      const diasConHorario = dias.filter((d) => d.hora_entrada_manana && d.hora_salida_manana);
      if (diasConHorario.length === 0) {
        nuevosErrores.dias = "Debes configurar al menos un día con horario de entrada y salida";
      }
    }

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleGuardar = async () => {
    if (!validar()) return;
    setGuardando(true);
    try {
      const tolEntrada = controlarTardanzas ? Math.max(0, parseInt(toleranciaMinutos, 10) || 0) : 0;
      const tolSalida = controlarTardanzas ? Math.max(0, parseInt(toleranciaSalidaMinutos, 10) || 0) : 0;

      const res = await crearHorario({
        nombre: nombre.trim(),
        modalidad: controlarTardanzas ? "strict" : "flexible",
        tipo_jornada: tipoJornada,
        descripcion: descripcion.trim() || null,
        horas_esperadas: tipoJornada === "by_hours" && horasEsperadas ? Number(horasEsperadas) : null,
        tolerancia_minutos: tolEntrada,
        tolerancia_salida_minutos: tolSalida,
        activo,
        detalles:
          tipoJornada === "fixed"
            ? dias
                .filter((d) => d.dia_semana && d.hora_entrada_manana && d.hora_salida_manana)
                .map((d) => ({
                  dia_semana: d.dia_semana,
                  hora_entrada_manana: d.hora_entrada_manana ? `${d.hora_entrada_manana}:00` : null,
                  hora_salida_manana: d.hora_salida_manana ? `${d.hora_salida_manana}:00` : null,
                  hora_entrada_tarde: d.bloque2 && d.hora_entrada_tarde ? `${d.hora_entrada_tarde}:00` : null,
                  hora_salida_tarde: d.bloque2 && d.hora_salida_tarde ? `${d.hora_salida_tarde}:00` : null,
                }))
            : [],
      });
      onNotificar?.(res.mensaje || "Horario creado correctamente", "success");
      onClose();
      onReload?.();
    } catch (err) {
      onNotificar?.(err.message || "Error al crear el horario", "error");
    } finally {
      setGuardando(false);
    }
  };

  const diasActivos = dias.filter((d) => d.hora_entrada_manana && d.hora_salida_manana);

  // Vista previa dinámica
  const vistaPrevia = [
    controlarTardanzas
      ? `Controlará tardanzas (tolerancia entrada: ${toleranciaMinutos || 0} min).`
      : "No controlará tardanzas (horario flexible).",
    tipoJornada === "fixed"
      ? `${diasActivos.length} día(s) configurado(s) en la semana.`
      : `Evaluará ${horasEsperadas || 0} horas esperadas por jornada.`,
    tipoJornada === "fixed"
      ? "Calculará ausencias y retrasos sobre horas pactadas."
      : "Comparará las horas registradas contra las esperadas.",
  ];

  return (
    <Dialog
      open={open}
      onClose={guardando ? undefined : onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      slotProps={{
        paper: {
          sx: {
            borderRadius: "20px",
            boxShadow: "0 24px 70px rgba(0,0,0,0.20)",
            backgroundColor: COLORES.fondoBlanco,
            height: "88vh",
            maxHeight: "88vh",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
      sx={{
        "& .MuiBackdrop-root": {
          bgcolor: "rgba(17, 24, 39, 0.45)",
          backdropFilter: "blur(4px)",
        },
      }}
    >
      {/* HEADER FIJO */}
      <DialogTitle sx={{ px: 3, py: 2, position: "relative", flexShrink: 0 }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
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
              flexShrink: 0,
            }}
          >
            <CalendarClock size={22} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 17, fontWeight: 700, color: PALETA.texto, lineHeight: 1.2 }}>
              Nuevo Horario Laboral
            </Typography>
            <Typography sx={{ fontSize: 12, color: PALETA.grisTexto, mt: 0.25 }}>
              Configura los turnos, reglas de tardanza y tolerancias del horario
            </Typography>
          </Box>
        </Box>
        <IconButton
          aria-label="Cerrar"
          onClick={onClose}
          disabled={guardando}
          size="small"
          sx={{
            position: "absolute",
            top: 14,
            right: 14,
            color: PALETA.gris,
            bgcolor: PALETA.grisClaro,
            "&:hover": { color: PALETA.texto, bgcolor: PALETA.borde },
          }}
        >
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <Divider />

      {/* CONTENIDO CON SCROLL VERTICAL VISIBLE Y FLUIDO */}
      <DialogContent
        dividers
        sx={{
          px: 3,
          py: 2.25,
          overflowY: "scroll",
          flex: "1 1 auto",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          bgcolor: COLORES.fondoBlanco,
          // Scrollbar vertical visible con diseño institucional
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            bgcolor: "#F3F4F6",
            borderRadius: "6px",
          },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "rgba(27, 94, 32, 0.35)",
            borderRadius: "6px",
            border: "2px solid #F3F4F6",
            "&:hover": {
              bgcolor: PALETA.verdeOscuro,
            },
          },
          scrollbarWidth: "thin",
          scrollbarColor: `rgba(27, 94, 32, 0.40) #F3F4F6`,
        }}
      >
        {/* SECCIÓN 1 — INFORMACIÓN GENERAL */}
        <Box
          sx={{
            border: `1px solid ${PALETA.borde}`,
            borderRadius: "14px",
            bgcolor: COLORES.fondoBlanco,
            p: 2,
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto, mb: 1.5 }}>
            1. Información general
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1.2fr 1.4fr 140px" },
              gap: 2,
            }}
          >
            <Box>
              <Typography sx={labelSx}>Nombre {asterisco}</Typography>
              <TextField
                size="small"
                fullWidth
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: undefined }));
                }}
                error={Boolean(errors.nombre)}
                helperText={errors.nombre}
                placeholder="Ej: Jornada Administrativa"
                sx={modalFieldSx}
              />
            </Box>
            <Box>
              <Typography sx={labelSx}>Descripción</Typography>
              <TextField
                size="small"
                fullWidth
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Turno diurno de sede principal"
                sx={modalFieldSx}
              />
            </Box>
            <Box>
              <Typography sx={labelSx}>Estado</Typography>
              <Select
                value={activo ? "activo" : "inactivo"}
                fullWidth
                size="small"
                onChange={(e) => setActivo(e.target.value === "activo")}
                sx={modalFieldSx}
              >
                <MenuItem value="activo">Activo</MenuItem>
                <MenuItem value="inactivo">Inactivo</MenuItem>
              </Select>
            </Box>
          </Box>
        </Box>

        {/* SECCIÓN 2 + 3 — JORNADA Y EVALUACIÓN */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
        >
          {/* ¿Cómo trabaja? */}
          <Box
            sx={{
              border: `1px solid ${PALETA.borde}`,
              borderRadius: "14px",
              bgcolor: COLORES.fondoBlanco,
              p: 2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto, mb: 0.25 }}>
              2. Modalidad de jornada
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: PALETA.grisTexto, mb: 1.5 }}>
              Selecciona cómo se medirán los turnos de trabajo
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, flex: 1 }}>
              <Box
                sx={tarjetaOpcion(tipoJornada === "fixed")}
                onClick={() => setTipoJornada("fixed")}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "9px",
                      bgcolor: PALETA.verdeClaro,
                      color: PALETA.verdeOscuro,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Clock size={16} />
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto }}>
                    Horario fijo por turnos
                  </Typography>
                  {tipoJornada === "fixed" && (
                    <CheckCircle2
                      size={16}
                      color={PALETA.verdeOscuro}
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </Box>
                <Typography sx={{ fontSize: 11.5, color: PALETA.grisTexto, lineHeight: 1.4 }}>
                  Horarios definidos de entrada y salida para cada día de la semana.
                </Typography>
              </Box>

              <Box
                sx={tarjetaOpcion(tipoJornada === "by_hours")}
                onClick={() => setTipoJornada("by_hours")}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "9px",
                      bgcolor: PALETA.verdeClaro,
                      color: PALETA.verdeOscuro,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Timer size={16} />
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto }}>
                    Jornada por horas
                  </Typography>
                  {tipoJornada === "by_hours" && (
                    <CheckCircle2
                      size={16}
                      color={PALETA.verdeOscuro}
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </Box>
                <Typography sx={{ fontSize: 11.5, color: PALETA.grisTexto, lineHeight: 1.4 }}>
                  El sistema evalúa el total de horas acumuladas sin exigir horas fijas.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* ¿Cómo evalúa tardanzas? */}
          <Box
            sx={{
              border: `1px solid ${PALETA.borde}`,
              borderRadius: "14px",
              bgcolor: COLORES.fondoBlanco,
              p: 2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto, mb: 0.25 }}>
              3. Reglas de tardanza y tolerancia
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: PALETA.grisTexto, mb: 1.5 }}>
              Define el rigor de puntualidad y los márgenes de gracia
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, flex: 1 }}>
              <Box
                sx={tarjetaOpcion(controlarTardanzas)}
                onClick={() => setControlarTardanzas(true)}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "9px",
                      bgcolor: PALETA.verdeClaro,
                      color: PALETA.verdeOscuro,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle2 size={16} />
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto }}>
                    Controlar tardanzas
                  </Typography>
                  {controlarTardanzas && (
                    <CheckCircle2
                      size={16}
                      color={PALETA.verdeOscuro}
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </Box>
                <Typography sx={{ fontSize: 11.5, color: PALETA.grisTexto, lineHeight: 1.4 }}>
                  Genera reportes de retardo si la marcación supera la tolerancia.
                </Typography>
              </Box>

              <Box
                sx={tarjetaOpcion(!controlarTardanzas)}
                onClick={() => setControlarTardanzas(false)}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "9px",
                      bgcolor: PALETA.grisClaro,
                      color: PALETA.grisTexto,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Clock size={16} />
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto }}>
                    Sin control de tardanzas (Flexible)
                  </Typography>
                  {!controlarTardanzas && (
                    <CheckCircle2
                      size={16}
                      color={PALETA.verdeOscuro}
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </Box>
                <Typography sx={{ fontSize: 11.5, color: PALETA.grisTexto, lineHeight: 1.4 }}>
                  Registra la asistencia normalmente pero no computa minutos de retraso.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* TOLERANCIAS CONFIGURABLES (Si controla tardanzas) */}
        {controlarTardanzas && (
          <Box
            sx={{
              border: `1px solid ${PALETA.borde}`,
              borderRadius: "14px",
              bgcolor: COLORES.fondoGris,
              p: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
              <SlidersHorizontal size={16} color={PALETA.verdeOscuro} />
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto }}>
                Tolerancias de marcación
              </Typography>
              <Chip
                label="En minutos"
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10.5,
                  fontWeight: 600,
                  bgcolor: PALETA.verdeClaro,
                  color: PALETA.verdeOscuro,
                }}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <Box>
                <Typography sx={labelSx}>
                  <Sun size={13} color={PALETA.verdeOscuro} /> Tolerancia de entrada (minutos)
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  value={toleranciaMinutos}
                  onChange={(e) => setToleranciaMinutos(e.target.value)}
                  placeholder="Ej: 10"
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end">min</InputAdornment>,
                    },
                    htmlInput: { min: 0, max: 120 },
                  }}
                  sx={modalFieldSx}
                />
                <Typography sx={{ fontSize: 11, color: PALETA.grisTexto, mt: 0.5 }}>
                  Minutos de gracia después de la hora de entrada sin generar tardanza.
                </Typography>
              </Box>

              <Box>
                <Typography sx={labelSx}>
                  <Moon size={13} color={PALETA.verdeOscuro} /> Tolerancia de salida (minutos)
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  value={toleranciaSalidaMinutos}
                  onChange={(e) => setToleranciaSalidaMinutos(e.target.value)}
                  placeholder="Ej: 0"
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end">min</InputAdornment>,
                    },
                    htmlInput: { min: 0, max: 120 },
                  }}
                  sx={modalFieldSx}
                />
                <Typography sx={{ fontSize: 11, color: PALETA.grisTexto, mt: 0.5 }}>
                  Margen permitido antes de la salida programada sin marcar salida anticipada.
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* SECCIÓN 4 — CONFIGURACIÓN SEMANAL O POR HORAS */}
        {tipoJornada === "fixed" ? (
          <Box
            sx={{
              border: `1px solid ${errors.dias ? PALETA.rojo : PALETA.borde}`,
              borderRadius: "14px",
              bgcolor: COLORES.fondoBlanco,
              p: 2,
            }}
          >
            {/* Cabecera y acciones rápidas */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                mb: 1.5,
                pb: 1.25,
                borderBottom: `1px solid ${PALETA.borde}`,
              }}
            >
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto }}>
                  4. Configuración semanal de turnos
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: PALETA.grisTexto }}>
                  Activa los días laborables y establece los bloques de entrada y salida
                </Typography>
              </Box>

              {/* Botones de acción rápida */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Tooltip title="Copia el horario configurado en el Lunes hacia Martes, Miércoles, Jueves y Viernes">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Copy size={13} />}
                    onClick={aplicarLunesALunVie}
                    sx={{
                      borderRadius: "8px",
                      textTransform: "none",
                      fontSize: 11.5,
                      fontWeight: 600,
                      borderColor: PALETA.verdeOscuro,
                      color: PALETA.verdeOscuro,
                      py: 0.4,
                      px: 1.5,
                      "&:hover": {
                        bgcolor: PALETA.verdeClaro,
                        borderColor: PALETA.verdeOscuro,
                      },
                    }}
                  >
                    Copiar Lunes a Lun–Vie
                  </Button>
                </Tooltip>

                <Tooltip title="Aplica turno continuo de 08:00 a 17:00 de Lunes a Viernes">
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<Sparkles size={13} />}
                    onClick={aplicarContinuoLunVie}
                    sx={{
                      borderRadius: "8px",
                      textTransform: "none",
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: PALETA.grisTexto,
                      py: 0.4,
                      px: 1.2,
                      "&:hover": { bgcolor: COLORES.fondoGris, color: PALETA.texto },
                    }}
                  >
                    Continuo 8h (L-V)
                  </Button>
                </Tooltip>

                <Tooltip title="Limpia los horarios de todos los días">
                  <IconButton
                    size="small"
                    onClick={limpiarSemana}
                    sx={{
                      color: PALETA.gris,
                      "&:hover": { color: PALETA.rojo, bgcolor: PALETA.rojoBg },
                    }}
                  >
                    <RotateCcw size={14} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {errors.dias && (
              <Alert severity="error" sx={{ mb: 1.5, borderRadius: "10px", py: 0.25, fontSize: 12 }}>
                {errors.dias}
              </Alert>
            )}

            {/* Grid de 7 días */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                  lg: "repeat(4, 1fr)",
                },
                gap: 1.25,
              }}
            >
              {dias.map((d, idx) => {
                const estaActivo = !!(d.hora_entrada_manana || d.hora_salida_manana);
                const esFinSemana = FINES_DE_SEMANA.includes(d.dia_semana);

                return (
                  <Box
                    key={d.dia_semana}
                    sx={{
                      border: `1.5px solid ${estaActivo ? PALETA.verdeMedio : PALETA.borde}`,
                      borderRadius: "12px",
                      p: 1.25,
                      bgcolor: estaActivo ? PALETA.verdeMuySuave : COLORES.fondoGris,
                      transition: "all 0.2s ease",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: 140,
                    }}
                  >
                    {/* Header del día */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Typography
                          sx={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: estaActivo ? PALETA.texto : PALETA.grisTexto,
                          }}
                        >
                          {d.dia_semana}
                        </Typography>
                        {esFinSemana && (
                          <Chip
                            label="Fds"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: 9.5,
                              fontWeight: 600,
                              bgcolor: PALETA.borde,
                              color: PALETA.grisTexto,
                            }}
                          />
                        )}
                      </Box>

                      <Switch
                        size="small"
                        checked={estaActivo}
                        onChange={(e) => {
                          const on = e.target.checked;
                          if (on) {
                            cambiarDia(idx, "hora_entrada_manana", "08:00");
                            cambiarDia(idx, "hora_salida_manana", "17:00");
                          } else {
                            cambiarDia(idx, "hora_entrada_manana", "");
                            cambiarDia(idx, "hora_salida_manana", "");
                            cambiarDia(idx, "hora_entrada_tarde", "");
                            cambiarDia(idx, "hora_salida_tarde", "");
                            cambiarDia(idx, "bloque2", false);
                          }
                        }}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": { color: PALETA.verdeOscuro },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                            bgcolor: PALETA.verde,
                          },
                        }}
                      />
                    </Box>

                    {/* Contenido de turnos */}
                    {estaActivo ? (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                        {/* Bloque 1 */}
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75 }}>
                          <TextField
                            type="time"
                            size="small"
                            value={d.hora_entrada_manana}
                            label="Entrada"
                            onChange={(e) => cambiarDia(idx, "hora_entrada_manana", e.target.value)}
                            sx={{
                              "& .MuiInputBase-input": { fontSize: 11.5, py: 0.6 },
                              ...modalFieldSx,
                            }}
                            slotProps={{ inputLabel: { shrink: true, sx: { fontSize: 11 } } }}
                          />
                          <TextField
                            type="time"
                            size="small"
                            value={d.hora_salida_manana}
                            label="Salida"
                            onChange={(e) => cambiarDia(idx, "hora_salida_manana", e.target.value)}
                            sx={{
                              "& .MuiInputBase-input": { fontSize: 11.5, py: 0.6 },
                              ...modalFieldSx,
                            }}
                            slotProps={{ inputLabel: { shrink: true, sx: { fontSize: 11 } } }}
                          />
                        </Box>

                        {/* Bloque 2 opcional */}
                        {d.bloque2 ? (
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.25 }}>
                            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75 }}>
                              <TextField
                                type="time"
                                size="small"
                                value={d.hora_entrada_tarde}
                                label="Entrada 2"
                                onChange={(e) => cambiarDia(idx, "hora_entrada_tarde", e.target.value)}
                                sx={{
                                  "& .MuiInputBase-input": { fontSize: 11.5, py: 0.6 },
                                  ...modalFieldSx,
                                }}
                                slotProps={{ inputLabel: { shrink: true, sx: { fontSize: 11 } } }}
                              />
                              <TextField
                                type="time"
                                size="small"
                                value={d.hora_salida_tarde}
                                label="Salida 2"
                                onChange={(e) => cambiarDia(idx, "hora_salida_tarde", e.target.value)}
                                sx={{
                                  "& .MuiInputBase-input": { fontSize: 11.5, py: 0.6 },
                                  ...modalFieldSx,
                                }}
                                slotProps={{ inputLabel: { shrink: true, sx: { fontSize: 11 } } }}
                              />
                            </Box>
                            <Button
                              size="small"
                              startIcon={<Trash2 size={11} />}
                              onClick={() => {
                                cambiarDia(idx, "hora_entrada_tarde", "");
                                cambiarDia(idx, "hora_salida_tarde", "");
                                cambiarDia(idx, "bloque2", false);
                              }}
                              sx={{
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: 10,
                                color: PALETA.rojo,
                                p: 0.2,
                                alignSelf: "flex-start",
                                "&:hover": { bgcolor: PALETA.rojoBg },
                              }}
                            >
                              Quitar bloque 2
                            </Button>
                          </Box>
                        ) : (
                          <Button
                            size="small"
                            startIcon={<Plus size={11} />}
                            onClick={() => {
                              cambiarDia(idx, "bloque2", true);
                              cambiarDia(idx, "hora_entrada_tarde", "14:00");
                              cambiarDia(idx, "hora_salida_tarde", "18:00");
                            }}
                            sx={{
                              textTransform: "none",
                              fontWeight: 600,
                              fontSize: 10.5,
                              color: PALETA.verdeOscuro,
                              bgcolor: PALETA.verdeClaro,
                              borderRadius: "7px",
                              py: 0.35,
                              mt: 0.25,
                              "&:hover": { bgcolor: COLORES.primarioClaro2 },
                            }}
                          >
                            + Segundo bloque
                          </Button>
                        )}
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          py: 2.5,
                          textAlign: "center",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography sx={{ fontSize: 11, color: PALETA.grisTexto, fontStyle: "italic" }}>
                          Día de descanso
                        </Typography>
                        <Typography sx={{ fontSize: 10, color: PALETA.gris, mt: 0.25 }}>
                          Activa el switch para asignar turno
                        </Typography>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        ) : (
          /* Horas esperadas */
          <Box
            sx={{
              border: `1px solid ${PALETA.borde}`,
              borderRadius: "14px",
              bgcolor: COLORES.fondoBlanco,
              p: 2,
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto, mb: 1 }}>
              4. Horas de trabajo requeridas
            </Typography>
            <Box sx={{ width: "100%", maxWidth: 260 }}>
              <Typography sx={labelSx}>Horas por jornada laboral {asterisco}</Typography>
              <TextField
                size="small"
                type="number"
                fullWidth
                value={horasEsperadas}
                onChange={(e) => {
                  setHorasEsperadas(e.target.value);
                  if (errors.horasEsperadas) {
                    setErrors((prev) => ({ ...prev, horasEsperadas: undefined }));
                  }
                }}
                error={Boolean(errors.horasEsperadas)}
                helperText={errors.horasEsperadas}
                placeholder="Ej: 8"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Clock size={15} color={PALETA.gris} />
                      </InputAdornment>
                    ),
                    endAdornment: <InputAdornment position="end">horas</InputAdornment>,
                  },
                  htmlInput: { step: 0.5, min: 1, max: 24 },
                }}
                sx={modalFieldSx}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 1.25,
                alignItems: "center",
                mt: 1.5,
                bgcolor: PALETA.verdeMuySuave,
                border: `1px solid ${PALETA.verdeClaro}`,
                borderRadius: "10px",
                p: 1.25,
              }}
            >
              <Info size={16} color={PALETA.verdeOscuro} style={{ flexShrink: 0 }} />
              <Typography sx={{ fontSize: 11.5, color: PALETA.grisTexto }}>
                La asistencia se considerará cumplida cuando la sumatoria de marcaciones del empleado
                alcance o supere las horas esperadas del turno.
              </Typography>
            </Box>
          </Box>
        )}

        {/* RESUMEN PREVIO */}
        <Box
          sx={{
            border: `1px solid ${PALETA.verdeClaro}`,
            borderRadius: "14px",
            bgcolor: PALETA.verdeMuySuave,
            p: 1.75,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <CheckCircle2 size={16} color={PALETA.verdeOscuro} />
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: PALETA.texto }}>
              Resumen de evaluación
            </Typography>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
              gap: 1,
            }}
          >
            {vistaPrevia.map((item, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
                <Check size={14} color={PALETA.verde} style={{ marginTop: 2, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 11.5, color: PALETA.grisTexto, lineHeight: 1.35 }}>
                  {item}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>

      {/* FOOTER FIJO */}
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.75, gap: 1.5, flexShrink: 0, bgcolor: COLORES.fondoBlanco }}>
        <Button
          onClick={onClose}
          disabled={guardando}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontSize: 13,
            fontWeight: 600,
            color: PALETA.grisTexto,
            bgcolor: COLORES.fondoBlanco,
            border: `1px solid ${PALETA.bordeInput}`,
            px: 2.5,
            py: 0.7,
            "&:hover": { bgcolor: PALETA.grisClaro },
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          startIcon={guardando ? <CircularProgress size={16} color="inherit" /> : <Plus size={16} />}
          onClick={handleGuardar}
          disabled={guardando}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontSize: 13,
            fontWeight: 600,
            px: 3.5,
            py: 0.7,
            bgcolor: PALETA.verdeOscuro,
            boxShadow: "0 4px 14px rgba(27, 94, 32, 0.20)",
            "&:hover": { bgcolor: PALETA.verde },
          }}
        >
          {guardando ? "Creando horario..." : "Crear horario"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
