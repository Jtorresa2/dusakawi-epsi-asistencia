import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box, Paper, Typography, TextField, Button, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Select, MenuItem, InputLabel, FormControl, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, InputAdornment,
} from "@mui/material";
import { Plus, Edit3, Trash2, Eye, Search, X, Users, UserCheck, UserX, Building2, User, Briefcase, KeyRound, UserPlus, Layers, ShieldCheck, Clock, CalendarDays } from "lucide-react";
import {
  obtenerPersonal, crearPersonal, actualizarPersonal, eliminarPersonal,
  obtenerRoles, generarUsuariosMasivos,
} from "../personal.api";
import { obtenerAreas } from "../../areas/area.api";
import { obtenerCargos } from "../../cargos/cargo.api";
import { obtenerHorarios, asignarHorario, desasignarHorario } from "../../horarios/horario.api";
import PersonalPerfilModal from "../components/PersonalPerfilModal";
import { onlyDigits } from "../../../shared/validators";
import { COLORES } from "../../../shared/constants/colores.js";

const initialForm = {
  cedula: "", nombre: "", apellido: "", correo: "", telefono: "", fecha_nacimiento: "",
  area_id: "", cargo_id: "", piso: "", rol_id: "", horario_id: "", username: "", password: "", activo: true,
};

const ESTADOS_FILTRO = ["Todos", "Activo", "Inactivo"];

const ROL_BADGE = {
  "Administrador":  { bg: COLORES.warningFondo, color: COLORES.warningOscuro },
  "Talento Humano": { bg: COLORES.primarioClaro, color: COLORES.primarioOscuro },
  "Empleado":       { bg: COLORES.primarioClaro, color: COLORES.primarioOscuro },
};

const selectMenuSx = {
  slotProps: {
    paper: { sx: { bgcolor: COLORES.fondoBlanco, "& .MuiMenuItem-root": { borderRadius: 1, mx: 0.5 } } },
  },
};

const verdeBoton = { bgcolor: COLORES.primarioOscuro, "&:hover": { bgcolor: COLORES.primario } };

// ─── Estilos del modal premium (Nuevo/Editar colaborador) ───────────────────
const modalFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    bgcolor: COLORES.fondoBlanco,
    minHeight: 40,
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    "& fieldset": { borderColor: COLORES.borde2 },
    "&:hover fieldset": { borderColor: COLORES.textoSuave },
    "&.Mui-focused fieldset": { borderColor: COLORES.primarioOscuro },
    "&.Mui-focused": { boxShadow: "0 0 0 4px rgba(27, 94, 32, 0.10)" },
  },
  "& .MuiInputLabel-root": { fontSize: 13, color: COLORES.textoTerciario },
  "& .MuiInputLabel-root.Mui-focused": { color: COLORES.primarioOscuro },
};

const modalSelectSx = {
  borderRadius: "12px", fontSize: 14, bgcolor: COLORES.fondoBlanco, minHeight: 40,
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  "& fieldset": { borderColor: COLORES.borde2 },
  "&:hover fieldset": { borderColor: COLORES.textoSuave },
  "&.Mui-focused fieldset": { borderColor: COLORES.primarioOscuro },
  "&.Mui-focused": { boxShadow: "0 0 0 4px rgba(27, 94, 32, 0.10)" },
};

const selectIconAdornment = {
  "& .MuiSelect-select": { display: "flex", alignItems: "center" },
  "& .MuiSelect-icon": { color: COLORES.textoSuave },
};

const modalSeccionCard = {
  border: `1px solid ${COLORES.grisContorno}`,
  borderRadius: "14px",
  bgcolor: COLORES.fondoBlanco,
  p: 2,
};

const modalSeccionTitulo = { fontSize: 13, fontWeight: 700, color: COLORES.textoPrimario, display: "flex", alignItems: "center", gap: 1 };
const modalSeccionSubtitulo = { fontSize: 11, color: COLORES.textoSuave, mt: 0.25 };

export default function PersonalPage() {
  // ─── Datos ────────────────────────────────────────────────────────────────
  const [personal, setPersonal] = useState([]);
  const [roles, setRoles] = useState([]);
  const [areas, setAreas] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [perfilId, setPerfilId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const cargoFiltro = searchParams.get("cargo") || "";
  const areaFiltro = searchParams.get("area") || "";

  // ─── Filtros ──────────────────────────────────────────────────────────────
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroArea, setFiltroArea] = useState("Todas");
  const [filtroRol, setFiltroRol] = useState("Todos");

  // ─── Modales / acciones ───────────────────────────────────────────────────
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [modalGenerar, setModalGenerar] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [resultadoGen, setResultadoGen] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const [form, setForm] = useState({ ...initialForm });
  const [confirmPassword, setConfirmPassword] = useState("");

  const isActive = (e) => e.activo === 1 || e.activo === true;
  const getName = (e) => `${e.nombre} ${e.apellido}`;
  const getInitials = (e) => `${e.nombre?.[0] || ""}${e.apellido?.[0] || ""}`.toUpperCase();

  // ─── Carga de datos ───────────────────────────────────────────────────────
  useEffect(() => {
    cargarDatos();
    fetchAreas();
    fetchCargos();
    fetchHorarios();
  }, [cargoFiltro, areaFiltro]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const params = {};
      if (cargoFiltro) params.cargo = cargoFiltro;
      if (areaFiltro) params.area = areaFiltro;
      const [resPersonal, resRoles] = await Promise.all([
        obtenerPersonal(params),
        obtenerRoles(),
      ]);
      setPersonal(resPersonal.empleados || []);
      setRoles(resRoles.roles || []);
    } catch (err) {
      console.error("Error al cargar personal:", err);
    } finally {
      setCargando(false);
    }
  };

  const fetchAreas = async () => {
    try { setAreas((await obtenerAreas()) || []); } catch {}
  };

  const fetchCargos = async () => {
    try { setCargos((await obtenerCargos()) || []); } catch {}
  };

  const fetchHorarios = async () => {
    try { setHorarios((await obtenerHorarios()) || []); } catch {}
  };

  // ─── Toast ────────────────────────────────────────────────────────────────
  const mostrarToast = (msg, tipo = "ok") => {
    setToast({ msg, tipo });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  // ─── Filtrado ─────────────────────────────────────────────────────────────
  let filtrados = personal.filter((e) =>
    `${e.nombre} ${e.apellido} ${e.cedula || ""} ${e.cargo || ""} ${e.area || ""} ${e.username || ""} ${e.rol || ""}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  if (filtroEstado !== "Todos") {
    const activo = filtroEstado === "Activo";
    filtrados = filtrados.filter((e) => (activo ? isActive(e) : !isActive(e)));
  }
  if (filtroArea !== "Todas") {
    filtrados = filtrados.filter((e) => e.area === filtroArea);
  }
  if (filtroRol !== "Todos") {
    filtrados = filtrados.filter((e) => e.rol === filtroRol);
  }

  const pendientes = personal.filter((p) => !p.username).length;

  // ─── Crear / Editar ───────────────────────────────────────────────────────
  const abrirCrear = () => {
    setEditando(null);
    setForm({ ...initialForm, touchedCorreo: false });
    setConfirmPassword("");
    setModalAbierto(true);
  };

  const abrirEditar = (e) => {
    setEditando(e);
    setForm({
      cedula: e.cedula || "",
      nombre: e.nombre || "",
      apellido: e.apellido || "",
      correo: e.correo || "",
      telefono: e.telefono || "",
      fecha_nacimiento: e.fecha_nacimiento ? String(e.fecha_nacimiento).slice(0, 10) : "",
      area_id: e.area_id ? String(e.area_id) : "",
      cargo_id: e.cargo_id ? String(e.cargo_id) : "",
      piso: e.piso ?? "",
      rol_id: e.rol_id ? String(e.rol_id) : "",
      horario_id: e.horario_id ? String(e.horario_id) : "",
      username: e.username || "",
      password: "",
      activo: isActive(e),
      touchedCorreo: false,
    });
    setConfirmPassword("");
    setModalAbierto(true);
  };

  const handleGenerarUsuario = () => {
    // Same formula as the backend: initial + first surname + last 3 digits of the cc.
    const normalizar = (s) =>
      s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    const primeraPalabra = (s) => (s || "").trim().split(/\s+/)[0] || "";
    const inicial = (normalizar(primeraPalabra(form.nombre)) || "u").charAt(0);
    const apellidoNorm = normalizar(primeraPalabra(form.apellido) || "usuario").slice(0, 12);
    const digitos = String(form.cedula || "").replace(/\D/g, "").slice(-3);
    const sufijo = digitos || String(Math.floor(Math.random() * 900) + 100);
    setForm((f) => ({ ...f, username: `${inicial}${apellidoNorm}${sufijo}` }));
  };

  const handleGuardar = async () => {
    if (!form.nombre.trim() || !form.apellido.trim() || !form.cedula.trim() || !form.correo.trim()) {
      return mostrarToast("Completa los campos obligatorios", "err");
    }
    if (!editando && form.password && form.password !== confirmPassword) {
      return mostrarToast("Las contraseñas no coinciden", "err");
    }
    setGuardando(true);
    try {
      const { horario_id: horarioSel, ...rest } = form;
      const payload = {
        ...rest,
        area_id: form.area_id || null,
        cargo_id: form.cargo_id || null,
        rol_id: form.rol_id || null,
        piso: form.piso !== "" && form.piso !== null ? Number(form.piso) : null,
        activo: form.activo ? 1 : 0,
      };
      if (editando) {
        const res = await actualizarPersonal(editando.id, payload);
        // Sincroniza el horario asignado (asignar/desasignar) si cambió.
        const original = editando.horario_id ? String(editando.horario_id) : "";
        const nuevo = horarioSel || "";
        if (nuevo !== original) {
          if (nuevo) await asignarHorario({ usuario_id: editando.id, horario_id: nuevo, motivo: "Asignación desde edición de colaborador" });
          else await desasignarHorario(editando.id);
        }
        mostrarToast(res?.mensaje || "Empleado actualizado correctamente", "ok");
      } else {
        const res = await crearPersonal(payload);
        if (horarioSel) {
          await asignarHorario({ usuario_id: res.id, horario_id: horarioSel, motivo: "Asignación desde creación de colaborador" });
        }
        const extra = res?.password
          ? ` — Usuario: ${res.username}, Contraseña: ${res.password}`
          : res?.email_enviado
            ? ` — Usuario: ${res.username}. Le enviamos al correo el link para crear su contraseña`
            : "";
        mostrarToast(`${res?.mensaje || "Empleado creado correctamente"}${extra}`, "ok");
      }
      setModalAbierto(false);
      await cargarDatos();
    } catch (e) {
      mostrarToast(e.message || "Error al guardar", "err");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!confirmEliminar) return;
    try {
      await eliminarPersonal(confirmEliminar.id);
      setConfirmEliminar(null);
      mostrarToast("Empleado eliminado correctamente", "ok");
      await cargarDatos();
    } catch (e) {
      mostrarToast(e.message || "Error al eliminar", "err");
    }
  };

  const toggleActivo = async (e) => {
    try {
      await actualizarPersonal(e.id, { activo: isActive(e) ? 0 : 1 });
      await cargarDatos();
    } catch (err) {
      mostrarToast("Error al cambiar el estado", "err");
    }
  };

  // ─── Generar masivos ──────────────────────────────────────────────────────
  const handleGenerarMasivos = async () => {
    setGenerando(true);
    try {
      const data = await generarUsuariosMasivos();
      setResultadoGen(data);
      await cargarDatos();
    } catch (err) {
      mostrarToast("Error al generar usuarios", "err");
    } finally {
      setGenerando(false);
    }
  };

  const descargarReporte = () => {
    if (!resultadoGen?.resultados?.length) return;
    const filas = resultadoGen.resultados
      .map((r) => `${r.empleado}\t${r.username}\t${r.password}\t${r.correo}\t${r.email_enviado ? "SI" : "NO"}`)
      .join("\n");
    const tsv = `EMPLEADO\tUSUARIO\tCONTRASENA\tCORREO\tEMAIL_ENVIADO\n${filas}`;
    const blob = new Blob([tsv], { type: "text/tab-separated-values;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "usuarios_generados.tsv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* ENCABEZADO */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2, flexWrap: "wrap" }}>
        <Typography sx={{ fontSize: 13, color: COLORES.textoMuted }}>Inicio / Gestión del personal / Personal</Typography>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          {pendientes > 0 && (
            <Button onClick={() => setModalGenerar(true)}
              sx={{ bgcolor: COLORES.primarioOscuro, color: COLORES.fondoBlanco, borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, px: 2.5, height: 42, "&:hover": { bgcolor: COLORES.primario } }}>
              Generar faltantes ({pendientes})
            </Button>
          )}
          <Button startIcon={<Plus size={18} />} onClick={abrirCrear}
            sx={{ bgcolor: COLORES.primarioOscuro, color: COLORES.fondoBlanco, borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, px: 2.5, height: 42, "&:hover": { bgcolor: COLORES.primario } }}>
            Nuevo empleado
          </Button>
        </Box>
      </Box>

      {/* TARJETAS RESUMEN */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3.5 }}>
        {[
          { icon: <Users size={20} />, value: personal.length, label: "Total empleados", color: COLORES.primarioOscuro, bg: COLORES.primarioClaro },
          { icon: <UserCheck size={20} />, value: personal.filter((e) => isActive(e)).length, label: "Activos", color: COLORES.primarioOscuro, bg: COLORES.primarioClaro },
          { icon: <UserX size={20} />, value: personal.filter((e) => !isActive(e)).length, label: "Inactivos", color: COLORES.danger, bg: COLORES.dangerFondo },
          { icon: <Building2 size={20} />, value: new Set(personal.map((e) => e.area).filter(Boolean)).size, label: "Áreas distintas", color: COLORES.primario, bg: COLORES.primarioClaro },
        ].map((card, i) => (
          <Paper key={i} elevation={0}
            sx={{ p: 2, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", alignItems: "center", gap: 1.5 }}>
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
      <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}`, mb: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "2fr 1fr 1fr 1fr" }, gap: 1.5, alignItems: "center" }}>
          <TextField aria-label="Buscar empleado" placeholder="Buscar empleado..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <Search size={15} style={{ color: COLORES.textoSuave, marginRight: 6 }} />,
                sx: { borderRadius: "8px", fontSize: 13, height: 40, bgcolor: COLORES.fondoGris, py: 0 },
              },
            }} />
          <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} size="small"
            sx={{ borderRadius: "8px", fontSize: 13, height: 40, bgcolor: COLORES.fondoGris, "& fieldset": { borderColor: COLORES.borde } }}>
            {ESTADOS_FILTRO.map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
          </Select>
          <Select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} size="small"
            sx={{ borderRadius: "8px", fontSize: 13, height: 40, bgcolor: COLORES.fondoGris, "& fieldset": { borderColor: COLORES.borde } }}>
            <MenuItem value="Todas">Área</MenuItem>
            {areas.map((a) => <MenuItem key={a.id} value={a.nombre}>{a.nombre}</MenuItem>)}
          </Select>
          <Select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} size="small"
            sx={{ borderRadius: "8px", fontSize: 13, height: 40, bgcolor: COLORES.fondoGris, "& fieldset": { borderColor: COLORES.borde } }}>
            <MenuItem value="Todos">Rol</MenuItem>
            {roles.map((r) => <MenuItem key={r.id} value={r.nombre}>{r.nombre}</MenuItem>)}
          </Select>
        </Box>
        {(cargoFiltro || areaFiltro) && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
            <Typography sx={{ fontSize: 12, color: COLORES.textoSuave }}>
              Mostrando solo empleados de:
            </Typography>
            {cargoFiltro && (
              <Chip
                label={`Cargo: ${cargoFiltro}`}
                icon={<Briefcase size={13} />}
                onDelete={() => setSearchParams(areaFiltro ? { area: areaFiltro } : {})}
                size="small"
                sx={{
                  height: 26, fontSize: 12, fontWeight: 600, borderRadius: "8px",
                  bgcolor: COLORES.primarioClaro, color: COLORES.primarioOscuro,
                  "& .MuiChip-deleteIcon": { color: COLORES.primarioOscuro, "&:hover": { color: COLORES.primario } },
                }}
              />
            )}
            {areaFiltro && (
              <Chip
                label={`Área: ${areaFiltro}`}
                icon={<Building2 size={13} />}
                onDelete={() => setSearchParams(cargoFiltro ? { cargo: cargoFiltro } : {})}
                size="small"
                sx={{
                  height: 26, fontSize: 12, fontWeight: 600, borderRadius: "8px",
                  bgcolor: COLORES.primarioClaro, color: COLORES.primarioOscuro,
                  "& .MuiChip-deleteIcon": { color: COLORES.primarioOscuro, "&:hover": { color: COLORES.primario } },
                }}
              />
            )}
          </Box>
        )}
      </Paper>

      {/* TABLA PRINCIPAL */}
      <Paper elevation={0} sx={{ borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}`, overflow: "hidden" }}>
        <TableContainer sx={{
          overflowX: "auto",
          "&::-webkit-scrollbar": { height: 8 },
          "&::-webkit-scrollbar-track": { background: COLORES.primarioClaro, borderRadius: 4 },
          "&::-webkit-scrollbar-thumb": { background: COLORES.acento, borderRadius: 4 },
          "&::-webkit-scrollbar-thumb:hover": { background: COLORES.acento },
          scrollbarWidth: "thin",
          scrollbarColor: `${COLORES.acento} ${COLORES.primarioClaro}`,
        }}>
          <Table sx={{ minWidth: { xs: 780, md: 1250 } }}>
            <TableHead>
              <TableRow>
                {["", "Empleado", "Documento", "Cargo", "Área", "Piso", "Rol", "Usuario", "Último acceso", "Inas.", "Tard.", "Estado", "Acciones"].map((h) => (
                  <TableCell key={h} sx={{
                    fontWeight: 600, color: COLORES.textoTerciario, fontSize: 12, bgcolor: COLORES.fondoGris, py: 1.5, whiteSpace: "nowrap",
                    display: h === "Cargo" || h === "Área" || h === "Piso" ? { xs: "none", md: "table-cell" }
                      : h === "Rol" || h === "Acciones" ? { xs: "none", sm: "table-cell" } : undefined,
                  }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {cargando ? (
                <TableRow>
                  <TableCell colSpan={13} align="center" sx={{ py: 6, color: COLORES.textoSuave, fontSize: 14 }}>Cargando...</TableCell>
                </TableRow>
              ) : filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} align="center" sx={{ py: 6, color: COLORES.textoSuave, fontSize: 14 }}>
                    {busqueda ? "No se encontraron empleados" : "No hay empleados registrados"}
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((e) => {
                  const badge = ROL_BADGE[e.rol] || { bg: COLORES.fondoGris2, color: COLORES.textoSecundario };
                  return (
                    <TableRow key={e.id} sx={{ "&:hover": { bgcolor: COLORES.fondoGris }, transition: "background .15s" }}>
                      <TableCell sx={{ py: 1.2 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: COLORES.primarioClaro, color: COLORES.primario, fontSize: 12, fontWeight: 700 }}>
                          {getInitials(e) || "?"}
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ py: 1.2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box>
                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: COLORES.textoPrimario }}>{getName(e)}</Typography>
                            <Typography sx={{ fontSize: 12, color: COLORES.textoSuave }}>{e.correo || "—"}</Typography>
                          </Box>
                          <IconButton size="small" onClick={() => setPerfilId(e.id)} title="Ver perfil"
                            sx={{ bgcolor: COLORES.primarioClaro, color: COLORES.primario, borderRadius: "6px", width: 26, height: 26, "&:hover": { bgcolor: COLORES.primarioClaro2 } }}>
                            <Eye size={13} />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.2, fontSize: 13, color: COLORES.textoMuted, whiteSpace: "nowrap" }}>{e.cedula || "—"}</TableCell>
                      <TableCell sx={{ py: 1.2, fontSize: 13, color: COLORES.textoMuted, display: { xs: "none", md: "table-cell" } }}>{e.cargo || "—"}</TableCell>
                      <TableCell sx={{ py: 1.2, fontSize: 13, color: COLORES.textoMuted, whiteSpace: "nowrap", display: { xs: "none", md: "table-cell" } }}>
                    {e.area || "—"}
                  </TableCell>
                  <TableCell sx={{ py: 1.2, fontSize: 13, color: COLORES.textoMuted, whiteSpace: "nowrap", display: { xs: "none", md: "table-cell" } }}>
                    {e.piso ? `P${e.piso}` : "—"}
                  </TableCell>
                      <TableCell sx={{ py: 1.2, display: { xs: "none", sm: "table-cell" } }}>
                        <Chip label={e.rol || "Sin rol"} size="small"
                          sx={{ height: 24, fontSize: 11, fontWeight: 600, bgcolor: badge.bg, color: badge.color }} />
                      </TableCell>
                      <TableCell sx={{ py: 1.2, fontSize: 12, fontFamily: "monospace", color: COLORES.textoSecundario, whiteSpace: "nowrap" }}>
                        {e.username || "—"}
                      </TableCell>
                      <TableCell sx={{ py: 1.2, fontSize: 12, color: COLORES.textoSuave, whiteSpace: "nowrap" }}>
                        {e.ultimo_acceso ? new Date(e.ultimo_acceso).toLocaleDateString("es-CO") : "Nunca"}
                      </TableCell>
                      <TableCell sx={{ py: 1.2 }}>
                        <Chip label={e.inasistencias ?? 0} size="small"
                          sx={{ height: 24, fontSize: 11, fontWeight: 700, minWidth: 32,
                            bgcolor: (e.inasistencias ?? 0) > 0 ? COLORES.dangerFondo : COLORES.fondoGris2,
                            color: (e.inasistencias ?? 0) > 0 ? COLORES.danger : COLORES.textoSuave }} />
                      </TableCell>
                      <TableCell sx={{ py: 1.2 }}>
                        <Chip label={e.llegadas_tardias ?? 0} size="small"
                          sx={{ height: 24, fontSize: 11, fontWeight: 700, minWidth: 32,
                            bgcolor: (e.llegadas_tardias ?? 0) > 0 ? COLORES.warningFondo : COLORES.fondoGris2,
                            color: (e.llegadas_tardias ?? 0) > 0 ? COLORES.warningOscuro : COLORES.textoSuave }} />
                      </TableCell>
                      <TableCell sx={{ py: 1.2 }}>
                        <Button size="small" onClick={() => toggleActivo(e)} title="Cambiar estado"
                          sx={{ borderRadius: "20px", fontSize: 11, fontWeight: 600, minWidth: 0, px: 1.5, textTransform: "none",
                            bgcolor: isActive(e) ? COLORES.successFondo : COLORES.dangerFondo,
                            color: isActive(e) ? COLORES.verdeTexto : COLORES.dangerOscuro,
                            "&:hover": { bgcolor: isActive(e) ? COLORES.successFondo : COLORES.dangerBorde } }}>
                          {isActive(e) ? "Activo" : "Inactivo"}
                        </Button>
                      </TableCell>
                      <TableCell sx={{ py: 1.2 }}>
                        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                          <Box onClick={() => abrirEditar(e)} title="Editar" sx={{
                            width: 34, height: 34, borderRadius: "9px",
                            bgcolor: COLORES.primarioClaro, color: COLORES.primario, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all .2s", flexShrink: 0,
                            "&:hover": { bgcolor: COLORES.primarioClaro2 },
                          }}>
                            <Edit3 size={15} />
                          </Box>
                          <Box onClick={() => setConfirmEliminar(e)} title="Eliminar" sx={{
                            width: 34, height: 34, borderRadius: "9px",
                            bgcolor: COLORES.dangerFondo, color: COLORES.danger, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all .2s", flexShrink: 0,
                            "&:hover": { bgcolor: COLORES.dangerBorde },
                          }}>
                            <Trash2 size={15} />
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* MODAL CREAR / EDITAR */}
      <Dialog open={modalAbierto} onClose={() => setModalAbierto(false)} maxWidth="md" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "18px", position: "relative", boxShadow: "0 24px 70px rgba(0,0,0,0.25)", maxHeight: "92vh" } } }}
        sx={{ "& .MuiBackdrop-root": { bgcolor: "rgba(17, 24, 39, 0.5)", backdropFilter: "blur(4px)" } }}>
        {/* HEADER FIJO */}
        <DialogTitle sx={{ px: 3, py: 2, position: "relative", pb: 1.5 }}>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: "12px", bgcolor: COLORES.primarioClaro, color: COLORES.primarioOscuro,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <User size={20} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 17, fontWeight: 700, color: COLORES.textoPrimario, lineHeight: 1.2 }}>
                {editando ? "Editar empleado" : "Nuevo empleado"}
              </Typography>
              <Typography sx={{ fontSize: 12, color: COLORES.textoTerciario, mt: 0.15 }}>
                {editando ? "Actualiza la información del empleado." : "Registra un nuevo empleado dentro del sistema."}
              </Typography>
            </Box>
          </Box>
          <IconButton aria-label="Cerrar" onClick={() => setModalAbierto(false)} size="small"
            sx={{ position: "absolute", top: 12, right: 12, color: COLORES.textoSuave, bgcolor: COLORES.fondoGris2, "&:hover": { color: COLORES.textoPrimario, bgcolor: COLORES.borde } }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <Divider />

        {/* CUERPO SCROLLEABLE */}
        <DialogContent sx={{ px: 3, py: 2, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1.75, bgcolor: COLORES.fondoGris }}>

          {/* SECCIÓN 1 — INFORMACIÓN PERSONAL */}
          <Box sx={modalSeccionCard}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: COLORES.primarioClaro, color: COLORES.primarioOscuro, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={14} />
              </Box>
              <Box>
                <Typography sx={modalSeccionTitulo}>Información personal</Typography>
                <Typography sx={modalSeccionSubtitulo}>Datos básicos del empleado</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 1.5 }}>
              <TextField required label="Nombre *" value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                slotProps={{ inputLabel: { sx: { fontSize: 12.5 } } }} sx={modalFieldSx} />
              <TextField required label="Apellido *" value={form.apellido}
                onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                slotProps={{ inputLabel: { sx: { fontSize: 12.5 } } }} sx={modalFieldSx} />
              <TextField required label="Cédula *" value={form.cedula}
                onChange={(e) => setForm({ ...form, cedula: onlyDigits(e.target.value) })}
                slotProps={{ inputLabel: { sx: { fontSize: 12.5 } }, htmlInput: { inputMode: "numeric", maxLength: 15 } }} sx={modalFieldSx} />
              <TextField label="Teléfono" value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: onlyDigits(e.target.value) })}
                slotProps={{ inputLabel: { sx: { fontSize: 12.5 } }, htmlInput: { inputMode: "numeric", maxLength: 15 } }} sx={modalFieldSx} />
              <TextField required label="Correo electrónico *" value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                error={form.correo.trim() === "" && form.touchedCorreo}
                helperText={form.correo.trim() === "" && form.touchedCorreo ? "El correo es obligatorio" : ""}
                onBlur={() => setForm((f) => ({ ...f, touchedCorreo: true }))}
                slotProps={{ inputLabel: { sx: { fontSize: 12.5 } }, formHelperText: { sx: { fontSize: 11 } } }} sx={modalFieldSx} />
              <TextField label="Fecha de nacimiento" type="date" value={form.fecha_nacimiento}
                onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
                slotProps={{ inputLabel: { shrink: true, sx: { fontSize: 12.5 } } }} sx={modalFieldSx} />
            </Box>
          </Box>

          {/* SECCIÓN 2 — INFORMACIÓN LABORAL */}
          <Box sx={modalSeccionCard}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: COLORES.primarioClaro, color: COLORES.primarioOscuro, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Briefcase size={14} />
              </Box>
              <Box>
                <Typography sx={modalSeccionTitulo}>Información laboral</Typography>
                <Typography sx={modalSeccionSubtitulo}>Datos del puesto y asignación</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 1.5 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontSize: 12.5, color: COLORES.textoTerciario }}>Área</InputLabel>
                <Select value={form.area_id} label="Área" sx={{ ...modalSelectSx, ...selectIconAdornment }}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><Building2 size={15} style={{ color: COLORES.textoSuave }} /></InputAdornment> }, menu: selectMenuSx }}
                  onChange={(e) => setForm({ ...form, area_id: e.target.value })}>
                  <MenuItem value=""><em>Sin área</em></MenuItem>
                  {areas.map((a) => (
                    <MenuItem key={a.id} value={String(a.id)}>{a.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel sx={{ fontSize: 12.5, color: COLORES.textoTerciario }}>Cargo</InputLabel>
                <Select value={form.cargo_id} label="Cargo" sx={{ ...modalSelectSx, ...selectIconAdornment }}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><Briefcase size={15} style={{ color: COLORES.textoSuave }} /></InputAdornment> }, menu: selectMenuSx }}
                  onChange={(e) => setForm({ ...form, cargo_id: e.target.value })}>
                  <MenuItem value=""><em>Sin cargo</em></MenuItem>
                  {cargos.filter((c) => c.estado !== "inactivo").map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>{c.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Piso" type="number" value={form.piso}
                onChange={(e) => setForm({ ...form, piso: e.target.value === "" ? "" : Number(e.target.value) })}
                slotProps={{ inputLabel: { sx: { fontSize: 12.5 } }, htmlInput: { min: 1 }, input: { startAdornment: <InputAdornment position="start"><Layers size={15} style={{ color: COLORES.textoSuave }} /></InputAdornment> } }} sx={modalFieldSx} />
              <FormControl fullWidth>
                <InputLabel sx={{ fontSize: 12.5, color: COLORES.textoTerciario }}>Rol del sistema</InputLabel>
                <Select value={form.rol_id} label="Rol del sistema" sx={{ ...modalSelectSx, ...selectIconAdornment }}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><ShieldCheck size={15} style={{ color: COLORES.textoSuave }} /></InputAdornment> }, menu: selectMenuSx }}
                  onChange={(e) => setForm({ ...form, rol_id: e.target.value })}>
                  <MenuItem value=""><em>Sin rol</em></MenuItem>
                  {roles.map((r) => (
                    <MenuItem key={r.id} value={String(r.id)}>{r.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel sx={{ fontSize: 12.5, color: COLORES.textoTerciario }}>Horario asignado</InputLabel>
                <Select value={form.horario_id || ""} label="Horario asignado"
                  onChange={(e) => setForm({ ...form, horario_id: e.target.value })}
                  sx={{ ...modalSelectSx, ...selectIconAdornment }}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><Clock size={15} style={{ color: COLORES.textoSuave }} /></InputAdornment> }, menu: selectMenuSx }}>
                  <MenuItem value=""><em>Sin asignar</em></MenuItem>
                  {horarios.map((h) => (
                    <MenuItem key={h.id} value={String(h.id)}>{h.nombre}</MenuItem>
                  ))}
                </Select>
                <Typography sx={{ fontSize: 10.5, color: COLORES.textoSuave, mt: 0.5 }}>
                  {editando ? "Podés asignar o quitar el horario desde acá." : "Lo podés elegir ahora o modificarlo después."}
                </Typography>
              </FormControl>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={<Switch checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />}
                  label={form.activo ? "Empleado activo" : "Empleado inactivo"}
                  sx={{ "& .MuiFormControlLabel-label": { fontSize: 13.5, fontWeight: 500, color: COLORES.textoSecundario } }}
                />
              </Box>
            </Box>
          </Box>

          {/* SECCIÓN 3 — INFORMACIÓN DE ACCESO */}
          <Box sx={modalSeccionCard}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: COLORES.primarioClaro, color: COLORES.primarioOscuro, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <KeyRound size={14} />
              </Box>
              <Box>
                <Typography sx={modalSeccionTitulo}>Información de acceso</Typography>
                <Typography sx={modalSeccionSubtitulo}>Credenciales para ingresar al sistema</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 1.5 }}>
              <TextField label="Usuario" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                disabled={!!editando}
                autoComplete="off"
                helperText={editando ? "El nombre de usuario no se puede cambiar al editar" : "Se completa al guardar"}
                slotProps={{ inputLabel: { sx: { fontSize: 12.5 } }, formHelperText: { sx: { fontSize: 11 } } }} sx={modalFieldSx} />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <TextField label="Contraseña temporal" type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password"
                  helperText={editando ? "Dejar vacío para no cambiar" : "Vacío = se envía al correo un link para crearla"}
                  slotProps={{
                    inputLabel: { sx: { fontSize: 12.5 } }, formHelperText: { sx: { fontSize: 11 } },
                    input: {
                      startAdornment: <InputAdornment position="start"><KeyRound size={15} style={{ color: COLORES.textoSuave }} /></InputAdornment>,
                    },
                  }} sx={modalFieldSx} />
                {!editando && form.password !== "" && (
                  <TextField label="Confirmar contraseña" type="password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    error={confirmPassword !== "" && form.password !== "" && confirmPassword !== form.password}
                    helperText={confirmPassword !== "" && form.password !== "" && confirmPassword !== form.password ? "Las contraseñas no coinciden" : ""}
                    slotProps={{ inputLabel: { sx: { fontSize: 12.5 } }, formHelperText: { sx: { fontSize: 11 } } }} sx={modalFieldSx} />
                )}
              </Box>
            </Box>
            {!editando && (
              <Button startIcon={<UserPlus size={14} />} onClick={handleGenerarUsuario}
                disabled={!form.nombre.trim() || !form.apellido.trim() || !form.cedula.trim()}
                sx={{ mt: 1.5, borderRadius: "10px", textTransform: "none", fontSize: 12.5, fontWeight: 600, color: COLORES.primarioOscuro, bgcolor: COLORES.primarioClaro, px: 2.5, py: 0.75, "&:hover": { bgcolor: COLORES.primarioClaro2 } }}>
                Generar usuario
              </Button>
            )}
          </Box>
        </DialogContent>

        {/* FOOTER FIJO */}
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1.5 }}>
          <Button onClick={() => setModalAbierto(false)}
            sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, fontWeight: 600, color: COLORES.textoSecundario, bgcolor: COLORES.fondoBlanco, border: `1px solid ${COLORES.borde2}`, px: 3, py: 0.75, "&:hover": { bgcolor: COLORES.fondoGris } }}>
            Cancelar
          </Button>
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={handleGuardar}
            disabled={guardando || !form.nombre.trim() || !form.apellido.trim() || !form.cedula.trim() || !form.correo.trim()}
            sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, fontWeight: 600, px: 3.5, py: 0.75, ...verdeBoton }}>
            {guardando ? "Guardando..." : editando ? "Actualizar empleado" : "Crear empleado"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONFIRMAR ELIMINAR */}
      <Dialog open={!!confirmEliminar} onClose={() => setConfirmEliminar(null)} maxWidth="xs" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px" } } }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: COLORES.textoPrimario }}>Eliminar empleado?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: COLORES.textoTerciario }}>
            Se eliminará a <strong>{confirmEliminar?.nombre} {confirmEliminar?.apellido}</strong> de forma permanente. Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setConfirmEliminar(null)}
            sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, color: COLORES.textoTerciario }}>Cancelar</Button>
          <Button variant="contained" onClick={handleEliminar}
            sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, bgcolor: COLORES.danger, "&:hover": { bgcolor: COLORES.dangerOscuro2 } }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONFIRMAR GENERAR MASIVOS */}
      <Dialog open={modalGenerar && !resultadoGen} onClose={() => setModalGenerar(false)} maxWidth="xs" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px" } } }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: COLORES.textoPrimario }}>Generar usuarios faltantes?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: COLORES.textoTerciario }}>
            Se crearán usuarios para <strong>{pendientes} empleados</strong> que aún no tienen acceso al sistema.
            El username se genera automáticamente y, si no se define, se genera una contraseña segura al crear.
          </Typography>
          {pendientes > 0 && (
            <Typography sx={{ fontSize: 13, color: COLORES.textoTerciario, mt: 1 }}>
              Se enviará un correo a cada empleado si SMTP está configurado.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setModalGenerar(false)}
            sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, color: COLORES.textoTerciario }}>Cancelar</Button>
          <Button variant="contained" onClick={handleGenerarMasivos} disabled={generando}
            sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, ...verdeBoton }}>
            {generando ? "Generando..." : "Generar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL RESULTADO GENERACION */}
      <Dialog open={!!resultadoGen} onClose={() => { setModalGenerar(false); setResultadoGen(null); }} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px" } } }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: COLORES.textoPrimario, textAlign: "center" }}>Resultado</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Paper elevation={0} sx={{ textAlign: "center", bgcolor: COLORES.successClaro, borderRadius: "10px", p: 1.5, px: 3 }}>
              <Typography sx={{ fontSize: 24, fontWeight: 700, color: COLORES.primarioOscuro }}>{resultadoGen?.creados || 0}</Typography>
              <Typography sx={{ fontSize: 11, color: COLORES.textoTerciario }}>Creados</Typography>
            </Paper>
            <Paper elevation={0} sx={{ textAlign: "center", bgcolor: COLORES.primarioClaro, borderRadius: "10px", p: 1.5, px: 3 }}>
              <Typography sx={{ fontSize: 24, fontWeight: 700, color: COLORES.verdeTexto }}>{resultadoGen?.emails_enviados || 0}</Typography>
              <Typography sx={{ fontSize: 11, color: COLORES.textoTerciario }}>Emails enviados</Typography>
            </Paper>
            <Paper elevation={0} sx={{ textAlign: "center", bgcolor: COLORES.dangerFondo2, borderRadius: "10px", p: 1.5, px: 3 }}>
              <Typography sx={{ fontSize: 24, fontWeight: 700, color: COLORES.danger }}>{resultadoGen?.emails_fallados || 0}</Typography>
              <Typography sx={{ fontSize: 11, color: COLORES.textoTerciario }}>Fallos</Typography>
            </Paper>
          </Box>
          {resultadoGen?.resultados?.length > 0 && (
            <TableContainer sx={{ maxHeight: 220, border: `1px solid ${COLORES.borde}`, borderRadius: "8px" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {["Empleado", "Usuario", "Contrasena", "Email"].map((h) => (
                      <TableCell key={h} sx={{ fontSize: 11, fontWeight: 600, color: COLORES.textoTerciario, bgcolor: COLORES.fondoGris, py: 1 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resultadoGen.resultados.map((r, i) => (
                    <TableRow key={i} sx={{ "&:hover": { bgcolor: COLORES.fondoGris } }}>
                      <TableCell sx={{ fontSize: 11, py: 1 }}>{r.empleado}</TableCell>
                      <TableCell sx={{ fontSize: 11, py: 1, fontFamily: "monospace" }}>{r.username}</TableCell>
                      <TableCell sx={{ fontSize: 11, py: 1, fontFamily: "monospace" }}>{r.password}</TableCell>
                      <TableCell sx={{ fontSize: 11, py: 1 }}>{r.email_enviado ? "OK" : r.correo || "SIN CORREO"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="contained" onClick={descargarReporte} disabled={!resultadoGen?.resultados?.length}
            sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, ...verdeBoton }}>
            Descargar reporte TSV
          </Button>
          <Button onClick={() => { setModalGenerar(false); setResultadoGen(null); }}
            sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, color: COLORES.textoTerciario }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* PERFIL MODAL */}
      <PersonalPerfilModal
        open={perfilId !== null}
        id={perfilId}
        onClose={() => { setPerfilId(null); cargarDatos(); }}
        onSaved={() => cargarDatos()}
      />

      {/* TOAST */}
      {toast && (
        <Box sx={{
          position: "fixed", bottom: 24, right: 24,
          bgcolor: toast.tipo === "err" ? COLORES.danger : COLORES.primarioOscuro,
          color: COLORES.fondoBlanco, borderRadius: "10px", px: 2.5, py: 1.5,
          fontSize: 13, fontWeight: 500, zIndex: 9999,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          display: "flex", alignItems: "center", gap: 1,
          maxWidth: 420,
        }}>
          {toast.tipo === "err" ? <X size={15} /> : null}
          {toast.msg}
        </Box>
      )}
    </Box>
  );
}
