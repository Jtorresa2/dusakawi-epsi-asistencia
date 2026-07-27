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
import { CalendarDays, Clock, Sun, Moon, UserCheck, FileText } from "lucide-react";
import IconBox from "../../../shared/components/IconBox";

const tipoConfig = {
  completo: { label: "Completo", color: "#1B5E20", bg: "#E8F5E9", icon: <Clock size={16} /> },
  mañana: { label: "Solo mañana", color: "#92400E", bg: "#FEF3C7", icon: <Sun size={16} /> },
  tarde: { label: "Solo tarde", color: "#6B21A8", bg: "#F3E8FF", icon: <Moon size={16} /> },
};

function calcularDiasHabiles(desde, hasta) {
  if (!desde || !hasta) return 0;
  const ini = new Date(desde), fin = new Date(hasta);
  let count = 0;
  for (let d = new Date(ini); d <= fin; d.setDate(d.getDate() + 1)) {
    const ds = d.getDay();
    if (ds !== 0 && ds !== 6) count++;
  }
  return count;
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-CO", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default function PermisoDetailModal({ open, onClose, permiso }) {
  if (!permiso) return null;

  const tipo = tipoConfig[permiso.tipo || "completo"] || tipoConfig.completo;
  const nombreEmpleado = `${permiso.empleado_nombre || ""} ${permiso.empleado_apellido || ""}`.trim() || "—";
  const diasHabiles = calcularDiasHabiles(permiso.fecha_desde, permiso.fecha_hasta);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: "16px" } }}
    >
      <DialogTitle sx={{ fontSize: 18, fontWeight: 700, color: "#111827", pb: 0 }}>
        Detalle del permiso
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Header empleado */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <IconBox icon={<UserCheck />} color="#2E7D32" size={56} iconSize={26} />
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
              {nombreEmpleado}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#6B7280", mt: 0.3 }}>
              Información del permiso
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        <Box display="flex" flexDirection="column" gap={2.5}>
          {/* Tipo */}
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ width: 32, display: "flex", justifyContent: "center" }}>
              {tipo.icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", mb: 0.3 }}>
                Tipo
              </Typography>
              <Chip
                icon={tipo.icon}
                label={tipo.label}
                size="small"
                sx={{
                  height: 26, fontSize: 12, fontWeight: 600,
                  bgcolor: tipo.bg, color: tipo.color,
                  borderRadius: "8px",
                }}
              />
            </Box>
          </Box>

          {/* Fecha desde */}
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ width: 32, display: "flex", justifyContent: "center" }}>
              <CalendarDays size={18} color="#6B7280" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", mb: 0.3 }}>
                Desde
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#111827" }}>
                {formatFecha(permiso.fecha_desde)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", mb: 0.3 }}>
                Hasta
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#111827" }}>
                {formatFecha(permiso.fecha_hasta)}
              </Typography>
            </Box>
          </Box>

          {/* Días hábiles */}
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ width: 32, display: "flex", justifyContent: "center" }}>
              <Clock size={18} color="#6B7280" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", mb: 0.3 }}>
                Días hábiles
              </Typography>
              <Chip
                label={`${diasHabiles} día${diasHabiles !== 1 ? "s" : ""}`}
                size="small"
                sx={{
                  height: 24, fontSize: 12, fontWeight: 600,
                  bgcolor: "#E8F5E9", color: "#1B5E20",
                  borderRadius: "8px",
                }}
              />
            </Box>
          </Box>

          {/* Motivo */}
          <Box display="flex" alignItems="flex-start" gap={2}>
            <Box sx={{ width: 32, display: "flex", justifyContent: "center", mt: 0.3 }}>
              <FileText size={18} color="#6B7280" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", mb: 0.5 }}>
                Motivo
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#4B5563", lineHeight: 1.6 }}>
                {permiso.motivo || "—"}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* Footer info */}
        <Box display="flex" justifyContent="space-between" sx={{ color: "#9CA3AF" }}>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>
              Registrado por
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#6B7280", mt: 0.2 }}>
              {permiso.registrado_por_nombre || "—"}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>
              Fecha registro
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#6B7280", mt: 0.2 }}>
              {formatFecha(permiso.creado_en)}
            </Typography>
          </Box>
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
