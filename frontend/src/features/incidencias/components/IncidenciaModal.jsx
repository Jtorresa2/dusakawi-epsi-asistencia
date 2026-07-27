import { useState, useEffect } from "react";
import {
  Box, Button, Paper, TextField, Typography, Select, MenuItem,
} from "@mui/material";

const TIPOS = ["Tardanza", "Permiso", "Incapacidad", "Vacaciones", "Ausencia", "Salida anticipada", "Olvido de marcación"];
const ESTADOS = ["Pendiente", "Aprobada", "Rechazada"];

const inputSx = { borderRadius: "10px", fontSize: 13, height: 40, py: 0, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#ECECEC" } };

export default function IncidenciaModal({ open, onClose, onGuardar, incidencia }) {
  const [form, setForm] = useState({
    empleado: "", cargo: "", tipo: "Tardanza", fecha: new Date().toISOString().split("T")[0],
    estado: "Pendiente", responsable: "", responsable_cargo: "", descripcion: "",
  });

  useEffect(() => {
    if (!open) return;
    if (incidencia) {
      setForm({
        empleado: incidencia.empleado || "",
        cargo: incidencia.cargo || "",
        tipo: incidencia.tipo || "Tardanza",
        fecha: incidencia.fecha || new Date().toISOString().split("T")[0],
        estado: incidencia.estado || "Pendiente",
        responsable: incidencia.responsable || "",
        responsable_cargo: incidencia.responsable_cargo || "",
        descripcion: incidencia.descripcion || "",
      });
    } else {
      setForm({
        empleado: "", cargo: "", tipo: "Tardanza", fecha: new Date().toISOString().split("T")[0],
        estado: "Pendiente", responsable: "", responsable_cargo: "", descripcion: "",
      });
    }
  }, [open, incidencia]);

  if (!open) return null;

  return (
    <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <Paper elevation={0} sx={{ borderRadius: "20px", p: 3, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
          <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>
            {incidencia ? "Editar incidencia" : "Nueva incidencia"}
          </Typography>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", color: "#9CA3AF" }}>✕</button>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Empleado</Typography>
              <TextField value={form.empleado} onChange={(e) => setForm({ ...form, empleado: e.target.value })} placeholder="Nombre completo" fullWidth slotProps={{ input: { sx: inputSx } }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Cargo</Typography>
              <TextField value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Cargo" fullWidth slotProps={{ input: { sx: inputSx } }} />
            </Box>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Tipo de incidencia</Typography>
              <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} size="small" fullWidth sx={inputSx}>
                {TIPOS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Estado</Typography>
              <Select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} size="small" fullWidth sx={inputSx}>
                {ESTADOS.map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
              </Select>
            </Box>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Fecha</Typography>
              <TextField type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} fullWidth slotProps={{ input: { sx: inputSx } }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Responsable</Typography>
              <TextField value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} placeholder="Nombre" fullWidth slotProps={{ input: { sx: inputSx } }} />
            </Box>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Descripción</Typography>
            <TextField multiline rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Describe la incidencia..." fullWidth
              slotProps={{ input: { sx: { ...inputSx, height: "auto", py: 1, resize: "vertical" } } }} />
          </Box>
          <Box display="flex" gap={1} justifyContent="flex-end" mt={1}>
            <Button onClick={onClose} variant="outlined"
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 3, color: "#6B7280", borderColor: "#ECECEC", "&:hover": { borderColor: "#1B5E20" } }}>
              Cancelar
            </Button>
            <Button onClick={() => onGuardar(form)} variant="contained"
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 3, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}>
              {incidencia ? "Actualizar" : "Guardar"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
