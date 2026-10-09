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
  FormControl,
  InputLabel,
  InputAdornment,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { X, Briefcase, FileText, Plus, Save, Building2 } from "lucide-react";
import { COLORES } from "../../../shared/constants/colores.js";

// ─── Estilos premium idénticos al modal de Personal ─────────────────────────
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
  "& .MuiInputBase-input": { fontSize: 13 },
};

const modalSelectSx = {
  borderRadius: "12px",
  fontSize: 14,
  bgcolor: COLORES.fondoBlanco,
  minHeight: 40,
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

const modalSeccionTitulo = {
  fontSize: 13,
  fontWeight: 700,
  color: COLORES.textoPrimario,
  display: "flex",
  alignItems: "center",
  gap: 1,
};

const modalSeccionSubtitulo = {
  fontSize: 11,
  color: COLORES.textoSuave,
  mt: 0.25,
};

const selectMenuSx = {
  slotProps: {
    paper: {
      sx: {
        bgcolor: COLORES.fondoBlanco,
        borderRadius: "12px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        border: `1px solid ${COLORES.grisContorno}`,
        "& .MuiMenuItem-root": { borderRadius: 1, mx: 0.5, fontSize: 13 },
      },
    },
  },
};

export default function CargoModal({
  open,
  onClose,
  onGuardar,
  cargo,
  form,
  errors = {},
  onChange,
  areas = [],
}) {
  const isEditing = Boolean(cargo);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            borderRadius: "18px",
            position: "relative",
            boxShadow: "0 24px 70px rgba(0,0,0,0.25)",
            maxHeight: "92vh",
          },
        },
      }}
      sx={{
        "& .MuiBackdrop-root": {
          bgcolor: "rgba(17, 24, 39, 0.5)",
          backdropFilter: "blur(4px)",
        },
      }}
    >
      {/* HEADER FIJO */}
      <DialogTitle sx={{ px: 3, py: 2, position: "relative", pb: 1.5 }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              bgcolor: COLORES.primarioClaro,
              color: COLORES.primarioOscuro,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Briefcase size={20} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: 17,
                fontWeight: 700,
                color: COLORES.textoPrimario,
                lineHeight: 1.2,
              }}
            >
              {isEditing ? "Editar cargo" : "Nuevo cargo"}
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: COLORES.textoTerciario,
                mt: 0.15,
              }}
            >
              {isEditing
                ? "Actualiza la información del cargo en el sistema."
                : "Registra un nuevo cargo dentro de la estructura institucional."}
            </Typography>
          </Box>
        </Box>
        <IconButton
          aria-label="Cerrar"
          onClick={onClose}
          size="small"
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            color: COLORES.textoSuave,
            bgcolor: COLORES.fondoGris2,
            "&:hover": { color: COLORES.textoPrimario, bgcolor: COLORES.borde },
          }}
        >
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <Divider />

      {/* CUERPO SCROLLEABLE */}
      <DialogContent
        sx={{
          px: 3,
          py: 2,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 1.75,
          bgcolor: COLORES.fondoGris,
        }}
      >
        {/* SECCIÓN 1 — DATOS PRINCIPALES DEL CARGO */}
        <Box sx={modalSeccionCard}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                bgcolor: COLORES.primarioClaro,
                color: COLORES.primarioOscuro,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Briefcase size={14} />
            </Box>
            <Box>
              <Typography sx={modalSeccionTitulo}>Información principal</Typography>
              <Typography sx={modalSeccionSubtitulo}>
                Nombre y área de asignación institucional
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1.2fr 1fr", md: "1.3fr 1fr auto" },
              gap: 1.5,
              alignItems: "center",
            }}
          >
            {/* NOMBRE DEL CARGO */}
            <TextField
              required
              fullWidth
              name="nombre"
              label="Nombre del cargo"
              value={form.nombre || ""}
              onChange={onChange}
              error={Boolean(errors.nombre)}
              helperText={errors.nombre}
              placeholder="Ej: Analista de nómina"
              slotProps={{
                inputLabel: { sx: { fontSize: 12.5 } },
                formHelperText: { sx: { fontSize: 11 } },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Briefcase size={15} style={{ color: COLORES.textoSuave }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={modalFieldSx}
            />

            {/* ÁREA */}
            <FormControl fullWidth>
              <InputLabel sx={{ fontSize: 12.5, color: COLORES.textoTerciario }}>
                Área
              </InputLabel>
              <Select
                name="area_id"
                value={form.area_id ?? ""}
                label="Área"
                onChange={onChange}
                sx={{ ...modalSelectSx, ...selectIconAdornment }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Building2 size={15} style={{ color: COLORES.textoSuave }} />
                      </InputAdornment>
                    ),
                  },
                  menu: selectMenuSx,
                }}
              >
                <MenuItem value="">
                  <em>Sin área asignada</em>
                </MenuItem>
                {areas.map((a) => (
                  <MenuItem key={a.id} value={String(a.id)}>
                    {a.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* ESTADO CON SWITCH */}
            <Box sx={{ display: "flex", alignItems: "center", pl: { md: 1 } }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.estado === "activo"}
                    onChange={(e) =>
                      onChange({
                        target: {
                          name: "estado",
                          value: e.target.checked ? "activo" : "inactivo",
                        },
                      })
                    }
                  />
                }
                label={form.estado === "activo" ? "Cargo activo" : "Cargo inactivo"}
                sx={{
                  m: 0,
                  "& .MuiFormControlLabel-label": {
                    fontSize: 13,
                    fontWeight: 500,
                    color: COLORES.textoSecundario,
                    whiteSpace: "nowrap",
                  },
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* SECCIÓN 2 — DESCRIPCIÓN Y FUNCIONES */}
        <Box sx={modalSeccionCard}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                bgcolor: COLORES.primarioClaro,
                color: COLORES.primarioOscuro,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={14} />
            </Box>
            <Box>
              <Typography sx={modalSeccionTitulo}>Descripción del cargo</Typography>
              <Typography sx={modalSeccionSubtitulo}>
                Detalla las responsabilidades o funciones del puesto
              </Typography>
            </Box>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={4}
            name="descripcion"
            label="Descripción o funciones"
            value={form.descripcion || ""}
            onChange={onChange}
            placeholder="Describe brevemente las responsabilidades principales del cargo..."
            slotProps={{
              inputLabel: { sx: { fontSize: 12.5 } },
            }}
            sx={modalFieldSx}
          />
        </Box>
      </DialogContent>

      {/* FOOTER FIJO */}
      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1.5 }}>
        <Button
          onClick={onClose}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontSize: 13,
            fontWeight: 600,
            color: COLORES.textoSecundario,
            bgcolor: COLORES.fondoBlanco,
            border: `1px solid ${COLORES.borde2}`,
            px: 3,
            py: 0.75,
            "&:hover": { bgcolor: COLORES.fondoGris },
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          startIcon={isEditing ? <Save size={16} /> : <Plus size={16} />}
          onClick={onGuardar}
          disabled={!form.nombre?.trim()}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontSize: 13,
            fontWeight: 600,
            px: 3.5,
            py: 0.75,
            bgcolor: COLORES.primarioOscuro,
            "&:hover": { bgcolor: COLORES.primario },
          }}
        >
          {isEditing ? "Actualizar cargo" : "Crear cargo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
