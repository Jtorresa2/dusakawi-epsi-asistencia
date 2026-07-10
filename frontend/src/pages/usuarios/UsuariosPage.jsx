import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Button, Chip, Avatar, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Select, MenuItem, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import { UserPlus, Search, Trash2 } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/PageContainer";
import { useRol } from "../../hooks/useRol";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");

const ROL_COLORS = {
  "Administrador":  { bg: "#FFF3E0", color: "#E65100" },
  "Talento Humano": { bg: "#E8F5E9", color: "#1B5E20" },
  "Empleado":       { bg: "#E3F2FD", color: "#0D47A1" },
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState(null);
  const { puede } = useRol();

  const [form, setForm] = useState({
    empleado_id: "", rol_id: "", username: "", password: "", activo: 1
  });

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resU, resR] = await Promise.all([
        fetch(`${API}/usuarios`, { headers }),
        fetch(`${API}/usuarios/roles`, { headers }),
      ]);
      const dataU = await resU.json();
      const dataR = await resR.json();
      setUsuarios(dataU.usuarios || []);
      setRoles(dataR.roles || []);
    } catch {
      setError("Error al cargar datos");
    } finally {
      setCargando(false);
    }
  };

  const mostrarToast = (msg, tipo = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const abrirCrear = () => {
    setForm({ empleado_id: "", rol_id: "", username: "", password: "", activo: 1 });
    setModoEdicion(false);
    setUsuarioActual(null);
    setModalAbierto(true);
  };

  const abrirEditar = (u) => {
    setForm({
      empleado_id: u.empleado_id || "",
      rol_id: u.rol_id || roles.find(r => r.nombre === u.rol)?.id || "",
      username: u.username, password: "", activo: u.activo
    });
    setModoEdicion(true);
    setUsuarioActual(u);
    setModalAbierto(true);
  };

  const cerrarModal = () => { setModalAbierto(false); setUsuarioActual(null); };

  const handleGuardar = async () => {
    if (!form.username || !form.rol_id) return mostrarToast("Completa los campos obligatorios", "err");
    if (!modoEdicion && !form.password) return mostrarToast("La contraseña es obligatoria", "err");
    setGuardando(true);
    try {
      const url = modoEdicion ? `${API}/usuarios/${usuarioActual.id}` : `${API}/usuarios`;
      const method = modoEdicion ? "PUT" : "POST";
      const body = { ...form };
      if (modoEdicion && !body.password) delete body.password;
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) return mostrarToast(data.mensaje || "Error", "err");
      mostrarToast(data.mensaje);
      cerrarModal();
      cargarDatos();
    } catch {
      mostrarToast("Error de conexión", "err");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    try {
      const res = await fetch(`${API}/usuarios/${id}`, { method: "DELETE", headers });
      const data = await res.json();
      mostrarToast(data.mensaje);
      setConfirmEliminar(null);
      cargarDatos();
    } catch {
      mostrarToast("Error al eliminar", "err");
    }
  };

  const toggleActivo = async (u) => {
    try {
      const rolId = roles.find(r => r.nombre === u.rol)?.id;
      await fetch(`${API}/usuarios/${u.id}`, {
        method: "PUT", headers,
        body: JSON.stringify({ rol_id: rolId, username: u.username, activo: u.activo ? 0 : 1 })
      });
      cargarDatos();
    } catch {
      mostrarToast("Error al cambiar estado", "err");
    }
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.empleado?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.username?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.rol?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.cedula?.includes(busqueda)
  );

  if (cargando) return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 2 }}>
      <Box sx={{ width: 36, height: 36, border: "3px solid #E5E7EB", borderTop: "3px solid #1B5E20", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <Typography sx={{ color: "#9CA3AF", fontSize: 13 }}>Cargando usuarios...</Typography>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Box>
  );

  if (error) return (
    <Box sx={{ p: 4, textAlign: "center", color: "#DC2626" }}>
      <Typography>{error}</Typography>
      <Button onClick={cargarDatos} sx={{ mt: 2, color: "#DC2626", borderColor: "#DC2626" }} variant="outlined">Reintentar</Button>
    </Box>
  );

  return (
    <PageContainer>
      <PageHeader titulo="Usuarios" subtitulo={`${usuarios.length} usuarios registrados`} />

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}>
        {[
          { label: "Total usuarios", value: usuarios.length, color: "#1B5E20", bg: "#E8F5E9" },
          { label: "Activos", value: usuarios.filter(u => u.activo).length, color: "#0D9488", bg: "#F0FDFA" },
          { label: "Inactivos", value: usuarios.filter(u => !u.activo).length, color: "#DC2626", bg: "#FEF2F2" },
          { label: "Administradores", value: usuarios.filter(u => u.rol === "Administrador").length, color: "#D97706", bg: "#FFFBEB" },
        ].map((s, i) => (
          <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid #ECECEC", display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }} />
            <Box>
              <Typography sx={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</Typography>
              <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>{s.label}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid #ECECEC", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <TextField
          size="small" placeholder="Buscar por nombre, usuario, cédula o rol..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8, color: "#9CA3AF" }} /> }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13, minWidth: 320 } }}
        />
        {puede("usuarios", "crear") && (
          <Button variant="contained" startIcon={<UserPlus size={16} />} onClick={abrirCrear}
            sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, fontWeight: 600, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}>
            Nuevo usuario
          </Button>
        )}
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "16px", border: "1px solid #ECECEC" }}>
        <Table sx={{ fontSize: 13 }}>
          <TableHead>
            <TableRow>
              {["Empleado", "Usuario", "Rol", "Área", "Último acceso", "Estado", "Acciones"].map(h => (
                <TableCell key={h} sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap", textTransform: "uppercase" }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {usuariosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: "center", py: 6, color: "#9CA3AF", fontSize: 13 }}>
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : usuariosFiltrados.map((u, i) => {
              const badge = ROL_COLORS[u.rol] || { bg: "#F3F4F6", color: "#374151" };
              return (
                <TableRow key={u.id} sx={{ "&:last-child td": { border: 0 }, "&:hover": { bgcolor: "#F9FAFB" } }}>
                  <TableCell sx={{ color: "#111827" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "#1B5E20", fontSize: 11, fontWeight: 600 }}>
                        {u.empleado?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 500, fontSize: 13 }}>{u.empleado}</Typography>
                        <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>{u.cedula} · {u.correo}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "#374151", fontFamily: "monospace", fontSize: 12 }}>{u.username}</TableCell>
                  <TableCell>
                    <Chip label={u.rol} size="small" sx={{ bgcolor: badge.bg, color: badge.color, borderRadius: "8px", fontSize: 11, fontWeight: 600 }} />
                  </TableCell>
                  <TableCell sx={{ color: "#6B7280", fontSize: 12 }}>{u.area}{u.piso ? ` / P${u.piso}` : ""}</TableCell>
                  <TableCell sx={{ color: "#9CA3AF", fontSize: 12 }}>{u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleDateString("es-CO") : "Nunca"}</TableCell>
                  <TableCell>
                    <Button onClick={() => toggleActivo(u)} size="small" sx={{
                      borderRadius: "8px", fontSize: 11, fontWeight: 600, textTransform: "none", px: 1.5,
                      bgcolor: u.activo ? "#D1FAE5" : "#FEE2E2",
                      color: u.activo ? "#065F46" : "#991B1B",
                      "&:hover": { bgcolor: u.activo ? "#A7F3D0" : "#FECACA" }
                    }}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Button size="small" onClick={() => abrirEditar(u)}
                        sx={{ borderRadius: "8px", textTransform: "none", fontSize: 12, color: "#374151", borderColor: "#E5E7EB", px: 1.5 }}>
                        Editar
                      </Button>
                      {puede("usuarios", "eliminar") && (
                        <IconButton size="small" onClick={() => setConfirmEliminar(u)}
                          sx={{ borderRadius: "8px", color: "#DC2626" }}>
                          <Trash2 size={16} />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={modalAbierto} onClose={cerrarModal} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px", maxHeight: "90vh", overflow: "auto" } }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
          {modoEdicion ? "Editar usuario" : "Nuevo usuario"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", mb: 0.5, textTransform: "uppercase" }}>Usuario *</Typography>
            <TextField size="small" fullWidth value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="nombre.apellido"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", mb: 0.5, textTransform: "uppercase" }}>
              Contraseña {modoEdicion ? "(dejar vacío para no cambiar)" : "*"}
            </Typography>
            <TextField size="small" type="password" fullWidth value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", mb: 0.5, textTransform: "uppercase" }}>Rol *</Typography>
            <Select size="small" fullWidth value={form.rol_id} onChange={e => setForm({ ...form, rol_id: e.target.value })}
              sx={{ borderRadius: "8px", fontSize: 13 }}>
              <MenuItem value="">— Seleccione un rol —</MenuItem>
              {roles.map(r => <MenuItem key={r.id} value={r.id}>{r.nombre}</MenuItem>)}
            </Select>
          </Box>
          {modoEdicion && (
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", mb: 0.5, textTransform: "uppercase" }}>Estado</Typography>
              <Select size="small" fullWidth value={form.activo} onChange={e => setForm({ ...form, activo: Number(e.target.value) })}
                sx={{ borderRadius: "8px", fontSize: 13 }}>
                <MenuItem value={1}>Activo</MenuItem>
                <MenuItem value={0}>Inactivo</MenuItem>
              </Select>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={cerrarModal} sx={{ borderRadius: "8px", textTransform: "none", color: "#374151", bgcolor: "#F3F4F6", flex: 1 }}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar} disabled={guardando} variant="contained"
            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" }, flex: 2 }}>
            {guardando ? "Guardando..." : modoEdicion ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmEliminar} onClose={() => setConfirmEliminar(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: "16px", textAlign: "center", p: 2 } }}>
        <DialogContent>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827", mb: 1 }}>¿Eliminar usuario?</Typography>
          <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
            Se eliminará el usuario <strong>{confirmEliminar?.username}</strong> de forma permanente.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 1, pb: 2 }}>
          <Button onClick={() => setConfirmEliminar(null)} sx={{ borderRadius: "8px", textTransform: "none", color: "#374151", bgcolor: "#F3F4F6" }}>
            Cancelar
          </Button>
          <Button onClick={() => handleEliminar(confirmEliminar.id)} variant="contained" color="error"
            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600 }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {toast && (
        <Box sx={{
          position: "fixed", bottom: 24, right: 24,
          bgcolor: toast.tipo === "err" ? "#DC2626" : "#1B5E20",
          color: "#fff", borderRadius: "10px", px: 2.5, py: 1.5,
          fontSize: 13, fontWeight: 500, zIndex: 9999,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
        }}>
          {toast.msg}
        </Box>
      )}
    </PageContainer>
  );
}