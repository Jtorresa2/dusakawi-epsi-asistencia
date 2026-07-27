import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, TextField, Button, MenuItem, Chip, Snackbar,
} from "@mui/material";
import {
  FileText, CalendarCheck, UserCheck, User, Plus, CalendarDays, Clock, Sun, Moon,
} from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import Loading from "../../../shared/components/Loading";
import { obtenerPermisos, crearPermiso } from "../permiso.api";
import { obtenerEmpleados } from "../../empleados/empleado.api";
import { obtenerAreas } from "../../areas/area.api";
import useRol from "../../../shared/hooks/useRol";
import PermisoDetailModal from "../components/PermisoDetailModal";

const estiloBtn = {
  width: 30, height: 30, borderRadius: "8px", border: "none",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", flexShrink: 0, transition: "all .2s ease",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    background: "#fff",
    "& fieldset": { borderColor: "#E5E7EB" },
    "&:hover fieldset": { borderColor: "#2E7D32" },
    "&.Mui-focused fieldset": { borderColor: "#1B5E20" },
  },
  "& .MuiInputLabel-root": { fontSize: 13, color: "#6B7280" },
  "& .MuiInputBase-input": { fontSize: 13 },
};

export default function PermisosPage() {
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empleados, setEmpleados] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areaFiltro, setAreaFiltro] = useState("Todas");
  const [busqueda, setBusqueda] = useState("");

  const [form, setForm] = useState({ empleado_id: "", fecha_desde: "", fecha_hasta: "", motivo: "", tipo: "completo" });
  const [guardando, setGuardando] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const [permisoSeleccionado, setPermisoSeleccionado] = useState(null);
  const [openDetalle, setOpenDetalle] = useState(false);
  const { puede } = useRol();

  useEffect(() => {
    obtenerPermisos().then((p) => setPermisos(p.permisos || [])).catch(() => {});
    obtenerEmpleados().then((e) => setEmpleados(e.empleados || e || [])).catch(() => {});
    obtenerAreas().then((a) => setAreas(Array.isArray(a) ? a : a?.areas || [])).catch(() => {});
    setLoading(false);
  }, []);

  const empleadoAreaMap = Object.fromEntries(
    (empleados).map((emp) => [emp.id, emp.area || emp.area_nombre || ""])
  );

  const empleadosFiltrados = areaFiltro === "Todas"
    ? empleados
    : empleados.filter((emp) => empleadoAreaMap[emp.id] === areaFiltro);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGuardar = async () => {
    if (!form.empleado_id || !form.fecha_desde || !form.fecha_hasta || !form.motivo.trim()) {
      setSnack({ open: true, msg: "Todos los campos son obligatorios", severity: "error" });
      return;
    }
    if (form.fecha_desde > form.fecha_hasta) {
      setSnack({ open: true, msg: "La fecha 'hasta' debe ser mayor o igual a 'desde'", severity: "error" });
      return;
    }
    setGuardando(true);
    try {
      const res = await crearPermiso(form);
      const tipoLabel = { completo: "día completo", mañana: "solo mañana", tarde: "solo tarde" }[form.tipo] || "";
      setSnack({
        open: true,
        msg: `Permiso registrado (${tipoLabel})${res.dias_generados ? ` — ${res.dias_generados} día(s) justificado(s)` : " — el empleado marca la otra mitad normalmente"}`,
        severity: "success",
      });
      setForm({ empleado_id: "", fecha_desde: "", fecha_hasta: "", motivo: "", tipo: "completo" });
      const updated = await obtenerPermisos();
      setPermisos(updated.permisos || []);
    } catch {
      setSnack({ open: true, msg: "Error al registrar el permiso", severity: "error" });
    }
    setGuardando(false);
  };

  const totalMes = permisos.filter((p) => {
    const d = new Date(p.creado_en);
    const ahora = new Date();
    return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
  }).length;

  const activosHoy = permisos.filter((p) => {
    const hoy = new Date().toISOString().split("T")[0];
    return p.fecha_desde <= hoy && p.fecha_hasta >= hoy;
  }).length;

  const cols = [
    { field: "empleado_nombre", headerName: "Empleado", width: 160,
      renderCell: ({ row }) => `${row.empleado_nombre || ""} ${row.empleado_apellido || ""}`.trim() || "—" },
    { field: "fecha_desde", headerName: "Desde", width: 100, valueFormatter: (v) => v ? new Date(v).toLocaleDateString("es-CO") : "—" },
    { field: "fecha_hasta", headerName: "Hasta", width: 100, valueFormatter: (v) => v ? new Date(v).toLocaleDateString("es-CO") : "—" },
    { field: "motivo", headerName: "Motivo", width: 200 },
    { field: "tipo", headerName: "Tipo", width: 110,
      renderCell: ({ row }) => {
        const t = row.tipo || "completo";
        const cfg = {
          completo: { label: "Completo", color: "#1B5E20", bg: "#E8F5E9", icon: <Clock size={12} /> },
          mañana: { label: "Solo mañana", color: "#92400E", bg: "#FEF3C7", icon: <Sun size={12} /> },
          tarde: { label: "Solo tarde", color: "#6B21A8", bg: "#F3E8FF", icon: <Moon size={12} /> },
        }[t];
        return <Chip icon={cfg?.icon} label={cfg?.label || t} size="small" sx={{ fontWeight: 600, fontSize: 11, bgcolor: cfg?.bg || "#F3F4F6", color: cfg?.color || "#111827", borderRadius: "8px" }} />;
      },
    },
    { field: "dias", headerName: "Días", width: 70, renderCell: ({ row }) => {
      if (!row.fecha_desde || !row.fecha_hasta) return "—";
      const ini = new Date(row.fecha_desde), fin = new Date(row.fecha_hasta);
      let count = 0;
      for (let d = new Date(ini); d <= fin; d.setDate(d.getDate() + 1)) {
        const ds = d.getDay();
        if (ds !== 0 && ds !== 6) count++;
      }
      return <Chip label={count} size="small" sx={{ fontWeight: 600, fontSize: 11, bgcolor: "#E8F5E9", color: "#1B5E20", borderRadius: "8px" }} />;
    } },
    { field: "registrado_por_nombre", headerName: "Registrado por", width: 150 },
    { field: "creado_en", headerName: "Fecha registro", width: 120, valueFormatter: (v) => v ? new Date(v).toLocaleDateString("es-CO") : "—" },
  ];

  if (loading) return <Loading texto="Cargando permisos..." />;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>Inicio / Talento Humano / Permisos</Typography>

      {/* Tarjetas resumen */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
        {[
          { icon: <FileText size={20} />, value: totalMes, label: "Permisos este mes", color: "#1B5E20", bg: "#E8F5E9" },
          { icon: <CalendarCheck size={20} />, value: activosHoy, label: "Con permiso hoy", color: "#1565C0", bg: "#EFF6FF" },
          { icon: <UserCheck size={20} />, value: permisos.length, label: "Total registrados", color: "#7C3AED", bg: "#F3E8FF" },
          { icon: <CalendarDays size={20} />, value: `${new Date().toLocaleDateString("es-CO", { month: "long", year: "numeric" })}`, label: "Mes actual", color: "#6B7280", bg: "#F3F4F6" },
        ].map((card, i) => (
          <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid #ECECEC", display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>
              {card.icon}
            </Box>
            <Box>
              <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" }}>{card.label}</Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 700, color: card.color, lineHeight: 1.2, textTransform: "capitalize" }}>{card.value}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Formulario registro */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #ECECEC" }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#111827", mb: 2 }}>Registrar permiso</Typography>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "end" }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Área (filtro)</Typography>
            <TextField select size="small" value={areaFiltro} onChange={(e) => setAreaFiltro(e.target.value)}
              sx={{ minWidth: 150, ...fieldSx }}>
              <MenuItem value="Todas">Todas las áreas</MenuItem>
              {areas.map((a) => <MenuItem key={a.id} value={a.nombre}>{a.nombre}</MenuItem>)}
            </TextField>
          </Box>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Empleado</Typography>
            <TextField select size="small" name="empleado_id" value={form.empleado_id} onChange={handleChange}
              sx={{ width: "100%", ...fieldSx }}>
              <MenuItem value="">Seleccionar empleado</MenuItem>
              {empleadosFiltrados.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>{emp.nombre} {emp.apellido} — {empleadoAreaMap[emp.id] || "Sin área"}</MenuItem>
              ))}
            </TextField>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Desde</Typography>
            <TextField type="date" size="small" name="fecha_desde" value={form.fecha_desde} onChange={handleChange}
              sx={{ width: 160, ...fieldSx }} InputLabelProps={{ shrink: true }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Hasta</Typography>
            <TextField type="date" size="small" name="fecha_hasta" value={form.fecha_hasta} onChange={handleChange}
              sx={{ width: 160, ...fieldSx }} InputLabelProps={{ shrink: true }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Tipo</Typography>
            <TextField select size="small" name="tipo" value={form.tipo} onChange={handleChange}
              sx={{ width: 150, ...fieldSx }}>
              <MenuItem value="completo"><Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}><Clock size={14} /> Día completo</Box></MenuItem>
              <MenuItem value="mañana"><Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}><Sun size={14} /> Solo mañana</Box></MenuItem>
              <MenuItem value="tarde"><Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}><Moon size={14} /> Solo tarde</Box></MenuItem>
            </TextField>
          </Box>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Motivo</Typography>
            <TextField size="small" name="motivo" value={form.motivo} onChange={handleChange}
              placeholder="Ej: Viaje a Medellín" sx={{ width: "100%", ...fieldSx }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>&nbsp;</Typography>
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={handleGuardar} disabled={guardando}
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 3, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}>
              {guardando ? "Guardando..." : "Registrar permiso"}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Tabla historial */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #ECECEC" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Historial de permisos</Typography>
          <TextField size="small" placeholder="Buscar empleado..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            sx={{ width: 220, "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13 } }} />
        </Box>
        <DataTable
          rows={permisos.filter((p) => {
            if (!busqueda) return true;
            const nom = `${p.empleado_nombre || ""} ${p.empleado_apellido || ""}`.toLowerCase();
            return nom.includes(busqueda.toLowerCase()) || (p.motivo || "").toLowerCase().includes(busqueda.toLowerCase());
          })}
          columns={cols}
          entityLabel="permisos"
          getRowId={(r) => r.id}
          pageSize={10}
          onRowClick={({ row }) => {
            setPermisoSeleccionado(row);
            setOpenDetalle(true);
          }}
        />
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        message={snack.msg}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        ContentProps={{ sx: { borderRadius: "10px", fontWeight: 500, fontSize: 13 } }}
      />

      <PermisoDetailModal
        open={openDetalle}
        onClose={() => { setOpenDetalle(false); setPermisoSeleccionado(null); }}
        permiso={permisoSeleccionado}
      />
    </Box>
  );
}
