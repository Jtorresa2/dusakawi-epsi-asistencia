import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Tabs, Tab, TextField, Switch, Button,
  Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Divider, FormControlLabel, Table, TableHead, TableBody,
  TableRow, TableCell, Checkbox, Chip, CircularProgress,
} from "@mui/material";
import {
  Clock, Fingerprint, Shield, Bell, Settings, RotateCcw, Save,
  Lock, X, Mail,
} from "lucide-react";
import { obtenerConfig, actualizarConfig, obtenerPendientesEmail, enviarEmailAcceso } from "../config.api";
import { COLORES } from "../../../shared/constants/colores.js";
import { PALETA } from "../../../shared/constants/paleta.js";

// ─── Definición de pestañas ──────────────────────────────────────────────────
const TABS = [
  { id: "asistencia", label: "Asistencia", icon: <Clock size={17} /> },
  { id: "marcacion", label: "Marcación", icon: <Fingerprint size={17} /> },
  { id: "seguridad", label: "Seguridad", icon: <Shield size={17} /> },
  { id: "notificaciones", label: "Notificaciones", icon: <Bell size={17} /> },
  { id: "correo", label: "Correo", icon: <Mail size={17} /> },
  { id: "general", label: "General", icon: <Settings size={17} /> },
];

// ─── Valores predeterminados ─────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  // Asistencia (reglas globales de marcación)
  tiempo_min_marcaciones: 5,
  control_duplicadas: true,
  // Marcación
  permitir_marcacion_antes: false,
  permitir_marcacion_despues: false,
  validacion_salida_obligatoria: true,
  formato_hora: "24h",
  tiempo_minimo_extra: 10,
  // Seguridad
  tiempo_expiracion_sesion: 30,
  politica_contrasenas: "",
  autenticacion_dos_pasos: false,
  longitud_minima: 15,
  longitud_maxima: 64,
  bloquear_contrasenas_comprometidas: true,
  permitir_espacios_contrasena: true,
  exigir_cambio_periodico: false,
  // Notificaciones
  notificar_incidencias_creadas: true,
  notificar_incidencias_aprobadas: true,
  notificar_incidencias_rechazadas: true,
  notificar_acumulacion_tardanzas: false,
  recordatorios_marcacion: false,
  // General
  empresa_nombre: "", empresa_nit: "", empresa_direccion: "",
  empresa_telefono: "", empresa_email: "", zona_horaria: "",
};

// ─── Estilos compartidos ─────────────────────────────────────────────────────
const fieldSx = {
  width: 92,
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    fontSize: 14,
    bgcolor: COLORES.fondoGris,
    "& fieldset": { borderColor: COLORES.grisContorno },
    "&:hover fieldset": { borderColor: COLORES.textoSuave },
    "&.Mui-focused fieldset": { borderColor: COLORES.primarioOscuro },
  },
  "& input": { textAlign: "right" },
};

const switchSx = {
  "& .MuiSwitch-switchBase.Mui-checked": { color: COLORES.primarioOscuro },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: COLORES.primario },
};

// Tarjeta de configuración: título + explicación + control
function ConfigCard({ icon, titulo, descripcion, control }) {
  return (
    <Paper elevation={0} sx={{
      p: 2, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}`,
      display: "flex", alignItems: "center", gap: 1.5, minHeight: 84,
      bgcolor: COLORES.fondoBlanco,
    }}>
      <Box sx={{
        width: 38, height: 38, borderRadius: "11px", flexShrink: 0,
        bgcolor: COLORES.primarioClaro, color: COLORES.primarioOscuro,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: COLORES.textoPrimario }}>
          {titulo}
        </Typography>
        <Typography sx={{ fontSize: 12, color: COLORES.textoTerciario, lineHeight: 1.45, mt: 0.2 }}>
          {descripcion}
        </Typography>
      </Box>
      <Box sx={{ flexShrink: 0 }}>{control}</Box>
    </Paper>
  );
}

// ─── Helpers para la pestaña Correo ──────────────────────────────────────────
const formatearFecha = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
};

const ESTADO_INFO = {
  sin_enviar: { label: "Sin enviar", bg: COLORES.fondoGris, color: COLORES.textoTerciario },
  enviado: { label: "Enviado", bg: COLORES.primarioClaro, color: COLORES.primarioOscuro },
  expirado: { label: "Expirado", bg: "#FDEBEB", color: "#B3261E" },
  aceptado: { label: "Aceptado", bg: "#E6F4EA", color: "#1E7B34" },
};

function EstadoChip({ estado }) {
  const info = ESTADO_INFO[estado] || ESTADO_INFO.sin_enviar;
  return (
    <Chip
      label={info.label}
      size="small"
      sx={{ fontSize: 11, fontWeight: 700, bgcolor: info.bg, color: info.color, borderRadius: "8px" }}
    />
  );
}

export default function ConfiguracionPage() {
  const [tab, setTab] = useState("asistencia");
  const [form, setForm] = useState({ ...DEFAULT_CONFIG });
  const [guardando, setGuardando] = useState(false);
  const [snack, setSnack] = useState(null);
  const [modalPolitica, setModalPolitica] = useState(false);
  const [pendientes, setPendientes] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [snackCorreo, setSnackCorreo] = useState(null);
  const [filtroCorreo, setFiltroCorreo] = useState("todos");

  useEffect(() => {
    (async () => {
      try {
        const data = await obtenerConfig();
        setForm({ ...DEFAULT_CONFIG, ...data });
      } catch {
        setSnack({ type: "error", msg: "Error al cargar la configuración" });
      }
    })();
  }, []);

  const setVal = (clave, valor) => setForm((prev) => ({ ...prev, [clave]: valor }));

  const guardar = async () => {
    setGuardando(true);
    try {
      const res = await actualizarConfig(form);
      setForm({ ...DEFAULT_CONFIG, ...(res.config || form) });
      setSnack({ type: "success", msg: "Configuración guardada correctamente" });
    } catch {
      setSnack({ type: "error", msg: "Error al guardar la configuración" });
    } finally {
      setGuardando(false);
    }
  };

  const restablecer = () => {
    setForm({ ...DEFAULT_CONFIG });
    setSnack({ type: "info", msg: "Valores predeterminados restaurados. Presiona Guardar para aplicarlos." });
  };

  const cargarPendientes = async () => {
    setCargandoPendientes(true);
    try {
      const data = await obtenerPendientesEmail();
      setPendientes(data.pendientes || []);
    } catch {
      setSnackCorreo({ type: "error", msg: "Error al cargar los empleados pendientes" });
    } finally {
      setCargandoPendientes(false);
    }
  };

  useEffect(() => {
    cargarPendientes();
  }, []);

  const mostrarResumenCorreo = (res) => {
    const enviados = res.enviados ?? 0;
    const fallidos = res.fallidos ?? 0;
    const sinCorreo = res.sin_correo ?? 0;
    setSnackCorreo({
      type: fallidos === 0 ? "success" : "warning",
      msg: `${enviados} enviados, ${fallidos} fallidos, ${sinCorreo} sin correo`,
    });
  };

  const enviarTodos = async () => {
    if (!window.confirm("¿Enviar el enlace de acceso a todos los empleados pendientes?")) return;
    setEnviando(true);
    try {
      const res = await enviarEmailAcceso({ todos: true });
      mostrarResumenCorreo(res);
      await cargarPendientes();
      setSeleccionados([]);
    } catch {
      setSnackCorreo({ type: "error", msg: "Error al enviar los correos" });
    } finally {
      setEnviando(false);
    }
  };

  const enviarSeleccionados = async () => {
    if (!window.confirm(`¿Enviar el enlace de acceso a ${seleccionados.length} empleado(s)?`)) return;
    setEnviando(true);
    try {
      const res = await enviarEmailAcceso({ userIds: seleccionados });
      mostrarResumenCorreo(res);
      await cargarPendientes();
      setSeleccionados([]);
    } catch {
      setSnackCorreo({ type: "error", msg: "Error al enviar los correos" });
    } finally {
      setEnviando(false);
    }
  };

  const alternarSeleccion = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const alternarSeleccionTodos = () => {
    const accionables = pendientes.filter((p) => p.estado !== "aceptado");
    if (seleccionados.length === accionables.length) setSeleccionados([]);
    else setSeleccionados(accionables.map((p) => p.id));
  };

  const pendientesVisibles = pendientes.filter((p) =>
    filtroCorreo === "todos" ? true : p.estado === filtroCorreo
  );

  const reenviarIndividual = async (p) => {
    if (!window.confirm(`¿Reenviar el enlace de acceso a ${p.nombre}?`)) return;
    setEnviando(true);
    try {
      const res = await enviarEmailAcceso({ userIds: [p.id] });
      mostrarResumenCorreo(res);
      await cargarPendientes();
    } catch {
      setSnackCorreo({ type: "error", msg: "Error al enviar el correo" });
    } finally {
      setEnviando(false);
    }
  };

  const campoMin = (clave, label) => (
    <TextField
      aria-label={label}
      type="number"
      value={form[clave] ?? ""}
      onChange={(e) => setVal(clave, Number(e.target.value))}
      slotProps={{ input: { endAdornment: <Typography sx={{ fontSize: 12, color: COLORES.textoSuave, ml: 0.5 }}>min</Typography> } }}
      sx={fieldSx}
    />
  );

  const switchControl = (clave, label) => (
    <Switch
      aria-label={label}
      checked={form[clave] === true}
      onChange={(e) => setVal(clave, e.target.checked)}
      sx={switchSx}
    />
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* ENCABEZADO */}
      <Box>
        <Typography sx={{ fontSize: 13, color: COLORES.textoMuted, mb: 0.5 }}>
          Inicio / Gestión del sistema / Configuración
        </Typography>
        
      </Box>

      {/* PESTAÑAS */}
      <Paper elevation={0} sx={{ borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}`, overflow: "hidden", bgcolor: COLORES.fondoBlanco }}>
        <Box sx={{ px: 2.5, pt: 1, borderBottom: `1px solid ${COLORES.grisContorno}`, bgcolor: COLORES.fondoBlanco }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: 52,
              "& .MuiTab-root": {
                textTransform: "none", fontWeight: 600, fontSize: 13.5,
                minHeight: 52, color: COLORES.textoTerciario,
                gap: 0.8, px: 2.25,
                "&.Mui-selected": { color: COLORES.primarioOscuro, fontWeight: 700 },
              },
              "& .MuiTabs-indicator": { bgcolor: COLORES.primarioOscuro, height: 3, borderRadius: "3px 3px 0 0" },
            }}
          >
            {TABS.map((t) => (
              <Tab key={t.id} value={t.id} label={t.label} icon={t.icon} iconPosition="start" />
            ))}
          </Tabs>
        </Box>

        {/* CONTENIDO */}
        <Box sx={{ p: 2.5 }}>
          {tab === "asistencia" && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "1fr 1fr 1fr" }, gap: 1.75 }}>
              <ConfigCard
                icon={<Clock size={18} />}
                titulo="Tiempo mínimo entre marcaciones"
                descripcion="Espacio mínimo requerido entre dos marcaciones consecutivas del mismo empleado."
                control={campoMin("tiempo_min_marcaciones", "Tiempo mínimo entre marcaciones")}
              />
              <ConfigCard
                icon={<Clock size={18} />}
                titulo="Control de marcaciones duplicadas"
                descripcion="Evita registrar la misma marcación más de una vez en un período corto."
                control={switchControl("control_duplicadas", "Control de marcaciones duplicadas")}
              />
            </Box>
          )}

          {tab === "marcacion" && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "1fr 1fr 1fr" }, gap: 1.75 }}>
              <ConfigCard
                icon={<Fingerprint size={18} />}
                titulo="Marcación antes del horario"
                descripcion="Permite registrar la entrada antes de la hora programada."
                control={switchControl("permitir_marcacion_antes", "Marcación antes del horario")}
              />
              <ConfigCard
                icon={<Fingerprint size={18} />}
                titulo="Marcación después del horario"
                descripcion="Permite registrar la salida después de la hora programada."
                control={switchControl("permitir_marcacion_despues", "Marcación después del horario")}
              />
              <ConfigCard
                icon={<Fingerprint size={18} />}
                titulo="Validación obligatoria de salida"
                descripcion="Exige registrar la salida para cerrar la jornada del día."
                control={switchControl("validacion_salida_obligatoria", "Validación obligatoria de salida")}
              />
              <ConfigCard
                icon={<Fingerprint size={18} />}
                titulo="Formato de hora"
                descripcion="Formato en que se muestran las horas en todo el sistema."
                control={
                  <TextField
                    aria-label="Formato de hora"
                    select
                    value={form.formato_hora || "24h"}
                    onChange={(e) => setVal("formato_hora", e.target.value)}
                    slotProps={{ select: { native: true } }}
                    sx={{ width: 92, ...fieldSx, "& .MuiOutlinedInput-root": { ...fieldSx["& .MuiOutlinedInput-root"], textAlign: "left" } }}
                  >
                    <option value="24h">24h</option>
                    <option value="12h">12h</option>
                  </TextField>
                }
              />
              <ConfigCard
                icon={<Fingerprint size={18} />}
                titulo="Tiempo mínimo para horas extra"
                descripcion="Minutos trabajados por encima de la jornada que cuentan como hora extra."
                control={campoMin("tiempo_minimo_extra", "Tiempo mínimo para horas extra")}
              />
            </Box>
          )}

          {tab === "seguridad" && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "1fr 1fr 1fr" }, gap: 1.75 }}>
              <ConfigCard
                icon={<Shield size={18} />}
                titulo="Expiración de sesión"
                descripcion="Minutos de inactividad antes de cerrar la sesión automáticamente."
                control={campoMin("tiempo_expiracion_sesion", "Expiración de sesión")}
              />
              <ConfigCard
                icon={<Shield size={18} />}
                titulo="Autenticación en dos pasos"
                descripcion="Exige un segundo factor de verificación al iniciar sesión."
                control={switchControl("autenticacion_dos_pasos", "Autenticación en dos pasos")}
              />
              <ConfigCard
                icon={<Shield size={18} />}
                titulo="Política de contraseñas"
                descripcion="Reglas de complejidad exigidas a las contraseñas de los usuarios."
                control={
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setModalPolitica(true)}
                    sx={{ borderRadius: "10px", textTransform: "none", fontSize: 12, color: COLORES.textoTerciario, borderColor: COLORES.grisContorno }}
                  >
                    Configurar
                  </Button>
                }
              />
            </Box>
          )}

          {tab === "notificaciones" && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "1fr 1fr 1fr" }, gap: 1.75 }}>
              <ConfigCard
                icon={<Bell size={18} />}
                titulo="Incidencias creadas"
                descripcion="Notifica cuando un empleado registra una nueva incidencia."
                control={switchControl("notificar_incidencias_creadas", "Incidencias creadas")}
              />
              <ConfigCard
                icon={<Bell size={18} />}
                titulo="Incidencias aprobadas"
                descripcion="Notifica cuando una incidencia es aprobada."
                control={switchControl("notificar_incidencias_aprobadas", "Incidencias aprobadas")}
              />
              <ConfigCard
                icon={<Bell size={18} />}
                titulo="Incidencias rechazadas"
                descripcion="Notifica cuando una incidencia es rechazada."
                control={switchControl("notificar_incidencias_rechazadas", "Incidencias rechazadas")}
              />
              <ConfigCard
                icon={<Bell size={18} />}
                titulo="Acumulación de tardanzas"
                descripcion="Notifica al alcanzar un número acumulado de tardanzas en el mes."
                control={switchControl("notificar_acumulacion_tardanzas", "Acumulación de tardanzas")}
              />
              <ConfigCard
                icon={<Bell size={18} />}
                titulo="Recordatorios de marcación"
                descripcion="Envía recordatorios a los empleados que aún no han marcado."
                control={switchControl("recordatorios_marcacion", "Recordatorios de marcación")}
              />
            </Box>
          )}

          {tab === "correo" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ flex: 1, minWidth: 260 }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario }}>
                    Envios de enlace de acceso
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: COLORES.textoTerciario, mt: 0.4, lineHeight: 1.5 }}>
                    Controla el envio del enlace para crear contrasena. Cuando caduca, puedes reenviarlo.
                  </Typography>
                  {!cargandoPendientes && (
                    <Typography sx={{ fontSize: 12, color: COLORES.primarioOscuro, fontWeight: 600, mt: 0.75 }}>
                      {pendientes.filter((p) => p.estado !== "aceptado").length === 0
                        ? "No hay empleados pendientes"
                        : `${pendientes.filter((p) => p.estado !== "aceptado").length} empleado(s) pendiente(s)`}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  <Button
                    variant="contained"
                    startIcon={<Mail size={16} />}
                    disabled={!pendientes.filter((p) => p.estado !== "aceptado").length || enviando}
                    onClick={enviarTodos}
                    sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, px: 2.5, height: 42, bgcolor: COLORES.primarioOscuro, "&:hover": { bgcolor: COLORES.primario } }}
                  >
                    {enviando ? "Enviando..." : "Enviar a todos"}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Mail size={16} />}
                    disabled={!seleccionados.length || enviando}
                    onClick={enviarSeleccionados}
                    sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, px: 2.5, height: 42, color: COLORES.primarioOscuro, borderColor: COLORES.grisContorno, "&:hover": { borderColor: COLORES.primarioOscuro, bgcolor: COLORES.fondoGris } }}
                  >
                    Enviar seleccionados ({seleccionados.length})
                  </Button>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {[
                  { id: "todos", label: "Todos" },
                  { id: "sin_enviar", label: "Sin enviar" },
                  { id: "enviado", label: "Enviados" },
                  { id: "expirado", label: "Expirados" },
                  { id: "aceptado", label: "Aceptados" },
                ].map((f) => (
                  <Chip
                    key={f.id}
                    label={f.label}
                    onClick={() => setFiltroCorreo(f.id)}
                    sx={{
                      fontSize: 12, fontWeight: 600, cursor: "pointer", borderRadius: "8px",
                      bgcolor: filtroCorreo === f.id ? COLORES.primarioOscuro : COLORES.fondoGris,
                      color: filtroCorreo === f.id ? "#fff" : COLORES.textoTerciario,
                      "&:hover": { bgcolor: filtroCorreo === f.id ? COLORES.primarioOscuro : COLORES.grisContorno },
                    }}
                  />
                ))}
              </Box>

              <Paper elevation={0} sx={{ borderRadius: "14px", border: `1px solid ${COLORES.grisContorno}`, overflow: "hidden", bgcolor: COLORES.fondoBlanco }}>
                {cargandoPendientes ? (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 6 }}>
                    <CircularProgress size={28} sx={{ color: COLORES.primarioOscuro }} />
                  </Box>
                ) : (
                  <Box sx={{ overflowX: "auto" }}>
                    <Table sx={{ minWidth: 760 }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: COLORES.fondoGris }}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              aria-label="Seleccionar todos"
                              indeterminate={seleccionados.length > 0 && seleccionados.length < pendientes.filter((p) => p.estado !== "aceptado").length}
                              checked={pendientes.length > 0 && seleccionados.length === pendientes.filter((p) => p.estado !== "aceptado").length}
                              onChange={alternarSeleccionTodos}
                              disabled={!pendientes.filter((p) => p.estado !== "aceptado").length || enviando}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: 12, color: COLORES.textoTerciario, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                            Nombre
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: 12, color: COLORES.textoTerciario, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                            Usuario
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: 12, color: COLORES.textoTerciario, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                            Email
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: 12, color: COLORES.textoTerciario, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                            Rol
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: 12, color: COLORES.textoTerciario, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                            Estado
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: 12, color: COLORES.textoTerciario, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                            Enviado el
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: 12, color: COLORES.textoTerciario, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                            Expira
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12, color: COLORES.textoTerciario, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                            Accion
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendientesVisibles.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} align="center" sx={{ py: 5, color: COLORES.textoTerciario, fontSize: 13 }}>
                              No hay empleados en este filtro
                            </TableCell>
                          </TableRow>
                        ) : (
                          pendientesVisibles.map((p) => {
                            const accionable = p.estado !== "aceptado";
                            return (
                              <TableRow key={p.id} hover selected={seleccionados.includes(p.id)}>
                                <TableCell padding="checkbox">
                                  {accionable && (
                                    <Checkbox
                                      aria-label={`Seleccionar ${p.nombre}`}
                                      checked={seleccionados.includes(p.id)}
                                      onChange={() => alternarSeleccion(p.id)}
                                      disabled={enviando}
                                    />
                                  )}
                                </TableCell>
                                <TableCell sx={{ fontSize: 13.5, fontWeight: 600, color: COLORES.textoPrimario }}>{p.nombre}</TableCell>
                                <TableCell sx={{ fontSize: 13, color: COLORES.textoTerciario }}>{p.username}</TableCell>
                                <TableCell sx={{ fontSize: 13, color: COLORES.textoTerciario }}>{p.email || "—"}</TableCell>
                                <TableCell sx={{ fontSize: 13, color: COLORES.textoTerciario }}>{p.rol || "—"}</TableCell>
                                <TableCell>
                                  <EstadoChip estado={p.estado} />
                                </TableCell>
                                <TableCell sx={{ fontSize: 12.5, color: COLORES.textoTerciario }}>{formatearFecha(p.ultimo_envio)}</TableCell>
                                <TableCell sx={{ fontSize: 12.5, color: COLORES.textoTerciario }}>{formatearFecha(p.expira)}</TableCell>
                                <TableCell align="right">
                                  {accionable && (
                                    <Button
                                      size="small"
                                      variant="text"
                                      startIcon={<Mail size={14} />}
                                      disabled={enviando}
                                      onClick={() => reenviarIndividual(p)}
                                      sx={{ fontSize: 12, fontWeight: 600, textTransform: "none", color: COLORES.primarioOscuro, "&:hover": { bgcolor: COLORES.primarioClaro } }}
                                    >
                                      {p.estado === "sin_enviar" ? "Enviar" : "Reenviar"}
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Paper>
            </Box>
          )}

          {tab === "general" && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "1fr 1fr 1fr" }, gap: 1.75 }}>
              {[
                { key: "empresa_nombre", label: "Nombre de la empresa" },
                { key: "empresa_nit", label: "NIT" },
                { key: "empresa_direccion", label: "Dirección" },
                { key: "empresa_telefono", label: "Teléfono" },
                { key: "empresa_email", label: "Correo institucional" },
                { key: "zona_horaria", label: "Zona horaria" },
              ].map(({ key, label }) => (
                <ConfigCard
                  key={key}
                  icon={<Settings size={18} />}
                  titulo={label}
                  descripcion="Información general de la institución."
                  control={
                    <TextField
                      aria-label={label}
                      value={form[key] || ""}
                      onChange={(e) => setVal(key, e.target.value)}
                      size="small"
                      sx={{ width: 170, "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13, bgcolor: COLORES.fondoGris, "& fieldset": { borderColor: COLORES.grisContorno }, "&.Mui-focused fieldset": { borderColor: COLORES.primarioOscuro } } }}
                    />
                  }
                />
              ))}
            </Box>
          )}
        </Box>

        {/* ACCIONES */}
        {tab !== "correo" && (
          <Box sx={{ px: 2.5, py: 2, borderTop: `1px solid ${COLORES.grisContorno}`, display: "flex", justifyContent: "flex-end", gap: 1.5, flexWrap: "wrap", bgcolor: COLORES.fondoBlanco }}>
            <Button
              startIcon={<RotateCcw size={16} />}
              onClick={restablecer}
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, px: 2.5, height: 42, color: COLORES.textoTerciario, borderColor: COLORES.grisContorno, "&:hover": { borderColor: COLORES.textoSuave, bgcolor: COLORES.fondoGris } }}
            >
              Restablecer valores predeterminados
            </Button>
            <Button
              variant="contained"
              startIcon={<Save size={16} />}
              onClick={guardar}
              disabled={guardando}
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, px: 3, height: 42, bgcolor: COLORES.primarioOscuro, "&:hover": { bgcolor: COLORES.primario } }}
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </Button>
          </Box>
        )}
      </Paper>

      {/* MODAL POLÍTICA DE CONTRASEÑAS */}
      <Dialog
        open={modalPolitica}
        onClose={() => setModalPolitica(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: { sx: { borderRadius: "18px", position: "relative", boxShadow: "0 24px 70px rgba(0,0,0,0.25)", backgroundColor: COLORES.fondoBlanco } },
        }}
        sx={{ "& .MuiBackdrop-root": { bgcolor: "rgba(17, 24, 39, 0.5)", backdropFilter: "blur(4px)" } }}
      >
        {/* HEADER */}
        <DialogTitle sx={{ px: 3, py: 1.75, position: "relative", pb: 1.25 }}>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Box sx={{
              width: 38, height: 38, borderRadius: "11px", bgcolor: PALETA.verdeClaro, color: PALETA.verdeOscuro,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Lock size={19} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: PALETA.texto, lineHeight: 1.2 }}>
                Política de contraseñas
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: PALETA.grisTexto, mt: 0.15 }}>
                Define los requisitos de seguridad para las contraseñas de los usuarios.
              </Typography>
            </Box>
          </Box>
          <IconButton aria-label="Cerrar" onClick={() => setModalPolitica(false)} size="small"
            sx={{ position: "absolute", top: 11, right: 11, color: PALETA.gris, bgcolor: PALETA.grisClaro, "&:hover": { color: PALETA.texto, bgcolor: PALETA.borde } }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <Divider />

        {/* CUERPO */}
        <DialogContent sx={{ px: 3, py: 1.75, bgcolor: COLORES.fondoBlanco }}>
          <Box sx={{ border: `1px solid ${PALETA.borde}`, borderRadius: "12px", bgcolor: COLORES.fondoBlanco, p: 2 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: PALETA.texto, mb: 1.25 }}>
              Requisitos de seguridad
            </Typography>

            {/* FILA 1 — Longitudes */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, mb: 1.25 }}>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: PALETA.grisTexto, mb: 0.5 }}>
                  Longitud mínima <span style={{ color: PALETA.rojo }}>*</span>
                </Typography>
                <TextField
                  aria-label="Longitud mínima"
                  type="number"
                  value={form.longitud_minima ?? ""}
                  onChange={(e) => setVal("longitud_minima", Number(e.target.value))}
                  fullWidth
                  slotProps={{ input: { endAdornment: <Typography sx={{ fontSize: 12, color: PALETA.gris, ml: 0.5 }}>caracteres</Typography> } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px", bgcolor: COLORES.fondoBlanco, minHeight: 40,
                      "& fieldset": { borderColor: PALETA.bordeInput },
                      "&:hover fieldset": { borderColor: PALETA.gris },
                      "&.Mui-focused fieldset": { borderColor: PALETA.verdeOscuro },
                      "&.Mui-focused": { boxShadow: "0 0 0 4px rgba(27, 94, 32, 0.10)" },
                    },
                    "& .MuiInputBase-input": { fontSize: 13 },
                  }}
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: PALETA.grisTexto, mb: 0.5 }}>
                  Longitud máxima <span style={{ color: PALETA.rojo }}>*</span>
                </Typography>
                <TextField
                  aria-label="Longitud máxima"
                  type="number"
                  value={form.longitud_maxima ?? ""}
                  onChange={(e) => setVal("longitud_maxima", Number(e.target.value))}
                  fullWidth
                  slotProps={{ input: { endAdornment: <Typography sx={{ fontSize: 12, color: PALETA.gris, ml: 0.5 }}>caracteres</Typography> } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px", bgcolor: COLORES.fondoBlanco, minHeight: 40,
                      "& fieldset": { borderColor: PALETA.bordeInput },
                      "&:hover fieldset": { borderColor: PALETA.gris },
                      "&.Mui-focused fieldset": { borderColor: PALETA.verdeOscuro },
                      "&.Mui-focused": { boxShadow: "0 0 0 4px rgba(27, 94, 32, 0.10)" },
                    },
                    "& .MuiInputBase-input": { fontSize: 13 },
                  }}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 1.25 }} />

            {/* CONTRASEÑAS COMPROMETIDAS */}
            <Box sx={{ mb: 1.25 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: PALETA.texto, mb: 0.75 }}>
                Contraseñas comprometidas
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.bloquear_contrasenas_comprometidas === true}
                    onChange={(e) => setVal("bloquear_contrasenas_comprometidas", e.target.checked)}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": { color: PALETA.verdeOscuro },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: PALETA.verde },
                    }}
                  />
                }
                label={<Typography sx={{ fontSize: 13, fontWeight: 500, color: PALETA.texto }}>Bloquear contraseñas comunes o comprometidas</Typography>}
                sx={{ mx: 0, alignItems: "center" }}
              />
              <Typography sx={{ fontSize: 11, color: PALETA.gris, mt: 0.25 }}>
                Impide utilizar contraseñas que hayan sido identificadas como comunes, débiles o comprometidas.
              </Typography>
            </Box>

            {/* CONTRASEÑAS */}
            <Box sx={{ mb: 1.25 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: PALETA.texto, mb: 0.75 }}>
                Contraseñas
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.permitir_espacios_contrasena === true}
                    onChange={(e) => setVal("permitir_espacios_contrasena", e.target.checked)}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": { color: PALETA.verdeOscuro },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: PALETA.verde },
                    }}
                  />
                }
                label={<Typography sx={{ fontSize: 13, fontWeight: 500, color: PALETA.texto }}>Permitir espacios en la contraseña</Typography>}
                sx={{ mx: 0, alignItems: "center" }}
              />
            </Box>

            {/* EXPIRACIÓN */}
            <Box sx={{ mb: 1.25 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: PALETA.texto, mb: 0.75 }}>
                Expiración
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.exigir_cambio_periodico === true}
                    onChange={(e) => setVal("exigir_cambio_periodico", e.target.checked)}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": { color: PALETA.verdeOscuro },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: PALETA.verde },
                    }}
                  />
                }
                label={<Typography sx={{ fontSize: 13, fontWeight: 500, color: PALETA.texto }}>Exigir cambio periódico de contraseña</Typography>}
                sx={{ mx: 0, alignItems: "center" }}
              />
            </Box>

            {/* NOTA */}
            <Box sx={{ p: 1.25, borderRadius: "10px", bgcolor: PALETA.verdeClaro, border: `1px solid ${PALETA.borde}` }}>
              <Typography sx={{ fontSize: 11, color: PALETA.verdeOscuro, lineHeight: 1.5 }}>
                La configuración toma como referencia las recomendaciones de NIST SP 800-63B-4 para fortalecer la seguridad de las credenciales.
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        {/* FOOTER */}
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5, gap: 1.5 }}>
          <Button
            onClick={() => setModalPolitica(false)}
            sx={{ borderRadius: "9px", textTransform: "none", fontSize: 12.5, fontWeight: 600, color: PALETA.grisTexto, bgcolor: COLORES.fondoBlanco, border: `1px solid ${PALETA.bordeInput}`, px: 3, py: 0.6, "&:hover": { bgcolor: PALETA.grisClaro } }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={<Save size={15} />}
            onClick={() => {
              setModalPolitica(false);
              setSnack({ type: "success", msg: "Política de contraseñas actualizada. Presiona Guardar cambios para aplicar." });
            }}
            sx={{ borderRadius: "9px", textTransform: "none", fontSize: 12.5, fontWeight: 600, px: 3.5, py: 0.6, bgcolor: PALETA.verdeOscuro, "&:hover": { bgcolor: PALETA.verde } }}
          >
            Guardar cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {snack ? <Alert severity={snack.type} sx={{ borderRadius: "10px" }}>{snack.msg}</Alert> : undefined}
      </Snackbar>
      <Snackbar open={!!snackCorreo} autoHideDuration={5000} onClose={() => setSnackCorreo(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {snackCorreo ? <Alert severity={snackCorreo.type} sx={{ borderRadius: "10px" }}>{snackCorreo.msg}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
}
