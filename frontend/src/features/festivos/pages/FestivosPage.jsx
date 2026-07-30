import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, TextField, Button, MenuItem, Chip, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from "@mui/material";
import { Plus, Trash2, Pencil, CalendarDays, Wand2, X } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import Loading from "../../../shared/components/Loading";
import { obtenerFestivos, crearFestivo, eliminarFestivo, actualizarFestivo, generarFestivos } from "../festivos.api";

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
    borderRadius: "10px", background: "#fff",
    "& fieldset": { borderColor: "#E5E7EB" },
    "&:hover fieldset": { borderColor: "#2E7D32" },
    "&.Mui-focused fieldset": { borderColor: "#1B5E20" },
  },
  "& .MuiInputLabel-root": { fontSize: 13, color: "#6B7280" },
  "& .MuiInputBase-input": { fontSize: 13 },
};

const modalFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px", background: "transparent",
    "& fieldset": { borderColor: "#C8E6C9" },
    "&:hover fieldset": { borderColor: "#2E7D32" },
    "&.Mui-focused fieldset": { borderColor: "#1B5E20" },
  },
  "& .MuiInputLabel-root": { fontSize: 13, color: "#6B7280" },
  "& .MuiInputBase-input": { fontSize: 13 },
};

export default function FestivosPage() {
  const [festivos, setFestivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ fecha: "", nombre: "", tipo: "nacional" });
  const [guardando, setGuardando] = useState(false);
  const [dialogEliminar, setDialogEliminar] = useState(null);
  const [dialogEditar, setDialogEditar] = useState(null);
  const [editForm, setEditForm] = useState({ fecha: "", nombre: "", tipo: "nacional" });
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
    setEditForm({ fecha: d, nombre: row.nombre || "", tipo: row.tipo || "nacional" });
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
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{row.nombre}</Typography>
      ),
    },
    { field: "tipo", headerName: "Tipo", width: 140,
      renderCell: ({ row }) => {
        const cfg = { nacional: { label: "Nacional", color: "#1B5E20", bg: "#E8F5E9" }, regional: { label: "Regional", color: "#92400E", bg: "#FEF3C7" }, institucional: { label: "Institucional", color: "#1565C0", bg: "#EFF6FF" } };
        const c = cfg[row.tipo] || cfg.nacional;
        return <Chip label={c.label} size="small" sx={{ fontWeight: 600, fontSize: 11, bgcolor: c.bg, color: c.color, borderRadius: "8px" }} />;
      },
    },
    { field: "activo", headerName: "Estado", width: 100,
      renderCell: ({ row }) => (
        <Chip label={row.activo ? "Activo" : "Inactivo"} size="small"
          sx={{ fontWeight: 600, fontSize: 11, bgcolor: row.activo ? "#E8F5E9" : "#FEE2E2", color: row.activo ? "#2E7D32" : "#DC2626", borderRadius: "8px" }} />
      ),
    },
    { field: "acciones", headerName: "Acciones", width: 90, sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Box sx={{ ...estiloBtn, bgcolor: "#EFF6FF", color: "#2563EB", "&:hover": { bgcolor: "#DBEAFE" } }} title="Editar"
            onClick={() => abrirEditar(row)}>
            <Pencil size={14} />
          </Box>
          <Box sx={{ ...estiloBtn, bgcolor: "#FEE2E2", color: "#DC2626", "&:hover": { bgcolor: "#FECACA" } }} title="Eliminar"
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
      <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>Inicio / Administración / Festivos</Typography>

      {/* Formulario */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #ECECEC" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <CalendarDays size={20} color="#1B5E20" />
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
            Agregar festivo
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "end" }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Fecha</Typography>
            <TextField type="date" size="small" name="fecha" value={form.fecha} onChange={handleChange}
              sx={{ width: 180, ...fieldSx }} InputLabelProps={{ shrink: true }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Nombre del festivo</Typography>
            <TextField size="small" name="nombre" value={form.nombre} onChange={handleChange}
              placeholder="Ej: Día de la Independencia" sx={{ width: "100%", ...fieldSx }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Tipo</Typography>
            <TextField select size="small" name="tipo" value={form.tipo} onChange={handleChange}
              sx={{ width: 150, ...fieldSx }}>
              {TIPOS.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>&nbsp;</Typography>
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={handleGuardar} disabled={guardando}
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 3, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}>
              {guardando ? "Guardando..." : "Agregar"}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Generar festivos nacionales */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #ECECEC" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Wand2 size={20} color="#1B5E20" />
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
            Generar festivos nacionales
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "end" }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Año</Typography>
            <TextField type="number" size="small" value={yearGen} onChange={(e) => setYearGen(Number(e.target.value))}
              inputProps={{ min: 2000, max: 2100 }}
              sx={{ width: 120, "& .MuiOutlinedInput-root": { borderRadius: "10px", background: "#fff", "& fieldset": { borderColor: "#E5E7EB" }, "&:hover fieldset": { borderColor: "#2E7D32" }, "&.Mui-focused fieldset": { borderColor: "#1B5E20" } }, "& .MuiInputBase-input": { fontSize: 13 } }} />
          </Box>
          <Button variant="contained" startIcon={<Wand2 size={16} />} onClick={handleGenerar} disabled={generando}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 3, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}>
            {generando ? "Generando..." : "Generar festivos nacionales"}
          </Button>
        </Box>
      </Paper>

      {/* Tabla */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #ECECEC" }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#111827", mb: 1.5 }}>
          Calendario de festivos ({festivos.length})
        </Typography>
        <DataTable rows={festivos} columns={cols} entityLabel="festivos" getRowId={(r) => r.id} pageSize={15} />
      </Paper>

      {/* Editar festivo */}
      <Dialog open={!!dialogEditar} onClose={() => setDialogEditar(null)}
        fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "16px", position: "relative" } }}
        sx={{ "& .MuiPaper-root": { backgroundColor: "#E8F5E9" } }}>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Pencil size={18} color="#2563EB" />
            Editar festivo
          </Box>
          <IconButton onClick={() => setDialogEditar(null)} size="small" sx={{ position: "absolute", top: 8, right: 8, color: "#9CA3AF", "&:hover": { color: "#6B7280", bgcolor: "#F3F4F6" } }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5, pb: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Fecha</Typography>
              <TextField type="date" size="small" value={editForm.fecha}
                onChange={(e) => setEditForm({ ...editForm, fecha: e.target.value })}
                sx={{ width: "100%", ...modalFieldSx }} InputLabelProps={{ shrink: true }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Nombre del festivo</Typography>
              <TextField size="small" value={editForm.nombre}
                onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                placeholder="Ej: Día de la Independencia" sx={{ width: "100%", ...modalFieldSx }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Tipo</Typography>
              <TextField select size="small" value={editForm.tipo}
                onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value })}
                sx={{ width: "100%", ...modalFieldSx }}>
                {TIPOS.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1, gap: 1 }}>
          <Button onClick={() => setDialogEditar(null)}
            sx={{ textTransform: "none", fontWeight: 600, fontSize: 13, color: "#6B7280", px: 3, borderRadius: "10px" }}>
            Cancelar
          </Button>
          <Button onClick={handleGuardarEdicion} variant="contained" disabled={editando}
            sx={{ textTransform: "none", fontWeight: 600, fontSize: 13, borderRadius: "10px", px: 3, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}>
            {editando ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación eliminar */}
      <Dialog open={!!dialogEliminar} onClose={() => setDialogEliminar(null)}
        PaperProps={{ sx: { borderRadius: "16px", maxWidth: 400 } }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: "#111827", pb: 0 }}>
          Eliminar festivo
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ fontSize: 14, color: "#6B7280" }}>
            ¿Estás seguro? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0, gap: 1 }}>
          <Button onClick={() => setDialogEliminar(null)}
            sx={{ textTransform: "none", fontWeight: 600, fontSize: 13, color: "#6B7280", borderRadius: "10px", px: 3 }}>
            Cancelar
          </Button>
          <Button onClick={handleEliminar} variant="contained"
            sx={{ textTransform: "none", fontWeight: 600, fontSize: 13, borderRadius: "10px", px: 3, bgcolor: "#DC2626", "&:hover": { bgcolor: "#B91C1C" } }}>
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
