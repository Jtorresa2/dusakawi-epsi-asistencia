import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Paper, TextField, Typography, Select, MenuItem,
  Menu, MenuItem as MuiMenuItem, ListItemIcon, ListItemText, Divider,
} from "@mui/material";
import {
  Search, Users, UserCheck, UserX, UserRound, Download, Plus,
  Copy, ToggleLeft, ToggleRight, Trash2, Users as UsersIcon,
} from "lucide-react";
import IconBox from "../../../shared/components/IconBox";
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
  const { puede } = useRol();

  useEffect(() => { cargarCargos(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await obtenerAreas();
        const lista = Array.isArray(data) ? data : data.areas || [];
        setAreas(lista.map((a) => (typeof a === "string" ? a : a.nombre || a.name)));
      } catch {
        setAreas(AREAS_FALLBACK.slice(1));
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
    setForm({ nombre: "", descripcion: "", estado: "activo" });
    setErrors({});
    setOpenModal(true);
  }

  function abrirEditar(cargo) {
    setCargoSeleccionado(cargo);
    setForm({ nombre: cargo.nombre, descripcion: cargo.descripcion || "", estado: cargo.estado || "activo" });
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
      } else {
        await crearCargo(form);
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
    cargarCargos();
  }

  async function toggleEstado(cargo) {
    const nuevoEstado = cargo.estado === "inactivo" ? "activo" : "inactivo";
    if (cargo.id) {
      await actualizarCargo(cargo.id, { nombre: cargo.nombre, descripcion: cargo.descripcion, estado: nuevoEstado });
    }
    setMenuAnchor(null);
    cargarCargos();
  }

  async function eliminarCargo(cargo) {
    setMenuAnchor(null);
    if (!window.confirm(`¿Eliminar el cargo "${cargo.nombre}"?`)) return;
    try {
      const { eliminarCargo: eliminar } = await import("../cargo.api");
      await eliminar(cargo.id);
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
    { icon: <Users />, value: total, label: "Total cargos", color: "#1B5E20" },
    { icon: <UserCheck />, value: activos, label: "Cargos activos", color: "#1565C0" },
    { icon: <UserX />, value: inactivos, label: "Cargos inactivos", color: "#DC2626" },
    { icon: <UserRound />, value: promedio, label: "Promedio empleados", color: "#7C3AED" },
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
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2.5, mb: 3.5 }}>
        {cards.map((card, i) => (
          <Paper
            key={i}
            elevation={0}
            sx={{
              p: 3, borderRadius: "20px",
              border: "1px solid #ECECEC", minHeight: 150,
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              transition: "all .25s ease",
              "&:hover": { transform: "translateY(-3px)", boxShadow: "0 8px 30px rgba(0,0,0,.07)" },
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Typography sx={{ color: "#6B7280", fontSize: 13, fontWeight: 500 }}>
                {card.label}
              </Typography>
              <IconBox icon={card.icon} color={card.color} size={52} iconSize={24} />
            </Box>
            <Typography sx={{ fontSize: 36, fontWeight: 700, lineHeight: 1.1, color: "#111827", mt: 1 }}>
              {card.value}
            </Typography>
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
            <Button variant="outlined" startIcon={<Download size={16} />}
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
          />
        )}
      </Paper>

      {/* 5. MENÚ CONTEXTUAL */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{ paper: { sx: { borderRadius: "12px", boxShadow: "0 8px 30px rgba(0,0,0,.12)", minWidth: 200, mt: 0.5 } } }}
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
      />

      {/* 7. MODAL VER DETALLE */}
      <CargoDetailModal
        open={Boolean(verCargo)}
        onClose={() => setVerCargo(null)}
        cargo={verCargo}
      />
    </Box>
  );
}
