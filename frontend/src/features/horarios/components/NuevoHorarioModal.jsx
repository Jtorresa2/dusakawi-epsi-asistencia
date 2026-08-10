import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, TextField, Button, MenuItem, IconButton,
  Select, Switch, Divider, InputAdornment,
} from "@mui/material";
import { X, Plus, Trash2, Clock, Timer, CheckCircle2, CalendarClock, Info } from "lucide-react";
import { crearHorario } from "../horario.api";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const PALETA = {
  verdeOscuro: "#1B5E20",
  verde: "#2E7D32",
  verdeClaro: "#E8F5E9",
  verdeMuySuave: "#F1F8F1",
  borde: "#ECECEC",
  bordeInput: "#D1D5DB",
  grisClaro: "#F3F4F6",
  gris: "#9CA3AF",
  grisTexto: "#6B7280",
  texto: "#111827",
  rojo: "#DC2626",
  rojoBg: "#FEF2F2",
};

const modalFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    bgcolor: "#FFFFFF",
    minHeight: 36,
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

const labelSx = { fontSize: 12, fontWeight: 600, color: PALETA.grisTexto, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 };
const asterisco = <span style={{ color: PALETA.rojo }}>*</span>;

// Tarjeta seleccionable (sección 2 y 3)
const tarjetaOpcion = (seleccionada) => ({
  border: seleccionada ? `2px solid ${PALETA.verdeOscuro}` : `1.5px solid ${PALETA.bordeInput}`,
  bgcolor: seleccionada ? PALETA.verdeMuySuave : "#FFFFFF",
  borderRadius: "12px",
  p: 1.5,
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": {
    borderColor: seleccionada ? PALETA.verdeOscuro : PALETA.gris,
    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  },
});

// Día vacío para la configuración semanal
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
  const [tipoJornada, setTipoJornada] = useState("fija");
  const [controlarTardanzas, setControlarTardanzas] = useState(true);
  const [horasEsperadas, setHorasEsperadas] = useState("");
  const [dias, setDias] = useState([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) {
      setNombre("");
      setDescripcion("");
      setActivo(true);
      setTipoJornada("fija");
      setControlarTardanzas(true);
      setHorasEsperadas("");
      setDias(DIAS.map(diaVacio));
      setGuardando(false);
    }
  }, [open]);

  const cambiarDia = (idx, campo, valor) =>
    setDias((prev) => prev.map((d, i) => (i === idx ? { ...d, [campo]: valor } : d)));

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      onNotificar?.("El nombre es obligatorio", "error");
      return;
    }
    setGuardando(true);
    try {
      const res = await crearHorario({
        nombre: nombre.trim(),
        // "Controlar tardanzas" -> estricto | "No controlar tardanzas" -> flexible
        modalidad: controlarTardanzas ? "estricto" : "flexible",
        tipo_jornada: tipoJornada,
        descripcion: descripcion.trim() || null,
        horas_esperadas: horasEsperadas || null,
        tolerancia_minutos: 0,
        tolerancia_salida_minutos: 0,
        activo,
        detalles: dias
          .filter((d) => d.dia_semana && (d.hora_entrada_manana || d.hora_salida_manana))
          .map((d) => ({
            dia_semana: d.dia_semana,
            hora_entrada_manana: d.hora_entrada_manana ? `${d.hora_entrada_manana}:00` : null,
            hora_salida_manana: d.hora_salida_manana ? `${d.hora_salida_manana}:00` : null,
            hora_entrada_tarde: d.bloque2 && d.hora_entrada_tarde ? `${d.hora_entrada_tarde}:00` : null,
            hora_salida_tarde: d.bloque2 && d.hora_salida_tarde ? `${d.hora_salida_tarde}:00` : null,
          })),
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

  // Vista previa dinámica
  const vistaPrevia = [
    controlarTardanzas ? "Controlará tardanzas." : "No controlará tardanzas.",
    tipoJornada === "fija" ? "Utilizará horarios definidos." : "Evaluará horas trabajadas.",
    tipoJornada === "fija"
      ? "Permitirá calcular ausencias."
      : "Comparará las horas registradas con las horas esperadas.",
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md"
      PaperProps={{ sx: { borderRadius: "18px", boxShadow: "0 24px 70px rgba(0,0,0,0.25)", backgroundColor: "#FFFFFF", maxHeight: "94vh" } }}
      sx={{ "& .MuiBackdrop-root": { bgcolor: "rgba(17, 24, 39, 0.5)", backdropFilter: "blur(4px)" } }}>

      {/* HEADER */}
      <DialogTitle sx={{ px: 3, py: 1.75, position: "relative", pb: 1.25 }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: "11px", bgcolor: PALETA.verdeClaro, color: PALETA.verdeOscuro,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <CalendarClock size={19} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: PALETA.texto, lineHeight: 1.2 }}>
              Nuevo horario
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: PALETA.grisTexto, mt: 0.15 }}>
              Configura un horario y define cómo será evaluada la asistencia de los empleados.
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small"
          sx={{ position: "absolute", top: 11, right: 11, color: PALETA.gris, bgcolor: PALETA.grisClaro, "&:hover": { color: PALETA.texto, bgcolor: PALETA.borde } }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ px: 3, py: 1.75, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1.5, bgcolor: "#FFFFFF" }}>

        {/* SECCIÓN 1 — INFORMACIÓN GENERAL */}
        <Box sx={{ border: `1px solid ${PALETA.borde}`, borderRadius: "12px", bgcolor: "#FFFFFF", p: 1.75 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: PALETA.texto, mb: 1.25 }}>
            Información general
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 1.5 }}>
            <Box>
              <Typography sx={labelSx}>Nombre {asterisco}</Typography>
              <TextField size="small" fullWidth value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Jornada A" sx={modalFieldSx} />
            </Box>
            <Box>
              <Typography sx={labelSx}>Descripción</Typography>
              <TextField size="small" fullWidth value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Breve descripción del horario" sx={modalFieldSx} />
            </Box>
            <Box>
              <Typography sx={labelSx}>Estado</Typography>
              <Select value={activo ? "activo" : "inactivo"} fullWidth size="small"
                onChange={(e) => setActivo(e.target.value === "activo")} sx={modalFieldSx}>
                <MenuItem value="activo">Activo</MenuItem>
                <MenuItem value="inactivo">Inactivo</MenuItem>
              </Select>
            </Box>
          </Box>
        </Box>

        {/* SECCIÓN 2 + 3 — LADO A LADO */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
          <Box sx={{ border: `1px solid ${PALETA.borde}`, borderRadius: "12px", bgcolor: "#FFFFFF", p: 1.75 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: PALETA.texto, mb: 0.25 }}>
              ¿Cómo trabaja este horario?
            </Typography>
            <Typography sx={{ fontSize: 11, color: PALETA.gris, mb: 1.25 }}>
              Elige el tipo de jornada que aplicarán los empleados.
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={tarjetaOpcion(tipoJornada === "fija")} onClick={() => setTipoJornada("fija")}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.5 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: "9px", bgcolor: PALETA.verdeClaro, color: PALETA.verdeOscuro, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Clock size={16} />
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto }}>Horario fijo</Typography>
                  {tipoJornada === "fija" && <CheckCircle2 size={15} color={PALETA.verdeOscuro} style={{ marginLeft: "auto" }} />}
                </Box>
                <Typography sx={{ fontSize: 11, color: PALETA.grisTexto, lineHeight: 1.4 }}>
                  El empleado debe cumplir horarios definidos de entrada y salida.
                </Typography>
              </Box>
              <Box sx={tarjetaOpcion(tipoJornada === "por_horas")} onClick={() => setTipoJornada("por_horas")}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.5 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: "9px", bgcolor: PALETA.verdeClaro, color: PALETA.verdeOscuro, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Timer size={16} />
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto }}>Jornada por horas</Typography>
                  {tipoJornada === "por_horas" && <CheckCircle2 size={15} color={PALETA.verdeOscuro} style={{ marginLeft: "auto" }} />}
                </Box>
                <Typography sx={{ fontSize: 11, color: PALETA.grisTexto, lineHeight: 1.4 }}>
                  El sistema evaluará únicamente las horas trabajadas.
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ border: `1px solid ${PALETA.borde}`, borderRadius: "12px", bgcolor: "#FFFFFF", p: 1.75 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: PALETA.texto, mb: 0.25 }}>
              ¿Cómo se evaluará la asistencia?
            </Typography>
            <Typography sx={{ fontSize: 11, color: PALETA.gris, mb: 1.25 }}>
              Define si el sistema generará tardanzas por retrasos.
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={tarjetaOpcion(controlarTardanzas)} onClick={() => setControlarTardanzas(true)}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.5 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: "9px", bgcolor: PALETA.verdeClaro, color: PALETA.verdeOscuro, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CheckCircle2 size={16} />
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto }}>Controlar tardanzas</Typography>
                  {controlarTardanzas && <CheckCircle2 size={15} color={PALETA.verdeOscuro} style={{ marginLeft: "auto" }} />}
                </Box>
                <Typography sx={{ fontSize: 11, color: PALETA.grisTexto, lineHeight: 1.4 }}>
                  El sistema comparará la hora de entrada con el horario configurado.
                </Typography>
              </Box>
              <Box sx={tarjetaOpcion(!controlarTardanzas)} onClick={() => setControlarTardanzas(false)}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.5 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: "9px", bgcolor: PALETA.grisClaro, color: PALETA.grisTexto, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Clock size={16} />
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto }}>No controlar tardanzas</Typography>
                  {!controlarTardanzas && <CheckCircle2 size={15} color={PALETA.verdeOscuro} style={{ marginLeft: "auto" }} />}
                </Box>
                <Typography sx={{ fontSize: 11, color: PALETA.grisTexto, lineHeight: 1.4 }}>
                  El sistema registrará la asistencia normalmente pero nunca generará tardanzas.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* CONFIGURACIÓN CONDICIONAL */}
        {tipoJornada === "fija" ? (
          <Box sx={{ border: `1px solid ${PALETA.borde}`, borderRadius: "12px", bgcolor: "#FFFFFF", p: 1.75 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: PALETA.texto, mb: 0.25 }}>
              Configuración semanal
            </Typography>
            <Typography sx={{ fontSize: 11, color: PALETA.gris, mb: 1.25 }}>
              Define los bloques de entrada y salida por día. El segundo bloque es opcional.
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr", lg: "1fr 1fr 1fr 1fr" }, gap: 1 }}>
              {dias.map((d, idx) => (
                <Box key={d.dia_semana} sx={{
                  border: `1px solid ${PALETA.borde}`,
                  borderRadius: "10px",
                  p: 1.25,
                  bgcolor: d.hora_entrada_manana || d.hora_salida_manana ? PALETA.verdeMuySuave : "#FFFFFF",
                  transition: "all 0.2s ease",
                  "&:hover": { borderColor: PALETA.gris, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" },
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: PALETA.texto }}>{d.dia_semana}</Typography>
                    <Switch
                      size="small"
                      checked={!!(d.hora_entrada_manana || d.hora_salida_manana)}
                      onChange={(e) => {
                        const on = e.target.checked;
                        if (!on) {
                          cambiarDia(idx, "hora_entrada_manana", "");
                          cambiarDia(idx, "hora_salida_manana", "");
                          cambiarDia(idx, "hora_entrada_tarde", "");
                          cambiarDia(idx, "hora_salida_tarde", "");
                          cambiarDia(idx, "bloque2", false);
                        }
                      }}
                      sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: PALETA.verdeOscuro }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: PALETA.verde } }}
                    />
                  </Box>
                  {d.hora_entrada_manana || d.hora_salida_manana ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75 }}>
                        <TextField type="time" size="small" value={d.hora_entrada_manana}
                          label="Entrada" onChange={(e) => cambiarDia(idx, "hora_entrada_manana", e.target.value)}
                          sx={{ "& .MuiInputBase-input": { fontSize: 11.5 }, ...modalFieldSx }} InputLabelProps={{ shrink: true }} />
                        <TextField type="time" size="small" value={d.hora_salida_manana}
                          label="Salida" onChange={(e) => cambiarDia(idx, "hora_salida_manana", e.target.value)}
                          sx={{ "& .MuiInputBase-input": { fontSize: 11.5 }, ...modalFieldSx }} InputLabelProps={{ shrink: true }} />
                      </Box>
                      {d.bloque2 ? (
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75 }}>
                          <TextField type="time" size="small" value={d.hora_entrada_tarde}
                            label="Entrada 2" onChange={(e) => cambiarDia(idx, "hora_entrada_tarde", e.target.value)}
                            sx={{ "& .MuiInputBase-input": { fontSize: 11.5 }, ...modalFieldSx }} InputLabelProps={{ shrink: true }} />
                          <TextField type="time" size="small" value={d.hora_salida_tarde}
                            label="Salida 2" onChange={(e) => cambiarDia(idx, "hora_salida_tarde", e.target.value)}
                            sx={{ "& .MuiInputBase-input": { fontSize: 11.5 }, ...modalFieldSx }} InputLabelProps={{ shrink: true }} />
                        </Box>
                      ) : (
                        <Button size="small" startIcon={<Plus size={12} />} onClick={() => cambiarDia(idx, "bloque2", true)}
                          sx={{ textTransform: "none", fontWeight: 600, fontSize: 11, color: PALETA.verdeOscuro, bgcolor: PALETA.verdeClaro, borderRadius: "7px", py: 0.35, "&:hover": { bgcolor: "#C8E6C9" } }}>
                          Agregar bloque
                        </Button>
                      )}
                      {d.bloque2 && (
                        <Button size="small" startIcon={<Trash2 size={11} />} onClick={() => {
                          cambiarDia(idx, "hora_entrada_tarde", "");
                          cambiarDia(idx, "hora_salida_tarde", "");
                          cambiarDia(idx, "bloque2", false);
                        }}
                          sx={{ textTransform: "none", fontWeight: 600, fontSize: 10.5, color: PALETA.rojo, "&:hover": { bgcolor: PALETA.rojoBg }, alignSelf: "flex-start" }}>
                          Quitar bloque
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <Typography sx={{ fontSize: 10.5, color: PALETA.gris }}>
                      Sin horario definido.
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <Box sx={{ border: `1px solid ${PALETA.borde}`, borderRadius: "12px", bgcolor: "#FFFFFF", p: 1.75 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: PALETA.texto, mb: 1.25 }}>
              Horas esperadas
            </Typography>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              <Box sx={{ width: "100%", maxWidth: 220 }}>
                <Typography sx={{ fontSize: 11, color: PALETA.grisTexto, mb: 0.5 }}>
                  Horas de trabajo por jornada
                </Typography>
                <TextField size="small" type="number" fullWidth value={horasEsperadas}
                  onChange={(e) => setHorasEsperadas(e.target.value)}
                  placeholder="Ej: 6.5"
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><Clock size={14} style={{ color: PALETA.gris }} /></InputAdornment>,
                    },
                  }}
                  sx={modalFieldSx} />
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", mt: 1.25, bgcolor: PALETA.verdeMuySuave, border: `1px solid ${PALETA.verdeClaro}`, borderRadius: "9px", p: 1.25 }}>
              <Info size={14} color={PALETA.verdeOscuro} style={{ marginTop: 2, flexShrink: 0 }} />
              <Typography sx={{ fontSize: 11.5, color: PALETA.grisTexto, lineHeight: 1.45 }}>
                La asistencia será evaluada comparando las horas trabajadas con las horas esperadas.
              </Typography>
            </Box>
          </Box>
        )}

        {/* VISTA PREVIA */}
        <Box sx={{ border: `1px solid ${PALETA.verdeClaro}`, borderRadius: "12px", bgcolor: PALETA.verdeMuySuave, p: 1.75 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
            <CheckCircle2 size={14} color={PALETA.verdeOscuro} />
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: PALETA.texto }}>
              Vista previa de evaluación
            </Typography>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 0.5 }}>
            {vistaPrevia.map((item) => (
              <Box key={item} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <CheckCircle2 size={12} color={PALETA.verde} />
                <Typography sx={{ fontSize: 11.5, color: PALETA.grisTexto }}>{item}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>

      {/* FOOTER */}
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1.5 }}>
        <Button onClick={onClose}
          sx={{ borderRadius: "9px", textTransform: "none", fontSize: 12.5, fontWeight: 600, color: PALETA.grisTexto, bgcolor: "#FFFFFF", border: `1px solid ${PALETA.bordeInput}`, px: 3, py: 0.6, "&:hover": { bgcolor: PALETA.grisClaro } }}>
          Cancelar
        </Button>
        <Button variant="contained" startIcon={<Plus size={15} />} onClick={handleGuardar} disabled={guardando}
          sx={{ borderRadius: "9px", textTransform: "none", fontSize: 12.5, fontWeight: 600, px: 3.5, py: 0.6, bgcolor: PALETA.verdeOscuro, "&:hover": { bgcolor: PALETA.verde } }}>
          {guardando ? "Creando..." : "Crear horario"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
