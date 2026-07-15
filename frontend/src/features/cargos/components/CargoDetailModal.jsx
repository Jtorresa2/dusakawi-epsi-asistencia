import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
} from "@mui/material";
import { UserRound, Building2, Users } from "lucide-react";
import IconBox from "../../../shared/components/IconBox";

export default function CargoDetailModal({ open, onClose, cargo }) {
  if (!cargo) return null;

  const activo = cargo.estado !== "inactivo";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: "16px" } }}
    >
      <DialogTitle sx={{ fontSize: 18, fontWeight: 700, color: "#111827", pb: 0 }}>
        Detalle del cargo
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <IconBox icon={<UserRound />} color="#2E7D32" size={56} iconSize={26} />
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
              {cargo.nombre}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#6B7280", mt: 0.3 }}>
              Información general del cargo
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        <Box display="flex" flexDirection="column" gap={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ width: 32, display: "flex", justifyContent: "center" }}>
              <Building2 size={18} color="#6B7280" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", mb: 0.3 }}>
                Área
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#111827" }}>
                {cargo.areas || "—"}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ width: 32, display: "flex", justifyContent: "center" }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: activo ? "#2E7D32" : "#DC2626" }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", mb: 0.3 }}>
                Estado
              </Typography>
              <Chip
                label={activo ? "Activo" : "Inactivo"}
                size="small"
                sx={{
                  height: 24, fontSize: 12, fontWeight: 600,
                  bgcolor: activo ? "#E8F5E9" : "#FDECEC",
                  color: activo ? "#1B5E20" : "#DC2626",
                }}
              />
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ width: 32, display: "flex", justifyContent: "center" }}>
              <Users size={18} color="#6B7280" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", mb: 0.3 }}>
                Empleados asignados
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#111827" }}>
                {cargo.empleados_count ?? 0} personas
              </Typography>
            </Box>
          </Box>

          {cargo.descripcion && (
            <Box>
              <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", mb: 0.8, mt: 1 }}>
                Descripción
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#4B5563", lineHeight: 1.6 }}>
                {cargo.descripcion}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 0 }}>
        <Button
          onClick={onClose}
          sx={{
            textTransform: "none", fontWeight: 600, fontSize: 13,
            color: "#6B7280", px: 3, borderRadius: "10px",
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
