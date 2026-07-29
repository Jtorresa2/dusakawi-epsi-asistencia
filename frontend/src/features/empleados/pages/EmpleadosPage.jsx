import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, TextField, Button, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Select, MenuItem, InputLabel, FormControl, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Menu,
  Snackbar, Alert,
} from "@mui/material";
import { Plus, Search, Edit3, Trash2, Eye, X, Users, UserCheck, UserX, UserRound, Filter } from "lucide-react";
import { obtenerEmpleados, crearEmpleado, actualizarEmpleado, eliminarEmpleado } from "../empleado.api";
import { obtenerAreas } from "../../areas/area.api";
import { obtenerCargos } from "../../cargos/cargo.api";
import useRol from "../../../shared/hooks/useRol";
import ConfirmDialog from "../../../shared/components/ConfirmDialog";
import EmpleadoPerfilModal from "../components/EmpleadoPerfilModal";

const initialForm = { cedula: "", nombre: "", apellido: "", correo: "", telefono: "", area_id: "", cargo_id: "", activo: true };

const ESTADOS_FILTRO = ["Todos", "Activo", "Inactivo"];

export default function EmpleadosPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const areaFilter = searchParams.get("area") || "";
  const cargoFilter = searchParams.get("cargo") || "";
  const [buscar, setBuscar] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroArea, setFiltroArea] = useState("Todas");
  const [filtroCargo, setFiltroCargo] = useState("Todos");
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const { puede } = useRol();
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ ...initialForm });
  const [guardando, setGuardando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [perfilEmpleadoId, setPerfilEmpleadoId] = useState(null);
  const [masAnchor, setMasAnchor] = useState(null);
  const [snack, setSnack] = useState({ open: false, severity: "success", mensaje: "" });
  const [areas, setAreas] = useState([]);
  const [cargos, setCargos] = useState([]);

  const filtrosActivos = [filtroEstado !== "Todos", filtroArea !== "Todas", filtroCargo !== "Todos", buscar !== ""].filter(Boolean).length;

  useEffect(() => { fetchData(); fetchAreas(); fetchCargos(); }, [areaFilter, cargoFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (areaFilter) params.area = areaFilter;
      if (cargoFilter) params.cargo = cargoFilter;
      const res = await obtenerEmpleados(params);
      setEmpleados(res.empleados || []);
    } catch { setEmpleados([]); }
    finally { setLoading(false); }
  };

  const fetchAreas = async () => {
    try { const res = await obtenerAreas(); setAreas(res || []); } catch {}
  };

  const fetchCargos = async () => {
    try { const res = await obtenerCargos(); setCargos(res || []); } catch {}
  };

  const isActive = (e) => e.activo === 1 || e.activo === true;

  let filtrados = empleados.filter((e) =>
    `${e.nombre} ${e.apellido} ${e.cedula} ${e.cargo || ""} ${e.area || ""}`
      .toLowerCase().includes(buscar.toLowerCase())
  );

  if (filtroEstado !== "Todos") {
    const activo = filtroEstado === "Activo";
    filtrados = filtrados.filter((e) => activo ? isActive(e) : !isActive(e));
  }
  if (filtroArea !== "Todas") {
    filtrados = filtrados.filter((e) => e.area === filtroArea);
  }
  if (filtroCargo !== "Todos") {
    filtrados = filtrados.filter((e) => e.cargo === filtroCargo);
  }

  const getName = (e) => `${e.nombre} ${e.apellido}`;
  const getInitial = (e) => (e.nombre ? e.nombre[0].toUpperCase() : "?");

  const abrirCrear = () => {
    setEditando(null);
    setForm({ ...initialForm });
    setModal(true);
  };

  const abrirEditar = (e) => {
    setEditando(e);
    setForm({
      cedula: e.cedula || "",
      nombre: e.nombre || "",
      apellido: e.apellido || "",
      correo: e.correo || "",
      telefono: e.telefono || "",
      area_id: e.area_id ? String(e.area_id) : "",
      cargo_id: e.cargo_id ? String(e.cargo_id) : "",
      activo: e.activo === 1 || e.activo === true,
    });
    setModal(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.apellido.trim() || !form.cedula.trim()) return;
    setGuardando(true);
    try {
      const payload = {
        ...form,
        area_id: form.area_id ? Number(form.area_id) : null,
        cargo_id: form.cargo_id ? Number(form.cargo_id) : null,
        activo: form.activo ? 1 : 0,
      };
      if (editando) {
        await actualizarEmpleado(editando.id, payload);
        setSnack({ open: true, severity: "success", mensaje: "Empleado actualizado correctamente" });
      } else {
        await crearEmpleado(payload);
        setSnack({ open: true, severity: "success", mensaje: "Empleado creado correctamente" });
      }
      setModal(false);
      await fetchData();
    } catch (e) { alert(e.mensaje || "Error al guardar"); }
    finally { setGuardando(false); }
  };

  const eliminar = async () => {
    if (!confirmDelete) return;
    try {
      await eliminarEmpleado(confirmDelete.id);
      setConfirmDelete(null);
      setSnack({ open: true, severity: "success", mensaje: "Empleado eliminado correctamente" });
      await fetchData();
    } catch (e) { alert(e.mensaje || "Error al eliminar"); }
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      "& fieldset": { borderColor: "#6B7280" },
      "&:hover fieldset": { borderColor: "#374151" },
    },
  };
  const selectSx = {
    borderRadius: "10px", fontSize: 14,
    "& fieldset": { borderColor: "#6B7280" },
    "&:hover fieldset": { borderColor: "#374151" },
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>Inicio / Gestión / Empleados</Typography>
        </Box>
        {puede("empleados", "crear") && (
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={abrirCrear}
            sx={{ bgcolor: "#1B5E20", borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, px: 2.5, height: 42, "&:hover": { bgcolor: "#2E7D32" } }}>
            Nuevo empleado
          </Button>
        )}
      </Box>

      {/* TARJETAS RESUMEN */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3.5 }}>
        {[
          { icon: <Users size={20} />, value: empleados.length, label: "Total empleados", color: "#1B5E20", bg: "#E8F5E9", onClick: () => { setFiltroEstado("Todos"); setFiltroArea("Todas"); setFiltroCargo("Todos"); setBuscar(""); } },
          { icon: <UserCheck size={20} />, value: empleados.filter((e) => isActive(e)).length, label: "Activos", color: "#1565C0", bg: "#EFF6FF", onClick: () => setFiltroEstado("Activo") },
          { icon: <UserX size={20} />, value: empleados.filter((e) => !isActive(e)).length, label: "Inactivos", color: "#DC2626", bg: "#FEE2E2", onClick: () => setFiltroEstado("Inactivo") },
          { icon: <UserRound size={20} />, value: new Set(empleados.map((e) => e.area).filter(Boolean)).size, label: "Áreas distintas", color: "#7C3AED", bg: "#F3E8FF", onClick: () => {} },
        ].map((card, i) => (
          <Paper key={i} elevation={0} onClick={card.onClick}
            sx={{ p: 2, borderRadius: "16px", border: "1px solid #ECECEC", display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", transition: "all .25s ease", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 15px rgba(0,0,0,.06)" } }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>
              {card.icon}
            </Box>
            <Box>
              <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.03em" }}>{card.label}</Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 700, color: card.color, lineHeight: 1.2 }}>{card.value}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* BARRA DE FILTROS */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid #ECECEC", mb: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "2fr 1fr 1fr 1fr auto" }, gap: 1.5, alignItems: "center" }}>
          <TextField placeholder="Buscar empleado..." value={buscar} onChange={(e) => setBuscar(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <Search size={15} style={{ color: "#9CA3AF", marginRight: 6 }} />,
                sx: { borderRadius: "8px", fontSize: 13, height: 36, bgcolor: "#F9FAFB", py: 0 },
              },
            }} />
          <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} size="small"
            sx={{ borderRadius: "8px", fontSize: 13, height: 36, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#E5E7EB" } }}>
            {ESTADOS_FILTRO.map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
          </Select>
          <Select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} size="small"
            sx={{ borderRadius: "8px", fontSize: 13, height: 36, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#E5E7EB" } }}>
            <MenuItem value="Todas">Área</MenuItem>
            {areas.map((a) => <MenuItem key={a.id} value={a.nombre}>{a.nombre}</MenuItem>)}
          </Select>
          <Select value={filtroCargo} onChange={(e) => setFiltroCargo(e.target.value)} size="small"
            sx={{ borderRadius: "8px", fontSize: 13, height: 36, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#E5E7EB" } }}>
            <MenuItem value="Todos">Cargo</MenuItem>
            {cargos.filter((c) => c.estado !== "inactivo").map((c) => <MenuItem key={c.id} value={c.nombre}>{c.nombre}</MenuItem>)}
          </Select>
          <Box>
            <Button onClick={(e) => setMasAnchor(e.currentTarget)}
              sx={{ borderRadius: "8px", textTransform: "none", fontSize: 11, fontWeight: 600, height: 36, px: 1.5, color: "#6B7280", border: "1px solid #E5E7EB", bgcolor: "#fff", whiteSpace: "nowrap", width: "100%", "&:hover": { borderColor: "#1B5E20", color: "#1B5E20", bgcolor: "#F9FAFB" } }}>
              <Filter size={14} style={{ marginRight: 4 }} />
              Más
              {filtrosActivos > 0 && (
                <Chip label={filtrosActivos} size="small" sx={{ ml: 0.3, height: 16, minWidth: 16, fontSize: 9, fontWeight: 700, bgcolor: "#1B5E20", color: "#fff", borderRadius: "50%", "& .MuiChip-label": { px: 0.2 } }} />
              )}
            </Button>
          </Box>
        </Box>
        <Menu anchorEl={masAnchor} open={Boolean(masAnchor)} onClose={() => setMasAnchor(null)}
          transformOrigin={{ horizontal: "right", vertical: "top" }} anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          slotProps={{ paper: { sx: { borderRadius: "12px", mt: 0.5, minWidth: 160, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } } }}>
          <MenuItem onClick={() => { setMasAnchor(null); setFiltroEstado("Todos"); setFiltroArea("Todas"); setFiltroCargo("Todos"); setBuscar(""); }}
            sx={{ borderRadius: "8px", mx: 0.5, fontSize: 13, gap: 1 }}>
            <X size={16} /> Limpiar filtros
          </MenuItem>
        </Menu>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: "20px", border: "1px solid #ECECEC", overflow: "visible" }}>
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                {["", "Nombre", "Documento", "Cargo", "Área", "Estado", "Acciones"].map((h) => (
                  <TableCell key={h} sx={{
                    fontWeight: 600, color: "#6B7280", fontSize: 12, bgcolor: "#F9FAFB", py: 1.5,
                    whiteSpace: "nowrap",
                    display: h === "Cargo" || h === "Área" ? { xs: "none", md: "table-cell" } : h === "Acciones" ? { xs: "none", sm: "table-cell" } : undefined,
                  }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "#9CA3AF", fontSize: 14 }}>Cargando...</TableCell>
                </TableRow>
              ) : filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "#9CA3AF", fontSize: 14 }}>
                    {buscar ? "No se encontraron empleados" : "No hay empleados registrados"}
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((e) => (
                  <TableRow key={e.id} sx={{ cursor: "pointer", "&:hover": { bgcolor: "#F9FAFB" }, transition: "background .15s" }}
                    onClick={() => setPerfilEmpleadoId(e.id)}>
                    <TableCell sx={{ py: 1.2 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: "#E8F5E9", color: "#2E7D32", fontSize: 14, fontWeight: 700 }}>
                        {getInitial(e)}
                      </Avatar>
                    </TableCell>
                    <TableCell sx={{ py: 1.2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{getName(e)}</Typography>
                        <IconButton size="small" onClick={(ev) => { ev.stopPropagation(); setPerfilEmpleadoId(e.id); }}
                          sx={{ bgcolor: "#EFF6FF", color: "#1565C0", borderRadius: "6px", width: 26, height: 26, "&:hover": { bgcolor: "#DBEAFE" } }}>
                          <Eye size={13} />
                        </IconButton>
                      </Box>
                      <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>{e.correo}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.2, fontSize: 13, color: "#4B5563", whiteSpace: "nowrap" }}>{e.cedula}</TableCell>
                    <TableCell sx={{ py: 1.2, fontSize: 13, color: "#4B5563", display: { xs: "none", md: "table-cell" } }}>{e.cargo || "—"}</TableCell>
                    <TableCell sx={{ py: 1.2, fontSize: 13, color: "#4B5563", display: { xs: "none", md: "table-cell" } }}>{e.area || "—"}</TableCell>
                    <TableCell sx={{ py: 1.2 }}>
                      <Chip label={isActive(e) ? "activo" : "inactivo"} size="small"
                        sx={{ height: 24, fontSize: 11, fontWeight: 600, bgcolor: isActive(e) ? "#E8F5E9" : "#F3F4F6", color: isActive(e) ? "#2E7D32" : "#6B7280" }} />
                    </TableCell>
                    <TableCell sx={{ py: 1.2, display: { xs: "none", sm: "table-cell" } }}>
                      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }} onClick={(ev) => ev.stopPropagation()}>
                        {puede("empleados", "editar") && (
                          <Box onClick={() => abrirEditar(e)} title="Editar" sx={{
                            width: 34, height: 34, borderRadius: "9px",
                            bgcolor: "#EFF6FF", color: "#1565C0", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all .2s", flexShrink: 0,
                            "&:hover": { bgcolor: "#DBEAFE" },
                          }}>
                            <Edit3 size={15} />
                          </Box>
                        )}
                        {puede("empleados", "eliminar") && (
                          <Box onClick={() => setConfirmDelete(e)} title="Eliminar" sx={{
                            width: 34, height: 34, borderRadius: "9px",
                            bgcolor: "#FEE2E2", color: "#DC2626", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all .2s", flexShrink: 0,
                            "&:hover": { bgcolor: "#FECACA" },
                          }}>
                            <Trash2 size={15} />
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* MODAL CREAR/EDITAR */}
      <Dialog open={modal} onClose={() => setModal(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px", position: "relative" } }}
        sx={{ "& .MuiPaper-root": { backgroundColor: "#E8F5E9" } }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
          {editando ? "Editar empleado" : "Nuevo empleado"}
          <IconButton onClick={() => setModal(false)} size="small" sx={{ position: "absolute", top: 8, right: 8, color: "#9CA3AF", "&:hover": { color: "#6B7280", bgcolor: "#F3F4F6" } }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField label="Cédula" value={form.cedula}
              onChange={(e) => setForm({ ...form, cedula: e.target.value })}
              slotProps={{ inputLabel: { sx: { fontSize: 13 } } }} sx={fieldSx} />
            <TextField label="Teléfono" value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              slotProps={{ inputLabel: { sx: { fontSize: 13 } } }} sx={fieldSx} />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField label="Nombre" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              slotProps={{ inputLabel: { sx: { fontSize: 13 } } }} sx={fieldSx} />
            <TextField label="Apellido" value={form.apellido}
              onChange={(e) => setForm({ ...form, apellido: e.target.value })}
              slotProps={{ inputLabel: { sx: { fontSize: 13 } } }} sx={fieldSx} />
          </Box>
          <TextField label="Correo electrónico" value={form.correo}
            onChange={(e) => setForm({ ...form, correo: e.target.value })}
            slotProps={{ inputLabel: { sx: { fontSize: 13 } } }} sx={fieldSx} />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontSize: 13 }}>Área</InputLabel>
              <Select value={form.area_id} label="Área" sx={selectSx}
                onChange={(e) => setForm({ ...form, area_id: e.target.value })}>
                <MenuItem value=""><em>Sin área</em></MenuItem>
                {areas.map((a) => (
                  <MenuItem key={a.id} value={String(a.id)}>{a.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel sx={{ fontSize: 13 }}>Cargo</InputLabel>
              <Select value={form.cargo_id} label="Cargo" sx={selectSx}
                onChange={(e) => setForm({ ...form, cargo_id: e.target.value })}>
                <MenuItem value=""><em>Sin cargo</em></MenuItem>
                {cargos.filter((c) => c.estado !== "inactivo").map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>{c.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {editando && (
            <FormControlLabel
              control={<Switch checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />}
              label="Empleado activo"
              sx={{ mt: 1, "& .MuiFormControlLabel-label": { fontSize: 14, fontWeight: 500, color: "#374151" } }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setModal(false)}
            sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, color: "#6B7280" }}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={guardando || !form.nombre.trim() || !form.apellido.trim() || !form.cedula.trim()}
            sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}>
            {guardando ? "Guardando..." : editando ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONFIRMAR ELIMINAR */}
      <ConfirmDialog
        open={!!confirmDelete}
        titulo="Eliminar empleado"
        mensaje={`¿Estás seguro de eliminar a "${confirmDelete?.nombre} ${confirmDelete?.apellido}"? Esta acción no se puede deshacer.`}
        onConfirm={eliminar}
        onCancel={() => setConfirmDelete(null)}
        onClose={() => setConfirmDelete(null)}
      />

      {/* SNACKBAR */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} variant="filled" sx={{ borderRadius: "10px" }}>{snack.mensaje}</Alert>
      </Snackbar>

      {/* PERFIL MODAL */}
      <EmpleadoPerfilModal
        open={perfilEmpleadoId !== null}
        empleadoId={perfilEmpleadoId}
        onClose={() => { setPerfilEmpleadoId(null); fetchData(); }}
        onSaved={() => fetchData()}
      />
    </Box>
  );
}
