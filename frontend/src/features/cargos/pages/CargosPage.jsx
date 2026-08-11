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
  Eye, Edit3, MoreVertical,
} from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import Loading from "../../../shared/components/Loading";
import EmptyState from "../../../shared/components/EmptyState";
import IconBox from "../../../shared/components/IconBox";
import CargoModal from "../components/CargoModal";
import CargoDetailModal from "../components/CargoDetailModal";
import {
  obtenerCargos,
  crearCargo,
  actualizarCargo,
  eliminarCargo,
} from "../cargo.api";
import { obtenerAreas } from "../../areas/area.api";
import useRol from "../../../shared/hooks/useRol";
import { exportarExcel } from "../../../shared/utils/exportarExcel";
import { COLORES } from "../../../shared/constants/colores.js";

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

const btnBase = {
  width: 32, height: 32, borderRadius: "8px", border: "none",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", flexShrink: 0, transition: "all .2s ease",
};

const cargoColumns = ({ onEditar, onVer, onMenuOpen, onNombreClick }) => [
  {
    field: "nombre",
    headerName: "Cargo",
    flex: 2,
    minWidth: 160,
    renderCell: ({ row }) => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%", minWidth: 0, overflow: "hidden" }}>
        <IconBox icon={<UserRound />} color={COLORES.primario} size={36} iconSize={18} sx={{ flexShrink: 0 }} />
        <Button
          onClick={(e) => { e.stopPropagation(); onNombreClick?.(row); }}
          sx={{
            fontSize: 14, fontWeight: 600, color: COLORES.textoPrimario, textTransform: "none",
            p: 0, minWidth: 0, textAlign: "left", lineHeight: 1.3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            display: "block",
            "&:hover": { color: COLORES.primarioOscuro, bgcolor: "transparent" },
          }}
        >
          {row.nombre}
        </Button>
      </Box>
    ),
  },
  {
    field: "areas",
    headerName: "Área",
    flex: 1,
    minWidth: 100,
    renderCell: ({ row }) => {
      const area = row.areas || row.area;
      const label = area && typeof area === "object" ? (area.nombre || area.name) : area;
      return (
        <Typography sx={{ fontSize: 13, color: COLORES.textoTerciario, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label || "—"}
        </Typography>
      );
    },
  },
  {
    field: "descripcion",
    headerName: "Descripción",
    flex: 1.5,
    minWidth: 120,
    renderCell: ({ row }) => (
      <Typography
        sx={{
          fontSize: 13,
          color: COLORES.textoTerciario,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {row.descripcion || "—"}
      </Typography>
    ),
  },
  {
    field: "empleados_count",
    headerName: "Empleados",
    flex: 0.5,
    minWidth: 80,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => (
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORES.textoPrimario }}>
        {row.empleados_count ?? "—"}
      </Typography>
    ),
  },
  {
    field: "estado",
    headerName: "Estado",
    flex: 0.5,
    minWidth: 80,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => {
      const activo = row.estado !== "inactivo";
      return (
        <Chip
          label={activo ? "Activo" : "Inactivo"}
          size="small"
          sx={{
            height: 24,
            fontSize: 11,
            fontWeight: 600,
            bgcolor: activo ? COLORES.primarioClaro : COLORES.dangerFondo,
            color: activo ? COLORES.primarioOscuro : COLORES.danger,
          }}
        />
      );
    },
  },
  {
    field: "acciones",
    headerName: "Acciones",
    width: 120,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => (
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
        <Box
          sx={{ ...btnBase, bgcolor: COLORES.primarioClaro, color: COLORES.primario, "&:hover": { bgcolor: COLORES.primarioClaro2 } }}
          title="Editar"
          onClick={(e) => {
            e.stopPropagation();
            onEditar(row);
          }}
        >
          <Edit3 size={15} />
        </Box>
        <Box
          sx={{ ...btnBase, bgcolor: COLORES.primarioClaro, color: COLORES.primario, "&:hover": { bgcolor: COLORES.primarioClaro2 } }}
          title="Ver"
          onClick={(e) => {
            e.stopPropagation();
            onVer(row);
          }}
        >
          <Eye size={15} />
        </Box>
        <Box
          sx={{ ...btnBase, bgcolor: COLORES.primarioClaro, color: COLORES.primario, "&:hover": { bgcolor: COLORES.primarioClaro2 } }}
          title="Más opciones"
          onClick={(e) => {
            e.stopPropagation();
            onMenuOpen(e, row);
          }}
        >
          <MoreVertical size={15} />
        </Box>
      </Box>
    ),
  },
];

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
      await eliminarCargo(cargo.id);
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
    { icon: <Users size={20} />, value: total, label: "Total cargos", color: COLORES.primarioOscuro, bg: COLORES.primarioClaro, onClick: () => { setFiltroEstado("Todos"); setFiltroArea("Todas"); setOrden("Nombre A-Z"); setSearch(""); } },
    { icon: <UserCheck size={20} />, value: activos, label: "Cargos activos", color: COLORES.primarioOscuro, bg: COLORES.primarioClaro, onClick: () => setFiltroEstado("Activo") },
    { icon: <UserX size={20} />, value: inactivos, label: "Cargos inactivos", color: COLORES.danger, bg: COLORES.dangerFondo, onClick: () => setFiltroEstado("Inactivo") },
    { icon: <UserRound size={20} />, value: promedio, label: "Promedio empleados", color: COLORES.primario, bg: COLORES.primarioClaro, onClick: () => setOrden("Más empleados") },
  ];

  if (loading) return <Loading />;

  return (
    <Box sx={{ p: 3, bgcolor: COLORES.grisAzulado, minHeight: "100vh" }}>
      {/* 1. ENCABEZADO */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
        <Box>
          <Typography sx={{ fontSize: 13, color: COLORES.textoMuted }}>
            Inicio / Gestión de mantenimiento / Cargos
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={abrirNuevo}
          sx={{
            bgcolor: COLORES.primarioOscuro, borderRadius: "12px", textTransform: "none",
            fontWeight: 600, fontSize: 14, px: 3.5, py: 1.2, height: 44,
            "&:hover": { bgcolor: COLORES.primario },
          }}
        >
          Nuevo cargo
        </Button>
      </Box>

      {/* 2. TARJETAS RESUMEN */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3.5 }}>
        {cards.map((card, i) => (
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

      {/* 3. BARRA DE FILTROS */}
      <Paper elevation={0} sx={{ borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}`, p: 2.5, mb: 3 }}>
        <Box sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr auto auto auto auto" },
          gap: 2,
          alignItems: "end",
        }}>
          <Box sx={{ display: "grid", gap: 0.6 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: COLORES.textoTerciario }}>
              Buscar por cargo
            </Typography>
            <TextField
              aria-label="Buscar cargo"
              placeholder="Escribe un cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: "100%", minWidth: 180 }}
              slotProps={{
                input: {
                  startAdornment: <Search size={16} style={{ color: COLORES.textoSuave, marginRight: 6 }} />,
                  sx: { borderRadius: "10px", fontSize: 13, height: 40, py: 0, bgcolor: COLORES.fondoGris },
                },
              }}
            />
          </Box>
          <Box sx={{ display: "grid", gap: 0.6 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: COLORES.textoTerciario }}>
              Estado
            </Typography>
            <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} size="small"
              sx={{ borderRadius: "10px", fontSize: 13, height: 40, minWidth: 120, bgcolor: COLORES.fondoGris, "& fieldset": { borderColor: COLORES.grisContorno } }}>
              {ESTADOS.map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
            </Select>
          </Box>
          <Box sx={{ display: "grid", gap: 0.6 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: COLORES.textoTerciario }}>
              Área
            </Typography>
            <Select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} size="small"
              sx={{ borderRadius: "10px", fontSize: 13, height: 40, minWidth: 140, bgcolor: COLORES.fondoGris, "& fieldset": { borderColor: COLORES.grisContorno } }}>
              {["Todas", ...areas].map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </Select>
          </Box>
          <Box sx={{ display: "grid", gap: 0.6 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: COLORES.textoTerciario }}>
              Ordenar por
            </Typography>
            <Select value={orden} onChange={(e) => setOrden(e.target.value)} size="small"
              sx={{ borderRadius: "10px", fontSize: 13, height: 40, minWidth: 150, bgcolor: COLORES.fondoGris, "& fieldset": { borderColor: COLORES.grisContorno } }}>
              {ORDENAR.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </Select>
          </Box>
          <Box sx={{ display: "grid", gap: 0.6, justifySelf: "end" }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: COLORES.textoTerciario }}>
              &nbsp;
            </Typography>
            <Button variant="outlined" startIcon={<Download size={16} />} onClick={() => setOpenExport(true)}
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 2.5, color: COLORES.textoTerciario, borderColor: COLORES.grisContorno,
                "&:hover": { borderColor: COLORES.primarioOscuro, color: COLORES.primarioOscuro, bgcolor: COLORES.fondoGris } }}>
              Exportar
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* 4. TABLA */}
      <Paper elevation={0} sx={{ borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}`, overflow: "hidden" }}>
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
            <MuiMenuItem onClick={() => { eliminarCargo(menuCargo); }} sx={{ fontSize: 13, py: 1.2, color: COLORES.danger }}>
              <ListItemIcon sx={{ color: COLORES.danger }}><Trash2 size={16} /></ListItemIcon>
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
        sx={{ "& .MuiPaper-root": { backgroundColor: COLORES.fondoBlanco } }}
        slotProps={{ paper: { sx: { borderRadius: "16px", position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" } } }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: COLORES.textoPrimario }}>
          Exportar cargos ({filtrados.length})
          <IconButton aria-label="Cerrar exportación" onClick={() => setOpenExport(false)} size="small" sx={{ position: "absolute", top: 8, right: 8, color: COLORES.textoSuave, "&:hover": { bgcolor: COLORES.fondoGris2 } }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Nombre", "Descripción", "Área", "Empleados", "Estado"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 8px", borderBottom: `2px solid ${COLORES.borde}`, fontWeight: 600, color: COLORES.textoTerciario, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(r => (
                <tr key={r.id}>
                  <td style={{ padding: "10px 8px", borderBottom: `1px solid ${COLORES.fondoGris2}`, fontWeight: 500, color: COLORES.textoPrimario }}>{r.nombre}</td>
                  <td style={{ padding: "10px 8px", borderBottom: `1px solid ${COLORES.fondoGris2}`, color: COLORES.textoTerciario }}>{r.descripcion || "—"}</td>
                  <td style={{ padding: "10px 8px", borderBottom: `1px solid ${COLORES.fondoGris2}`, color: COLORES.textoTerciario }}>{r.areas || "—"}</td>
                  <td style={{ padding: "10px 8px", borderBottom: `1px solid ${COLORES.fondoGris2}`, color: COLORES.textoTerciario }}>{r.empleados_count ?? 0}</td>
                  <td style={{ padding: "10px 8px", borderBottom: `1px solid ${COLORES.fondoGris2}` }}>
                    <Chip label={r.estado === "inactivo" ? "Inactivo" : "Activo"} size="small"
                      sx={{ borderRadius: "8px", fontSize: 11, fontWeight: 600, bgcolor: r.estado === "inactivo" ? COLORES.dangerFondo : COLORES.successFondo, color: r.estado === "inactivo" ? COLORES.dangerOscuro : COLORES.verdeTexto }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setOpenExport(false)}
            sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, color: COLORES.textoTerciario }}>Cancelar</Button>
          <Button variant="contained" startIcon={<Download size={16} />} onClick={() => {
            exportarExcel(filtrados.map(r => ({ Nombre: r.nombre, Descripción: r.descripcion || "", Área: r.areas || "", Empleados: r.empleados_count ?? 0, Estado: r.estado === "inactivo" ? "Inactivo" : "Activo" })), "Cargos");
            setOpenExport(false);
          }} sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, bgcolor: COLORES.primarioOscuro, "&:hover": { bgcolor: COLORES.primario } }}>
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
