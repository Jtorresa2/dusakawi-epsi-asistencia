import { useState, useEffect, useRef, useMemo } from "react";
import {
  Box, Paper, Typography, TextField, Button, MenuItem, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Select, Switch, FormControlLabel, Divider, CircularProgress,
  Checkbox, Tabs, Tab,
} from "@mui/material";
import {
  Plus, Clock, X, Search, UserPlus, UserMinus, Users, Filter,
  Save, Star, Trash2, Info, CalendarDays, Edit3, Copy, History,
  Clock4, Timer, Hourglass, Check,
} from "lucide-react";
import {
  obtenerHorarios, crearHorario, eliminarHorario, obtenerAsignados,
  obtenerHistorialGlobal, establecerPorDefecto, actualizarHorario,
  asignarHorario, asignarMasivo, desasignarHorario,
} from "../horario.api";
import { obtenerPersonal } from "../../personal/personal.api";
import { obtenerAreas } from "../../areas/area.api";
import { obtenerCargos } from "../../cargos/cargo.api";
import IconBox from "../../../shared/components/IconBox";
import NuevoHorarioModal from "../components/NuevoHorarioModal";
import { COLORES } from "../../../shared/constants/colores.js";
import { PALETA } from "../../../shared/constants/paleta.js";

const DIAS_LABORABLES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const DIAS_ORDEN = {
  Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6, Domingo: 7,
};

const inputSx = {
  borderRadius: "10px",
  fontSize: 13,
  height: 40,
  py: 0,
  bgcolor: COLORES.fondoGris,
  "& fieldset": { borderColor: COLORES.grisContorno },
};

const modalFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    "& fieldset": { borderColor: COLORES.borde },
    "&:hover fieldset": { borderColor: COLORES.primario },
    "&.Mui-focused fieldset": { borderColor: COLORES.primarioOscuro },
  },
  "& .MuiInputLabel-root": { fontSize: 13, color: COLORES.textoTerciario },
  "& .MuiInputBase-input": { fontSize: 13 },
};

function hoyLocal() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

const CAMPOS_BLOQUES = [
  ["hora_entrada_manana", "Entrada mañana"],
  ["hora_salida_manana", "Salida mañana"],
  ["hora_entrada_tarde", "Entrada tarde"],
  ["hora_salida_tarde", "Salida tarde"],
];

function diaVacio(dia) {
  return {
    dia_semana: dia,
    hora_entrada_manana: "",
    hora_salida_manana: "",
    hora_entrada_tarde: "",
    hora_salida_tarde: "",
  };
}

function buildDias(horario) {
  const existentes = horario?.detalles || [];
  const porNombre = new Map(existentes.map((d) => [d.dia_semana, d]));
  const base = DIAS_LABORABLES.map((d) => {
    const det = porNombre.get(d);
    const fila = diaVacio(d);
    if (det) {
      CAMPOS_BLOQUES.forEach(([campo]) => {
        const v = det[campo];
        if (v) fila[campo] = String(v).slice(0, 5);
      });
    }
    return fila;
  });
  const extras = existentes
    .filter((d) => !DIAS_LABORABLES.includes(d.dia_semana))
    .sort((a, b) => (DIAS_ORDEN[a.dia_semana] || 99) - (DIAS_ORDEN[b.dia_semana] || 99))
    .map((d) => {
      const fila = diaVacio(d.dia_semana);
      CAMPOS_BLOQUES.forEach(([campo]) => {
        const v = d[campo];
        if (v) fila[campo] = String(v).slice(0, 5);
      });
      return fila;
    });
  return [...base, ...extras];
}

function nombreEmpleado(e) {
  return `${e.nombre || ""} ${e.apellido || ""}`.trim() || e.empleado || e.correo || "—";
}

function EstadoChip({ activo }) {
  return (
    <Chip label={activo ? "Activo" : "Inactivo"} size="small"
      sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 11, bgcolor: activo ? PALETA.verdeClaro : PALETA.grisClaro, color: activo ? PALETA.verdeOscuro : PALETA.gris }} />
  );
}

function fmtFecha(v) {
  if (!v) return "—";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  try {
    return new Date(v).toISOString().slice(0, 10);
  } catch {
    return s;
  }
}

const COLUMNAS_HISTORIAL = ["Empleado", "Horario anterior", "Horario nuevo", "Fecha", "Usuario", "Motivo"];

function HistorialGlobalTable({ data = [], cargando = false }) {
  return (
    <Paper elevation={0} sx={{ borderRadius: "16px", border: `1px solid ${PALETA.borde}`, overflow: "hidden" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2.5, pt: 2, pb: 1.5 }}>
        <History size={16} color={PALETA.verdeOscuro} />
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto }}>
          Historial global de asignaciones
        </Typography>
      </Box>
      <TableContainer sx={{ maxHeight: 300, overflowY: "auto" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {COLUMNAS_HISTORIAL.map((c) => (
                <TableCell key={c} sx={{ fontWeight: 600, color: PALETA.grisTexto, fontSize: 12, bgcolor: COLORES.fondoGris, py: 1.1, whiteSpace: "nowrap" }}>
                  {c}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {cargando ? (
              <TableRow>
                <TableCell colSpan={COLUMNAS_HISTORIAL.length} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={22} sx={{ color: PALETA.verde }} />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNAS_HISTORIAL.length} align="center" sx={{ py: 6, color: PALETA.gris, fontSize: 13 }}>
                  Sin asignaciones registradas
                </TableCell>
              </TableRow>
            ) : (
              data.map((r, i) => (
                <TableRow key={r.id ?? i} sx={{ "&:hover": { bgcolor: COLORES.fondoGris } }}>
                  <TableCell sx={{ fontSize: 13, fontWeight: 600, color: PALETA.texto, py: 1, whiteSpace: "nowrap" }}>{r.empleado || "—"}</TableCell>
                  <TableCell sx={{ fontSize: 13, color: COLORES.textoMuted, py: 1, whiteSpace: "nowrap" }}>{r.horario_anterior || "—"}</TableCell>
                  <TableCell sx={{ fontSize: 13, color: PALETA.verdeOscuro, fontWeight: 600, py: 1, whiteSpace: "nowrap" }}>{r.horario_nuevo || "—"}</TableCell>
                  <TableCell sx={{ fontSize: 13, color: COLORES.textoMuted, py: 1, whiteSpace: "nowrap" }}>{fmtFecha(r.fecha)}</TableCell>
                  <TableCell sx={{ fontSize: 13, color: COLORES.textoMuted, py: 1, whiteSpace: "nowrap" }}>{r.usuario || "—"}</TableCell>
                  <TableCell sx={{ fontSize: 13, color: COLORES.textoMuted, py: 1 }}>{r.motivo || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

const REGLAS = [
  {
    icon: <Timer size={16} />,
    titulo: "Modalidad Estricto",
    texto: "El sistema calcula tardanzas utilizando la hora de entrada y salida configuradas.",
  },
  {
    icon: <Clock4 size={16} />,
    titulo: "Modalidad Flexible",
    texto: "El sistema registra la asistencia pero no genera tardanzas ni sanciones por hora de ingreso.",
  },
  {
    icon: <Info size={16} />,
    titulo: "Tipo Fija",
    texto: "La jornada posee horarios definidos de entrada y salida.",
  },
  {
    icon: <Hourglass size={16} />,
    titulo: "Tipo Por Horas",
    texto: "La jornada se evalúa por el total de horas trabajadas según las horas esperadas configuradas.",
  },
];

function ReglasCard() {
  return (
    <Paper elevation={0} sx={{ borderRadius: "16px", border: `1px solid ${PALETA.borde}`, p: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Info size={16} color={PALETA.verdeOscuro} />
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto }}>
          Reglas del sistema de asistencia
        </Typography>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
        {REGLAS.map((r) => (
          <Box key={r.titulo} sx={{ bgcolor: COLORES.fondoGris, borderRadius: "12px", p: 1.5, display: "flex", gap: 1.25, alignItems: "flex-start" }}>
            <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: PALETA.verdeClaro, color: PALETA.verdeOscuro, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {r.icon}
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: PALETA.texto, mb: 0.25 }}>{r.titulo}</Typography>
              <Typography sx={{ fontSize: 11, color: PALETA.grisTexto, lineHeight: 1.45 }}>{r.texto}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

function HorarioCard({
  h,
  asignados = [],
  cargandoAsignados = false,
  seleccionado = false,
  esAdmin = false,
  onSelect,
  onDuplicar,
  onEliminar,
  onPorDefecto,
}) {
  const esPorHoras = h.tipo_jornada === "por_horas";
  const conteo = Array.isArray(asignados) ? asignados.length : 0;
  const chipModalidad =
    h.modalidad === "flexible"
      ? { bgcolor: COLORES.warningFondo, color: COLORES.warningOscuro }
      : { bgcolor: COLORES.successClaro, color: PALETA.verdeOscuro };

  return (
    <Paper
      elevation={0}
      onClick={() => onSelect?.(h)}
      sx={{
        borderRadius: "16px",
        border: `1.5px solid ${seleccionado ? PALETA.verde : PALETA.borde}`,
        bgcolor: seleccionado ? COLORES.verdeVariante3 : COLORES.fondoBlanco,
        p: 2.5,
        cursor: "pointer",
        flex: "1 1 0",
        display: "flex",
        flexDirection: "column",
        transition: "all .15s",
        "&:hover": { borderColor: COLORES.primarioClaro2, boxShadow: "0 4px 14px rgba(0,0,0,0.05)" },
      }}
    >
      {/* Cabecera */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <IconBox icon={<Clock />} color={PALETA.verde} size={40} iconSize={18} />
        <Typography
          sx={{
            flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, color: PALETA.texto,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}
        >
          {h.nombre}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
          <Box
            sx={{
              width: 8, height: 8, borderRadius: "50%",
              bgcolor: h.activo ? PALETA.verde : COLORES.textoSuave,
              boxShadow: `0 0 0 3px ${h.activo ? PALETA.verdeClaro : COLORES.grisContorno}`,
            }}
          />
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: h.activo ? PALETA.verdeOscuro : PALETA.gris }}>
            {h.activo ? "Activo" : "Inactivo"}
          </Typography>
        </Box>
      </Box>

      {/* Chips */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
        <Chip label={esPorHoras ? "Jornada por horas" : "Horario fijo"} size="small"
          sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 11, bgcolor: PALETA.grisClaro, color: PALETA.grisTexto }} />
        <Chip label={h.modalidad === "flexible" ? "No controla tardanzas" : "Controla tardanzas"} size="small"
          sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 11, ...chipModalidad }} />
        {esPorHoras && h.horas_esperadas && (
          <Chip label={`${parseFloat(h.horas_esperadas)} horas esperadas`} size="small"
            sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 11, bgcolor: PALETA.verdeClaro, color: PALETA.verdeOscuro }} />
        )}
      </Box>

      {/* Asignados */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, flex: 1 }}>
        <Box sx={{ width: 30, height: 30, borderRadius: "9px", bgcolor: PALETA.verdeClaro, color: PALETA.verde, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Users size={14} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto, lineHeight: 1.1 }}>
            {cargandoAsignados ? <CircularProgress size={12} sx={{ color: PALETA.verde }} /> : conteo}
          </Typography>
          <Typography sx={{ fontSize: 11, color: PALETA.gris }}>
            {conteo === 1 ? "empleado asignado" : "empleados asignados"}
          </Typography>
        </Box>
      </Box>

      {/* Acciones */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, pt: 1.5, borderTop: `1px solid ${PALETA.borde}` }}>
        {esAdmin && (
          <Button size="small" variant="contained" startIcon={<Edit3 size={13} />} onClick={() => onSelect?.(h)}
            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, fontSize: 12, height: 40, px: 1.5, bgcolor: PALETA.verdeOscuro, "&:hover": { bgcolor: PALETA.verde } }}>
            Editar
          </Button>
        )}
        {esAdmin && (
          <IconButton size="small" onClick={() => onPorDefecto?.(h)} title={h.es_por_defecto ? "Por defecto" : "Establecer como por defecto"}
            sx={{ color: h.es_por_defecto ? COLORES.warningOscuro : PALETA.gris, bgcolor: h.es_por_defecto ? COLORES.warningFondo : PALETA.grisClaro, "&:hover": { bgcolor: COLORES.borde } }}>
            <Star size={15} fill={h.es_por_defecto ? COLORES.warningOscuro : "none"} />
          </IconButton>
        )}
        <Box sx={{ flex: 1 }} />
        {esAdmin && (
          <IconButton size="small" onClick={() => onDuplicar?.(h)} title="Duplicar horario"
            sx={{ color: PALETA.verde, bgcolor: PALETA.verdeClaro, "&:hover": { bgcolor: PALETA.verdeMedio } }}>
            <Copy size={15} />
          </IconButton>
        )}
        {esAdmin && (
          <IconButton size="small" onClick={() => onEliminar?.(h)} title="Eliminar horario"
            sx={{ color: PALETA.rojo, bgcolor: PALETA.rojoBg, "&:hover": { bgcolor: COLORES.dangerBorde } }}>
            <Trash2 size={15} />
          </IconButton>
        )}
      </Box>
    </Paper>
  );
}

function SelectorCard({ titulo, descripcion, seleccionado = false, onClick, disabled = false }) {
  return (
    <Box
      onClick={disabled ? undefined : onClick}
      sx={{
        border: `1.5px solid ${seleccionado ? PALETA.verde : PALETA.borde}`,
        bgcolor: seleccionado ? COLORES.verdeVariante3 : COLORES.fondoBlanco,
        borderRadius: "12px",
        p: 1.5,
        cursor: disabled ? "default" : "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        opacity: disabled ? 0.55 : 1,
        transition: "all .15s",
        "&:hover": disabled ? {} : { borderColor: COLORES.primarioClaro2, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto }}>{titulo}</Typography>
        <Box sx={{
          width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
          border: `1.5px solid ${seleccionado ? PALETA.verde : PALETA.gris}`,
          bgcolor: seleccionado ? PALETA.verde : "transparent",
          color: COLORES.fondoBlanco, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {seleccionado && <Check size={12} strokeWidth={3} />}
        </Box>
      </Box>
      <Typography sx={{ fontSize: 11, color: PALETA.grisTexto, lineHeight: 1.4 }}>{descripcion}</Typography>
    </Box>
  );
}

function DetalleHorarioForm({ horario, esAdmin = true, soloLectura = false, onNotificar, onReload }) {
  const readonly = soloLectura || !esAdmin;
  const [form, setForm] = useState(null);
  const [bloque2Dias, setBloque2Dias] = useState(() => new Set());
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    if (!horario) {
      setForm(null);
      setBloque2Dias(new Set());
      return;
    }
    setForm({
      nombre: horario.nombre || "",
      descripcion: horario.descripcion || "",
      tipo_jornada: horario.tipo_jornada || "fija",
      modalidad: horario.modalidad || "estricto",
      horas_esperadas: horario.horas_esperadas != null ? String(horario.horas_esperadas) : "",
      tolerancia_minutos: horario.tolerancia_minutos ?? 0,
      tolerancia_salida_minutos: horario.tolerancia_salida_minutos ?? 0,
      activo: horario.activo,
      dias: buildDias(horario),
    });
    setBloque2Dias(
      new Set(
        (horario.detalles || [])
          .filter((d) => d.hora_entrada_tarde || d.hora_salida_tarde)
          .map((d) => d.dia_semana)
      )
    );
  }, [horario?.id]);

  if (!horario || !form) {
    return (
      <Paper elevation={0} sx={{ borderRadius: "16px", border: `1px solid ${PALETA.borde}`, p: 4, minHeight: 420, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box sx={{ textAlign: "center" }}>
          <Box sx={{ width: 56, height: 56, borderRadius: "16px", bgcolor: PALETA.verdeClaro, color: PALETA.verde, display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 1.5 }}>
            <CalendarDays size={26} />
          </Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: PALETA.texto }}>Selecciona un horario</Typography>
          <Typography sx={{ fontSize: 13, color: PALETA.gris, mt: 0.5 }}>
            Elige una tarjeta para ver y editar su configuración.
          </Typography>
        </Box>
      </Paper>
    );
  }

  const esFija = form.tipo_jornada === "fija";
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setCampo = (campo, valor) => set({ [campo]: valor });
  const setDia = (idx, campo, valor) =>
    setForm((f) => ({ ...f, dias: f.dias.map((d, i) => (i === idx ? { ...d, [campo]: valor } : d)) }));

  const toggleBloque2 = (dia) => {
    setBloque2Dias((prev) => {
      const next = new Set(prev);
      if (next.has(dia)) next.delete(dia);
      else next.add(dia);
      return next;
    });
    setForm((f) => ({
      ...f,
      dias: f.dias.map((d) =>
        d.dia_semana === dia ? { ...d, hora_entrada_tarde: "", hora_salida_tarde: "" } : d
      ),
    }));
  };

  const validar = () => {
    if (!form.nombre.trim()) return "El nombre es obligatorio";
    if (esFija && form.dias.some((d) => {
      const tieneTarde = d.hora_entrada_tarde || d.hora_salida_tarde;
      const tieneManana = d.hora_entrada_manana || d.hora_salida_manana;
      if (!tieneTarde) return false;
      return !d.hora_entrada_manana || !d.hora_salida_manana;
    })) return "Los días con bloque de tarde requieren horario de mañana completo";
    return null;
  };

  const handleGuardar = async () => {
    const error = validar();
    if (error) return onNotificar?.(error, "error");
    setGuardando(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        modalidad: form.modalidad,
        tipo_jornada: form.tipo_jornada,
        descripcion: form.descripcion.trim() || null,
        horas_esperadas: esFija ? (horario.horas_esperadas ?? null) : (form.horas_esperadas || null),
        tolerancia_minutos: Number(form.tolerancia_minutos) || 0,
        tolerancia_salida_minutos: Number(form.tolerancia_salida_minutos) || 0,
        activo: form.activo,
      };
      if (esFija) {
        payload.detalles = form.dias.map((d) => ({
          dia_semana: d.dia_semana,
          hora_entrada_manana: d.hora_entrada_manana ? `${d.hora_entrada_manana}:00` : null,
          hora_salida_manana: d.hora_salida_manana ? `${d.hora_salida_manana}:00` : null,
          hora_entrada_tarde: d.hora_entrada_tarde ? `${d.hora_entrada_tarde}:00` : null,
          hora_salida_tarde: d.hora_salida_tarde ? `${d.hora_salida_tarde}:00` : null,
        }));
      }
      const res = await actualizarHorario(horario.id, payload);
      onNotificar?.(res.mensaje || "Horario actualizado correctamente", "success");
      onReload?.();
    } catch (err) {
      onNotificar?.(err.message || "Error al guardar el horario", "error");
    } finally {
      setGuardando(false);
    }
  };

  const handlePorDefecto = async () => {
    try {
      const res = await establecerPorDefecto(horario.id, !horario.es_por_defecto);
      onNotificar?.(res.mensaje || "Estado por defecto actualizado", "success");
      onReload?.();
    } catch (err) {
      onNotificar?.(err.message || "Error al actualizar el estado por defecto", "error");
    }
  };

  const handleEliminar = async () => {
    if (!window.confirm(`¿Eliminar el horario "${horario.nombre}"?`)) return;
    setEliminando(true);
    try {
      const res = await eliminarHorario(horario.id);
      onNotificar?.(res.mensaje || "Horario eliminado correctamente", "success");
      onReload?.({ eliminarId: horario.id });
    } catch (err) {
      onNotificar?.(err.message || "Error al eliminar el horario", "error");
    } finally {
      setEliminando(false);
    }
  };

  const itemsVista = [];
  if (form.tipo_jornada === "por_horas") {
    itemsVista.push("No controlará tardanzas", "Evaluará horas trabajadas", "Comparará contra las horas esperadas configuradas");
  } else if (form.modalidad === "estricto") {
    itemsVista.push("Controlará tardanzas", "Generará ausencias", "Utilizará horarios definidos");
  } else {
    itemsVista.push("No controlará tardanzas", "Registrará asistencia normalmente", "No generará sanciones por hora de ingreso");
  }

  return (
    <Paper elevation={0} sx={{ borderRadius: "16px", border: `1px solid ${PALETA.borde}`, p: 3 }}>
      {/* Cabecera */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: PALETA.gris, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Detalle del horario
          </Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: PALETA.texto, mt: 0.25 }}>
            {form.nombre || "Sin nombre"}
          </Typography>
        </Box>
        <Chip label={form.activo ? "Activo" : "Inactivo"} size="small"
          sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 11, bgcolor: form.activo ? PALETA.verdeClaro : PALETA.grisClaro, color: form.activo ? PALETA.verdeOscuro : PALETA.gris }} />
      </Box>

      <Divider sx={{ borderColor: PALETA.borde, mb: 2.5 }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Nombre */}
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: PALETA.grisTexto, mb: 0.5 }}>Nombre</Typography>
          <TextField size="small" fullWidth value={form.nombre}
            onChange={(e) => setCampo("nombre", e.target.value)} disabled={readonly}
            placeholder="Ej: Jornada A"
            slotProps={{ input: { sx: inputSx } }} />
        </Box>

        {/* Descripción */}
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: PALETA.grisTexto, mb: 0.5 }}>Descripción</Typography>
          <TextField size="small" fullWidth multiline minRows={2} value={form.descripcion}
            onChange={(e) => setCampo("descripcion", e.target.value)} disabled={readonly}
            placeholder="Breve descripción del horario"
            slotProps={{ input: { sx: { ...inputSx, height: "auto", py: 1.5 } } }} />
        </Box>

        {/* Tipo de jornada */}
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto, mb: 1 }}>
            ¿Cómo trabaja este horario?
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
            <SelectorCard titulo="Horario fijo"
              descripcion="El empleado debe cumplir horarios definidos de entrada y salida."
              seleccionado={form.tipo_jornada === "fija"} disabled={readonly}
              onClick={() => setCampo("tipo_jornada", "fija")} />
            <SelectorCard titulo="Jornada por horas"
              descripcion="El sistema evaluará únicamente las horas trabajadas."
              seleccionado={form.tipo_jornada === "por_horas"} disabled={readonly}
              onClick={() => setCampo("tipo_jornada", "por_horas")} />
          </Box>
        </Box>

        {/* Modalidad */}
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto, mb: 1 }}>
            ¿Cómo se evaluará la asistencia?
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
            <SelectorCard titulo="Controlar tardanzas"
              descripcion="El sistema comparará la hora de entrada con el horario configurado."
              seleccionado={form.modalidad === "estricto"} disabled={readonly}
              onClick={() => setCampo("modalidad", "estricto")} />
            <SelectorCard titulo="No controlar tardanzas"
              descripcion="El sistema registrará la asistencia normalmente pero nunca generará tardanzas."
              seleccionado={form.modalidad === "flexible"} disabled={readonly}
              onClick={() => setCampo("modalidad", "flexible")} />
          </Box>
        </Box>

        {esFija ? (
          <>
            {/* Configuración semanal */}
            <Box sx={{ bgcolor: COLORES.fondoGris, borderRadius: "12px", p: 2 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto, mb: 1 }}>
                Jornada laboral
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {form.dias.map((d, idx) => {
                  const conBloque2 = bloque2Dias.has(d.dia_semana);
                  return (
                    <Box key={d.dia_semana}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: `66px ${conBloque2 ? "1fr 1fr 1fr 1fr" : "1fr 1fr"} auto`,
                        gap: 1,
                        alignItems: "center",
                      }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: PALETA.texto, pr: 0.25 }}>{d.dia_semana}</Typography>
                      <TextField type="time" size="small" value={d.hora_entrada_manana}
                        onChange={(e) => setDia(idx, "hora_entrada_manana", e.target.value)} disabled={readonly}
                        label="Entrada" slotProps={{
                          inputLabel: { shrink: true, sx: { fontSize: 11 } },
                          input: { sx: { ...inputSx, height: 36 } },
                        }} />
                      <TextField type="time" size="small" value={d.hora_salida_manana}
                        onChange={(e) => setDia(idx, "hora_salida_manana", e.target.value)} disabled={readonly}
                        label="Salida" slotProps={{
                          inputLabel: { shrink: true, sx: { fontSize: 11 } },
                          input: { sx: { ...inputSx, height: 36 } },
                        }} />
                      {conBloque2 && (
                        <>
                          <TextField type="time" size="small" value={d.hora_entrada_tarde}
                            onChange={(e) => setDia(idx, "hora_entrada_tarde", e.target.value)} disabled={readonly}
                            label="Entrada tarde" slotProps={{
                              inputLabel: { shrink: true, sx: { fontSize: 11 } },
                              input: { sx: { ...inputSx, height: 36 } },
                            }} />
                          <TextField type="time" size="small" value={d.hora_salida_tarde}
                            onChange={(e) => setDia(idx, "hora_salida_tarde", e.target.value)} disabled={readonly}
                            label="Salida tarde" slotProps={{
                              inputLabel: { shrink: true, sx: { fontSize: 11 } },
                              input: { sx: { ...inputSx, height: 36 } },
                            }} />
                        </>
                      )}
                      {!readonly && (
                        <IconButton size="small" onClick={() => toggleBloque2(d.dia_semana)}
                          title={conBloque2 ? "Quitar segundo bloque" : "Agregar segundo bloque"}
                          sx={{
                            width: 32, height: 32, borderRadius: "8px",
                            color: conBloque2 ? PALETA.grisTexto : PALETA.verdeOscuro,
                            bgcolor: conBloque2 ? PALETA.grisClaro : PALETA.verdeClaro,
                            "&:hover": { bgcolor: conBloque2 ? COLORES.borde : PALETA.verdeMedio },
                          }}>
                          {conBloque2 ? <Trash2 size={15} /> : <Plus size={15} />}
                        </IconButton>
                      )}
                    </Box>
                  );
                })}
              </Box>
              <Typography sx={{ fontSize: 11, color: PALETA.gris, mt: 1.5 }}>
                El modelo soporta hasta 2 bloques por día (mañana y tarde).
              </Typography>
            </Box>

            {/* Tolerancias */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: PALETA.grisTexto, mb: 0.5 }}>Tolerancia entrada (min)</Typography>
                <TextField type="number" size="small" fullWidth value={form.tolerancia_minutos}
                  onChange={(e) => setCampo("tolerancia_minutos", e.target.value)} disabled={readonly}
                  slotProps={{ input: { sx: inputSx } }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: PALETA.grisTexto, mb: 0.5 }}>Tolerancia salida (min)</Typography>
                <TextField type="number" size="small" fullWidth value={form.tolerancia_salida_minutos}
                  onChange={(e) => setCampo("tolerancia_salida_minutos", e.target.value)} disabled={readonly}
                  slotProps={{ input: { sx: inputSx } }} />
              </Box>
            </Box>
          </>
        ) : (
          <>
            {/* Horas esperadas */}
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto, mb: 0.5 }}>Horas esperadas</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                <TextField type="number" size="small" value={form.horas_esperadas}
                  onChange={(e) => setCampo("horas_esperadas", e.target.value)} disabled={readonly}
                  placeholder="Ej: 6.5" sx={{ width: 160 }} slotProps={{ input: { sx: inputSx } }} />
                <Box sx={{ display: "flex", gap: 0.75 }}>
                  {["6", "6.5", "11"].map((v) => (
                    <Chip key={v} label={v} size="small" disabled={readonly}
                      onClick={() => setCampo("horas_esperadas", v)}
                      sx={{
                        borderRadius: "8px", fontWeight: 600, fontSize: 11, cursor: readonly ? "default" : "pointer",
                        bgcolor: form.horas_esperadas === v ? PALETA.verdeOscuro : PALETA.verdeClaro,
                        color: form.horas_esperadas === v ? COLORES.fondoBlanco : PALETA.verdeOscuro,
                        "&:hover": readonly ? {} : { bgcolor: form.horas_esperadas === v ? PALETA.verde : PALETA.verdeMedio },
                      }} />
                  ))}
                </Box>
              </Box>
              <Box sx={{ bgcolor: PALETA.verdeClaro, borderRadius: "12px", p: 2, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                <Info size={17} color={PALETA.verdeOscuro} style={{ flexShrink: 0, marginTop: 1 }} />
                <Typography sx={{ fontSize: 13, color: PALETA.verdeOscuro }}>
                  La asistencia será evaluada comparando las horas trabajadas contra las horas esperadas.
                </Typography>
              </Box>
            </Box>
          </>
        )}

        {/* Vista previa de evaluación */}
        <Box sx={{ bgcolor: COLORES.fondoGris, borderRadius: "12px", p: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: PALETA.texto, mb: 1 }}>
            Vista previa de evaluación
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {itemsVista.map((t) => (
              <Box key={t} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 18, height: 18, borderRadius: "50%", bgcolor: PALETA.verdeClaro, color: PALETA.verdeOscuro, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Check size={11} strokeWidth={3} />
                </Box>
                <Typography sx={{ fontSize: 12, color: PALETA.grisTexto }}>{t}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Estado */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${PALETA.borde}`, pt: 2 }}>
          <FormControlLabel
            control={<Switch checked={!!form.activo} onChange={(e) => setCampo("activo", e.target.checked)} disabled={readonly}
              sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: PALETA.verde }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: PALETA.verde } }} />}
            label="Horario activo"
            sx={{ "& .MuiFormControlLabel-label": { fontSize: 13, fontWeight: 500, color: PALETA.grisTexto } }}
          />
          {esAdmin && (
            <Button size="small" startIcon={<Star size={14} />} onClick={handlePorDefecto}
              sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, fontSize: 12,
                color: horario.es_por_defecto ? COLORES.warningOscuro : PALETA.grisTexto,
                bgcolor: horario.es_por_defecto ? COLORES.warningFondo : PALETA.grisClaro,
                "&:hover": { bgcolor: COLORES.borde } }}>
              {horario.es_por_defecto ? "Es el horario por defecto" : "Establecer por defecto"}
            </Button>
          )}
        </Box>

        {/* Acciones */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, borderTop: `1px solid ${PALETA.borde}`, pt: 2 }}>
          {esAdmin && (
            <Button startIcon={<Trash2 size={15} />} onClick={handleEliminar} disabled={eliminando}
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, color: PALETA.rojo, borderColor: COLORES.dangerBorde, "&:hover": { bgcolor: PALETA.rojoBg, borderColor: PALETA.rojo } }}>
              Eliminar
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          {!readonly && (
            <Button variant="contained" startIcon={<Save size={16} />} onClick={handleGuardar} disabled={guardando}
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 4, bgcolor: PALETA.verdeOscuro, "&:hover": { bgcolor: PALETA.verde } }}>
              {guardando ? <CircularProgress size={16} color="inherit" /> : "Guardar"}
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

function AsignacionSection({ empleados = [], horarios = [], areas = [], cargos = [], onNotificar, onReload }) {
  const [tab, setTab] = useState(0);

  // Individual
  const [busqueda, setBusqueda] = useState("");
  const [filtroAreaInd, setFiltroAreaInd] = useState("");
  const [filtroCargoInd, setFiltroCargoInd] = useState("");
  const [asignarA, setAsignarA] = useState(null);
  const [asigForm, setAsigForm] = useState({ horario_id: "", vigencia_desde: hoyLocal(), motivo: "" });
  const [asignando, setAsignando] = useState(false);
  const [quitandoId, setQuitandoId] = useState(null);

  // Masiva
  const [filtroArea, setFiltroArea] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("");
  const [seleccionados, setSeleccionados] = useState(() => new Set());
  const [mostrarMasivo, setMostrarMasivo] = useState(false);
  const [masivoForm, setMasivoForm] = useState({ horario_id: "", vigencia_desde: hoyLocal(), motivo: "" });
  const [asignandoMasivo, setAsignandoMasivo] = useState(false);

  const areasList = useMemo(() => {
    const map = new Map();
    areas.forEach((a) => {
      if (a.nombre) map.set(String(a.id), a.nombre);
    });
    return [...map.entries()].map(([id, nombre]) => ({ id, nombre }));
  }, [areas]);

  const cargosList = useMemo(() => {
    const map = new Map();
    cargos.forEach((c) => {
      if (c.nombre) map.set(String(c.id), c.nombre);
    });
    return [...map.entries()].map(([id, nombre]) => ({ id, nombre }));
  }, [cargos]);

  const horarioNombre = (id) => horarios.find((h) => h.id === id)?.nombre || null;

  const filtradosInd = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return empleados.filter((e) => {
      if (filtroAreaInd && String(e.area_id ?? e.area) !== String(filtroAreaInd)) return false;
      if (filtroCargoInd && String(e.cargo_id ?? e.cargo) !== String(filtroCargoInd)) return false;
      if (q) {
        const texto = `${nombreEmpleado(e)} ${e.cargo || ""} ${e.area || ""} ${e.correo || ""}`.toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [empleados, busqueda, filtroAreaInd, filtroCargoInd]);

  const filtradosMasivo = useMemo(() => {
    return empleados.filter((e) => {
      if (filtroArea && String(e.area_id ?? e.area) !== String(filtroArea)) return false;
      if (filtroCargo && String(e.cargo_id ?? e.cargo) !== String(filtroCargo)) return false;
      return true;
    });
  }, [empleados, filtroArea, filtroCargo]);

  const abrirAsignacion = (e) => {
    setAsignarA(e);
    setAsigForm({ horario_id: e.horario_id ? String(e.horario_id) : "", vigencia_desde: hoyLocal(), motivo: "" });
  };

  const aplicarIndividual = async () => {
    if (!asigForm.horario_id) return onNotificar?.("Selecciona un horario", "error");
    setAsignando(true);
    try {
      const res = await asignarHorario({
        usuario_id: asignarA.id,
        horario_id: Number(asigForm.horario_id),
        vigencia_desde: asigForm.vigencia_desde || hoyLocal(),
        motivo: asigForm.motivo.trim() || null,
      });
      onNotificar?.(res.mensaje || "Horario asignado correctamente", "success");
      setAsignarA(null);
      onReload?.();
    } catch (err) {
      onNotificar?.(err.message || "Error al asignar el horario", "error");
    } finally {
      setAsignando(false);
    }
  };

  const quitar = async (e) => {
    if (!window.confirm(`¿Quitar a ${nombreEmpleado(e)} de su horario actual?`)) return;
    setQuitandoId(e.id);
    try {
      const res = await desasignarHorario(e.id);
      onNotificar?.(res.mensaje || "Empleado quitado del horario correctamente", "success");
      onReload?.();
    } catch (err) {
      onNotificar?.(err.message || "Error al quitar el horario", "error");
    } finally {
      setQuitandoId(null);
    }
  };

  const todosSeleccionados = filtradosMasivo.length > 0 && filtradosMasivo.every((e) => seleccionados.has(e.id));

  const toggleSeleccion = (id) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (todosSeleccionados) filtradosMasivo.forEach((e) => next.delete(e.id));
      else filtradosMasivo.forEach((e) => next.add(e.id));
      return next;
    });
  };

  const abrirSelectorMasivo = () => {
    if (seleccionados.size === 0) return;
    setMostrarMasivo(true);
    setMasivoForm({ horario_id: "", vigencia_desde: hoyLocal(), motivo: "" });
  };

  const aplicarMasivo = async () => {
    if (!masivoForm.horario_id) return onNotificar?.("Selecciona un horario", "error");
    if (seleccionados.size === 0) return onNotificar?.("Selecciona al menos un empleado", "error");
    setAsignandoMasivo(true);
    try {
      const res = await asignarMasivo({
        horario_id: Number(masivoForm.horario_id),
        usuario_ids: [...seleccionados],
        vigencia_desde: masivoForm.vigencia_desde || hoyLocal(),
        motivo: masivoForm.motivo.trim() || null,
      });
      onNotificar?.(res.mensaje || `Horario asignado a ${res.cantidad ?? 0} empleados correctamente`, "success");
      setSeleccionados(new Set());
      setMostrarMasivo(false);
      setMasivoForm({ horario_id: "", vigencia_desde: hoyLocal(), motivo: "" });
      onReload?.();
    } catch (err) {
      onNotificar?.(err.message || "Error al asignar masivamente", "error");
    } finally {
      setAsignandoMasivo(false);
    }
  };

  const selectHorarios = (value, onChange) => (
    <Select size="small" fullWidth value={value} onChange={(e) => onChange(e.target.value)} sx={modalFieldSx} displayEmpty>
      <MenuItem value="" disabled>Selecciona un horario</MenuItem>
      {horarios.map((h) => (
        <MenuItem key={h.id} value={String(h.id)}>
          {h.nombre} — {h.tipo_jornada === "por_horas" ? "Por horas" : "Fija"} ({h.modalidad === "flexible" ? "Flexible" : "Estricto"})
        </MenuItem>
      ))}
    </Select>
  );

  const tablaHead = (cols) => (
    <TableHead>
      <TableRow>
        {cols.map((c) => (
          <TableCell key={c} sx={{ fontWeight: 600, color: PALETA.grisTexto, fontSize: 12, bgcolor: COLORES.fondoGris, py: 1.25, whiteSpace: "nowrap" }}>{c}</TableCell>
        ))}
      </TableRow>
    </TableHead>
  );

  const panelLateralSx = {
    width: 320,
    flexShrink: 0,
    bgcolor: COLORES.fondoGris,
    borderRadius: "12px",
    border: `1px solid ${PALETA.borde}`,
    p: 2,
    alignSelf: "flex-start",
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: "16px", border: `1px solid ${PALETA.borde}`, overflow: "hidden" }}>
      {/* Encabezado + pestañas */}
      <Box sx={{ px: 2.5, pt: 2, pb: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Users size={16} color={PALETA.verdeOscuro} />
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: PALETA.texto }}>
            Asignación de horarios
          </Typography>
        </Box>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setAsignarA(null); setMostrarMasivo(false); }}
          sx={{
            minHeight: 40,
            "& .MuiTabs-indicator": { bgcolor: PALETA.verdeOscuro, borderRadius: "3px 3px 0 0" },
            "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: 13, color: PALETA.grisTexto, minHeight: 40, py: 0 },
            "& .Mui-selected": { color: PALETA.verdeOscuro },
          }}>
          <Tab label="Asignación individual" />
          <Tab label="Asignación masiva" />
        </Tabs>
      </Box>

      <Divider sx={{ borderColor: PALETA.borde, mt: 1 }} />

      {/* Contenido */}
      <Box sx={{ p: 2.5 }}>
        {tab === 0 ? (
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Filtros individual */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 2fr" }, gap: 1.5, mb: 2 }}>
                <Select size="small" value={filtroAreaInd} onChange={(e) => setFiltroAreaInd(e.target.value)} displayEmpty
                  sx={{ borderRadius: "10px", fontSize: 13, height: 40, bgcolor: COLORES.fondoGris, "& fieldset": { borderColor: PALETA.borde } }}>
                  <MenuItem value=""><em>Todas las áreas</em></MenuItem>
                  {areasList.map((a) => <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>)}
                </Select>
                <Select size="small" value={filtroCargoInd} onChange={(e) => setFiltroCargoInd(e.target.value)} displayEmpty
                  sx={{ borderRadius: "10px", fontSize: 13, height: 40, bgcolor: COLORES.fondoGris, "& fieldset": { borderColor: PALETA.borde } }}>
                  <MenuItem value=""><em>Todos los cargos</em></MenuItem>
                  {cargosList.map((c) => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
                </Select>
                <TextField aria-label="Buscar empleado" placeholder="Buscar empleado por nombre, cargo, área, correo..." value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: <Search size={15} style={{ color: PALETA.gris, marginRight: 8 }} />,
                      sx: { borderRadius: "10px", fontSize: 13, height: 40, bgcolor: COLORES.fondoGris, py: 0, "& fieldset": { borderColor: PALETA.borde } },
                    },
                  }} />
              </Box>

              {/* Tabla individual */}
              <TableContainer sx={{ border: `1px solid ${PALETA.borde}`, borderRadius: "12px", overflowX: "auto" }}>
                <Table size="small">
                  {tablaHead(["Empleado", "Área", "Cargo", "Horario actual", "Estado", "Acción"])}
                  <TableBody>
                    {filtradosInd.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 5, color: PALETA.gris, fontSize: 13 }}>
                          {busqueda || filtroAreaInd || filtroCargoInd ? "No se encontraron empleados" : "No hay empleados para asignar"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtradosInd.map((e) => {
                        const actual = horarioNombre(e.horario_id);
                        return (
                          <TableRow key={e.id} sx={{ "&:hover": { bgcolor: COLORES.fondoGris } }}>
                            <TableCell sx={{ fontSize: 13, fontWeight: 600, color: PALETA.texto, py: 1.1, whiteSpace: "nowrap" }}>
                              {nombreEmpleado(e)}
                              {e.correo && <Typography sx={{ fontSize: 11, color: PALETA.gris }}>{e.correo}</Typography>}
                            </TableCell>
                            <TableCell sx={{ fontSize: 13, color: COLORES.textoMuted, py: 1.1 }}>{e.area || "—"}</TableCell>
                            <TableCell sx={{ fontSize: 13, color: COLORES.textoMuted, py: 1.1 }}>{e.cargo || "—"}</TableCell>
                            <TableCell sx={{ py: 1.1 }}>
                              {actual ? (
                                <Chip label={actual} size="small"
                                  sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 11, bgcolor: PALETA.verdeClaro, color: PALETA.verdeOscuro }} />
                              ) : (
                                <Typography sx={{ fontSize: 12, color: PALETA.gris }}>Sin asignar</Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ py: 1.1 }}><EstadoChip activo={!!e.activo} /></TableCell>
                            <TableCell sx={{ py: 1.1 }}>
                              <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
                                <Button size="small" startIcon={<UserPlus size={13} />} onClick={() => abrirAsignacion(e)}
                                  sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, fontSize: 11, height: 28, whiteSpace: "nowrap", px: 1.25, bgcolor: PALETA.verdeOscuro, color: COLORES.fondoBlanco, "&:hover": { bgcolor: PALETA.verde } }}>
                                  Asignar horario
                                </Button>
                                {actual && (
                                  <IconButton size="small" onClick={() => quitar(e)} disabled={quitandoId === e.id}
                                    title="Quitar horario"
                                    sx={{ width: 28, height: 28, borderRadius: "8px", color: PALETA.rojo, bgcolor: PALETA.rojoBg, "&:hover": { bgcolor: COLORES.dangerBorde } }}>
                                    <UserMinus size={14} />
                                  </IconButton>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Panel lateral asignación individual */}
            {asignarA && (
              <Box sx={panelLateralSx}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: PALETA.gris, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Asignar horario
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: PALETA.texto, mt: 0.25 }}>
                      {nombreEmpleado(asignarA)}
                    </Typography>
                  </Box>
                  <IconButton aria-label="Cerrar asignación" size="small" onClick={() => setAsignarA(null)}
                    sx={{ color: PALETA.gris, "&:hover": { color: PALETA.grisTexto, bgcolor: PALETA.grisClaro } }}>
                    <X size={16} />
                  </IconButton>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: PALETA.grisTexto, mb: 0.5 }}>Horario</Typography>
                    {selectHorarios(asigForm.horario_id, (v) => setAsigForm((f) => ({ ...f, horario_id: v })))}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: PALETA.grisTexto, mb: 0.5 }}>Fecha de vigencia</Typography>
                    <TextField type="date" size="small" fullWidth value={asigForm.vigencia_desde}
                      onChange={(e) => setAsigForm((f) => ({ ...f, vigencia_desde: e.target.value }))}
                      sx={modalFieldSx} slotProps={{ inputLabel: { shrink: true } }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: PALETA.grisTexto, mb: 0.5 }}>Motivo (opcional)</Typography>
                    <TextField size="small" fullWidth value={asigForm.motivo}
                      onChange={(e) => setAsigForm((f) => ({ ...f, motivo: e.target.value }))}
                      placeholder="Ej: Cambio de turno" sx={modalFieldSx} />
                  </Box>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
                  <Button onClick={() => setAsignarA(null)}
                    sx={{ textTransform: "none", fontWeight: 600, fontSize: 12, color: PALETA.grisTexto, borderRadius: "8px" }}>
                    Cancelar
                  </Button>
                  <Button variant="contained" startIcon={<UserPlus size={14} />} onClick={aplicarIndividual} disabled={asignando}
                    sx={{ textTransform: "none", fontWeight: 600, fontSize: 12, borderRadius: "8px", bgcolor: PALETA.verdeOscuro, "&:hover": { bgcolor: PALETA.verde } }}>
                    {asignando ? "Asignando..." : "Guardar"}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Filtros masiva */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, mb: 2 }}>
                <Select size="small" value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} displayEmpty
                  sx={{ borderRadius: "10px", fontSize: 13, height: 40, bgcolor: COLORES.fondoGris, "& fieldset": { borderColor: PALETA.borde } }}>
                  <MenuItem value=""><em>Todas las áreas</em></MenuItem>
                  {areasList.map((a) => <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>)}
                </Select>
                <Select size="small" value={filtroCargo} onChange={(e) => setFiltroCargo(e.target.value)} displayEmpty
                  sx={{ borderRadius: "10px", fontSize: 13, height: 40, bgcolor: COLORES.fondoGris, "& fieldset": { borderColor: PALETA.borde } }}>
                  <MenuItem value=""><em>Todos los cargos</em></MenuItem>
                  {cargosList.map((c) => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
                </Select>
              </Box>

              {/* Contador + botón */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Filter size={14} color={PALETA.gris} />
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: PALETA.grisTexto }}>
                    {filtradosMasivo.length} empleado{filtradosMasivo.length === 1 ? "" : "s"} · {seleccionados.size} seleccionado{seleccionados.size === 1 ? "" : "s"}
                  </Typography>
                </Box>
                <Button variant="contained" startIcon={<UserPlus size={15} />} onClick={abrirSelectorMasivo} disabled={seleccionados.size === 0}
                  sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 38, px: 2, bgcolor: PALETA.verdeOscuro, "&:hover": { bgcolor: PALETA.verde } }}>
                  Asignar horario
                </Button>
              </Box>

              {/* Tabla masiva con checkboxes */}
              <TableContainer sx={{ border: `1px solid ${PALETA.borde}`, borderRadius: "12px", overflowX: "auto", maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ bgcolor: COLORES.fondoGris, py: 1.25 }}>
                        <Checkbox size="small" checked={todosSeleccionados} indeterminate={seleccionados.size > 0 && !todosSeleccionados}
                          onChange={toggleTodos}
                          sx={{ color: PALETA.gris, "&.Mui-checked": { color: PALETA.verdeOscuro } }} />
                      </TableCell>
                      {["Empleado", "Área", "Cargo", "Horario actual", "Estado"].map((c) => (
                        <TableCell key={c} sx={{ fontWeight: 600, color: PALETA.grisTexto, fontSize: 12, bgcolor: COLORES.fondoGris, py: 1.25, whiteSpace: "nowrap" }}>{c}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtradosMasivo.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 5, color: PALETA.gris, fontSize: 13 }}>
                          No hay empleados con los filtros seleccionados
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtradosMasivo.map((e) => (
                        <TableRow key={e.id} hover sx={{ "&:hover": { bgcolor: COLORES.fondoGris } }}>
                          <TableCell padding="checkbox" sx={{ py: 1 }}>
                            <Checkbox size="small" checked={seleccionados.has(e.id)} onChange={() => toggleSeleccion(e.id)}
                              sx={{ color: PALETA.gris, "&.Mui-checked": { color: PALETA.verdeOscuro } }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: 13, fontWeight: 600, color: PALETA.texto, py: 1, whiteSpace: "nowrap" }}>{nombreEmpleado(e)}</TableCell>
                          <TableCell sx={{ fontSize: 13, color: COLORES.textoMuted, py: 1 }}>{e.area || "—"}</TableCell>
                          <TableCell sx={{ fontSize: 13, color: COLORES.textoMuted, py: 1 }}>{e.cargo || "—"}</TableCell>
                          <TableCell sx={{ fontSize: 13, color: COLORES.textoMuted, py: 1 }}>{horarioNombre(e.horario_id) || "—"}</TableCell>
                          <TableCell sx={{ py: 1 }}><EstadoChip activo={!!e.activo} /></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Panel lateral selector masivo */}
            {mostrarMasivo && (
              <Box sx={panelLateralSx}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: PALETA.gris, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Asignación masiva
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: PALETA.texto, mt: 0.25 }}>
                      {seleccionados.size} empleado{seleccionados.size === 1 ? "" : "s"} seleccionado{seleccionados.size === 1 ? "" : "s"}
                    </Typography>
                  </Box>
                  <IconButton aria-label="Cerrar asignación masiva" size="small" onClick={() => setMostrarMasivo(false)}
                    sx={{ color: PALETA.gris, "&:hover": { color: PALETA.grisTexto, bgcolor: PALETA.grisClaro } }}>
                    <X size={16} />
                  </IconButton>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: PALETA.grisTexto, mb: 0.5 }}>Horario</Typography>
                    {selectHorarios(masivoForm.horario_id, (v) => setMasivoForm((f) => ({ ...f, horario_id: v })))}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: PALETA.grisTexto, mb: 0.5 }}>Motivo (opcional)</Typography>
                    <TextField size="small" fullWidth value={masivoForm.motivo}
                      onChange={(e) => setMasivoForm((f) => ({ ...f, motivo: e.target.value }))}
                      placeholder="Ej: Cambio de turno" sx={modalFieldSx} />
                  </Box>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
                  <Button onClick={() => setMostrarMasivo(false)}
                    sx={{ textTransform: "none", fontWeight: 600, fontSize: 12, color: PALETA.grisTexto, borderRadius: "8px" }}>
                    Cancelar
                  </Button>
                  <Button variant="contained" startIcon={<Users size={14} />} onClick={aplicarMasivo} disabled={asignandoMasivo}
                    sx={{ textTransform: "none", fontWeight: 600, fontSize: 12, borderRadius: "8px", bgcolor: PALETA.verdeOscuro, "&:hover": { bgcolor: PALETA.verde } }}>
                    {asignandoMasivo ? "Aplicando..." : "Aplicar a seleccionados"}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
}

export default function HorariosPage() {
  const [usuario, setUsuario] = useState({ rol: "" });
  useEffect(() => {
    try { const u = JSON.parse(localStorage.getItem("usuario") || "{}"); setUsuario(u); } catch {}
  }, []);
  const esAdmin = usuario.rol === "admin";
  const esTH = usuario.rol === "talento_humano";

  const [horarios, setHorarios] = useState([]);
  const [asignadosMap, setAsignadosMap] = useState({});
  const [empleados, setEmpleados] = useState([]);
  const [areas, setAreas] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [historialGlobal, setHistorialGlobal] = useState([]);
  const [historialCargando, setHistorialCargando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [abrirNuevo, setAbrirNuevo] = useState(false);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const mostrarToast = (msg, tipo = "ok") => {
    setToast({ msg, tipo });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const seleccionado = horarios.find((h) => h.id === seleccionadoId) || null;

  async function cargarHorarios() {
    setCargando(true);
    try {
      const data = await obtenerHorarios();
      const lista = Array.isArray(data) ? data : [];
      lista.forEach((h) => {
        if (h.detalles) {
          h.detalles.sort((a, b) => (DIAS_ORDEN[a.dia_semana] || 99) - (DIAS_ORDEN[b.dia_semana] || 99));
        }
      });
      setHorarios(lista);

      const map = {};
      await Promise.all(
        lista.map(async (h) => {
          try {
            const asig = await obtenerAsignados(h.id);
            map[h.id] = Array.isArray(asig) ? asig : [];
          } catch {
            map[h.id] = [];
          }
        })
      );
      setAsignadosMap(map);

      setSeleccionadoId((prev) =>
        prev && lista.some((h) => h.id === prev) ? prev : (lista[0]?.id ?? null)
      );
    } catch {
      setHorarios([]);
      setAsignadosMap({});
    } finally {
      setCargando(false);
    }
  }

  async function cargarEmpleados() {
    try {
      const res = await obtenerPersonal();
      setEmpleados(Array.isArray(res?.empleados) ? res.empleados : []);
    } catch {
      setEmpleados([]);
    }
  }

  async function cargarAreas() {
    try {
      const data = await obtenerAreas();
      setAreas(Array.isArray(data) ? data : []);
    } catch {
      setAreas([]);
    }
  }

  async function cargarCargos() {
    try {
      const data = await obtenerCargos();
      setCargos(Array.isArray(data) ? data : []);
    } catch {
      setCargos([]);
    }
  }

  async function cargarHistorial() {
    if (!esAdmin && !esTH) return;
    setHistorialCargando(true);
    try {
      const data = await obtenerHistorialGlobal();
      setHistorialGlobal(Array.isArray(data) ? data : []);
    } catch {
      setHistorialGlobal([]);
    } finally {
      setHistorialCargando(false);
    }
  }

  useEffect(() => {
    cargarHorarios();
    cargarEmpleados();
    cargarAreas();
    cargarCargos();
  }, []);

  useEffect(() => {
    if (esAdmin || esTH) cargarHistorial();
  }, [esAdmin, esTH]);

  const relanzarTodo = ({ eliminarId } = {}) => {
    cargarHorarios();
    cargarEmpleados();
    cargarAreas();
    cargarCargos();
    if (esAdmin || esTH) cargarHistorial();
    if (eliminarId) setSeleccionadoId((prev) => (prev === eliminarId ? null : prev));
  };

  async function duplicar(h) {
    try {
      await crearHorario({
        nombre: `${h.nombre} (copia)`,
        descripcion: h.descripcion || null,
        modalidad: h.modalidad,
        tipo_jornada: h.tipo_jornada,
        horas_esperadas: h.horas_esperadas || null,
        tolerancia_minutos: Number(h.tolerancia_minutos) || 0,
        tolerancia_salida_minutos: Number(h.tolerancia_salida_minutos) || 0,
        activo: h.activo,
        detalles: (h.detalles || []).map((d) => ({ ...d })),
      });
      mostrarToast("Horario duplicado correctamente", "ok");
      await cargarHorarios();
    } catch (err) {
      mostrarToast(err.message || "Error al duplicar el horario", "err");
    }
  }

  async function eliminar(h) {
    if (!window.confirm(`¿Eliminar el horario "${h.nombre}"?`)) return;
    try {
      const res = await eliminarHorario(h.id);
      mostrarToast(res.mensaje || "Horario eliminado correctamente", "ok");
      setSeleccionadoId((prev) => (prev === h.id ? null : prev));
      await cargarHorarios();
    } catch (err) {
      mostrarToast(err.message || "Error al eliminar el horario", "err");
    }
  }

  async function porDefecto(h) {
    try {
      const res = await establecerPorDefecto(h.id, !h.es_por_defecto);
      mostrarToast(res.mensaje || "Estado por defecto actualizado", "ok");
      await cargarHorarios();
    } catch (err) {
      mostrarToast(err.message || "Error al actualizar el estado por defecto", "err");
    }
  }

  if (cargando && horarios.length === 0) {
    return (
      <Box sx={{ p: 3, bgcolor: COLORES.grisAzulado, minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress sx={{ color: PALETA.verde }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: COLORES.grisAzulado, minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 13, color: COLORES.textoMuted }}>Inicio / Gestión del personal / Horarios</Typography>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mt: 1, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            
            <Box>
              <Typography sx={{ fontSize: 22, fontWeight: 700, color: PALETA.texto, lineHeight: 1.15 }}></Typography>
              
            </Box>
          </Box>
          {esAdmin && (
            <Button variant="contained" onClick={() => setAbrirNuevo(true)}
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 2.5, bgcolor: PALETA.verdeOscuro, "&:hover": { bgcolor: PALETA.verde } }}>
              + Nuevo horario
            </Button>
          )}
        </Box>
      </Box>

      {/* Fila superior: listado + detalle */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "400px 1fr" }, gap: 2.5, alignItems: "stretch" }}>
        {/* Listado de tarjetas */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {horarios.map((h) => (
            <HorarioCard key={h.id} h={h}
              asignados={asignadosMap[h.id]}
              cargandoAsignados={!asignadosMap[h.id] && cargando}
              seleccionado={seleccionadoId === h.id}
              esAdmin={esAdmin}
              onSelect={(x) => setSeleccionadoId(x.id)}
              onDuplicar={duplicar}
              onEliminar={eliminar}
              onPorDefecto={porDefecto}
            />
          ))}
        </Box>

        {/* Detalle / formulario */}
        <DetalleHorarioForm horario={seleccionado} esAdmin={esAdmin} soloLectura={!esAdmin}
          onNotificar={mostrarToast} onReload={relanzarTodo} />
      </Box>

      {/* Fila inferior: asignación a ancho completo */}
      {(esAdmin || esTH) && (
        <Box sx={{ mt: 2.5 }}>
          <AsignacionSection empleados={empleados} horarios={horarios} areas={areas} cargos={cargos}
            onNotificar={mostrarToast} onReload={relanzarTodo} />
        </Box>
      )}

      {/* Reglas e historial global */}
      {(esAdmin || esTH) && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2.5, mt: 2.5, alignItems: "start" }}>
          <ReglasCard />
          <HistorialGlobalTable data={historialGlobal} cargando={historialCargando} />
        </Box>
      )}

      <NuevoHorarioModal open={abrirNuevo} onClose={() => setAbrirNuevo(false)}
        onNotificar={mostrarToast} onReload={relanzarTodo} />

      {/* Toast */}
      {toast && (
        <Box sx={{
          position: "fixed", bottom: 24, right: 24,
          bgcolor: toast.tipo === "err" ? COLORES.danger : COLORES.primarioOscuro,
          color: COLORES.fondoBlanco, borderRadius: "10px", px: 2.5, py: 1.5,
          fontSize: 13, fontWeight: 500, zIndex: 9999,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          display: "flex", alignItems: "center", gap: 1,
          maxWidth: 420,
        }}>
          {toast.tipo === "err" ? <X size={15} /> : null}
          {toast.msg}
        </Box>
      )}
    </Box>
  );
}
