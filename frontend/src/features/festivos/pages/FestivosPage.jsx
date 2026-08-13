import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, TextField, Button, MenuItem, Chip, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Divider, Select,
} from "@mui/material";
import { Plus, Trash2, Pencil, CalendarDays, Wand2, X, Save } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import Loading from "../../../shared/components/Loading";
import { obtenerFestivos, crearFestivo, eliminarFestivo, actualizarFestivo, generarFestivos } from "../festivos.api";
import { COLORES } from "../../../shared/constants/colores.js";

const TIPOS = [
  { value: "nacional", label: "Nacional" },
  { value: "regional", label: "Regional" },
  { value: "institucional", label: "Institucional" },
];

const estiloBtn = {
  width: 30, height: 30, borderRadius: "8px", border: "none",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", flexShrink: 0, transition: "all .2s ease",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px", background: COLORES.fondoBlanco,
    "& fieldset": { borderColor: COLORES.textoPrimario },
    "&:hover fieldset": { borderColor: COLORES.textoPrimario },
    "&.Mui-focused fieldset": { borderColor: COLORES.textoPrimario },
  },
  "& .MuiInputLabel-root": { fontSize: 13, color: COLORES.textoTerciario },
  "& .MuiInputBase-input": { fontSize: 13 },
};

const modalFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px", background: COLORES.fondoBlanco,
    "& fieldset": { borderColor: COLORES.textoPrimario },
    "&:hover fieldset": { borderColor: COLORES.textoPrimario },
    "&.Mui-focused fieldset": { borderColor: COLORES.textoPrimario },
  },
  "& .MuiInputLabel-root": { fontSize: 13, color: COLORES.textoTerciario },
  "& .MuiInputBase-input": { fontSize: 13 },
};

const editFieldSx = {
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
  "& .MuiInputLabel-root": { fontSize: 12.5, color: COLORES.textoTerciario },
  "& .MuiInputLabel-root.Mui-focused": { color: COLORES.primarioOscuro },
  "& .MuiInputBase-input": { fontSize: 13 },
};

const labelSx = { fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 };
const asterisco = <span style={{ color: COLORES.danger }}>*</span>;

const selectMenuSx = {
  slotProps: {
    paper: { sx: { bgcolor: COLORES.fondoBlanco, "& .MuiMenuItem-root": { borderRadius: 1, mx: 0.5 } } },
  },
};

export default function FestivosPage() {
  const [festivos, setFestivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ fecha: "", nombre: "", tipo: "nacional" });
  const [guardando, setGuardando] = useState(false);
  const [dialogEliminar, setDialogEliminar] = useState(null);
  const [dialogEditar, setDialogEditar] = useState(null);
  const [editForm, setEditForm] = useState({ fecha: "", nombre: "", tipo: "nacional", activo: 1 });
  const [editando, setEditando] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const [yearGen, setYearGen] = useState(new Date().getFullYear());
  const [generando, setGenerando] = useState(false);

  const cargar = () => obtenerFestivos()
    .then((d) => setFestivos(d.festivos || []))
    .catch(() => {})
    .finally(() => setLoading(false));

  useEffect(() => { cargar(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGuardar = async () => {
    if (!form.fecha || !form.nombre.trim()) {
      setSnack({ open: true, msg: "Fecha y nombre son requeridos", severity: "error" });
      return;
    }
    setGuardando(true);
    try {
      await crearFestivo(form);
      setSnack({ open: true, msg: "Festivo agregado", severity: "success" });
      setForm({ fecha: "", nombre: "", tipo: "nacional" });
      await cargar();
    } catch {
      setSnack({ open: true, msg: "Error al guardar el festivo", severity: "error" });
    }
    setGuardando(false);
  };

  const handleEliminar = async () => {
    if (!dialogEliminar) return;
    try {
      await eliminarFestivo(dialogEliminar);
      setSnack({ open: true, msg: "Festivo eliminado", severity: "success" });
      setDialogEliminar(null);
      await cargar();
    } catch {
      setSnack({ open: true, msg: "Error al eliminar", severity: "error" });
    }
  };

  const abrirEditar = (row) => {
    const d = row.fecha ? new Date(row.fecha).toISOString().split("T")[0] : "";
    setEditForm({ fecha: d, nombre: row.nombre || "", tipo: row.tipo || "nacional", activo: row.activo ? 1 : 0 });
    setDialogEditar(row);
  };

  const handleGuardarEdicion = async () => {
    if (!dialogEditar || !editForm.fecha || !editForm.nombre.trim()) {
      setSnack({ open: true, msg: "Fecha y nombre son requeridos", severity: "error" });
      return;
    }
    setEditando(true);
    try {
      await actualizarFestivo(dialogEditar.id, editForm);
      setSnack({ open: true, msg: "Festivo actualizado", severity: "success" });
      setDialogEditar(null);
      await cargar();
    } catch {
      setSnack({ open: true, msg: "Error al actualizar el festivo", severity: "error" });
    }
    setEditando(false);
  };

  const handleGenerar = async () => {
    if (!yearGen) return;
    setGenerando(true);
    try {
      const res = await generarFestivos(Number(yearGen));
      setSnack({ open: true, msg: res.mensaje || `Festivos generados para ${yearGen}`, severity: "success" });
      await cargar();
    } catch {
      setSnack({ open: true, msg: "Error al generar festivos", severity: "error" });
    }
    setGenerando(false);
  };

  const cols = [
    { field: "fecha", headerName: "Fecha", width: 140,
      valueFormatter: (v) => v ? new Date(v).toLocaleDateString("es-CO") : "—",
    },
    { field: "nombre", headerName: "Festivo", width: 280,
      renderCell: ({ row }) => (
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORES.textoPrimario }}>{row.nombre}</Typography>
      ),
    },
    { field: "tipo", headerName: "Tipo", width: 140,
      renderCell: ({ row }) => {
        const cfg = { nacional: { label: "Nacional", color: COLORES.primarioOscuro, bg: COLORES.primarioClaro }, regional: { label: "Regional", color: COLORES.warningOscuro, bg: COLORES.warningFondo }, institucional: { label: "Institucional", color: COLORES.primarioOscuro, bg: COLORES.primarioClaro } };
        const c = cfg[row.tipo] || cfg.nacional;
        return <Chip label={c.label} size="small" sx={{ fontWeight: 600, fontSize: 11, bgcolor: c.bg, color: c.color, borderRadius: "8px" }} />;
      },
    },
    { field: "activo", headerName: "Estado", width: 100,
      renderCell: ({ row }) => (
        <Chip label={row.activo ? "Activo" : "Inactivo"} size="small"
          sx={{ fontWeight: 600, fontSize: 11, bgcolor: row.activo ? COLORES.primarioClaro : COLORES.dangerFondo, color: row.activo ? COLORES.primario : COLORES.danger, borderRadius: "8px" }} />
      ),
    },
    { field: "acciones", headerName: "Acciones", width: 90, sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Box sx={{ ...estiloBtn, bgcolor: COLORES.primarioClaro, color: COLORES.primario, "&:hover": { bgcolor: COLORES.primarioClaro2 } }} title="Editar"
            onClick={() => abrirEditar(row)}>
            <Pencil size={14} />
          </Box>
          <Box sx={{ ...estiloBtn, bgcolor: COLORES.dangerFondo, color: COLORES.danger, "&:hover": { bgcolor: COLORES.dangerBorde } }} title="Eliminar"
            onClick={() => setDialogEliminar(row.id)}>
            <Trash2 size={14} />
          </Box>
        </Box>
      ),
    },
  ];

  if (loading) return <Loading texto="Cargando festivos..." />;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Typography sx={{ fontSize: 13, color: COLORES.textoMuted }}>Inicio / Gestión de mantenimiento / Festivos</Typography>

      {/* Formulario */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}` }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <CalendarDays size={20} color={COLORES.primarioOscuro} />
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario }}>
            Agregar festivo
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "end" }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Fecha</Typography>
            <TextField type="date" size="small" name="fecha" value={form.fecha} onChange={handleChange}
              sx={{ width: 180, ...fieldSx }} slotProps={{ inputLabel: { shrink: true } }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Nombre del festivo</Typography>
            <TextField size="small" name="nombre" value={form.nombre} onChange={handleChange}
              placeholder="Ej: Día de la Independencia" sx={{ width: "100%", ...fieldSx }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Tipo</Typography>
            <TextField select size="small" name="tipo" value={form.tipo} onChange={handleChange}
              sx={{ width: 150, ...fieldSx }}>
              {TIPOS.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>&nbsp;</Typography>
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={handleGuardar} disabled={guardando}
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 3, bgcolor: COLORES.primarioOscuro, "&:hover": { bgcolor: COLORES.primario } }}>
              {guardando ? "Guardando..." : "Agregar"}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Generar festivos nacionales */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}` }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Wand2 size={20} color={COLORES.primarioOscuro} />
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario }}>
            Generar festivos nacionales
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "end" }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Año</Typography>
            <TextField type="number" size="small" value={yearGen} onChange={(e) => setYearGen(Number(e.target.value))}
              slotProps={{ htmlInput: { min: 2000, max: 2100 } }}
              sx={{ width: 120, "& .MuiOutlinedInput-root": { borderRadius: "10px", background: COLORES.fondoBlanco, "& fieldset": { borderColor: COLORES.borde }, "&:hover fieldset": { borderColor: COLORES.primario }, "&.Mui-focused fieldset": { borderColor: COLORES.primarioOscuro } }, "& .MuiInputBase-input": { fontSize: 13 } }} />
          </Box>
          <Button variant="contained" startIcon={<Wand2 size={16} />} onClick={handleGenerar} disabled={generando}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 3, bgcolor: COLORES.primarioOscuro, "&:hover": { bgcolor: COLORES.primario } }}>
            {generando ? "Generando..." : "Generar festivos nacionales"}
          </Button>
        </Box>
      </Paper>

      {/* Tabla */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}` }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario, mb: 1.5 }}>
          Calendario de festivos ({festivos.length})
        </Typography>
        <DataTable rows={festivos} columns={cols} entityLabel="festivos" getRowId={(r) => r.id} pageSize={15} />
      </Paper>

      {/* Editar festivo */}
      <Dialog
        open={!!dialogEditar}
        onClose={() => setDialogEditar(null)}
        fullWidth
        maxWidth="md"
        slotProps={{
          paper: { sx: { borderRadius: "18px", position: "relative", boxShadow: "0 24px 70px rgba(0,0,0,0.25)", backgroundColor: COLORES.fondoBlanco, maxHeight: "94vh" } },
        }}
        sx={{ "& .MuiBackdrop-root": { bgcolor: "rgba(17, 24, 39, 0.5)", backdropFilter: "blur(4px)" } }}
      >
        {/* HEADER */}
        <DialogTitle sx={{ px: 3, py: 1.75, position: "relative", pb: 1.25 }}>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Box sx={{
              width: 38, height: 38, borderRadius: "11px", bgcolor: COLORES.primarioClaro, color: COLORES.primarioOscuro,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <CalendarDays size={19} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: COLORES.textoPrimario, lineHeight: 1.2 }}>
                Editar festivo
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: COLORES.textoTerciario, mt: 0.15 }}>
                Actualiza la información del festivo.
              </Typography>
            </Box>
          </Box>
          <IconButton aria-label="Cerrar" onClick={() => setDialogEditar(null)} size="small"
            sx={{ position: "absolute", top: 11, right: 11, color: COLORES.textoSuave, bgcolor: COLORES.fondoGris2, "&:hover": { color: COLORES.textoPrimario, bgcolor: COLORES.grisContorno } }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <Divider />

        {/* CUERPO */}
        <DialogContent sx={{ px: 3, py: 1.75, overflowY: "auto", bgcolor: COLORES.fondoBlanco }}>
          <Box sx={{ border: `1px solid ${COLORES.primarioClaro2}`, borderRadius: "12px", bgcolor: COLORES.fondoBlanco, p: 2 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: COLORES.textoPrimario, mb: 1.25 }}>
              Información del festivo
            </Typography>

            {/* FILA 1 — Nombre + Fecha */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
              <Box>
                <Typography sx={labelSx}>Nombre del festivo {asterisco}</Typography>
                <TextField
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                  fullWidth
                  placeholder="Día de la Independencia"
                  slotProps={{ inputLabel: { sx: { fontSize: 12.5 } } }}
                  sx={editFieldSx}
                />
              </Box>
              <Box>
                <Typography sx={labelSx}>Fecha {asterisco}</Typography>
                <TextField
                  type="date"
                  size="small"
                  value={editForm.fecha}
                  onChange={(e) => setEditForm({ ...editForm, fecha: e.target.value })}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={editFieldSx}
                />
              </Box>
            </Box>

            {/* FILA 2 — Tipo + Estado */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, mt: 1.5 }}>
              <Box>
                <Typography sx={labelSx}>Tipo de festivo {asterisco}</Typography>
                <Select
                  value={editForm.tipo || "nacional"}
                  onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value })}
                  fullWidth
                  size="small"
                  slotProps={{ menu: selectMenuSx }}
                  sx={editFieldSx}
                >
                  {TIPOS.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </Box>
              <Box>
                <Typography sx={labelSx}>Estado</Typography>
                <Select
                  value={editForm.activo}
                  onChange={(e) => setEditForm({ ...editForm, activo: Number(e.target.value) })}
                  fullWidth
                  size="small"
                  slotProps={{ menu: selectMenuSx }}
                  sx={editFieldSx}
                >
                  <MenuItem value={1}>Activo</MenuItem>
                  <MenuItem value={0}>Inactivo</MenuItem>
                </Select>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        {/* FOOTER */}
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5, gap: 1.5 }}>
          <Button
            onClick={() => setDialogEditar(null)}
            sx={{ borderRadius: "9px", textTransform: "none", fontSize: 12.5, fontWeight: 600, color: COLORES.textoTerciario, bgcolor: COLORES.fondoBlanco, border: `1px solid ${COLORES.borde2}`, px: 3, py: 0.6, "&:hover": { bgcolor: COLORES.fondoGris2 } }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={<Save size={15} />}
            onClick={handleGuardarEdicion}
            disabled={editando}
            sx={{ borderRadius: "9px", textTransform: "none", fontSize: 12.5, fontWeight: 600, px: 3.5, py: 0.6, bgcolor: COLORES.primarioOscuro, "&:hover": { bgcolor: COLORES.primario } }}
          >
            {editando ? "Guardando..." : "Guardar festivo"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación eliminar */}
      <Dialog open={!!dialogEliminar} onClose={() => setDialogEliminar(null)}
        slotProps={{ paper: { sx: { borderRadius: "16px", maxWidth: 400 } } }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: COLORES.textoPrimario, pb: 0 }}>
          Eliminar festivo
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ fontSize: 14, color: COLORES.textoTerciario }}>
            ¿Estás seguro? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0, gap: 1 }}>
          <Button onClick={() => setDialogEliminar(null)}
            sx={{ textTransform: "none", fontWeight: 600, fontSize: 13, color: COLORES.textoTerciario, borderRadius: "10px", px: 3 }}>
            Cancelar
          </Button>
          <Button onClick={handleEliminar} variant="contained"
            sx={{ textTransform: "none", fontWeight: 600, fontSize: 13, borderRadius: "10px", px: 3, bgcolor: COLORES.danger, "&:hover": { bgcolor: COLORES.dangerOscuro2 } }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}
        message={snack.msg} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        ContentProps={{ sx: { borderRadius: "10px", fontWeight: 500, fontSize: 13 } }} />
    </Box>
  );
}
