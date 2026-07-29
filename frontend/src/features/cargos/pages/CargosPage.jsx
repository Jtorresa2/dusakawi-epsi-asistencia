import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Paper, TextField, Typography, Select, MenuItem,
  Menu, MenuItem as MuiMenuItem, ListItemIcon, ListItemText, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip,
  Snackbar, Alert,
} from "@mui/material";
import {
  Search, Users, UserCheck, UserX, UserRound, Download, Plus,
  Copy, ToggleLeft, ToggleRight, Trash2, Users as UsersIcon, X,
} from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import Loading from "../../../shared/components/Loading";
import EmptyState from "../../../shared/components/EmptyState";
import CargoModal from "../components/CargoModal";
import CargoDetailModal from "../components/CargoDetailModal";
import { cargoColumns } from "../components/columns";
import {
  obtenerCargos,
  crearCargo,
  actualizarCargo,
} from "../cargo.api";
import { obtenerAreas } from "../../areas/area.api";
import useRol from "../../../shared/hooks/useRol";
import { exportarExcel } from "../../../shared/utils/exportarExcel";

const MOCK = [
  { id: 1, nombre: "Médico General", descripcion: "Atención médica general a pacientes", areas: "Alto Costo", empleados_count: 12, estado: "activo" },
  { id: 2, nombre: "Enfermero", descripcion: "Cuidado y asistencia de enfermería", areas: "Baja Complejidad", empleados_count: 8, estado: "activo" },
  { id: 3, nombre: "Psicólogo", descripcion: "Atención psicológica a pacientes", areas: "Psicología", empleados_count: 5, estado: "activo" },
  { id: 4, nombre: "Auxiliar Administrativo", descripcion: "Soporte administrativo general", areas: "Dirección Administrativa", empleados_count: 3, estado: "activo" },
  { id: 5, nombre: "Recepcionista", descripcion: "Atención al público y recepción", areas: "Recepción", empleados_count: 2, estado: "inactivo" },
  { id: 6, nombre: "Fisioterapeuta", descripcion: "Rehabilitación física de pacientes", areas: "Mediana y Alta Complejidad", empleados_count: 4, estado: "activo" },
  { id: 7, nombre: "Odontólogo", descripcion: "Atención odontológica general", areas: "PQR", empleados_count: 3, estado: "activo" },
  { id: 8, nombre: "Trabajador Social", descripcion: "Intervención social con pacientes", areas: "Intercultural", empleados_count: 2, estado: "inactivo" },
];

const ESTADOS = ["Todos", "Activo", "Inactivo"];
const AREAS_FALLBACK = ["Todas", "SIAU", "PQR", "Call Center", "Aseguramiento", "Autorización", "Psicología", "Recepción", "Transporte", "MIPRES", "Portabilidad", "Referencia", "Auditoría de Cuentas Médicas", "Radicación", "Archivo", "SARLAFT", "Contabilidad", "Presupuesto", "Cartera", "Recobro", "Dirección Administrativa", "Estadística", "Sistemas", "Tesorería", "Alto Costo", "Baja Complejidad", "Comunicación", "Dirección de Riesgos", "Mediana y Alta Complejidad", "PYM", "Talento Humano", "Calidad", "Gerencia", "Contratación", "Control Interno", "Intercultural", "Jurídica"];
const ORDENAR = ["Nombre A-Z", "Nombre Z-A", "Más empleados", "Menos empleados"];

export default function CargosPage() {
  const navigate = useNavigate();
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState([]);
  const [areasRaw, setAreasRaw] = useState([]);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroArea, setFiltroArea] = useState("Todas");
  const [orden, setOrden] = useState("Nombre A-Z");

  const [openModal, setOpenModal] = useState(false);
  const [cargoSeleccionado, setCargoSeleccionado] = useState(null);
  const [form, setForm] = useState({ nombre: "", descripcion: "", estado: "activo" });
  const [errors, setErrors] = useState({});

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuCargo, setMenuCargo] = useState(null);
  const [verCargo, setVerCargo] = useState(null);
  const [openExport, setOpenExport] = useState(false);
  const [snack, setSnack] = useState({ open: false, severity: "success", mensaje: "" });
  const { puede } = useRol();

  useEffect(() => { cargarCargos(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await obtenerAreas();
        const lista = Array.isArray(data) ? data : data.areas || [];
        const items = lista.map((a) => (typeof a === "string" ? { id: a, nombre: a } : a));
        setAreasRaw(items);
        setAreas(items.map((a) => a.nombre));
      } catch {
        setAreas(AREAS_FALLBACK.slice(1));
        setAreasRaw(AREAS_FALLBACK.slice(1).map((n) => ({ id: n, nombre: n })));
      }
    })();
  }, []);

  async function cargarCargos() {
    try {
      setLoading(true);
      const data = await obtenerCargos();
      setCargos(data && data.length > 0 ? data : MOCK);
    } catch {
      setCargos(MOCK);
    } finally {
      setLoading(false);
    }
  }

  function abrirNuevo() {
    setCargoSeleccionado(null);
    setForm({ nombre: "", descripcion: "", estado: "activo", area_id: "" });
    setErrors({});
    setOpenModal(true);
  }

  function abrirEditar(cargo) {
    setCargoSeleccionado(cargo);
    setForm({ nombre: cargo.nombre, descripcion: cargo.descripcion || "", estado: cargo.estado || "activo", area_id: cargo.area_id ?? "" });
    setErrors({});
    setOpenModal(true);
  }

  function cerrarModal() { setOpenModal(false); }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validar() {
    let nuevosErrores = {};
    if (!form.nombre.trim()) nuevosErrores.nombre = "El nombre es obligatorio";
    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function guardarCargo() {
    if (!validar()) return;
    try {
      if (cargoSeleccionado) {
        await actualizarCargo(cargoSeleccionado.id, form);
        setSnack({ open: true, severity: "success", mensaje: "Cargo actualizado correctamente" });
      } else {
        await crearCargo(form);
        setSnack({ open: true, severity: "success", mensaje: "Cargo creado correctamente" });
      }
      cerrarModal();
      cargarCargos();
    } catch (error) {
      console.error(error);
    }
  }

  function abrirVer(cargo) {
    setVerCargo(cargo);
  }

  async function duplicarCargo(cargo) {
    await crearCargo({ nombre: `${cargo.nombre} (copia)`, descripcion: cargo.descripcion, estado: cargo.estado });
    setMenuAnchor(null);
    setSnack({ open: true, severity: "success", mensaje: "Cargo duplicado correctamente" });
    cargarCargos();
  }

  async function toggleEstado(cargo) {
    const nuevoEstado = cargo.estado === "inactivo" ? "activo" : "inactivo";
    if (cargo.id) {
      await actualizarCargo(cargo.id, { nombre: cargo.nombre, descripcion: cargo.descripcion, estado: nuevoEstado });
    }
    setMenuAnchor(null);
    setSnack({ open: true, severity: "success", mensaje: `Cargo ${nuevoEstado === "activo" ? "activado" : "desactivado"} correctamente` });
    cargarCargos();
  }

  async function eliminarCargo(cargo) {
    setMenuAnchor(null);
    if (!window.confirm(`¿Eliminar el cargo "${cargo.nombre}"?`)) return;
    try {
      const { eliminarCargo: eliminar } = await import("../cargo.api");
      await eliminar(cargo.id);
      setSnack({ open: true, severity: "success", mensaje: "Cargo eliminado correctamente" });
      cargarCargos();
    } catch (error) {
      console.error(error);
    }
  }

  function handleMenuOpen(event, cargo) {
    setMenuAnchor(event.currentTarget);
    setMenuCargo(cargo);
  }

  function handleMenuClose() {
    setMenuAnchor(null);
    setMenuCargo(null);
  }

  let filtrados = cargos.filter((c) =>
    c.nombre?.toLowerCase().includes(search.toLowerCase())
  );

  if (filtroEstado !== "Todos") {
    const esActivo = filtroEstado === "Activo";
    filtrados = filtrados.filter((c) => esActivo ? c.estado !== "inactivo" : c.estado === "inactivo");
  }

  if (filtroArea !== "Todas") {
    filtrados = filtrados.filter((c) => c.areas?.includes(filtroArea));
  }

  switch (orden) {
    case "Nombre Z-A": filtrados = [...filtrados].sort((a, b) => (b.nombre || "").localeCompare(a.nombre || "")); break;
    case "Más empleados": filtrados = [...filtrados].sort((a, b) => (b.empleados_count || 0) - (a.empleados_count || 0)); break;
    case "Menos empleados": filtrados = [...filtrados].sort((a, b) => (a.empleados_count || 0) - (b.empleados_count || 0)); break;
    default: filtrados = [...filtrados].sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }

  const total = cargos.length;
  const activos = cargos.filter((c) => c.estado !== "inactivo").length;
  const inactivos = cargos.filter((c) => c.estado === "inactivo").length;
  const promedio = total > 0 ? (cargos.reduce((s, c) => s + (c.empleados_count || 0), 0) / total).toFixed(1) : "0";

  const cards = [
    { icon: <Users size={20} />, value: total, label: "Total cargos", color: "#1B5E20", bg: "#E8F5E9", onClick: () => { setFiltroEstado("Todos"); setFiltroArea("Todas"); setOrden("Nombre A-Z"); setSearch(""); } },
    { icon: <UserCheck size={20} />, value: activos, label: "Cargos activos", color: "#1565C0", bg: "#EFF6FF", onClick: () => setFiltroEstado("Activo") },
    { icon: <UserX size={20} />, value: inactivos, label: "Cargos inactivos", color: "#DC2626", bg: "#FEE2E2", onClick: () => setFiltroEstado("Inactivo") },
    { icon: <UserRound size={20} />, value: promedio, label: "Promedio empleados", color: "#7C3AED", bg: "#F3E8FF", onClick: () => setOrden("Más empleados") },
  ];

  if (loading) return <Loading />;

  return (
    <Box sx={{ p: 3, bgcolor: "#F5F7F8", minHeight: "100vh" }}>
      {/* 1. ENCABEZADO */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
        <Box>
          <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>
            Inicio / Gestión / Cargos
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={abrirNuevo}
          sx={{
            bgcolor: "#1B5E20", borderRadius: "12px", textTransform: "none",
            fontWeight: 600, fontSize: 14, px: 3.5, py: 1.2, height: 44,
            "&:hover": { bgcolor: "#2E7D32" },
          }}
        >
          Nuevo cargo
        </Button>
      </Box>

      {/* 2. TARJETAS RESUMEN */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3.5 }}>
        {cards.map((card, i) => (
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

      {/* 3. BARRA DE FILTROS */}
      <Paper elevation={0} sx={{ borderRadius: "20px", border: "1px solid #ECECEC", p: 2.5, mb: 3 }}>
        <Box sx={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto auto auto",
          gap: 2,
          alignItems: "end",
        }}>
          <Box sx={{ display: "grid", gap: 0.6 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280" }}>
              Buscar por cargo
            </Typography>
            <TextField
              placeholder="Escribe un cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: "100%", minWidth: 180 }}
              slotProps={{
                input: {
                  startAdornment: <Search size={16} style={{ color: "#9CA3AF", marginRight: 6 }} />,
                  sx: { borderRadius: "10px", fontSize: 13, height: 40, py: 0, bgcolor: "#F9FAFB" },
                },
              }}
            />
          </Box>
          <Box sx={{ display: "grid", gap: 0.6 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280" }}>
              Estado
            </Typography>
            <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} size="small"
              sx={{ borderRadius: "10px", fontSize: 13, height: 40, minWidth: 120, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#ECECEC" } }}>
              {ESTADOS.map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
            </Select>
          </Box>
          <Box sx={{ display: "grid", gap: 0.6 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280" }}>
              Área
            </Typography>
            <Select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} size="small"
              sx={{ borderRadius: "10px", fontSize: 13, height: 40, minWidth: 140, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#ECECEC" } }}>
              {["Todas", ...areas].map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </Select>
          </Box>
          <Box sx={{ display: "grid", gap: 0.6 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280" }}>
              Ordenar por
            </Typography>
            <Select value={orden} onChange={(e) => setOrden(e.target.value)} size="small"
              sx={{ borderRadius: "10px", fontSize: 13, height: 40, minWidth: 150, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#ECECEC" } }}>
              {ORDENAR.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </Select>
          </Box>
          <Box sx={{ display: "grid", gap: 0.6, justifySelf: "end" }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280" }}>
              &nbsp;
            </Typography>
            <Button variant="outlined" startIcon={<Download size={16} />} onClick={() => setOpenExport(true)}
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 2.5, color: "#6B7280", borderColor: "#ECECEC",
                "&:hover": { borderColor: "#1B5E20", color: "#1B5E20", bgcolor: "#F9FAFB" } }}>
              Exportar
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* 4. TABLA */}
      <Paper elevation={0} sx={{ borderRadius: "20px", border: "1px solid #ECECEC", overflow: "hidden" }}>
        {filtrados.length === 0 ? (
          <EmptyState mensaje={search ? "No se encontraron cargos" : "No hay cargos registrados"} />
        ) : (
          <DataTable
            rows={filtrados}
            columns={cargoColumns({ onEditar: abrirEditar, onVer: abrirVer, onMenuOpen: handleMenuOpen, onNombreClick: (row) => navigate(`/empleados?cargo=${encodeURIComponent(row.nombre || "")}`) })}
            loading={loading}
            getRowHeight={() => "auto"}
          />
        )}
      </Paper>

      {/* 5. MENÚ CONTEXTUAL */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        slotProps={{
          paper: { sx: { borderRadius: "12px", boxShadow: "0 8px 30px rgba(0,0,0,.12)", minWidth: 200 } },
        }}
      >
        <MuiMenuItem onClick={() => { navigate(`/empleados?cargo=${encodeURIComponent(menuCargo?.nombre || "")}`); handleMenuClose(); }} sx={{ fontSize: 13, py: 1.2 }}>
          <ListItemIcon><UsersIcon size={16} /></ListItemIcon>
          <ListItemText>Ver empleados asignados</ListItemText>
        </MuiMenuItem>
        <MuiMenuItem onClick={() => { duplicarCargo(menuCargo); }} sx={{ fontSize: 13, py: 1.2 }}>
          <ListItemIcon><Copy size={16} /></ListItemIcon>
          <ListItemText>Duplicar cargo</ListItemText>
        </MuiMenuItem>
        <MuiMenuItem onClick={() => { toggleEstado(menuCargo); }} sx={{ fontSize: 13, py: 1.2 }}>
          <ListItemIcon>
            {menuCargo?.estado === "inactivo" ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          </ListItemIcon>
          <ListItemText>{menuCargo?.estado === "inactivo" ? "Activar" : "Desactivar"}</ListItemText>
        </MuiMenuItem>
        {puede("cargos", "eliminar") && (
          <>
            <Divider />
            <MuiMenuItem onClick={() => { eliminarCargo(menuCargo); }} sx={{ fontSize: 13, py: 1.2, color: "#DC2626" }}>
              <ListItemIcon sx={{ color: "#DC2626" }}><Trash2 size={16} /></ListItemIcon>
              <ListItemText>Eliminar</ListItemText>
            </MuiMenuItem>
          </>
        )}
      </Menu>

      {/* 6. MODAL NUEVO/EDITAR */}
      <CargoModal
        open={openModal}
        onClose={cerrarModal}
        onGuardar={guardarCargo}
        cargo={cargoSeleccionado}
        form={form}
        errors={errors}
        onChange={handleChange}
        areas={areasRaw}
      />

      {/* 7. MODAL VER DETALLE */}
      <CargoDetailModal
        open={Boolean(verCargo)}
        onClose={() => setVerCargo(null)}
        cargo={verCargo}
      />

      {/* 8. MODAL EXPORTAR */}
      <Dialog open={openExport} onClose={() => setOpenExport(false)} maxWidth="md" fullWidth
        sx={{ "& .MuiPaper-root": { backgroundColor: "#E8F5E9" } }}
        PaperProps={{ sx: { borderRadius: "16px", position: "relative" } }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
          Exportar cargos ({filtrados.length})
          <IconButton onClick={() => setOpenExport(false)} size="small" sx={{ position: "absolute", top: 8, right: 8, color: "#9CA3AF", "&:hover": { bgcolor: "#F3F4F6" } }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Nombre", "Descripción", "Área", "Empleados", "Estado"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 8px", borderBottom: "2px solid #E5E7EB", fontWeight: 600, color: "#6B7280", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(r => (
                <tr key={r.id}>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #F3F4F6", fontWeight: 500, color: "#111827" }}>{r.nombre}</td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #F3F4F6", color: "#6B7280" }}>{r.descripcion || "—"}</td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #F3F4F6", color: "#6B7280" }}>{r.areas || "—"}</td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #F3F4F6", color: "#6B7280" }}>{r.empleados_count ?? 0}</td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #F3F4F6" }}>
                    <Chip label={r.estado === "inactivo" ? "Inactivo" : "Activo"} size="small"
                      sx={{ borderRadius: "8px", fontSize: 11, fontWeight: 600, bgcolor: r.estado === "inactivo" ? "#FEE2E2" : "#D1FAE5", color: r.estado === "inactivo" ? "#991B1B" : "#065F46" }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setOpenExport(false)}
            sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, color: "#6B7280" }}>Cancelar</Button>
          <Button variant="contained" startIcon={<Download size={16} />} onClick={() => {
            exportarExcel(filtrados.map(r => ({ Nombre: r.nombre, Descripción: r.descripcion || "", Área: r.areas || "", Empleados: r.empleados_count ?? 0, Estado: r.estado === "inactivo" ? "Inactivo" : "Activo" })), "Cargos");
            setOpenExport(false);
          }} sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}>
            Descargar Excel
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} variant="filled" sx={{ borderRadius: "10px" }}>{snack.mensaje}</Alert>
      </Snackbar>
    </Box>
  );
}
