import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Paper, TextField, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Collapse, FormControl, InputLabel, Select, MenuItem,
} from "@mui/material";
import { Plus, Edit2, Trash2, Search, Building2, Users, ChevronDown, ChevronRight, X, Building, Layers, MapPin } from "lucide-react";

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
  const tieneAcciones = puede("areas", "editar") || puede("areas", "eliminar");
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

      {/* TARJETAS RESUMEN */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2, mb: 3.5 }}>
        {[
          { icon: <Building size={20} />, value: areas.length, label: "Total áreas", color: "#1B5E20", bg: "#E8F5E9", onClick: () => { setBuscar(""); setOrden("nombre"); } },
          { icon: <MapPin size={20} />, value: new Set(areas.map((a) => a.piso).filter((p) => p !== undefined && p !== null)).size, label: "Pisos distintos", color: "#1565C0", bg: "#EFF6FF", onClick: () => setOrden("piso") },
          { icon: <Layers size={20} />, value: areas.filter((a) => a.descripcion?.trim()).length, label: "Con descripción", color: "#7C3AED", bg: "#F3E8FF", onClick: () => {} },
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
      <Paper elevation={0} sx={{ borderRadius: "20px", border: "1px solid #ECECEC", p: 2.5, mb: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 2, alignItems: "end" }}>
          <Box sx={{ display: "grid", gap: 0.6 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280" }}>Buscar área</Typography>
            <TextField placeholder="Nombre o piso..."
              value={buscar} onChange={(e) => setBuscar(e.target.value)}
              sx={{ width: "100%", minWidth: 200 }}
              slotProps={{
                input: {
                  startAdornment: <Search size={16} style={{ color: "#9CA3AF", marginRight: 6 }} />,
                  sx: { borderRadius: "10px", fontSize: 13, height: 40, py: 0, bgcolor: "#F9FAFB" },
                },
              }} />
          </Box>
          <Box sx={{ display: "grid", gap: 0.6 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280" }}>Piso</Typography>
            <Select value="todos" onChange={() => {}} size="small"
              sx={{ borderRadius: "10px", fontSize: 13, height: 40, minWidth: 120, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#ECECEC" } }}>
              <MenuItem value="todos">Todos</MenuItem>
              {[...new Set(areas.map((a) => a.piso).filter((p) => p !== undefined && p !== null))].sort((a, b) => a - b).map((p) => (
                <MenuItem key={p} value={p}>Piso {p}</MenuItem>
              ))}
            </Select>
          </Box>
          <Box sx={{ display: "grid", gap: 0.6 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280" }}>Ordenar</Typography>
            <Select value={orden} onChange={(e) => setOrden(e.target.value)} size="small"
              sx={{ borderRadius: "10px", fontSize: 13, height: 40, minWidth: 130, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#ECECEC" } }}>
              <MenuItem value="nombre">A - Z</MenuItem>
              <MenuItem value="piso">Por piso</MenuItem>
            </Select>
          </Box>
        </Box>
      </Paper>

      {/* TABLE */}
      <Paper elevation={0} sx={{ borderRadius: "20px", border: "1px solid #ECECEC", overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {["Nombre", "Piso", "Descripción", ...(tieneAcciones ? ["Acciones"] : [])].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 600, color: "#6B7280", fontSize: 12, bgcolor: "#F9FAFB", py: 1.5 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={tieneAcciones ? 4 : 3} align="center" sx={{ py: 6, color: "#9CA3AF", fontSize: 14 }}>Cargando...</TableCell>
                </TableRow>
              ) : filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tieneAcciones ? 4 : 3} align="center" sx={{ py: 6, color: "#9CA3AF", fontSize: 14 }}>
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
                          sx={{ textTransform: "none", p: 0, minWidth: 0, color: "#111827", fontWeight: 600, fontSize: 14, "&:hover": { textDecoration: "underline", color: "#1B5E20" } }}>
                          {a.nombre}
                        </Button>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.2 }}>
                      <Chip label={`Piso ${a.piso}`} size="small"
                        sx={{ height: 24, fontSize: 11, fontWeight: 600, bgcolor: "#E8F5E9", color: "#2E7D32" }} />
                    </TableCell>
                    <TableCell sx={{ py: 1.2, fontSize: 13, color: "#6B7280" }}>{a.descripcion || "—"}</TableCell>
                    {tieneAcciones && (
                      <TableCell sx={{ py: 1.2 }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          {puede("areas", "editar") && (
                            <Box onClick={() => abrirEditar(a)}
                              sx={{ width: 32, height: 32, borderRadius: "10px", bgcolor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#1565C0", cursor: "pointer", transition: "all 0.2s", "&:hover": { bgcolor: "#DBEAFE" } }}>
                              <Edit2 size={15} />
                            </Box>
                          )}
                          {puede("areas", "eliminar") && (
                            <Box onClick={() => setConfirmDelete(a)}
                              sx={{ width: 32, height: 32, borderRadius: "10px", bgcolor: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", color: "#DC2626", cursor: "pointer", transition: "all 0.2s", "&:hover": { bgcolor: "#FECACA" } }}>
                              <Trash2 size={15} />
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                    )}
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
        PaperProps={{ sx: { borderRadius: "16px", position: "relative" } }}
        sx={{ "& .MuiPaper-root": { backgroundColor: "#F0FDF4" } }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
          {editando ? "Editar área" : "Nueva área"}
          <IconButton onClick={() => setModal(false)} size="small" sx={{ position: "absolute", top: 8, right: 8, color: "#9CA3AF", "&:hover": { color: "#6B7280", bgcolor: "#F3F4F6" } }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Nombre" value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            fullWidth slotProps={{ inputLabel: { sx: { fontSize: 13 } } }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", "& fieldset": { borderColor: "#6B7280" }, "&:hover fieldset": { borderColor: "#374151" } } }} />
          <FormControl fullWidth>
            <InputLabel sx={{ fontSize: 13 }}>Piso</InputLabel>
            <Select value={form.piso} label="Piso"
              sx={{ borderRadius: "10px", fontSize: 14, "& fieldset": { borderColor: "#6B7280" }, "&:hover fieldset": { borderColor: "#374151" } }}
              onChange={(e) => setForm({ ...form, piso: e.target.value })}>
              <MenuItem value="1">Piso 1</MenuItem>
              <MenuItem value="2">Piso 2</MenuItem>
              <MenuItem value="3">Piso 3</MenuItem>
              <MenuItem value="4">Piso 4</MenuItem>
              <MenuItem value="5">Piso 5</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Descripción" value={form.descripcion} multiline rows={2}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            fullWidth slotProps={{ inputLabel: { sx: { fontSize: 13 } } }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", "& fieldset": { borderColor: "#6B7280" }, "&:hover fieldset": { borderColor: "#374151" } } }} />
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
