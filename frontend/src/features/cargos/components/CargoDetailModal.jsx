import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Divider,
  IconButton,
} from "@mui/material";
import {
  UserRound, Building2, Users, CalendarDays, Clock,
  FileText, X,
} from "lucide-react";

const PALETA = {
  verdeOscuro: "#1B5E20",
  verde: "#2E7D32",
  verdeClaro: "#E8F5E9",
  borde: "#ECECEC",
  gris: "#9CA3AF",
  grisTexto: "#6B7280",
  texto: "#111827",
  rojo: "#DC2626",
};

const fmtFecha = (f) => {
  if (!f) return "—";
  try {
    return new Date(f).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
};

const infoCardSx = {
  border: `1px solid ${PALETA.borde}`,
  borderRadius: "14px",
  bgcolor: "#FFFFFF",
  p: 1.5,
};

const infoLabelSx = { fontSize: 10.5, color: PALETA.gris, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" };
const infoValueSx = { fontSize: 13.5, fontWeight: 700, color: PALETA.texto, mt: 0.4 };

export default function CargoDetailModal({ open, onClose, cargo }) {
  if (!cargo) return null;

  const activo = cargo.estado !== "inactivo";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: "18px",
          position: "relative",
          boxShadow: "0 24px 70px rgba(0,0,0,0.25)",
          backgroundColor: "#FFFFFF",
          overflow: "hidden",
        },
      }}
      sx={{ "& .MuiBackdrop-root": { bgcolor: "rgba(17, 24, 39, 0.5)", backdropFilter: "blur(4px)" } }}
    >
      {/* HEADER */}
      <DialogContent sx={{ px: 3, py: 2, bgcolor: "#FFFFFF" }}>
        <Box sx={{ display: "flex", gap: 1.75, alignItems: "center" }}>
          <Box sx={{ width: 44, height: 44, borderRadius: "13px", bgcolor: PALETA.verdeClaro, color: PALETA.verdeOscuro, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <UserRound size={21} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 17, fontWeight: 700, color: PALETA.texto, lineHeight: 1.25 }}>
              {cargo.nombre}
            </Typography>
            <Typography sx={{ fontSize: 12, color: PALETA.grisTexto, mt: 0.15, display: "flex", alignItems: "center", gap: 0.75 }}>
              <Building2 size={13} style={{ color: PALETA.gris }} />
              {cargo.areas || "Área sin asignar"}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small"
          sx={{ position: "absolute", top: 12, right: 12, color: PALETA.gris, bgcolor: PALETA.grisClaro, "&:hover": { color: PALETA.texto, bgcolor: PALETA.borde } }}>
          <X size={18} />
        </IconButton>
      </DialogContent>
      <Divider />

      {/* RESUMEN */}
      <DialogContent sx={{ px: 3, py: 1.5, bgcolor: "#FFFFFF" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.25 }}>
          <Box sx={infoCardSx}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.4 }}>
              <Building2 size={14} color={PALETA.gris} />
              <Typography sx={infoLabelSx}>Área</Typography>
            </Box>
            <Typography sx={infoValueSx}>{cargo.areas || "—"}</Typography>
          </Box>
          <Box sx={infoCardSx}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.4 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: activo ? PALETA.verde : PALETA.rojo }} />
              <Typography sx={infoLabelSx}>Estado</Typography>
            </Box>
            <Typography sx={{ ...infoValueSx, color: activo ? PALETA.verdeOscuro : PALETA.rojo }}>
              {activo ? "Activo" : "Inactivo"}
            </Typography>
          </Box>
          <Box sx={infoCardSx}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.4 }}>
              <Users size={14} color={PALETA.gris} />
              <Typography sx={infoLabelSx}>Empleados asignados</Typography>
            </Box>
            <Typography sx={infoValueSx}>{cargo.empleados_count ?? 0} colaboradores</Typography>
          </Box>
          <Box sx={infoCardSx}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.4 }}>
              <CalendarDays size={14} color={PALETA.gris} />
              <Typography sx={infoLabelSx}>Fecha de creación</Typography>
            </Box>
            <Typography sx={infoValueSx}>{fmtFecha(cargo.creado_en)}</Typography>
          </Box>
          <Box sx={infoCardSx}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.4 }}>
              <Clock size={14} color={PALETA.gris} />
              <Typography sx={infoLabelSx}>Última actualización</Typography>
            </Box>
            <Typography sx={infoValueSx}>{fmtFecha(cargo.updated_at)}</Typography>
          </Box>
        </Box>
      </DialogContent>

      {/* INFORMACIÓN */}
      <DialogContent sx={{ px: 3, py: 0.5, bgcolor: "#FFFFFF" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.25 }}>
          <Box sx={infoCardSx}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <FileText size={14} color={PALETA.gris} />
              <Typography sx={infoLabelSx}>Descripción</Typography>
            </Box>
            <Typography sx={{ fontSize: 13, color: PALETA.grisTexto, lineHeight: 1.6 }}>
              {cargo.descripcion || "No hay descripción registrada."}
            </Typography>
          </Box>
         
        </Box>
      </DialogContent>
    </Dialog>
  );
}
