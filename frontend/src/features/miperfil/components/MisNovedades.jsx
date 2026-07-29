import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Chip, Button,
} from "@mui/material";
import {
  Clock, Sun, Moon, UserCheck, Download, ChevronRight, CalendarDays, FileText, AlertCircle, ShieldAlert,
} from "lucide-react";
import { apiFetch } from "../../../shared/api/api";

const tipoNovedadConfig = {
  permiso: { label: "Permiso", color: "#2563EB", bg: "#DBEAFE", icon: <FileText size={14} /> },
  vacaciones: { label: "Vacaciones", color: "#7C3AED", bg: "#F3E8FF", icon: <CalendarDays size={14} /> },
  incapacidad: { label: "Incapacidad", color: "#DC2626", bg: "#FEE2E2", icon: <AlertCircle size={14} /> },
  comision: { label: "Comisión", color: "#C62828", bg: "#FFEBEE", icon: <UserCheck size={14} /> },
  licencia: { label: "Licencia", color: "#0891B2", bg: "#ECFEFF", icon: <FileText size={14} /> },
  suspension: { label: "Suspensión", color: "#6B7280", bg: "#F3F4F6", icon: <ShieldAlert size={14} /> },
};

const modalidadConfig = {
  dia_completo: { label: "Día completo", color: "#1B5E20", bg: "#E8F5E9", icon: <CalendarDays size={14} /> },
  manana: { label: "Solo mañana", color: "#92400E", bg: "#FEF3C7", icon: <Sun size={14} /> },
  tarde: { label: "Solo tarde", color: "#6B21A8", bg: "#F3E8FF", icon: <Moon size={14} /> },
  horas: { label: "Por horas", color: "#2563EB", bg: "#DBEAFE", icon: <Clock size={14} /> },
};

export default function MisNovedades({ empleadoId, maxItems = 10, sx }) {
  const [novedades, setNovedades] = useState([]);

  useEffect(() => {
    if (!empleadoId) return;
    apiFetch("/novedades/mios").then((res) => setNovedades(res.novedades || [])).catch(() => {});
  }, [empleadoId]);

  const visible = maxItems ? novedades.slice(0, maxItems) : novedades;
  const restantes = novedades.length - maxItems;

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid #ECECEC", display: "flex", flexDirection: "column", ...sx }}>
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", mb: 1.5 }}>
        Mis novedades registradas
      </Typography>

      {novedades.length === 0 ? (
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 60 }}>
          <Typography sx={{ fontSize: 12, color: "#9CA3AF", textAlign: "center" }}>
            No tenés novedades registradas
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          {visible.map((p) => {
            const tc = tipoNovedadConfig[p.tipo_novedad || "permiso"] || tipoNovedadConfig.permiso;
            const dc = modalidadConfig[p.tipo || "dia_completo"] || modalidadConfig.dia_completo;
            const estadoLabel = p.estado === "rechazado" ? "Rechazado" : p.estado === "pendiente" ? "Pendiente" : "";
            return (
              <Paper key={p.id} elevation={0} sx={{ p: 1, borderRadius: "8px", border: "1px solid #ECECEC",
                display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 26, height: 26, borderRadius: "7px", bgcolor: tc.bg, display: "flex",
                  alignItems: "center", justifyContent: "center", color: tc.color, flexShrink: 0 }}>
                  {tc.icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>
                    {tc.label} · {dc.label} — {new Date(p.fecha_desde).toLocaleDateString("es-CO")}
                    {p.fecha_hasta !== p.fecha_desde && ` → ${new Date(p.fecha_hasta).toLocaleDateString("es-CO")}`}
                  </Typography>
                  <Typography sx={{ fontSize: 10, color: "#6B7280", mt: 0.1, lineHeight: 1.2 }}>{p.motivo}</Typography>
                </Box>
                {estadoLabel && (
                  <Chip label={estadoLabel} size="small"
                    sx={{ fontWeight: 600, fontSize: 9, height: 18,
                      bgcolor: p.estado === "rechazado" ? "#FEE2E2" : "#FEF3C7",
                      color: p.estado === "rechazado" ? "#DC2626" : "#92400E",
                      borderRadius: "5px" }} />
                )}
              </Paper>
            );
          })}
          {restantes > 0 && (
            <Button size="small" endIcon={<ChevronRight size={12} />}
              sx={{ mt: 0.5, textTransform: "none", fontWeight: 600, fontSize: 11, color: "#1565C0",
                borderRadius: "6px", alignSelf: "flex-start", minHeight: 0, py: 0.25 }}>
              Ver todos ({restantes} más)
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
}
