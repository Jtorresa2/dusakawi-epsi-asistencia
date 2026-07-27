import { useState, useEffect } from "react";
import { Box, Paper, Typography, Avatar, Chip, TextField, Button, IconButton, MenuItem } from "@mui/material";
import {
  User, Mail, Phone, Calendar, FileText, Briefcase, MapPin, Clock,
  CheckCircle, XCircle, Edit3, Save, X, Shield, Fingerprint, Camera,
} from "lucide-react";
import { obtenerEmpleado, actualizarEmpleado } from "../../empleados/empleado.api";
import { obtenerCargos } from "../../cargos/cargo.api";
import { obtenerAreas } from "../../areas/area.api";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

export default function MiPerfilPage() {
  const [usuario, setUsuario] = useState(JSON.parse(localStorage.getItem("usuario") || "{}"));
  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [cargosList, setCargosList] = useState([]);
  const [areasList, setAreasList] = useState([]);

  useEffect(() => {
    const fetchEmpleado = async () => {
      try {
        if (usuario.empleado_id) {
          const data = await obtenerEmpleado(usuario.empleado_id);
          setEmpleado(data);
        }
      } catch {}
      setLoading(false);
    };
    fetchEmpleado();

    obtenerCargos().then((d) => setCargosList(Array.isArray(d) ? d : d?.cargos || [])).catch(() => {});
    obtenerAreas().then((d) => setAreasList(Array.isArray(d) ? d : d?.areas || [])).catch(() => {});
  }, []);

  const data = empleado || usuario;
  const initials = (usuario.nombre || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const personalFields = [
    { key: "nombre", label: "Nombre completo", icon: <User size={16} /> },
    { key: "apellido", label: "Apellido", icon: <User size={16} /> },
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
    {
      title: "Puntualidad",
      value: `${data?.puntualidad ?? 96}%`,
      sub: "Promedio general",
      icon: <CheckCircle size={22} />,
      color: "#16A34A",
      bg: "#D1FAE5",
    },
    {
      title: "Incidencias",
      value: String(data?.incidencias ?? 0),
      sub: "En el último mes",
      icon: <XCircle size={22} />,
      color: "#DC2626",
      bg: "#FEE2E2",
    },
  ];

  const handleEdit = (section) => {
    setEditando(section);
    if (section === "personal") {
      const obj = {};
      personalFields.forEach((f) => { obj[f.key] = data[f.key] || ""; });
      setForm(obj);
    } else {
      const obj = {};
      workFields.forEach((f) => { obj[f.key] = data[f.key] ?? ""; });
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
      const res = await fetch(`/api/empleados/${usuario.empleado_id}/foto`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.foto_url) {
        const updated = await obtenerEmpleado(usuario.empleado_id);
        setEmpleado(updated);
        const u = { ...usuario, foto_url: data.foto_url };
        localStorage.setItem("usuario", JSON.stringify(u));
        setUsuario(u);
      }
    } catch {}
    setSubiendoFoto(false);
  };

  const handleSave = async () => {
    setGuardando(true);
    try {
      await actualizarEmpleado(usuario.empleado_id, form);
      const updated = await obtenerEmpleado(usuario.empleado_id);
      setEmpleado(updated);
      const u = { ...usuario, ...form };
      localStorage.setItem("usuario", JSON.stringify(u));
      setUsuario(u);
      setEditando(null);
    } catch {}
    setGuardando(false);
  };

  const renderField = (field, value, section) => {
    const isEditing = editando === section;
    const isSelect = field.options?.length > 0;
    return (
      <Box key={field.key} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, borderBottom: "1px solid #F3F4F6" }}>
        <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", flexShrink: 0 }}>
          {field.icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", mb: 0.2 }}>{field.label}</Typography>
          {isEditing ? (
            isSelect ? (
              <TextField
                select
                fullWidth
                size="small"
                value={form[field.key] ?? ""}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value === "" ? null : Number(e.target.value) })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
              >
                <MenuItem value="">
                  <em>Sin {field.label.toLowerCase()}</em>
                </MenuItem>
                {field.options.map((opt) => (
                  <MenuItem key={opt.id} value={opt.id}>
                    {opt[field.optionLabel]}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                fullWidth
                size="small"
                type={field.type || "text"}
                value={form[field.key] || ""}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
              />
            )
          ) : (
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#111827", wordBreak: "break-word" }}>
              {field.type === "date" && value ? formatDate(value) : (field.display || value || "—")}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };


  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3, maxWidth: 1400, mx: "auto", width: "100%" }}>
      <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>
                Inicio / Mi cuenta / Mi perfil
            </Typography>
      <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", border: "1px solid #ECECEC", display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
        <Box sx={{ position: "relative", "&:hover .foto-overlay": { opacity: 1 } }}>
          <Avatar
            src={usuario.foto_url || empleado?.foto_url || ""}
            sx={{ width: 72, height: 72, bgcolor: "#E8F5E9", color: "#1B5E20", fontSize: 26, fontWeight: 700, cursor: "pointer" }}
          >
            {initials}
          </Avatar>
          <Box
            className="foto-overlay"
            onClick={() => document.getElementById("foto-input")?.click()}
            sx={{
              position: "absolute", inset: 0, borderRadius: "50%", bgcolor: "rgba(0,0,0,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
              opacity: 0, transition: "opacity 0.2s", cursor: "pointer",
            }}
          >
            {subiendoFoto ? (
              <Typography sx={{ fontSize: 10, fontWeight: 600 }}>...</Typography>
            ) : (
              <Camera size={20} />
            )}
          </Box>
          <input id="foto-input" type="file" hidden accept="image/*" onChange={handleFotoChange} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{usuario.nombre || "Usuario"}</Typography>
          <Typography sx={{ fontSize: 14, color: "#6B7280", mt: 0.3 }}>
            {(data?.cargo || "—")} · {(data?.area || "—")}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#9CA3AF", mt: 0.3 }}>
            {usuario.email || ""}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Chip
            label={data?.estado === "inactivo" ? "Inactivo" : "Activo"}
            size="small"
            sx={{ fontWeight: 600, borderRadius: "8px", bgcolor: data?.estado === "inactivo" ? "#FEE2E2" : "#E8F5E9", color: data?.estado === "inactivo" ? "#DC2626" : "#2E7D32", fontSize: 12 }}
          />
          <Chip
            label={usuario.rol?.replace("_", " ") || "—"}
            size="small"
            sx={{ fontWeight: 600, borderRadius: "8px", bgcolor: "#EFF6FF", color: "#1565C0", fontSize: 12, textTransform: "capitalize" }}
          />
        </Box>
      </Paper>

      {/* Grid principal */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "4fr 3fr 3fr" }, gap: 3, alignItems: "start" }}>
        {/* Columna 1 — Datos personales */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: "1px solid #ECECEC" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Datos personales</Typography>
            {editando === "personal" ? (
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <IconButton size="small" onClick={handleSave} disabled={guardando} sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", borderRadius: "8px", width: 28, height: 28, "&:hover": { bgcolor: "#C8E6C9" } }}>
                  <Save size={15} />
                </IconButton>
                <IconButton size="small" onClick={handleCancel} sx={{ bgcolor: "#FEE2E2", color: "#DC2626", borderRadius: "8px", width: 28, height: 28, "&:hover": { bgcolor: "#FECACA" } }}>
                  <X size={15} />
                </IconButton>
              </Box>
            ) : (
              <Box onClick={() => handleEdit("personal")} title="Editar" sx={{
                width: 34, height: 34, borderRadius: "9px", border: "none",
                bgcolor: "#EFF6FF", color: "#1565C0", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .2s", flexShrink: 0,
                "&:hover": { bgcolor: "#DBEAFE" },
              }}>
                <Edit3 size={15} />
              </Box>
            )}
          </Box>
          {personalFields.map((f) => renderField(f, data[f.key], "personal"))}
        </Paper>

        {/* Columna 2 — Información laboral */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: "1px solid #ECECEC" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Información laboral</Typography>
            {editando === "laboral" ? (
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <IconButton size="small" onClick={handleSave} disabled={guardando} sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", borderRadius: "8px", width: 28, height: 28, "&:hover": { bgcolor: "#C8E6C9" } }}>
                  <Save size={15} />
                </IconButton>
                <IconButton size="small" onClick={handleCancel} sx={{ bgcolor: "#FEE2E2", color: "#DC2626", borderRadius: "8px", width: 28, height: 28, "&:hover": { bgcolor: "#FECACA" } }}>
                  <X size={15} />
                </IconButton>
              </Box>
            ) : (
              <Box onClick={() => handleEdit("laboral")} title="Editar" sx={{
                width: 34, height: 34, borderRadius: "9px", border: "none",
                bgcolor: "#EFF6FF", color: "#1565C0", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .2s", flexShrink: 0,
                "&:hover": { bgcolor: "#DBEAFE" },
              }}>
                <Edit3 size={15} />
              </Box>
            )}
          </Box>
          {workFields.map((f) => renderField(f, data[f.key], "laboral"))}
        </Paper>

        {/* Columna 3 — Estadísticas */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {statsCards.map((card, i) => (
            <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid #ECECEC" }}>
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

      {/* Dispositivos / Seguridad */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: "1px solid #ECECEC" }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", mb: 2 }}>Dispositivos y seguridad</Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {[
            { label: "Huella digital", icon: <Fingerprint size={18} />, status: "Registrada", color: "#16A34A", bg: "#D1FAE5" },
            { label: "Último acceso", icon: <Shield size={18} />, status: "Hoy", color: "#1565C0", bg: "#E3F2FD" },
          ].map((item, i) => (
            <Paper key={i} elevation={0} sx={{ p: 1.5, borderRadius: "12px", border: "1px solid #ECECEC", display: "flex", alignItems: "center", gap: 1.5, minWidth: 180 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: item.bg, display: "flex", alignItems: "center", justifyContent: "center", color: item.color }}>
                {item.icon}
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF" }}>{item.label}</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: item.color }}>{item.status}</Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
