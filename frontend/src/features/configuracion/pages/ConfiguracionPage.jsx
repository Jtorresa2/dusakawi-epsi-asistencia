import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, FormControlLabel, Divider, IconButton, Snackbar, Alert,
} from "@mui/material";
import {
  Building2, Clock, MapPin, Bell, FileText, Shield, Settings, X, Save, CheckCircle2,
} from "lucide-react";
import Loading from "../../../shared/components/Loading";
import { obtenerConfig, actualizarConfig, respaldarBD } from "../config.api";
import { COLORES } from "../../../shared/constants/colores.js";

const CARD_DATA = [
  { id: "institucional", icon: <Building2 size={22} />, titulo: "Información institucional", desc: "Nombre de la empresa, NIT, dirección, teléfono y correo institucional.", color: COLORES.primarioOscuro },
  { id: "asistencia", icon: <Clock size={22} />, titulo: "Parámetros de asistencia", desc: "Tolerancia, horas extra, formato de hora y marcaciones fuera del horario.", color: COLORES.warning },
  { id: "acceso", icon: <MapPin size={22} />, titulo: "Control de acceso", desc: "Geocerca autorizada, radio permitido, validación GPS y reconocimiento biométrico.", color: COLORES.verdeTexto },
  { id: "notificaciones", icon: <Bell size={22} />, titulo: "Notificaciones", desc: "Correos automáticos, incidencias, aprobaciones, rechazos y tardanzas acumuladas.", color: COLORES.primario },
  { id: "plantillas", icon: <FileText size={22} />, titulo: "Plantillas PDF", desc: "Encabezado, pie de página, logo institucional y firma para documentos.", color: COLORES.primarioOscuro },
  { id: "seguridad", icon: <Shield size={22} />, titulo: "Seguridad", desc: "Contraseña, tiempo de sesión y autenticación del sistema.", color: COLORES.danger },
];

const SISTEMA_ITEMS = [
  { key: "version_sistema", label: "Versión del sistema", icon: "📦" },
  { key: "estado_servidor", label: "Estado del servidor", icon: "🟢" },
  { key: "fecha_ultimo_respaldo", label: "Última copia de seguridad", icon: "💾" },
  { key: "motor_bd", label: "Base de datos activa", icon: "🗄️" },
];

export default function ConfiguracionPage() {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [snack, setSnack] = useState(null);
  const [modalActivo, setModalActivo] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await obtenerConfig();
      setConfig(data);
    } catch { setSnack({ type: "error", msg: "Error al cargar configuración" }); }
    finally { setLoading(false); }
  };

  const abrirModal = (id) => {
    setFormData({ ...config });
    setModalActivo(id);
  };

  const handleChange = (clave, valor) => {
    setFormData((prev) => ({ ...prev, [clave]: valor }));
  };

  const guardarSeccion = async () => {
    setGuardando(true);
    try {
      const res = await actualizarConfig(formData);
      setConfig(res.config);
      setSnack({ type: "success", msg: "Configuración guardada" });
      setModalActivo(null);
    } catch { setSnack({ type: "error", msg: "Error al guardar" }); }
    finally { setGuardando(false); }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return "—"; }
  };

  if (loading) return <Loading texto="Cargando centro de configuración..." />;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* HEADER */}
        <Typography sx={{ fontSize: 13, color: COLORES.textoMuted }}>
              Inicio / Gestión del sistema / Incidencias
          </Typography>

      {/* CENTRO DE CONFIGURACIÓN — CARDS */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}` }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: COLORES.textoPrimario, mb: 2 }}></Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
          {CARD_DATA.map((r) => (
            <Paper key={r.id} elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", flexDirection: "column", transition: "all .25s ease", "&:hover": { transform: "translateY(-3px)", boxShadow: "0 8px 25px rgba(0,0,0,.07)" } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: "12px", background: `${r.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: r.color }}>{r.icon}</Box>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario }}>{r.titulo}</Typography>
              </Box>
              <Typography sx={{ fontSize: 12, color: COLORES.textoTerciario, mb: 2, lineHeight: 1.5, flex: 1, minHeight: 36 }}>{r.desc}</Typography>
              <Button variant="contained" onClick={() => abrirModal(r.id)} sx={{ borderRadius: "10px", textTransform: "none", fontSize: 12, fontWeight: 600, py: 1, background: r.color, "&:hover": { background: COLORES.primarioOscuro } }}>
                {r.id === "plantillas" ? "Personalizar" : r.id === "asistencia" ? "Configurar" : "Administrar"}
              </Button>
            </Paper>
          ))}
        </Box>
      </Paper>

      {/* ESTADO DEL SISTEMA */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}` }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario, mb: 1.5 }}>Estado del sistema</Typography>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          {SISTEMA_ITEMS.map((item) => {
            const valor = config[item.key];
            const esServidor = item.key === "estado_servidor";
            const display = esServidor ? (valor || "Activo") : (valor || "—");
            return (
              <Box key={item.key} sx={{ flex: "1 1 160px", minWidth: 140, p: 1.5, borderRadius: "14px", border: `1px solid ${COLORES.grisContorno}`, background: COLORES.fondoBlanco, display: "flex", alignItems: "center", gap: 1.5, "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,.06)" } }}>
                <Box sx={{ width: 36, height: 36, borderRadius: "10px", background: COLORES.successClaro, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{item.icon}</Box>
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ fontSize: 10, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase", letterSpacing: "0.03em", mb: 0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {esServidor && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: COLORES.success, flexShrink: 0 }} />}
                    <Box sx={{ fontSize: 13, fontWeight: 600, color: COLORES.textoPrimario }}>{display}</Box>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* SNACKBAR */}
      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {snack ? <Alert severity={snack.type} sx={{ borderRadius: "10px" }}>{snack.msg}</Alert> : undefined}
      </Snackbar>

      {/* ============ MODALES ============ */}

      {/* MODAL INFORMACIÓN INSTITUCIONAL */}
      <Dialog open={modalActivo === "institucional"} onClose={() => setModalActivo(null)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: "16px", p: 1, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" } } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", background: COLORES.primarioOscuro + "15", display: "flex", alignItems: "center", justifyContent: "center", color: COLORES.primarioOscuro }}><Building2 size={18} /></Box>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: COLORES.textoPrimario }}>Información institucional</Typography>
          <IconButton aria-label="Cerrar" onClick={() => setModalActivo(null)} sx={{ ml: "auto", color: COLORES.textoSuave }}><X size={20} /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Nombre de la empresa" value={formData.empresa_nombre || ""} onChange={(e) => handleChange("empresa_nombre", e.target.value)} fullWidth slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
          <TextField label="NIT" value={formData.empresa_nit || ""} onChange={(e) => handleChange("empresa_nit", e.target.value)} fullWidth slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
          <TextField label="Dirección" value={formData.empresa_direccion || ""} onChange={(e) => handleChange("empresa_direccion", e.target.value)} fullWidth slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
          <TextField label="Teléfono" value={formData.empresa_telefono || ""} onChange={(e) => handleChange("empresa_telefono", e.target.value)} fullWidth slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
          <TextField label="Correo institucional" value={formData.empresa_email || ""} onChange={(e) => handleChange("empresa_email", e.target.value)} fullWidth slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
          <TextField label="Zona horaria" value={formData.zona_horaria || ""} onChange={(e) => handleChange("zona_horaria", e.target.value)} fullWidth slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModalActivo(null)} sx={{ borderRadius: "10px", textTransform: "none", color: COLORES.textoTerciario }}>Cancelar</Button>
          <Button variant="contained" startIcon={<Save size={16} />} onClick={guardarSeccion} disabled={guardando} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, bgcolor: COLORES.primarioOscuro, "&:hover": { bgcolor: COLORES.primario } }}>{guardando ? "Guardando..." : "Guardar cambios"}</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL PARÁMETROS DE ASISTENCIA */}
      <Dialog open={modalActivo === "asistencia"} onClose={() => setModalActivo(null)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: "16px", p: 1, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" } } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", background: COLORES.warning + "15", display: "flex", alignItems: "center", justifyContent: "center", color: COLORES.warning }}><Clock size={18} /></Box>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: COLORES.textoPrimario }}>Parámetros de asistencia</Typography>
          <IconButton aria-label="Cerrar" onClick={() => setModalActivo(null)} sx={{ ml: "auto", color: COLORES.textoSuave }}><X size={20} /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Tolerancia para tardanzas (min)" type="number" value={formData.tolerancia_default ?? ""} onChange={(e) => handleChange("tolerancia_default", Number(e.target.value))} fullWidth slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
          <TextField label="Tiempo mínimo para horas extra (min)" type="number" value={formData.tiempo_minimo_extra ?? ""} onChange={(e) => handleChange("tiempo_minimo_extra", Number(e.target.value))} fullWidth slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
          <TextField label="Formato de hora" value={formData.formato_hora || "24h"} onChange={(e) => handleChange("formato_hora", e.target.value)} fullWidth slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} helperText="12h o 24h" />
          <FormControlLabel control={<Switch checked={formData.permitir_marcacion_antes === true} onChange={(e) => handleChange("permitir_marcacion_antes", e.target.checked)} />} label={<Typography sx={{ fontSize: 13, fontWeight: 500 }}>Permitir marcación antes del horario</Typography>} sx={{ mx: 0 }} />
          <FormControlLabel control={<Switch checked={formData.permitir_marcacion_despues === true} onChange={(e) => handleChange("permitir_marcacion_despues", e.target.checked)} />} label={<Typography sx={{ fontSize: 13, fontWeight: 500 }}>Permitir marcación después del horario</Typography>} sx={{ mx: 0 }} />
          <FormControlLabel control={<Switch checked={formData.validacion_salida_obligatoria === true} onChange={(e) => handleChange("validacion_salida_obligatoria", e.target.checked)} />} label={<Typography sx={{ fontSize: 13, fontWeight: 500 }}>Validación obligatoria de salida</Typography>} sx={{ mx: 0 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModalActivo(null)} sx={{ borderRadius: "10px", textTransform: "none", color: COLORES.textoTerciario }}>Cancelar</Button>
          <Button variant="contained" startIcon={<Save size={16} />} onClick={guardarSeccion} disabled={guardando} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, bgcolor: COLORES.primario, "&:hover": { bgcolor: COLORES.primarioOscuro } }}>{guardando ? "Guardando..." : "Guardar cambios"}</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL CONTROL DE ACCESO */}
      <Dialog open={modalActivo === "acceso"} onClose={() => setModalActivo(null)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: "16px", p: 1, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" } } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", background: COLORES.verdeTexto + "15", display: "flex", alignItems: "center", justifyContent: "center", color: COLORES.verdeTexto }}><MapPin size={18} /></Box>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: COLORES.textoPrimario }}>Control de acceso</Typography>
          <IconButton aria-label="Cerrar" onClick={() => setModalActivo(null)} sx={{ ml: "auto", color: COLORES.textoSuave }}><X size={20} /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ p: 2, borderRadius: "12px", bgcolor: COLORES.fondoGris, border: `1px solid ${COLORES.grisContorno}`, mb: 1 }}>
            <Typography sx={{ fontSize: 12, color: COLORES.primarioOscuro, fontWeight: 600 }}>
              Las marcaciones únicamente pueden realizarse dentro de las instalaciones autorizadas de la empresa.
            </Typography>
          </Box>
          <TextField label="Ubicación autorizada" value={formData.ubicacion_autorizada || ""} onChange={(e) => handleChange("ubicacion_autorizada", e.target.value)} fullWidth slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
          <TextField label="Radio permitido de la geocerca (m)" type="number" value={formData.radio_geocerca ?? ""} onChange={(e) => handleChange("radio_geocerca", Number(e.target.value))} fullWidth slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
          <TextField label="Método de validación" value={formData.metodo_validacion || "gps"} onChange={(e) => handleChange("metodo_validacion", e.target.value)} fullWidth slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} helperText="gps / biometrico" />
          <FormControlLabel control={<Switch checked={formData.estado_control_acceso === true} onChange={(e) => handleChange("estado_control_acceso", e.target.checked)} />} label={<Typography sx={{ fontSize: 13, fontWeight: 500 }}>Control de acceso activo</Typography>} sx={{ mx: 0 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModalActivo(null)} sx={{ borderRadius: "10px", textTransform: "none", color: COLORES.textoTerciario }}>Cancelar</Button>
          <Button variant="contained" startIcon={<Save size={16} />} onClick={guardarSeccion} disabled={guardando} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, bgcolor: COLORES.verdeTexto, "&:hover": { bgcolor: COLORES.verdeTexto } }}>{guardando ? "Guardando..." : "Guardar cambios"}</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL NOTIFICACIONES */}
      <Dialog open={modalActivo === "notificaciones"} onClose={() => setModalActivo(null)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: "16px", p: 1, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" } } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", background: COLORES.primario + "15", display: "flex", alignItems: "center", justifyContent: "center", color: COLORES.primario }}><Bell size={18} /></Box>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: COLORES.textoPrimario }}>Notificaciones</Typography>
          <IconButton aria-label="Cerrar" onClick={() => setModalActivo(null)} sx={{ ml: "auto", color: COLORES.textoSuave }}><X size={20} /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 1 }}>
          <FormControlLabel control={<Switch checked={formData.notificar_incidencias_creadas === true} onChange={(e) => handleChange("notificar_incidencias_creadas", e.target.checked)} />} label={<Typography sx={{ fontSize: 13, fontWeight: 500 }}>Notificar incidencias creadas</Typography>} sx={{ mx: 0 }} />
          <FormControlLabel control={<Switch checked={formData.notificar_incidencias_aprobadas === true} onChange={(e) => handleChange("notificar_incidencias_aprobadas", e.target.checked)} />} label={<Typography sx={{ fontSize: 13, fontWeight: 500 }}>Notificar incidencias aprobadas</Typography>} sx={{ mx: 0 }} />
          <FormControlLabel control={<Switch checked={formData.notificar_incidencias_rechazadas === true} onChange={(e) => handleChange("notificar_incidencias_rechazadas", e.target.checked)} />} label={<Typography sx={{ fontSize: 13, fontWeight: 500 }}>Notificar incidencias rechazadas</Typography>} sx={{ mx: 0 }} />
          <FormControlLabel control={<Switch checked={formData.notificar_acumulacion_tardanzas === true} onChange={(e) => handleChange("notificar_acumulacion_tardanzas", e.target.checked)} />} label={<Typography sx={{ fontSize: 13, fontWeight: 500 }}>Notificar acumulación de tardanzas</Typography>} sx={{ mx: 0 }} />
          <FormControlLabel control={<Switch checked={formData.recordatorios_marcacion === true} onChange={(e) => handleChange("recordatorios_marcacion", e.target.checked)} />} label={<Typography sx={{ fontSize: 13, fontWeight: 500 }}>Recordatorios de marcación</Typography>} sx={{ mx: 0 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModalActivo(null)} sx={{ borderRadius: "10px", textTransform: "none", color: COLORES.textoTerciario }}>Cancelar</Button>
          <Button variant="contained" startIcon={<Save size={16} />} onClick={guardarSeccion} disabled={guardando} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, bgcolor: COLORES.primario, "&:hover": { bgcolor: COLORES.primarioOscuro } }}>{guardando ? "Guardando..." : "Guardar cambios"}</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL PLANTILLAS PDF */}
      <Dialog open={modalActivo === "plantillas"} onClose={() => setModalActivo(null)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: "16px", p: 1, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" } } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", background: COLORES.primarioOscuro + "15", display: "flex", alignItems: "center", justifyContent: "center", color: COLORES.primarioOscuro }}><FileText size={18} /></Box>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: COLORES.textoPrimario }}>Plantillas PDF</Typography>
          <IconButton aria-label="Cerrar" onClick={() => setModalActivo(null)} sx={{ ml: "auto", color: COLORES.textoSuave }}><X size={20} /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Encabezado del documento" value={formData.encabezado_documento || ""} onChange={(e) => handleChange("encabezado_documento", e.target.value)} fullWidth multiline rows={2} slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
          <TextField label="Pie de página" value={formData.pie_pagina || ""} onChange={(e) => handleChange("pie_pagina", e.target.value)} fullWidth multiline rows={2} slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
          <TextField label="Color institucional (hex)" value={formData.color_institucional || COLORES.primarioOscuro} onChange={(e) => handleChange("color_institucional", e.target.value)} fullWidth slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} helperText={`Ej: ${COLORES.primarioOscuro}`} />
          <Typography sx={{ fontSize: 13, color: COLORES.textoTerciario, fontStyle: "italic" }}>La personalización del logo y la firma estará disponible próximamente.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModalActivo(null)} sx={{ borderRadius: "10px", textTransform: "none", color: COLORES.textoTerciario }}>Cancelar</Button>
          <Button variant="contained" startIcon={<Save size={16} />} onClick={guardarSeccion} disabled={guardando} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, bgcolor: COLORES.primarioOscuro, "&:hover": { bgcolor: COLORES.primarioOscuro } }}>{guardando ? "Guardando..." : "Guardar cambios"}</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL SEGURIDAD */}
      <Dialog open={modalActivo === "seguridad"} onClose={() => setModalActivo(null)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: "16px", p: 1, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" } } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", background: COLORES.danger + "15", display: "flex", alignItems: "center", justifyContent: "center", color: COLORES.danger }}><Shield size={18} /></Box>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: COLORES.textoPrimario }}>Seguridad</Typography>
          <IconButton aria-label="Cerrar" onClick={() => setModalActivo(null)} sx={{ ml: "auto", color: COLORES.textoSuave }}><X size={20} /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Tiempo de expiración de sesión (min)" type="number" value={formData.tiempo_expiracion_sesion ?? ""} onChange={(e) => handleChange("tiempo_expiracion_sesion", Number(e.target.value))} fullWidth slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
          <TextField label="Política de contraseñas" value={formData.politica_contrasenas || ""} onChange={(e) => handleChange("politica_contrasenas", e.target.value)} fullWidth multiline rows={2} slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
          <FormControlLabel control={<Switch checked={formData.autenticacion_dos_pasos === true} onChange={(e) => handleChange("autenticacion_dos_pasos", e.target.checked)} />} label={<Typography sx={{ fontSize: 13, fontWeight: 500 }}>Autenticación en dos pasos</Typography>} sx={{ mx: 0 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModalActivo(null)} sx={{ borderRadius: "10px", textTransform: "none", color: COLORES.textoTerciario }}>Cancelar</Button>
          <Button variant="contained" startIcon={<Save size={16} />} onClick={guardarSeccion} disabled={guardando} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, bgcolor: COLORES.danger, "&:hover": { bgcolor: COLORES.dangerOscuro2 } }}>{guardando ? "Guardando..." : "Guardar cambios"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
