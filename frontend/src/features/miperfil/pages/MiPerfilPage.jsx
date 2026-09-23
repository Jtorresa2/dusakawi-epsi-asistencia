import { useState, useEffect } from "react";
import { Box, Paper, Typography, Avatar, Chip, TextField, IconButton, Snackbar, Alert } from "@mui/material";
import {
  User, Mail, Phone, Calendar, FileText, Briefcase, MapPin, Shield, Fingerprint, Lock, CheckCircle, XCircle, Edit3, Save, X, Camera,
} from "lucide-react";
import { obtenerPersonalPorId, actualizarPersonal } from "../../personal/personal.api";
import { obtenerCargos } from "../../cargos/cargo.api";
import { obtenerAreas } from "../../areas/area.api";
import MisNovedades from "../components/MisNovedades";
import { onlyDigits } from "../../../shared/validators";
import { COLORES } from "../../../shared/constants/colores.js";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

const GESTOR_ROLES = ["admin", "talento_humano"];
function isGestor(u) { return GESTOR_ROLES.includes(u?.rol); }

/* ── Datos estáticos del panel de gestión ─────────────────── */
const ADMIN_PERSONAL = [
  { key: "nombre", label: "Nombre(s)", icon: <User size={16} />, value: "ADMINISTRADOR DEL SISTEMA" },
];
const ADMIN_LABORAL = [
  { key: "cargo", label: "Cargo", icon: <Shield size={16} />, value: "ADMINISTRADOR DE SISTEMA Y SEGURIDAD" },
  { key: "area", label: "Área", icon: <Shield size={16} />, value: "SISTEMAS" },
];
const ADMIN_SEGURIDAD = [
  { label: "BIOMÉTRICO (RELOJ)", sub: "EXENTO DE FICHADO", icon: <Fingerprint size={14} />, color: COLORES.textoSuave, bg: COLORES.fondoGris },
  { label: "Último acceso", sub: "Hoy 11:21 a. m.", icon: <Shield size={14} />, color: COLORES.verdeTexto, bg: COLORES.successFondo },
];
const ADMIN_PERMISOS = [
  { label: "ROL ASIGNADO", value: "SUPER ADMINISTRADOR", icon: <CheckCircle size={18} />, color: COLORES.verdeTexto, bg: COLORES.successFondo },
  { label: "ACCESO TOTAL", value: "CONFIGURACIÓN Y AUDITORÍA", icon: <Lock size={18} />, color: COLORES.primarioOscuro, bg: COLORES.primarioClaro },
];
const ADMIN_ACTIVIDAD = [
  { text: 'Creación de nuevo Empleado (ID 1450): Confirmado', when: "Hace 5 min." },
  { text: 'Cambio de Rol: Usuario "aperez" a Talento Humano', when: "Hace 1 hr." },
  { text: "Configuración Global Actualizada: Tolerancia de Turnos", when: "Hace 2 hrs." },
  { text: "Descarga de Copia de Seguridad: Exitosa", when: "Ayer 11:50 a. m." },
];

/* ── Helpers ──────────────────────────────────────────────── */
function renderStaticField(field) {
  return (
    <Box key={field.key} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, borderBottom: `1px solid ${COLORES.fondoGris2}` }}>
      <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: COLORES.fondoGris, display: "flex", alignItems: "center", justifyContent: "center", color: COLORES.textoSuave, flexShrink: 0 }}>{field.icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 10, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase", mb: 0.2 }}>{field.label}</Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: COLORES.textoPrimario, wordBreak: "break-word" }}>{field.value}</Typography>
      </Box>
    </Box>
  );
}

function renderInfoCard({ title, children }) {
  return (
    <Paper elevation={0} sx={{ p: 1.5, borderRadius: "14px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
      <Typography sx={{ fontSize: 10, fontWeight: 600, color: COLORES.textoTerciario, textTransform: "uppercase", mb: 1 }}>{title}</Typography>
      {children}
    </Paper>
  );
}

/* ── Panel de gestión (admin / talento humano) ────────────── */
function AdminPanel({ usuario }) {
  const initials = (usuario.nombre || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const rolNombre = usuario?.rol === "admin" ? "Administrador" : usuario?.rol === "talento_humano" ? "Talento Humano" : "Administrador";
  return (
    <Box sx={{ height: { md: "100dvh" }, overflowX: "hidden", overflowY: { xs: "auto", md: "hidden" }, p: { xs: 2, md: 2 }, display: "flex", flexDirection: "column", gap: 2, maxWidth: "100%", width: "100%", boxSizing: "border-box" }}>
      <Typography sx={{ fontSize: 13, color: COLORES.textoMuted, flexShrink: 0 }}>Inicio / Mi cuenta / Mi perfil</Typography>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 0, borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap", flexShrink: 0 }}>
        <Box sx={{ position: "relative" }}>
          <Avatar sx={{ width: 72, height: 72, bgcolor: COLORES.primarioClaro, color: COLORES.primarioOscuro, fontSize: 26, fontWeight: 700 }}>{initials}</Avatar>
        </Box>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: COLORES.textoPrimario }}>ADMINISTRADOR DEL SISTEMA</Typography>
          <Typography sx={{ fontSize: 14, color: COLORES.textoTerciario, mt: 0.3 }}>ADMINISTRADOR DE SISTEMA Y SEGURIDAD · SISTEMAS</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Chip label="Activo" size="small" sx={{ fontWeight: 600, borderRadius: "8px", bgcolor: COLORES.successFondo, color: COLORES.verdeTexto, fontSize: 12 }} />
          <Chip label={rolNombre} size="small" sx={{ fontWeight: 600, borderRadius: "8px", bgcolor: COLORES.primarioClaro, color: COLORES.primarioOscuro, fontSize: 12 }} />
        </Box>
      </Paper>
      {/* Grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 0.95fr" }, gap: 3, alignItems: "stretch", overflow: "hidden", minHeight: 0, flex: 1, width: "100%" }}>
        {/* Izquierda — Datos personales */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}`, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORES.textoTerciario, textTransform: "uppercase" }}>Datos personales</Typography>
          </Box>
          {ADMIN_PERSONAL.map((f) => renderStaticField(f))}
        </Paper>
        {/* Derecha — 2×2 */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gridTemplateRows: { xs: "auto", md: "1fr 1fr" }, gap: 2, overflow: "hidden", minHeight: 0 }}>
          {renderInfoCard({ title: "Información laboral", children: ADMIN_LABORAL.map((f) => renderStaticField(f)) })}
          {renderInfoCard({ title: "PERMISOS Y NIVELES", children: (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {ADMIN_PERMISOS.map((item, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: "8px", bgcolor: COLORES.fondoGris }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: item.bg, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, flexShrink: 0 }}>{item.icon}</Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 9, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase" }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORES.textoPrimario, lineHeight: 1.2 }}>{i === 0 ? rolNombre : item.value}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )})}
          {renderInfoCard({ title: "Dispositivos y seguridad", children: (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {ADMIN_SEGURIDAD.map((item, i) => (
                <Paper key={i} elevation={0} sx={{ p: 1, borderRadius: "8px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: item.bg, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, flexShrink: 0 }}>{item.icon}</Box>
                  <Box>
                    <Typography sx={{ fontSize: 9, fontWeight: 600, color: COLORES.textoSuave }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: item.color, mt: 0.1 }}>{item.sub}</Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          )})}
          {/* Actividad de sistema */}
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: "14px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 600, color: COLORES.textoTerciario, textTransform: "uppercase", mb: 1 }}>ACTIVIDAD DE SISTEMA RECIENTE</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, flex: 1 }}>
              {ADMIN_ACTIVIDAD.map((item, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1, p: 1, borderRadius: "8px", bgcolor: COLORES.fondoGris }}>
                  <Box sx={{ width: 26, height: 26, borderRadius: "7px", bgcolor: COLORES.primarioClaro, display: "flex", alignItems: "center", justifyContent: "center", color: COLORES.primarioOscuro, flexShrink: 0 }}><Shield size={14} /></Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORES.textoPrimario, lineHeight: 1.3 }}>{item.text}</Typography>
                    <Typography sx={{ fontSize: 10, color: COLORES.textoTerciario, mt: 0.1 }}>{item.when}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            <Box sx={{ mt: 1 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORES.primarioOscuro, cursor: "pointer", textAlign: "right" }}>Ver historial completo de auditoría</Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
      <Snackbar open={false} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}><Alert severity="success" variant="filled" sx={{ borderRadius: "10px" }} /></Snackbar>
    </Box>
  );
}

/* ── Pantalla principal ───────────────────────────────────── */
export default function MiPerfilPage() {
  const [usuario, setUsuario] = useState(JSON.parse(localStorage.getItem("usuario") || "{}"));
  const userId = usuario.id || usuario.empleado_id;
  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [snack, setSnack] = useState({ open: false, severity: "success", mensaje: "" });
  const [cargosList, setCargosList] = useState([]);
  const [areasList, setAreasList] = useState([]);

  const gestor = isGestor(usuario);

  useEffect(() => {
    const fetchEmpleado = async () => {
      try {
        if (!gestor && userId) {
          const data = await obtenerPersonalPorId(userId);
          setEmpleado(data);
        }
      } catch {}
      setLoading(false);
    };
    fetchEmpleado();
    if (!gestor) {
      obtenerCargos().then((d) => setCargosList(Array.isArray(d) ? d : d?.cargos || [])).catch(() => {});
      obtenerAreas().then((d) => setAreasList(Array.isArray(d) ? d : d?.areas || [])).catch(() => {});
    }
  }, [gestor, userId]);

  const data = empleado || usuario;
  const initials = (usuario.nombre || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const personalFields = [
    { key: "nombre", label: "Nombre(s) ", icon: <User size={16} /> },
    { key: "apellido", label: "Apellidos", icon: <User size={16} /> },
    { key: "correo", label: "Correo electrónico", icon: <Mail size={16} /> },
    { key: "telefono", label: "Teléfono", icon: <Phone size={16} /> },
    { key: "cedula", label: "Cédula", icon: <FileText size={16} /> },
    { key: "fecha_nacimiento", label: "Fecha de nacimiento", icon: <Calendar size={16} />, type: "date" },
  ];
  const workFields = [
    { key: "cargo_id", label: "Cargo", icon: <Briefcase size={16} />, options: cargosList, optionLabel: "nombre", display: data?.cargo || "—" },
    { key: "area_id", label: "Área", icon: <MapPin size={16} />, options: areasList, optionLabel: "nombre", display: data?.area || "—" },
  ];
  const statsCards = [
    { title: "Puntualidad", value: `${data?.puntualidad ?? 96}%`, sub: "Promedio general", icon: <CheckCircle size={22} />, color: COLORES.verdeTexto, bg: COLORES.successFondo },
    { title: "Incidencias", value: String(data?.incidencias ?? 0), sub: "En el último mes", icon: <XCircle size={22} />, color: COLORES.danger, bg: COLORES.dangerFondo },
  ];

  const handleEdit = (section) => {
    setEditando(section);
    if (section === "personal") { const obj = {}; personalFields.forEach((f) => { obj[f.key] = data[f.key] || ""; }); setForm(obj); }
    else { const obj = {}; workFields.forEach((f) => { obj[f.key] = data[f.key] ?? ""; }); setForm(obj); }
  };
  const handleCancel = () => { setEditando(null); setForm({}); };

  const handleFotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoFoto(true);
    try {
      const formData = new FormData(); formData.append("foto", file);
      const res = await fetch(`/api/empleados/${userId}/foto`, { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, body: formData });
      if (!res.ok) return;
      const d = await res.json();
      if (d.foto_url) { const updated = await obtenerPersonalPorId(userId); setEmpleado(updated); const u = { ...usuario, foto_url: d.foto_url }; localStorage.setItem("usuario", JSON.stringify(u)); setUsuario(u); }
    } catch {}
    setSubiendoFoto(false);
  };

  const handleSave = async () => {
    setGuardando(true);
    try {
      await actualizarPersonal(userId, form);
      const updated = await obtenerPersonalPorId(userId); setEmpleado(updated);
      const u = { ...usuario, ...form }; localStorage.setItem("usuario", JSON.stringify(u)); setUsuario(u);
      setEditando(null);
      setSnack({ open: true, severity: "success", mensaje: "Perfil actualizado correctamente" });
    } catch {}
    setGuardando(false);
  };

  const renderField = (field, value, section) => {
    const isEditing = editando === section;
    const isSelect = field.options?.length > 0;
    return (
      <Box key={field.key} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, borderBottom: `1px solid ${COLORES.fondoGris2}` }}>
        <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: COLORES.fondoGris, display: "flex", alignItems: "center", justifyContent: "center", color: COLORES.textoSuave, flexShrink: 0 }}>{field.icon}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase", mb: 0.2 }}>{field.label}</Typography>
          {isEditing ? (
            isSelect ? (
              <TextField select fullWidth size="small" value={form[field.key] ?? ""} onChange={(e) => setForm({ ...form, [field.key]: e.target.value === "" ? null : e.target.value })} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}>
                <MenuItem value=""><em>Sin {field.label.toLowerCase()}</em></MenuItem>
                {field.options.map((opt) => <MenuItem key={opt.id} value={opt.id}>{opt[field.optionLabel]}</MenuItem>)}
              </TextField>
            ) : (
              <TextField fullWidth size="small" type={field.type || "text"} value={form[field.key] || ""} onChange={(e) => setForm({ ...form, [field.key]: ["cedula", "telefono"].includes(field.key) ? onlyDigits(e.target.value) : e.target.value })} slotProps={{ htmlInput: ["cedula", "telefono"].includes(field.key) ? { inputMode: "numeric", maxLength: 15 } : undefined }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }} />
            )
          ) : (
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: COLORES.textoPrimario, wordBreak: "break-word" }}>{field.type === "date" && value ? formatDate(value) : (field.display || value || "—")}</Typography>
          )}
        </Box>
      </Box>
    );
  };

  /* ── Render condicional ─────────────────────────────────── */
  if (gestor) return <AdminPanel usuario={usuario} />;

  return (
    <Box sx={{ height: { md: editando ? "auto" : "100dvh" }, overflowX: "hidden", overflowY: { xs: "auto", md: editando ? "auto" : "hidden" }, p: { xs: 2, md: 2 }, display: "flex", flexDirection: "column", gap: 2, maxWidth: "100%", width: "100%", boxSizing: "border-box" }}>
      <Typography sx={{ fontSize: 13, color: COLORES.textoMuted, flexShrink: 0 }}>Inicio / Mi cuenta / Mi perfil</Typography>
      <Paper elevation={0} sx={{ p: 0, borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap", flexShrink: 0 }}>
        <Box sx={{ position: "relative", "&:hover .foto-overlay": { opacity: 1 } }}>
          <Avatar src={usuario.foto_url || empleado?.foto_url || ""} sx={{ width: 72, height: 72, bgcolor: COLORES.primarioClaro, color: COLORES.primarioOscuro, fontSize: 26, fontWeight: 700, cursor: "pointer" }}>{initials}</Avatar>
          <Box className="foto-overlay" onClick={() => document.getElementById("foto-input")?.click()} sx={{ position: "absolute", inset: 0, borderRadius: "50%", bgcolor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: COLORES.fondoBlanco, opacity: 0, transition: "opacity 0.2s", cursor: "pointer" }}>
            {subiendoFoto ? <Typography sx={{ fontSize: 10, fontWeight: 600 }}>...</Typography> : <Camera size={20} />}
          </Box>
          <input id="foto-input" type="file" hidden accept="image/*" onChange={handleFotoChange} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: COLORES.textoPrimario }}>{usuario.nombre || "Usuario"}</Typography>
          <Typography sx={{ fontSize: 14, color: COLORES.textoTerciario, mt: 0.3 }}>{(data?.cargo || "—")} · {(data?.area || "—")}</Typography>
          <Typography sx={{ fontSize: 13, color: COLORES.textoSuave, mt: 0.3 }}>{usuario.email || ""}</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Chip label={data?.estado === "inactivo" ? "Inactivo" : "Activo"} size="small" sx={{ fontWeight: 600, borderRadius: "8px", bgcolor: data?.estado === "inactivo" ? COLORES.dangerFondo : COLORES.primarioClaro, color: data?.estado === "inactivo" ? COLORES.danger : COLORES.primario, fontSize: 12 }} />
          <Chip label={usuario.rol?.replace("_", " ") || "—"} size="small" sx={{ fontWeight: 600, borderRadius: "8px", bgcolor: COLORES.primarioClaro, color: COLORES.primarioOscuro, fontSize: 12, textTransform: "capitalize" }} />
        </Box>
      </Paper>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 0.95fr" }, gap: 3, alignItems: "stretch", overflow: "hidden", minHeight: 0, flex: 1, width: "100%" }}>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}`, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORES.textoTerciario, textTransform: "uppercase" }}>Datos personales</Typography>
            {editando === "personal" ? (
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <IconButton aria-label="Guardar cambios" size="small" onClick={handleSave} disabled={guardando} sx={{ bgcolor: COLORES.primarioClaro, color: COLORES.primario, borderRadius: "8px", width: 28, height: 28, "&:hover": { bgcolor: COLORES.primarioClaro2 } }}><Save size={15} /></IconButton>
                <IconButton aria-label="Cancelar edición" size="small" onClick={handleCancel} sx={{ bgcolor: COLORES.dangerFondo, color: COLORES.danger, borderRadius: "8px", width: 28, height: 28, "&:hover": { bgcolor: COLORES.dangerBorde } }}><X size={15} /></IconButton>
              </Box>
            ) : (
              <Box onClick={() => handleEdit("personal")} title="Editar" sx={{ width: 34, height: 34, borderRadius: "9px", border: "none", bgcolor: COLORES.primarioClaro, color: COLORES.primario, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", flexShrink: 0, "&:hover": { bgcolor: COLORES.primarioClaro2 } }}><Edit3 size={15} /></Box>
            )}
          </Box>
          {personalFields.map((f) => renderField(f, data[f.key], "personal"))}
        </Paper>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gridTemplateRows: { xs: "auto", md: "1fr 1fr" }, gap: 2, overflow: "hidden", minHeight: 0 }}>
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: "14px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography sx={{ fontSize: 10, fontWeight: 600, color: COLORES.textoTerciario, textTransform: "uppercase" }}>Información laboral</Typography>
              {editando === "laboral" ? (
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <IconButton aria-label="Guardar cambios" size="small" onClick={handleSave} disabled={guardando} sx={{ bgcolor: COLORES.primarioClaro, color: COLORES.primario, borderRadius: "8px", width: 24, height: 24, "&:hover": { bgcolor: COLORES.primarioClaro2 } }}><Save size={12} /></IconButton>
                  <IconButton aria-label="Cancelar edición" size="small" onClick={handleCancel} sx={{ bgcolor: COLORES.dangerFondo, color: COLORES.danger, borderRadius: "8px", width: 24, height: 24, "&:hover": { bgcolor: COLORES.dangerBorde } }}><X size={12} /></IconButton>
                </Box>
              ) : (
                <Box onClick={() => handleEdit("laboral")} title="Editar" sx={{ width: 26, height: 26, borderRadius: "7px", border: "none", bgcolor: COLORES.primarioClaro, color: COLORES.primario, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", flexShrink: 0, "&:hover": { bgcolor: COLORES.primarioClaro2 } }}><Edit3 size={12} /></Box>
              )}
            </Box>
            {workFields.map((f) => renderField(f, data[f.key], "laboral"))}
          </Paper>
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: "14px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", flexDirection: "column", gap: 1, overflow: "hidden", minHeight: 0 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 600, color: COLORES.textoTerciario, textTransform: "uppercase" }}>Indicadores</Typography>
            {statsCards.map((card, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: "8px", bgcolor: COLORES.fondoGris }}>
                <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>{card.icon}</Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 9, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase" }}>{card.title}</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORES.textoPrimario, lineHeight: 1.2 }}>{card.value}</Typography>
                </Box>
              </Box>
            ))}
          </Paper>
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: "14px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 600, color: COLORES.textoTerciario, textTransform: "uppercase", mb: 1 }}>Dispositivos y seguridad</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[
                { label: "Huella digital", icon: <Fingerprint size={14} />, status: "Registrada", color: COLORES.verdeTexto, bg: COLORES.successFondo },
                { label: "Último acceso", icon: <Shield size={14} />, status: `Hoy ${new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`, color: COLORES.primarioOscuro, bg: COLORES.primarioClaro },
              ].map((item, i) => (
                <Paper key={i} elevation={0} sx={{ p: 1, borderRadius: "8px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: item.bg, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, flexShrink: 0 }}>{item.icon}</Box>
                  <Box><Typography sx={{ fontSize: 9, fontWeight: 600, color: COLORES.textoSuave }}>{item.label}</Typography><Typography sx={{ fontSize: 12, fontWeight: 700, color: item.color, mt: 0.1 }}>{item.status}</Typography></Box>
                </Paper>
              ))}
            </Box>
          </Paper>
          {userId ? (
            <MisNovedades empleadoId={userId} maxItems={2} sx={{ overflow: "hidden", minHeight: 0, p: 1.5, borderRadius: "14px" }} />
          ) : (
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: "14px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", minHeight: 0 }}>
              <Typography sx={{ fontSize: 13, color: COLORES.textoSuave }}>Sin empleado</Typography>
            </Paper>
          )}
        </Box>
      </Box>
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} variant="filled" sx={{ borderRadius: "10px" }}>{snack.mensaje}</Alert>
      </Snackbar>
    </Box>
  );
}
