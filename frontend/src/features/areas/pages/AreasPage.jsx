import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Paper, TextField, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  ToggleButtonGroup, ToggleButton, Collapse,
} from "@mui/material";
import { Plus, Edit2, Trash2, Search, Building2, SortAsc, ArrowUpDown, Users, ChevronDown, ChevronRight } from "lucide-react";
import { obtenerAreas, crearArea, actualizarArea, eliminarArea, obtenerEmpleadosPorArea } from "../area.api";
import useRol from "../../../shared/hooks/useRol";
import ConfirmDialog from "../../../shared/components/ConfirmDialog";

const initialForm = { nombre: "", piso: "", descripcion: "" };

export default function AreasPage() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [buscar, setBuscar] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ ...initialForm });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [orden, setOrden] = useState("nombre");
  const { puede } = useRol();
  const [areaExpandida, setAreaExpandida] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [cargandoEmpleados, setCargandoEmpleados] = useState(false);

  useEffect(() => { fetchAreas(); }, []);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const res = await obtenerAreas();
      setAreas(res || []);
    } catch { setAreas([]); }
    finally { setLoading(false); }
  };

  const filtrados = areas
    .filter((a) =>
      `${a.nombre} ${a.piso} ${a.descripcion || ""}`.toLowerCase().includes(buscar.toLowerCase())
    )
    .sort((a, b) =>
      orden === "nombre"
        ? a.nombre.localeCompare(b.nombre)
        : a.piso - b.piso
    );

  const abrirCrear = () => {
    setEditando(null);
    setForm({ ...initialForm });
    setModal(true);
  };

  const abrirEditar = (area) => {
    setEditando(area);
    setForm({ nombre: area.nombre, piso: String(area.piso), descripcion: area.descripcion || "" });
    setModal(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.piso.trim()) return;
    setGuardando(true);
    try {
      if (editando) {
        await actualizarArea(editando.id, { ...form, piso: Number(form.piso) });
      } else {
        await crearArea({ ...form, piso: Number(form.piso) });
      }
      setModal(false);
      await fetchAreas();
    } catch (e) { alert(e.mensaje || "Error al guardar"); }
    finally { setGuardando(false); }
  };

  const eliminar = async () => {
    if (!confirmDelete) return;
    try {
      await eliminarArea(confirmDelete.id);
      setConfirmDelete(null);
      await fetchAreas();
    } catch (e) { alert(e.mensaje || "Error al eliminar"); }
  };

  const toggleEmpleados = async (area) => {
    if (areaExpandida?.id === area.id) {
      setAreaExpandida(null);
      setEmpleados([]);
      return;
    }
    setAreaExpandida(area);
    setCargandoEmpleados(true);
    try {
      const data = await obtenerEmpleadosPorArea(area.id);
      setEmpleados(data || []);
    } catch { setEmpleados([]); }
    finally { setCargandoEmpleados(false); }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
        <Box>
          <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>Inicio / Gestión / Áreas</Typography>
        </Box>
        {puede("areas", "crear") && (
          <Button variant="contained" startIcon={<Plus size={18} />}
            onClick={abrirCrear}
            sx={{ bgcolor: "#1B5E20", borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, px: 2.5, height: 42, "&:hover": { bgcolor: "#2E7D32" } }}>
            Nueva área
          </Button>
        )}
      </Box>

      {/* SEARCH + SORT */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField fullWidth placeholder="Buscar área..."
          value={buscar} onChange={(e) => setBuscar(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <Search size={18} style={{ color: "#9CA3AF", marginRight: 10 }} />,
              sx: { borderRadius: "10px", fontSize: 14, height: 42, bgcolor: "#F9FAFB" },
            },
          }}
          sx={{ maxWidth: 360 }}
        />
        <ToggleButtonGroup value={orden} exclusive size="small"
          onChange={(_, v) => v && setOrden(v)}
          sx={{ "& .MuiToggleButton-root": { borderRadius: "8px", border: "1px solid #ECECEC", px: 2, fontSize: 12, fontWeight: 600, textTransform: "none", color: "#6B7280", "&.Mui-selected": { bgcolor: "#E8F5E9", color: "#1B5E20", borderColor: "#A5D6A7" } } }}>
          <ToggleButton value="nombre"><SortAsc size={15} style={{ marginRight: 6 }} />A - Z</ToggleButton>
          <ToggleButton value="piso"><ArrowUpDown size={15} style={{ marginRight: 6 }} />Por piso</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* TABLE */}
      <Paper elevation={0} sx={{ borderRadius: "20px", border: "1px solid #ECECEC", overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {["Nombre", "Piso", "Descripción", "Acciones"].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 600, color: "#6B7280", fontSize: 12, bgcolor: "#F9FAFB", py: 1.5 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: "#9CA3AF", fontSize: 14 }}>Cargando...</TableCell>
                </TableRow>
              ) : filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: "#9CA3AF", fontSize: 14 }}>
                    {buscar ? "No se encontraron áreas" : "No hay áreas registradas"}
                  </TableCell>
                </TableRow>
) : (
                filtrados.map((a) => (
                  <TableRow key={a.id} sx={{ "&:hover": { bgcolor: "#F9FAFB" }, transition: "background .15s" }}>
                    <TableCell sx={{ py: 1.2, fontSize: 14, fontWeight: 600, color: "#111827" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <IconButton size="small" onClick={() => toggleEmpleados(a)}
                          sx={{ borderRadius: "6px", color: "#6B7280", p: 0.3 }}>
                          {areaExpandida?.id === a.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </IconButton>
                        <Building2 size={16} style={{ color: "#1B5E20" }} />
                        <Button onClick={() => navigate(`/empleados?area=${encodeURIComponent(a.nombre)}`)}
                          sx={{ textTransform: "none", p: 0, minWidth: 0, color: "#1565C0", fontWeight: 600, fontSize: 14, "&:hover": { textDecoration: "underline" } }}>
                          {a.nombre}
                        </Button>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.2 }}>
                      <Chip label={`Piso ${a.piso}`} size="small"
                        sx={{ height: 24, fontSize: 11, fontWeight: 600, bgcolor: "#E8F5E9", color: "#2E7D32" }} />
                    </TableCell>
                    <TableCell sx={{ py: 1.2, fontSize: 13, color: "#6B7280" }}>{a.descripcion || "—"}</TableCell>
                    <TableCell sx={{ py: 1.2 }}>
                      {puede("areas", "editar") && (
                        <IconButton size="small" sx={{ color: "#6B7280" }} onClick={() => abrirEditar(a)}>
                          <Edit2 size={15} />
                        </IconButton>
                      )}
                      {puede("areas", "eliminar") && (
                        <IconButton size="small" sx={{ color: "#DC2626" }} onClick={() => setConfirmDelete(a)}>
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

      {/* EMPLEADOS DEL ÁREA */}
      <Collapse in={areaExpandida !== null}>
        <Paper elevation={0} sx={{ mt: 2, borderRadius: "16px", border: "1px solid #ECECEC", overflow: "hidden" }}>
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: "#F9FAFB", borderBottom: "1px solid #ECECEC", display: "flex", alignItems: "center", gap: 1 }}>
            <Users size={16} style={{ color: "#1B5E20" }} />
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
              Empleados de {areaExpandida?.nombre || ""}
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#9CA3AF", ml: 1 }}>
              ({empleados.length} registros)
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {["Nombre", "Cédula", "Cargo", "Estado", "Teléfono", "Email"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 600, color: "#6B7280", fontSize: 11, py: 1 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {cargandoEmpleados ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "#9CA3AF" }}>Cargando empleados...</TableCell></TableRow>
                ) : empleados.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "#9CA3AF" }}>No hay empleados en esta área</TableCell></TableRow>
                ) : (
                  empleados.map((emp) => (
                    <TableRow key={emp.id} sx={{ "&:hover": { bgcolor: "#F9FAFB" } }}>
                      <TableCell sx={{ py: 1.2, fontSize: 13, fontWeight: 500, color: "#111827" }}>
                        {emp.nombre} {emp.apellido}
                      </TableCell>
                      <TableCell sx={{ py: 1.2, fontSize: 13, color: "#6B7280" }}>{emp.cedula}</TableCell>
                      <TableCell sx={{ py: 1.2, fontSize: 13, color: "#6B7280" }}>{emp.cargo}</TableCell>
                      <TableCell sx={{ py: 1.2 }}>
                        <Chip label={emp.estado === "activo" ? "Activo" : "Inactivo"} size="small"
                          sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: emp.estado === "activo" ? "#D1FAE5" : "#FEE2E2", color: emp.estado === "activo" ? "#065F46" : "#991B1B" }} />
                      </TableCell>
                      <TableCell sx={{ py: 1.2, fontSize: 13, color: "#6B7280" }}>{emp.telefono || "—"}</TableCell>
                      <TableCell sx={{ py: 1.2, fontSize: 13, color: "#6B7280" }}>{emp.email || "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Collapse>

      {/* MODAL CREAR/EDITAR */}
      <Dialog open={modal} onClose={() => setModal(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
          {editando ? "Editar área" : "Nueva área"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Nombre" value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            fullWidth slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
          <TextField label="Piso" type="number" value={form.piso}
            onChange={(e) => setForm({ ...form, piso: e.target.value })}
            fullWidth slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
          <TextField label="Descripción" value={form.descripcion} multiline rows={2}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            fullWidth slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { borderRadius: "10px", fontSize: 14 } } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setModal(false)}
            sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, color: "#6B7280" }}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={guardando || !form.nombre.trim() || !form.piso.trim()}
            sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}>
            {guardando ? "Guardando..." : editando ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONFIRMAR ELIMINAR */}
      <ConfirmDialog
        open={!!confirmDelete}
        titulo="Eliminar área"
        mensaje={`¿Estás seguro de eliminar "${confirmDelete?.nombre}"? Los empleados asignados a esta área quedarán sin área.`}
        onConfirm={eliminar}
        onCancel={() => setConfirmDelete(null)}
      />
    </Box>
  );
}
