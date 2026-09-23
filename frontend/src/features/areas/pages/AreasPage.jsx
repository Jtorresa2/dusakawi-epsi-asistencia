import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Paper, TextField, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  Collapse, FormControl, InputLabel, Select, MenuItem,
  Snackbar, Alert,
} from "@mui/material";
import { Plus, Edit2, Trash2, Search, Building2, Users, ChevronDown, ChevronRight, X, Building, Layers, MapPin } from "lucide-react";

import { obtenerAreas, crearArea, actualizarArea, eliminarArea, obtenerEmpleadosPorArea } from "../area.api";
import useRol from "../../../shared/hooks/useRol";
import ConfirmDialog from "../../../shared/components/ConfirmDialog";
import { COLORES } from "../../../shared/constants/colores.js";

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
  const [snack, setSnack] = useState({ open: false, severity: "success", mensaje: "" });

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
        setSnack({ open: true, severity: "success", mensaje: "Área actualizada correctamente" });
      } else {
        await crearArea({ ...form, piso: Number(form.piso) });
        setSnack({ open: true, severity: "success", mensaje: "Área creada correctamente" });
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
      setSnack({ open: true, severity: "success", mensaje: "Área eliminada correctamente" });
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
          <Typography sx={{ fontSize: 13, color: COLORES.textoMuted }}>Inicio / Gestión de mantenimiento / Áreas</Typography>
        </Box>
        {puede("areas", "crear") && (
          <Button variant="contained" startIcon={<Plus size={18} />}
            onClick={abrirCrear}
            sx={{ bgcolor: COLORES.primarioOscuro, borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, px: 2.5, height: 42, "&:hover": { bgcolor: COLORES.primario } }}>
            Nueva área
          </Button>
        )}
      </Box>

      {/* TARJETAS RESUMEN */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2, mb: 3.5 }}>
        {[
          { icon: <Building size={20} />, value: areas.length, label: "Total áreas", color: COLORES.primarioOscuro, bg: COLORES.primarioClaro, onClick: () => { setBuscar(""); setOrden("nombre"); } },
          { icon: <MapPin size={20} />, value: new Set(areas.map((a) => a.piso).filter((p) => p !== undefined && p !== null)).size, label: "Pisos distintos", color: COLORES.primarioOscuro, bg: COLORES.primarioClaro, onClick: () => setOrden("piso") },
          { icon: <Layers size={20} />, value: areas.filter((a) => a.descripcion?.trim()).length, label: "Con descripción", color: COLORES.primario, bg: COLORES.primarioClaro, onClick: () => {} },
        ].map((card, i) => (
          <Paper key={i} elevation={0} onClick={card.onClick}
            sx={{ p: 2, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", transition: "all .25s ease", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 15px rgba(0,0,0,.06)" } }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>
              {card.icon}
            </Box>
            <Box>
              <Typography sx={{ fontSize: 10, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase", letterSpacing: "0.03em" }}>{card.label}</Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 700, color: card.color, lineHeight: 1.2 }}>{card.value}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* BARRA DE FILTROS */}
      <Paper elevation={0} sx={{ borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}`, p: 2.5, mb: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr auto auto" }, gap: 2, alignItems: "end" }}>
          <Box sx={{ display: "grid", gap: 0.6 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: COLORES.textoTerciario }}>Buscar área</Typography>
            <TextField aria-label="Buscar área" placeholder="Nombre o piso..."
              value={buscar} onChange={(e) => setBuscar(e.target.value)}
              sx={{ width: "100%", minWidth: 200 }}
              slotProps={{
                input: {
                  startAdornment: <Search size={16} style={{ color: COLORES.textoSuave, marginRight: 6 }} />,
                  sx: { borderRadius: "10px", fontSize: 13, height: 40, py: 0, bgcolor: COLORES.fondoGris },
                },
              }} />
          </Box>
          <Box sx={{ display: "grid", gap: 0.6 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: COLORES.textoTerciario }}>Piso</Typography>
            <Select aria-label="Piso" value="todos" onChange={() => {}} size="small"
              sx={{ borderRadius: "10px", fontSize: 13, height: 40, minWidth: 120, bgcolor: COLORES.fondoGris, "& fieldset": { borderColor: COLORES.grisContorno } }}>
              <MenuItem value="todos">Todos</MenuItem>
              {[...new Set(areas.map((a) => a.piso).filter((p) => p !== undefined && p !== null))].sort((a, b) => a - b).map((p) => (
                <MenuItem key={p} value={p}>Piso {p}</MenuItem>
              ))}
            </Select>
          </Box>
          <Box sx={{ display: "grid", gap: 0.6 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: COLORES.textoTerciario }}>Ordenar</Typography>
            <Select aria-label="Ordenar" value={orden} onChange={(e) => setOrden(e.target.value)} size="small"
              sx={{ borderRadius: "10px", fontSize: 13, height: 40, minWidth: 130, bgcolor: COLORES.fondoGris, "& fieldset": { borderColor: COLORES.grisContorno } }}>
              <MenuItem value="nombre">A - Z</MenuItem>
              <MenuItem value="piso">Por piso</MenuItem>
            </Select>
          </Box>
        </Box>
      </Paper>

      {/* TABLE */}
      <Paper elevation={0} sx={{ borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}`, overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {["Nombre", "Piso", "Descripción", ...(tieneAcciones ? ["Acciones"] : [])].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 600, color: COLORES.textoTerciario, fontSize: 12, bgcolor: COLORES.fondoGris, py: 1.5 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={tieneAcciones ? 4 : 3} align="center" sx={{ py: 6, color: COLORES.textoSuave, fontSize: 14 }}>Cargando...</TableCell>
                </TableRow>
              ) : filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tieneAcciones ? 4 : 3} align="center" sx={{ py: 6, color: COLORES.textoSuave, fontSize: 14 }}>
                    {buscar ? "No se encontraron áreas" : "No hay áreas registradas"}
                  </TableCell>
                </TableRow>
) : (
                filtrados.map((a) => (
                  <TableRow key={a.id} sx={{ "&:hover": { bgcolor: COLORES.fondoGris }, transition: "background .15s" }}>
                    <TableCell sx={{ py: 1.2, fontSize: 14, fontWeight: 600, color: COLORES.textoPrimario }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <IconButton aria-label="Mostrar empleados" size="small" onClick={() => toggleEmpleados(a)}
                          sx={{ borderRadius: "6px", color: COLORES.textoTerciario, p: 0.3 }}>
                          {areaExpandida?.id === a.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </IconButton>
                        <Building2 size={16} style={{ color: COLORES.primarioOscuro }} />
                        <Button onClick={() => navigate(`/empleados?area=${encodeURIComponent(a.nombre)}`)}
                          sx={{ textTransform: "none", p: 0, minWidth: 0, color: COLORES.textoPrimario, fontWeight: 600, fontSize: 14, "&:hover": { textDecoration: "underline", color: COLORES.primarioOscuro } }}>
                          {a.nombre}
                        </Button>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.2 }}>
                      <Chip label={`Piso ${a.piso}`} size="small"
                        sx={{ height: 24, fontSize: 11, fontWeight: 600, bgcolor: COLORES.primarioClaro, color: COLORES.primario }} />
                    </TableCell>
                    <TableCell sx={{ py: 1.2, fontSize: 13, color: COLORES.textoTerciario }}>{a.descripcion || "—"}</TableCell>
                    {tieneAcciones && (
                      <TableCell sx={{ py: 1.2 }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          {puede("areas", "editar") && (
                            <Box onClick={() => abrirEditar(a)}
                              sx={{ width: 32, height: 32, borderRadius: "10px", bgcolor: COLORES.primarioClaro, display: "flex", alignItems: "center", justifyContent: "center", color: COLORES.primario, cursor: "pointer", transition: "all 0.2s", "&:hover": { bgcolor: COLORES.primarioClaro2 } }}>
                              <Edit2 size={15} />
                            </Box>
                          )}
                          {puede("areas", "eliminar") && (
                            <Box onClick={() => setConfirmDelete(a)}
                              sx={{ width: 32, height: 32, borderRadius: "10px", bgcolor: COLORES.dangerFondo, display: "flex", alignItems: "center", justifyContent: "center", color: COLORES.danger, cursor: "pointer", transition: "all 0.2s", "&:hover": { bgcolor: COLORES.dangerBorde } }}>
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
        <Paper elevation={0} sx={{ mt: 2, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}`, overflow: "hidden" }}>
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: COLORES.fondoGris, borderBottom: `1px solid ${COLORES.grisContorno}`, display: "flex", alignItems: "center", gap: 1 }}>
            <Users size={16} style={{ color: COLORES.primarioOscuro }} />
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORES.textoPrimario }}>
              Empleados de {areaExpandida?.nombre || ""}
            </Typography>
            <Typography sx={{ fontSize: 12, color: COLORES.textoSuave, ml: 1 }}>
              ({empleados.length} registros)
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {["Nombre", "Cédula", "Cargo", "Estado", "Teléfono", "Email"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 600, color: COLORES.textoTerciario, fontSize: 11, py: 1 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {cargandoEmpleados ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: COLORES.textoSuave }}>Cargando empleados...</TableCell></TableRow>
                ) : empleados.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: COLORES.textoSuave }}>No hay empleados en esta área</TableCell></TableRow>
                ) : (
                  empleados.map((emp) => (
                    <TableRow key={emp.id} sx={{ "&:hover": { bgcolor: COLORES.fondoGris } }}>
                      <TableCell sx={{ py: 1.2, fontSize: 13, fontWeight: 500, color: COLORES.textoPrimario }}>
                        {emp.nombre} {emp.apellido}
                      </TableCell>
                      <TableCell sx={{ py: 1.2, fontSize: 13, color: COLORES.textoTerciario }}>{emp.cedula}</TableCell>
                      <TableCell sx={{ py: 1.2, fontSize: 13, color: COLORES.textoTerciario }}>{emp.cargo}</TableCell>
                      <TableCell sx={{ py: 1.2 }}>
                        <Chip label={emp.estado === "activo" ? "Activo" : "Inactivo"} size="small"
                          sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: emp.estado === "activo" ? COLORES.successFondo : COLORES.dangerFondo, color: emp.estado === "activo" ? COLORES.verdeTexto : COLORES.dangerOscuro }} />
                      </TableCell>
                      <TableCell sx={{ py: 1.2, fontSize: 13, color: COLORES.textoTerciario }}>{emp.telefono || "—"}</TableCell>
                      <TableCell sx={{ py: 1.2, fontSize: 13, color: COLORES.textoTerciario }}>{emp.email || "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Collapse>

      {/* MODAL CREAR/EDITAR */}
      <Dialog open={modal} onClose={() => setModal(false)} maxWidth="md" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "18px", position: "relative", boxShadow: "0 24px 70px rgba(0,0,0,0.25)", backgroundColor: COLORES.fondoBlanco, maxHeight: "94vh" } } }}
        sx={{ "& .MuiBackdrop-root": { bgcolor: "rgba(17, 24, 39, 0.5)", backdropFilter: "blur(4px)" } }}>
        <DialogTitle sx={{ px: 3, py: 1.75, position: "relative", pb: 1.25 }}>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Box sx={{ width: 38, height: 38, borderRadius: "11px", bgcolor: COLORES.primarioClaro, color: COLORES.primarioOscuro, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Building2 size={19} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: COLORES.textoPrimario, lineHeight: 1.2 }}>
                {editando ? "Editar área" : "Nueva área"}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: COLORES.textoTerciario, mt: 0.15 }}>
                {editando ? "Actualiza la información del área." : "Crea una nueva área organizacional para clasificar a los colaboradores."}
              </Typography>
            </Box>
          </Box>
          <IconButton aria-label="Cerrar" onClick={() => setModal(false)} size="small" sx={{ position: "absolute", top: 11, right: 11, color: COLORES.textoSuave, bgcolor: COLORES.fondoGris2, "&:hover": { color: COLORES.textoPrimario, bgcolor: COLORES.grisContorno } }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 1.75, overflowY: "auto", bgcolor: COLORES.fondoBlanco }}>
          <Box sx={{ border: `1px solid ${COLORES.grisContorno}`, borderRadius: "12px", bgcolor: COLORES.fondoBlanco, p: 2 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: COLORES.textoPrimario, mb: 1.25 }}>
              Información del área
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                    Nombre <span style={{ color: COLORES.danger }}>*</span>
                  </Typography>
                  <TextField placeholder="Ej: Recursos Humanos" value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    fullWidth size="small"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: COLORES.fondoBlanco, minHeight: 40, transition: "border-color 0.2s ease, box-shadow 0.2s ease", "& fieldset": { borderColor: COLORES.borde2 }, "&:hover fieldset": { borderColor: COLORES.textoSuave }, "&.Mui-focused fieldset": { borderColor: COLORES.primarioOscuro }, "&.Mui-focused": { boxShadow: "0 0 0 4px rgba(27, 94, 32, 0.10)" } }, "& .MuiInputBase-input": { fontSize: 13 } }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                    Piso
                  </Typography>
                  <Select value={form.piso} fullWidth size="small"
                    displayEmpty
                    sx={{ borderRadius: "12px", fontSize: 13, bgcolor: COLORES.fondoBlanco, minHeight: 40, transition: "border-color 0.2s ease, box-shadow 0.2s ease", "& fieldset": { borderColor: COLORES.borde2 }, "&:hover fieldset": { borderColor: COLORES.textoSuave }, "&.Mui-focused fieldset": { borderColor: COLORES.primarioOscuro }, "&.Mui-focused": { boxShadow: "0 0 0 4px rgba(27, 94, 32, 0.10)" } }}
                    slotProps={{ menu: { slotProps: { paper: { sx: { bgcolor: COLORES.fondoBlanco, "& .MuiMenuItem-root": { borderRadius: 1, mx: 0.5 } } } } } }}
                    onChange={(e) => setForm({ ...form, piso: e.target.value })}>
                    <MenuItem value="" disabled><em>Selecciona un piso</em></MenuItem>
                    <MenuItem value="1">Piso 1</MenuItem>
                    <MenuItem value="2">Piso 2</MenuItem>
                    <MenuItem value="3">Piso 3</MenuItem>
                    <MenuItem value="4">Piso 4</MenuItem>
                    <MenuItem value="5">Piso 5</MenuItem>
                  </Select>
                  <Typography sx={{ fontSize: 10.5, color: COLORES.textoSuave, mt: 0.5 }}>
                    Selecciona el piso donde se encuentra ubicada esta área.
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                  Descripción
                </Typography>
                <TextField placeholder="Describe brevemente el propósito o funciones del área."
                  value={form.descripcion} multiline rows={4}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  fullWidth
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: COLORES.fondoBlanco, transition: "border-color 0.2s ease, box-shadow 0.2s ease", "& fieldset": { borderColor: COLORES.borde2 }, "&:hover fieldset": { borderColor: COLORES.textoSuave }, "&.Mui-focused fieldset": { borderColor: COLORES.primarioOscuro }, "&.Mui-focused": { boxShadow: "0 0 0 4px rgba(27, 94, 32, 0.10)" } }, "& .MuiInputBase-input": { fontSize: 13 } }} />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5, gap: 1.5 }}>
          <Button onClick={() => setModal(false)}
            sx={{ borderRadius: "9px", textTransform: "none", fontSize: 12.5, fontWeight: 600, color: COLORES.textoTerciario, bgcolor: COLORES.fondoBlanco, border: `1px solid ${COLORES.borde2}`, px: 3, py: 0.6, "&:hover": { bgcolor: COLORES.fondoGris2 } }}>Cancelar</Button>
          <Button variant="contained" startIcon={editando ? null : <Plus size={15} />} onClick={guardar} disabled={guardando || !form.nombre.trim() || !form.piso.trim()}
            sx={{ borderRadius: "9px", textTransform: "none", fontSize: 12.5, fontWeight: 600, px: 3.5, py: 0.6, bgcolor: COLORES.primarioOscuro, "&:hover": { bgcolor: COLORES.primario } }}>
            {guardando ? "Guardando..." : editando ? "Actualizar área" : "Crear área"}
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

      {/* SNACKBAR */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} variant="filled" sx={{ borderRadius: "10px" }}>{snack.mensaje}</Alert>
      </Snackbar>
    </Box>
  );
}
