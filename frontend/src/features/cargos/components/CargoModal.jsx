import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
  TextField,
  MenuItem,
  Select,
} from "@mui/material";
import { X, Briefcase, Save } from "lucide-react";

const PALETA = {
  verdeOscuro: "#1B5E20",
  verde: "#2E7D32",
  verdeClaro: "#E8F5E9",
  borde: "#ECECEC",
  bordeInput: "#D1D5DB",
  grisClaro: "#F3F4F6",
  gris: "#9CA3AF",
  grisTexto: "#6B7280",
  texto: "#111827",
  rojo: "#DC2626",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    bgcolor: "#FFFFFF",
    minHeight: 40,
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    "& fieldset": { borderColor: PALETA.bordeInput },
    "&:hover fieldset": { borderColor: PALETA.gris },
    "&.Mui-focused fieldset": { borderColor: PALETA.verdeOscuro },
    "&.Mui-focused": { boxShadow: "0 0 0 4px rgba(27, 94, 32, 0.10)" },
  },
  "& .MuiInputLabel-root": { fontSize: 12.5, color: PALETA.grisTexto },
  "& .MuiInputLabel-root.Mui-focused": { color: PALETA.verdeOscuro },
  "& .MuiInputBase-input": { fontSize: 13 },
};

const labelSx = { fontSize: 12, fontWeight: 600, color: PALETA.grisTexto, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 };
const asterisco = <span style={{ color: PALETA.rojo }}>*</span>;

const selectMenuSx = {
  PaperProps: {
    sx: { bgcolor: "#FFFFFF", "& .MuiMenuItem-root": { borderRadius: 1, mx: 0.5 } },
  },
};

export default function CargoModal({
  open,
  onClose,
  onGuardar,
  cargo,
  form,
  errors,
  onChange,
  areas = [],
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: { borderRadius: "18px", position: "relative", boxShadow: "0 24px 70px rgba(0,0,0,0.25)", backgroundColor: "#FFFFFF", maxHeight: "94vh" },
      }}
      sx={{ "& .MuiBackdrop-root": { bgcolor: "rgba(17, 24, 39, 0.5)", backdropFilter: "blur(4px)" } }}
    >
      {/* HEADER */}
      <DialogTitle sx={{ px: 3, py: 1.75, position: "relative", pb: 1.25 }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: "11px", bgcolor: PALETA.verdeClaro, color: PALETA.verdeOscuro,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Briefcase size={19} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: PALETA.texto, lineHeight: 1.2 }}>
              {cargo ? "Editar cargo" : "Nuevo cargo"}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: PALETA.grisTexto, mt: 0.15 }}>
              {cargo ? "Actualiza la información del cargo." : "Registra un nuevo cargo dentro de la organización."}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small"
          sx={{ position: "absolute", top: 11, right: 11, color: PALETA.gris, bgcolor: PALETA.grisClaro, "&:hover": { color: PALETA.texto, bgcolor: PALETA.borde } }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <Divider />

      {/* CUERPO */}
      <DialogContent sx={{ px: 3, py: 1.75, overflowY: "auto", bgcolor: "#FFFFFF" }}>
        <Box sx={{ border: `1px solid ${PALETA.borde}`, borderRadius: "12px", bgcolor: "#FFFFFF", p: 2 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: PALETA.texto, mb: 1.25 }}>
            Información del cargo
          </Typography>

          {/* FILA 1 — Nombre + Área */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
            <Box>
              <Typography sx={labelSx}>Nombre del cargo {asterisco}</Typography>
              <TextField
                name="nombre"
                value={form.nombre}
                onChange={onChange}
                error={!!errors.nombre}
                helperText={errors.nombre}
                fullWidth
                placeholder="Ej: Analista de nómina"
                slotProps={{ inputLabel: { sx: { fontSize: 12.5 } }, formHelperText: { sx: { fontSize: 11 } } }}
                sx={fieldSx}
              />
            </Box>
            <Box>
              <Typography sx={labelSx}>Área {asterisco}</Typography>
              <Select
                name="area_id"
                value={form.area_id ?? ""}
                onChange={onChange}
                fullWidth
                size="small"
                displayEmpty
                MenuProps={selectMenuSx}
                sx={fieldSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <Briefcase size={15} style={{ color: PALETA.gris, marginRight: 6 }} />
                    ),
                  },
                }}
              >
                <MenuItem value="">
                  <em>Selecciona un área</em>
                </MenuItem>
                {areas.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.nombre}
                  </MenuItem>
                ))}
              </Select>
              <Typography sx={{ fontSize: 10.5, color: PALETA.gris, mt: 0.5 }}>
                El cargo quedará asociado al área seleccionada.
              </Typography>
            </Box>
          </Box>

          {/* FILA 2 — Estado */}
          <Box>
            <Typography sx={labelSx}>Estado</Typography>
            <Select
              name="estado"
              value={form.estado || "activo"}
              onChange={onChange}
              fullWidth
              size="small"
              MenuProps={selectMenuSx}
              sx={{ maxWidth: 260, ...fieldSx }}
            >
              <MenuItem value="activo">Activo</MenuItem>
              <MenuItem value="inactivo">Inactivo</MenuItem>
            </Select>
          </Box>

          {/* FILA 3 — Descripción (full width) */}
          <Box>
            <Typography sx={labelSx}>Descripción</Typography>
            <TextField
              name="descripcion"
              value={form.descripcion}
              onChange={onChange}
              multiline
              rows={4}
              fullWidth
              placeholder="Describe brevemente las funciones o responsabilidades del cargo."
              slotProps={{ inputLabel: { sx: { fontSize: 12.5 } } }}
              sx={fieldSx}
            />
          </Box>
        </Box>
      </DialogContent>

      {/* FOOTER */}
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1.5 }}>
        <Button
          onClick={onClose}
          sx={{ borderRadius: "9px", textTransform: "none", fontSize: 12.5, fontWeight: 600, color: PALETA.grisTexto, bgcolor: "#FFFFFF", border: `1px solid ${PALETA.bordeInput}`, px: 3, py: 0.6, "&:hover": { bgcolor: PALETA.grisClaro } }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          startIcon={<Save size={15} />}
          onClick={onGuardar}
          sx={{ borderRadius: "9px", textTransform: "none", fontSize: 12.5, fontWeight: 600, px: 3.5, py: 0.6, bgcolor: PALETA.verdeOscuro, "&:hover": { bgcolor: PALETA.verde } }}
        >
          Guardar cargo
        </Button>
      </DialogActions>
    </Dialog>
  );
}
