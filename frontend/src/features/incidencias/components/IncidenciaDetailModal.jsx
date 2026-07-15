import { Box, Paper, Typography, Chip, Divider, Button } from "@mui/material";
import { Check, X } from "lucide-react";

const tipoStyles = {
  "Tardanza": { bg: "#FEF3C7", color: "#92400E" },
  "Permiso": { bg: "#DBEAFE", color: "#1E40AF" },
  "Incapacidad": { bg: "#EDE9FE", color: "#5B21B6" },
  "Vacaciones": { bg: "#D1FAE5", color: "#065F46" },
  "Ausencia": { bg: "#FEE2E2", color: "#991B1B" },
  "Salida anticipada": { bg: "#F5E6D3", color: "#78350F" },
  "Olvido de marcación": { bg: "#F3F4F6", color: "#4B5563" },
};

const estadoStyles = {
  "Pendiente": { bg: "#FEF3C7", color: "#92400E" },
  "Aprobada": { bg: "#D1FAE5", color: "#065F46" },
  "Rechazada": { bg: "#FEE2E2", color: "#991B1B" },
};

function Row({ label, value }) {
  return (
    <Box display="flex" sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", width: 130, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>
        {value || "—"}
      </Typography>
    </Box>
  );
}

export default function IncidenciaDetailModal({ open, onClose, incidencia, onCambiarEstado }) {
  if (!open || !incidencia) return null;

  const fecha = incidencia.fecha
    ? new Date(incidencia.fecha + (incidencia.fecha.includes("T") ? "" : "T00:00:00")).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  const ts = tipoStyles[incidencia.tipo] || { bg: "#F3F4F6", color: "#6B7280" };
  const es = estadoStyles[incidencia.estado] || { bg: "#F3F4F6", color: "#6B7280" };

  return (
    <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <Paper elevation={0} sx={{ borderRadius: "20px", p: 3, width: "100%", maxWidth: 480, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
          <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>
            Detalle de incidencia
          </Typography>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", color: "#9CA3AF" }}>✕</button>
        </Box>

        <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
          <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: "#E8F5E9", color: "#1B5E20", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {incidencia.empleado?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </Box>
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{incidencia.empleado}</Typography>
            <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>{incidencia.cargo}</Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Row label="Empleado" value={incidencia.empleado} />
        <Row label="Cargo" value={incidencia.cargo} />
        <Box display="flex" sx={{ mb: 1.5 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", width: 130, flexShrink: 0 }}>Tipo</Typography>
          <Chip label={incidencia.tipo} size="small" sx={{ height: 24, fontSize: 12, fontWeight: 600, bgcolor: ts.bg, color: ts.color }} />
        </Box>
        <Box display="flex" sx={{ mb: 1.5 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", width: 130, flexShrink: 0 }}>Estado</Typography>
          <Chip label={incidencia.estado} size="small" sx={{ height: 24, fontSize: 12, fontWeight: 600, bgcolor: es.bg, color: es.color }} />
        </Box>
        <Row label="Fecha" value={fecha} />
        <Row label="Responsable" value={incidencia.responsable} />
        <Row label="Cargo resp." value={incidencia.responsable_cargo} />

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280", mb: 0.6 }}>Descripción</Typography>
          <Typography sx={{ fontSize: 13, color: "#374151", bgcolor: "#F9FAFB", borderRadius: "10px", p: 1.5, lineHeight: 1.5 }}>
            {incidencia.descripcion || "Sin descripción"}
          </Typography>
        </Box>

        {incidencia.estado === "Pendiente" && onCambiarEstado && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" gap={1.5} justifyContent="center">
              <Button
                variant="contained"
                startIcon={<Check size={16} />}
                onClick={() => onCambiarEstado(incidencia, "Aprobada")}
                sx={{ bgcolor: "#16A34A", borderRadius: "12px", textTransform: "none", fontWeight: 600, fontSize: 14, px: 3, py: 1, "&:hover": { bgcolor: "#15803D" } }}
              >
                Aprobar
              </Button>
              <Button
                variant="contained"
                startIcon={<X size={16} />}
                onClick={() => onCambiarEstado(incidencia, "Rechazada")}
                sx={{ bgcolor: "#DC2626", borderRadius: "12px", textTransform: "none", fontWeight: 600, fontSize: 14, px: 3, py: 1, "&:hover": { bgcolor: "#B91C1C" } }}
              >
                Rechazar
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
