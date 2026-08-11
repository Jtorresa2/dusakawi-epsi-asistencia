import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Chip, Button,
} from "@mui/material";
import {
  Clock, Sun, Moon, UserCheck, Download, ChevronRight, CalendarDays, FileText, AlertCircle, ShieldAlert,
} from "lucide-react";
import { apiFetch } from "../../../shared/api/api";
import { COLORES } from "../../../shared/constants/colores.js";

const tipoNovedadConfig = {
  permiso: { label: "Permiso", color: COLORES.primario, bg: COLORES.primarioClaro2, icon: <FileText size={14} /> },
  vacaciones: { label: "Vacaciones", color: COLORES.primario, bg: COLORES.primarioClaro, icon: <CalendarDays size={14} /> },
  incapacidad: { label: "Incapacidad", color: COLORES.danger, bg: COLORES.dangerFondo, icon: <AlertCircle size={14} /> },
  comision: { label: "Comisión", color: COLORES.danger, bg: COLORES.dangerFondo2, icon: <UserCheck size={14} /> },
  licencia: { label: "Licencia", color: COLORES.verdeTexto, bg: COLORES.successClaro, icon: <FileText size={14} /> },
  suspension: { label: "Suspensión", color: COLORES.textoTerciario, bg: COLORES.fondoGris2, icon: <ShieldAlert size={14} /> },
};

const modalidadConfig = {
  dia_completo: { label: "Día completo", color: COLORES.primarioOscuro, bg: COLORES.primarioClaro, icon: <CalendarDays size={14} /> },
  manana: { label: "Solo mañana", color: COLORES.warningOscuro, bg: COLORES.warningFondo, icon: <Sun size={14} /> },
  tarde: { label: "Solo tarde", color: COLORES.primarioOscuro, bg: COLORES.primarioClaro, icon: <Moon size={14} /> },
  horas: { label: "Por horas", color: COLORES.primario, bg: COLORES.primarioClaro2, icon: <Clock size={14} /> },
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
    <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", flexDirection: "column", ...sx }}>
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORES.textoTerciario, textTransform: "uppercase", mb: 1.5 }}>
        Mis novedades registradas
      </Typography>

      {novedades.length === 0 ? (
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 60 }}>
          <Typography sx={{ fontSize: 12, color: COLORES.textoSuave, textAlign: "center" }}>
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
              <Paper key={p.id} elevation={0} sx={{ p: 1, borderRadius: "8px", border: `1px solid ${COLORES.grisContorno}`,
                display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 26, height: 26, borderRadius: "7px", bgcolor: tc.bg, display: "flex",
                  alignItems: "center", justifyContent: "center", color: tc.color, flexShrink: 0 }}>
                  {tc.icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORES.textoPrimario, lineHeight: 1.3 }}>
                    {tc.label} · {dc.label} — {new Date(p.fecha_desde).toLocaleDateString("es-CO")}
                    {p.fecha_hasta !== p.fecha_desde && ` → ${new Date(p.fecha_hasta).toLocaleDateString("es-CO")}`}
                  </Typography>
                  <Typography sx={{ fontSize: 10, color: COLORES.textoTerciario, mt: 0.1, lineHeight: 1.2 }}>{p.motivo}</Typography>
                </Box>
                {estadoLabel && (
                  <Chip label={estadoLabel} size="small"
                    sx={{ fontWeight: 600, fontSize: 9, height: 18,
                      bgcolor: p.estado === "rechazado" ? COLORES.dangerFondo : COLORES.warningFondo,
                      color: p.estado === "rechazado" ? COLORES.danger : COLORES.warningOscuro,
                      borderRadius: "5px" }} />
                )}
              </Paper>
            );
          })}
          {restantes > 0 && (
            <Button size="small" endIcon={<ChevronRight size={12} />}
              sx={{ mt: 0.5, textTransform: "none", fontWeight: 600, fontSize: 11, color: COLORES.primarioOscuro,
                borderRadius: "6px", alignSelf: "flex-start", minHeight: 0, py: 0.25 }}>
              Ver todos ({restantes} más)
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
}
