import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, TextField, Button, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Select, MenuItem, InputLabel, FormControl, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import { Plus, Search, Edit2, Trash2, Eye, XCircle } from "lucide-react";
import { obtenerEmpleados, crearEmpleado, actualizarEmpleado, eliminarEmpleado } from "../empleado.api";
import { obtenerAreas } from "../../areas/area.api";
import { obtenerCargos } from "../../cargos/cargo.api";
import useRol from "../../../shared/hooks/useRol";
import ConfirmDialog from "../../../shared/components/ConfirmDialog";
import EmpleadoPerfilModal from "../components/EmpleadoPerfilModal";

const initialForm = { cedula: "", nombre: "", apellido: "", correo: "", telefono: "", area_id: "", cargo_id: "", activo: true };

export default function EmpleadosPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const areaFilter = searchParams.get("area") || "";
  const cargoFilter = searchParams.get("cargo") || "";
  const [buscar, setBuscar] = useState("");
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const { puede } = useRol();
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ ...initialForm });
  const [guardando, setGuardando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [perfilEmpleadoId, setPerfilEmpleadoId] = useState(null);
  const [areas, setAreas] = useState([]);
  const [cargos, setCargos] = useState([]);

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

  const filtrados = empleados.filter((e) =>
    `${e.nombre} ${e.apellido} ${e.cedula} ${e.cargo || ""} ${e.area || ""}`
      .toLowerCase().includes(buscar.toLowerCase())
  );

  const getName = (e) => `${e.nombre} ${e.apellido}`;
  const getInitial = (e) => (e.nombre ? e.nombre[0].toUpperCase() : "?");
  const isActive = (e) => e.activo === 1 || e.activo === true;

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
      } else {
        await crearEmpleado(payload);
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
      await fetchData();
    } catch (e) { alert(e.mensaje || "Error al eliminar"); }
  };

  const selectSx = { borderRadius: "10px", fontSize: 14, "& fieldset": { borderColor: "#ECECEC" } };

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

      <Box sx={{ maxWidth: 360, mb: 3 }}>
        <TextField fullWidth placeholder="Buscar por nombre, documento, cargo o área..."
          value={buscar} onChange={(e) => setBuscar(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <Search size={18} style={{ color: "#9CA3AF", marginRight: 10 }} />,
              sx: { borderRadius: "10px", fontSize: 14, height: 42, bgcolor: "#F9FAFB" },
            },
          }}
        />
      </Box>

      {(areaFilter || cargoFilter) && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, flexWrap: "wrap" }}>
          {areaFilter && (
            <Chip label={`Área: ${areaFilter}`} size="small" onDelete={() => navigate(cargoFilter ? `/empleados?cargo=${encodeURIComponent(cargoFilter)}` : "/empleados")}
              sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 12, bgcolor: "#E8F5E9", color: "#1B5E20" }} />
          )}
          {cargoFilter && (
            <Chip label={`Cargo: ${cargoFilter}`} size="small" onDelete={() => navigate(areaFilter ? `/empleados?area=${encodeURIComponent(areaFilter)}` : "/empleados")}
              sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 12, bgcolor: "#E3F2FD", color: "#1565C0" }} />
          )}
          {(areaFilter || cargoFilter) && (
            <Chip label="Limpiar filtros" size="small" onDelete={() => navigate("/empleados")}
              sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 12, bgcolor: "#F3F4F6", color: "#6B7280" }} />
          )}
        </Box>
      )}

      <Paper elevation={0} sx={{ borderRadius: "20px", border: "1px solid #ECECEC", overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {["", "Nombre", "Documento", "Cargo", "Área", "Estado", "Acciones"].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 600, color: "#6B7280", fontSize: 12, bgcolor: "#F9FAFB", py: 1.5 }}>
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
                  <TableRow key={e.id} sx={{ "&:hover": { bgcolor: "#F9FAFB" }, transition: "background .15s" }}>
                    <TableCell sx={{ py: 1.2 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: "#E8F5E9", color: "#2E7D32", fontSize: 14, fontWeight: 700 }}>
                        {getInitial(e)}
                      </Avatar>
                    </TableCell>
                    <TableCell sx={{ py: 1.2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Button onClick={() => setPerfilEmpleadoId(e.id)}
                          sx={{ textTransform: "none", p: 0, minWidth: 0, justifyContent: "flex-start", textAlign: "left", display: "block" }}>
                          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827", "&:hover": { textDecoration: "underline" } }}>{getName(e)}</Typography>
                        </Button>
                        <IconButton size="small" onClick={() => setPerfilEmpleadoId(e.id)}
                          sx={{ borderRadius: "6px", color: "#9CA3AF", p: 0.3 }}>
                          <Eye size={14} />
                        </IconButton>
                      </Box>
                      <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>{e.correo}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.2, fontSize: 13, color: "#4B5563" }}>{e.cedula}</TableCell>
                    <TableCell sx={{ py: 1.2, fontSize: 13, color: "#4B5563" }}>{e.cargo || "—"}</TableCell>
                    <TableCell sx={{ py: 1.2, fontSize: 13, color: "#4B5563" }}>{e.area || "—"}</TableCell>
                    <TableCell sx={{ py: 1.2 }}>
                      <Chip label={isActive(e) ? "activo" : "inactivo"} size="small"
                        sx={{ height: 24, fontSize: 11, fontWeight: 600, bgcolor: isActive(e) ? "#E8F5E9" : "#F3F4F6", color: isActive(e) ? "#2E7D32" : "#6B7280" }} />
                    </TableCell>
                    <TableCell sx={{ py: 1.2 }}>
                      {puede("empleados", "editar") && (
                        <IconButton size="small" sx={{ color: "#6B7280" }} onClick={() => abrirEditar(e)}>
                          <Edit2 size={15} />
                        </IconButton>
                      )}
                      {puede("empleados", "eliminar") && (
                        <IconButton size="small" sx={{ color: "#DC2626" }} onClick={() => setConfirmDelete(e)}>
                          <Trash2 size={15} />
                        </IconButton>
                      )}
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
        PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
          {editando ? "Editar empleado" : "Nuevo empleado"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField label="Cédula" value={form.cedula}
              onChange={(e) => setForm({ ...form, cedula: e.target.value })}
              slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
            <TextField label="Teléfono" value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField label="Nombre" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
            <TextField label="Apellido" value={form.apellido}
              onChange={(e) => setForm({ ...form, apellido: e.target.value })}
              slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
          </Box>
          <TextField label="Correo electrónico" value={form.correo}
            onChange={(e) => setForm({ ...form, correo: e.target.value })}
            slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
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
