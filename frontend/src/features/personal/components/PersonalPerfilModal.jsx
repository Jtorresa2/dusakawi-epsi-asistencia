import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, Box, Paper, Typography, Avatar, Chip,
  TextField, IconButton, Switch, FormControlLabel, FormControl, InputLabel, Select, MenuItem,
  Snackbar, Alert,
} from "@mui/material";
import {
  User, Mail, Phone, Calendar, FileText, Briefcase, MapPin,
  CheckCircle, XCircle, Clock, Edit2, Save, X, Camera, Shield,
} from "lucide-react";
import { obtenerPersonalPorId, actualizarPersonal } from "../personal.api";
import { obtenerAreas } from "../../areas/area.api";
import { obtenerCargos } from "../../cargos/cargo.api";
import { obtenerHorarios, asignarHorario, desasignarHorario } from "../../horarios/horario.api";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

const personalFields = [
  { key: "nombre", label: "Nombre", icon: <User size={16} /> },
  { key: "apellido", label: "Apellido", icon: <User size={16} /> },
  { key: "cedula", label: "Cédula", icon: <FileText size={16} /> },
  { key: "correo", label: "Correo electrónico", icon: <Mail size={16} /> },
  { key: "telefono", label: "Teléfono", icon: <Phone size={16} /> },
  { key: "fecha_nacimiento", label: "Fecha de nacimiento", icon: <Calendar size={16} />, type: "date" },
];

const workFields = [
  { key: "cargo", label: "Cargo", icon: <Briefcase size={16} /> },
  { key: "area", label: "Área", icon: <MapPin size={16} /> },
];

const infoFields = [
  { key: "piso", label: "Piso", icon: <MapPin size={16} />, render: (v) => (v ? `Piso ${v}` : "—") },
  { key: "rol", label: "Rol del sistema", icon: <Shield size={16} /> },
];

const selectSx = { borderRadius: "10px", fontSize: 14, background: "#FFFFFF", "& fieldset": { borderColor: "#111827" }, "&:hover fieldset": { borderColor: "#111827" }, "&.Mui-focused fieldset": { borderColor: "#111827" } };
const selectMenuSx = {
  PaperProps: {
    sx: { bgcolor: "#FFFFFF", "& .MuiMenuItem-root": { borderRadius: 1, mx: 0.5 } },
  },
};

export default function PersonalPerfilModal({ open, id, onClose, onSaved }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
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

  const initials = data ? `${data.nombre || ""} ${data.apellido || ""}`.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "??";

  const handleEdit = (section) => {
    setEditando(section);
    if (section === "personal") {
      const obj = {};
      personalFields.forEach((f) => { obj[f.key] = data[f.key] || ""; });
      setForm(obj);
    } else {
      const obj = {};
      workFields.forEach((f) => { obj[f.key] = data[f.key] || ""; });
      obj.area_id = data.area_id ? String(data.area_id) : "";
      obj.cargo_id = data.cargo_id ? String(data.cargo_id) : "";
      obj.horario_id = data.horario_id ? String(data.horario_id) : "";
      setForm(obj);
    }
  };

  const handleCancel = () => {
    setEditando(null);
    setForm({});
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoFoto(true);
    try {
      const formData = new FormData();
      formData.append("foto", file);
      await fetch(`/api/empleados/${id}/foto`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      const updated = await obtenerPersonalPorId(id);
      setData(updated);
    } catch {}
    setSubiendoFoto(false);
  };

  const handleSave = async () => {
    setGuardando(true);
    try {
      const payload = { ...form };
      let horarioAsignado = null;
      if (editando === "laboral") {
        payload.area_id = form.area_id ? Number(form.area_id) : null;
        payload.cargo_id = form.cargo_id ? Number(form.cargo_id) : null;
        delete payload.horario_id;
        delete payload.area;
        delete payload.cargo;
        if (form.horario_id && String(form.horario_id) !== String(data?.horario_id)) {
          await asignarHorario({
            usuario_id: id,
            horario_id: Number(form.horario_id),
            motivo: "Asignación desde perfil",
          });
          horarioAsignado = true;
        } else if (!form.horario_id && data?.horario_id) {
          await desasignarHorario(id);
          horarioAsignado = true;
        }
      }
      await actualizarPersonal(id, payload);
      const updated = await obtenerPersonalPorId(id);
      setData(updated);
      setEditando(null);
      if (onSaved) onSaved();
      setSnack({ tipo: "ok", msg: horarioAsignado ? "Perfil y horario actualizados correctamente" : "Perfil actualizado correctamente" });
    } catch (e) {
      setSnack({ tipo: "err", msg: e.message || "Error al guardar" });
    }
    setGuardando(false);
  };

  const handleToggleEstado = async () => {
    const nuevo = data.activo === 1 || data.activo === true ? 0 : 1;
    setGuardando(true);
    try {
      await actualizarPersonal(id, { activo: nuevo });
      const updated = await obtenerPersonalPorId(id);
      setData(updated);
      if (onSaved) onSaved();
    } catch {}
    setGuardando(false);
  };

  const renderField = (field, value, section) => {
    const isEditing = editando === section;
    return (
      <Box key={field.key} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, borderBottom: "1px solid #D9EFDB" }}>
        <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#DCF5E4", display: "flex", alignItems: "center", justifyContent: "center", color: "#1B5E20", flexShrink: 0 }}>
          {field.icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", mb: 0.2 }}>{field.label}</Typography>
          {isEditing ? (
            <TextField
              fullWidth size="small" type={field.type || "text"}
              value={form[field.key] || ""}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13, background: "#FFFFFF", "& fieldset": { borderColor: "#111827" }, "&:hover fieldset": { borderColor: "#111827" }, "&.Mui-focused fieldset": { borderColor: "#111827" } } }}
            />
          ) : (
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#111827", wordBreak: "break-word" }}>
              {field.type === "date" && value ? formatDate(value) : value || "—"}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  const isActive = data?.activo === 1 || data?.activo === true;
  const horarioNombre = horarios.find((h) => String(h.id) === String(data?.horario_id))?.nombre;
  const statsCards = [
    { title: "Inasistencias", value: String(data?.inasistencias ?? 0), sub: "Total de ausencias registradas", icon: <XCircle size={22} />, color: "#DC2626", bg: "#FEE2E2" },
    { title: "Llegadas tardías", value: String(data?.llegadas_tardias ?? 0), sub: "Total de retardos registrados", icon: <Clock size={22} />, color: "#D97706", bg: "#FEF3C7" },
  ];

  return (
    <>
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
  sx={{ "& .MuiPaper-root": { backgroundColor: "#FFFFFF" } }}
  PaperProps={{ sx: { position: "relative", borderRadius: "16px", maxHeight: "95vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" } }}>
      {loading ? (
        <DialogContent sx={{ py: 8, textAlign: "center", color: "#9CA3AF" }}>Cargando perfil...</DialogContent>
      ) : data ? (
        <>
          <IconButton onClick={onClose} size="small" sx={{ position: "absolute", top: 12, right: 12, zIndex: 2, color: "#9CA3AF", "&:hover": { color: "#6B7280", bgcolor: "#F3F4F6" } }}>
            <X size={18} />
          </IconButton>
          <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: "#111827", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Perfil de {data.nombre} {data.apellido}
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Header card */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid #ECECEC", display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap", bgcolor: "#F9FAFB" }}>
              <Box sx={{ position: "relative", "&:hover .foto-overlay": { opacity: 1 } }}>
                <Avatar src={data.foto_url || ""}
                  sx={{ width: 72, height: 72, bgcolor: "#E8F5E9", color: "#1B5E20", fontSize: 26, fontWeight: 700, cursor: "pointer" }}>
                  {initials}
                </Avatar>
                <Box className="foto-overlay" onClick={() => document.getElementById("perfil-foto-input")?.click()}
                  sx={{ position: "absolute", inset: 0, borderRadius: "50%", bgcolor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", opacity: 0, transition: "opacity 0.2s", cursor: "pointer" }}>
                  {subiendoFoto ? <Typography sx={{ fontSize: 10, fontWeight: 600 }}>...</Typography> : <Camera size={20} />}
                </Box>
                <input id="perfil-foto-input" type="file" hidden accept="image/*" onChange={handleFotoChange} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{data.nombre} {data.apellido}</Typography>
                <Typography sx={{ fontSize: 14, color: "#6B7280", mt: 0.3 }}>{data.cargo || "—"} · {data.area || "—"}</Typography>
                <Typography sx={{ fontSize: 13, color: "#9CA3AF", mt: 0.3 }}>{data.correo || ""}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Chip label={isActive ? "Activo" : "Inactivo"} size="small"
                  sx={{ fontWeight: 600, borderRadius: "8px", bgcolor: isActive ? "#E8F5E9" : "#FEE2E2", color: isActive ? "#2E7D32" : "#DC2626", fontSize: 12 }} />
                <FormControlLabel
                  control={<Switch checked={isActive} onChange={handleToggleEstado} disabled={guardando} size="small" />}
                  label=""
                  sx={{ m: 0 }}
                />
              </Box>
            </Paper>

            {/* Grid principal */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "4fr 3fr 3fr" }, gap: 3, alignItems: "start" }}>
              {/* Col 1 — Datos personales */}
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #ECECEC", bgcolor: "#F9FAFB" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Datos personales</Typography>
                  {editando === "personal" ? (
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton size="small" onClick={handleSave} disabled={guardando} sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", borderRadius: "8px", width: 28, height: 28, "&:hover": { bgcolor: "#C8E6C9" } }}><Save size={15} /></IconButton>
                      <IconButton size="small" onClick={handleCancel} sx={{ bgcolor: "#FEE2E2", color: "#DC2626", borderRadius: "8px", width: 28, height: 28, "&:hover": { bgcolor: "#FECACA" } }}><X size={15} /></IconButton>
                    </Box>
                  ) : (
                    <IconButton size="small" onClick={() => handleEdit("personal")} sx={{ bgcolor: "#EFF6FF", color: "#1565C0", borderRadius: "8px", width: 28, height: 28, "&:hover": { bgcolor: "#DBEAFE" } }}><Edit2 size={15} /></IconButton>
                  )}
                </Box>
                {personalFields.map((f) => renderField(f, data[f.key], "personal"))}
              </Paper>

              {/* Col 2 — Información laboral */}
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #ECECEC", bgcolor: "#F9FAFB" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Información laboral</Typography>
                  {editando === "laboral" ? (
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton size="small" onClick={handleSave} disabled={guardando} sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", borderRadius: "8px", width: 28, height: 28, "&:hover": { bgcolor: "#C8E6C9" } }}><Save size={15} /></IconButton>
                      <IconButton size="small" onClick={handleCancel} sx={{ bgcolor: "#FEE2E2", color: "#DC2626", borderRadius: "8px", width: 28, height: 28, "&:hover": { bgcolor: "#FECACA" } }}><X size={15} /></IconButton>
                    </Box>
                  ) : (
                    <IconButton size="small" onClick={() => handleEdit("laboral")} sx={{ bgcolor: "#EFF6FF", color: "#1565C0", borderRadius: "8px", width: 28, height: 28, "&:hover": { bgcolor: "#DBEAFE" } }}><Edit2 size={15} /></IconButton>
                  )}
                </Box>
                {editando === "laboral" ? (
                  <>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, borderBottom: "1px solid #D9EFDB" }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#DCF5E4", display: "flex", alignItems: "center", justifyContent: "center", color: "#1B5E20", flexShrink: 0 }}>
                        <Briefcase size={16} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", mb: 0.2 }}>Cargo</Typography>
                        <FormControl fullWidth size="small">
                          <Select value={form.cargo_id || ""} sx={selectSx} MenuProps={selectMenuSx}
                            onChange={(e) => setForm({ ...form, cargo_id: e.target.value })}>
                            <MenuItem value=""><em>Sin cargo</em></MenuItem>
                            {cargos.filter((c) => c.estado !== "inactivo").map((c) => (
                              <MenuItem key={c.id} value={String(c.id)}>{c.nombre}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, borderBottom: "1px solid #D9EFDB" }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#DCF5E4", display: "flex", alignItems: "center", justifyContent: "center", color: "#1B5E20", flexShrink: 0 }}>
                        <MapPin size={16} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", mb: 0.2 }}>Área</Typography>
                        <FormControl fullWidth size="small">
                          <Select value={form.area_id || ""} sx={selectSx} MenuProps={selectMenuSx}
                            onChange={(e) => setForm({ ...form, area_id: e.target.value })}>
                            <MenuItem value=""><em>Sin área</em></MenuItem>
                            {areas.map((a) => (
                              <MenuItem key={a.id} value={String(a.id)}>{a.nombre}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, borderBottom: "1px solid #D9EFDB" }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#DCF5E4", display: "flex", alignItems: "center", justifyContent: "center", color: "#1B5E20", flexShrink: 0 }}>
                        <Clock size={16} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", mb: 0.2 }}>Horario</Typography>
                        <FormControl fullWidth size="small">
                          <Select value={form.horario_id || ""} sx={selectSx} MenuProps={selectMenuSx}
                            onChange={(e) => setForm({ ...form, horario_id: e.target.value })}>
                            <MenuItem value=""><em>Sin horario</em></MenuItem>
                            {horarios.map((h) => (
                              <MenuItem key={h.id} value={String(h.id)}>{h.nombre}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <>
                    {workFields.map((f) => renderField(f, data[f.key], "laboral"))}
                    {infoFields.map((f) => (
                      <Box key={f.key} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, borderBottom: "1px solid #D9EFDB" }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#DCF5E4", display: "flex", alignItems: "center", justifyContent: "center", color: "#1B5E20", flexShrink: 0 }}>
                          {f.icon}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", mb: 0.2 }}>{f.label}</Typography>
                          <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#111827", wordBreak: "break-word" }}>
                            {f.render ? f.render(data[f.key]) : (data[f.key] || "—")}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, borderBottom: "1px solid #D9EFDB" }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#DCF5E4", display: "flex", alignItems: "center", justifyContent: "center", color: "#1B5E20", flexShrink: 0 }}>
                        <Clock size={16} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", mb: 0.2 }}>Horario</Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#111827", wordBreak: "break-word" }}>
                          {horarioNombre || "—"}
                        </Typography>
                      </Box>
                    </Box>
                  </>
                )}
              </Paper>

              {/* Col 3 — Estadísticas */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {statsCards.map((card, i) => (
                  <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid #ECECEC", bgcolor: "#F9FAFB" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: "12px", bgcolor: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>
                        {card.icon}
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" }}>{card.title}</Typography>
                        <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{card.value}</Typography>
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>{card.sub}</Typography>
                  </Paper>
                ))}
              </Box>
            </Box>
          </DialogContent>
        </>
      ) : (
        <DialogContent sx={{ padding: 8, textAlign: "center", color: "#9CA3AF" }}>No se pudo cargar el perfil</DialogContent>
      )}
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3500} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack?.tipo === "err" ? "error" : "success"} variant="filled"
          sx={{ borderRadius: "10px", fontWeight: 500, fontSize: 13 }}>
          {snack?.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
