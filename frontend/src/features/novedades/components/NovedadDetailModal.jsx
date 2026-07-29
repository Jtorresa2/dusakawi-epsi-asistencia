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
  Link,
} from "@mui/material";
import { CalendarDays, Clock, Sun, Moon, FileText, Calendar, Timer, UserCheck, CheckCircle, XCircle, Hourglass, Download, AlertCircle, ShieldAlert } from "lucide-react";

const tipoNovedadConfig = {
  permiso: { label: "Permiso", color: "#2563EB", bg: "#DBEAFE", icon: <FileText size={16} /> },
  vacaciones: { label: "Vacaciones", color: "#7C3AED", bg: "#F3E8FF", icon: <CalendarDays size={16} /> },
  incapacidad: { label: "Incapacidad", color: "#DC2626", bg: "#FEE2E2", icon: <AlertCircle size={16} /> },
  comision: { label: "Comisión", color: "#C62828", bg: "#FFEBEE", icon: <UserCheck size={16} /> },
  licencia: { label: "Licencia", color: "#0891B2", bg: "#ECFEFF", icon: <FileText size={16} /> },
  suspension: { label: "Suspensión", color: "#6B7280", bg: "#F3F4F6", icon: <ShieldAlert size={16} /> },
};

const modalidadConfig = {
  dia_completo: { label: "Día completo", color: "#1B5E20", bg: "#E8F5E9", icon: <CalendarDays size={16} /> },
  manana: { label: "Solo mañana", color: "#92400E", bg: "#FEF3C7", icon: <Sun size={16} /> },
  tarde: { label: "Solo tarde", color: "#6B21A8", bg: "#F3E8FF", icon: <Moon size={16} /> },
  horas: { label: "Por horas", color: "#2563EB", bg: "#DBEAFE", icon: <Timer size={16} /> },
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

function formatearFechaCorta(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-CO", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function obtenerEstado(novedad) {
  const hoy = new Date().toISOString().split("T")[0];
  if (novedad.fecha_desde > hoy) return { label: "Programado", color: "#92400E", bg: "#FEF3C7" };
  if (novedad.fecha_hasta < hoy) return { label: "Finalizado", color: "#6B7280", bg: "#F3F4F6" };
  return { label: "Activo", color: "#1B5E20", bg: "#E8F5E9" };
}

const estadoWorkflowMap = {
  aprobado: { label: "Aprobado", color: "#1B5E20", bg: "#E8F5E9", icon: <CheckCircle size={14} /> },
  pendiente: { label: "Pendiente", color: "#92400E", bg: "#FEF3C7", icon: <Hourglass size={14} /> },
  rechazado: { label: "Rechazado", color: "#DC2626", bg: "#FEE2E2", icon: <XCircle size={14} /> },
};

const FilaInfo = ({ icon, label, valor, color }) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, py: 1.25 }}>
    <Box sx={{ width: 28, flexShrink: 0, display: "flex", justifyContent: "center", pt: 0.3 }}>
      <Box sx={{ color: color || "#9CA3AF", display: "flex" }}>{icon}</Box>
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", mb: 0.2 }}>
        {label}
      </Typography>
      {typeof valor === "string" || typeof valor === "number" ? (
        <Typography sx={{ fontSize: 14, color: "#111827", fontWeight: 500, wordBreak: "break-word" }}>
          {valor}
        </Typography>
      ) : (
        valor
      )}
    </Box>
  </Box>
);

export default function NovedadDetailModal({ open, onClose, novedad }) {
  if (!novedad) return null;

  const tipoCfg = tipoNovedadConfig[novedad.tipo_novedad || "permiso"] || tipoNovedadConfig.permiso;
  const durCfg = modalidadConfig[novedad.tipo || "dia_completo"] || modalidadConfig.dia_completo;
  const nombreEmpleado = `${novedad.empleado_nombre || ""} ${novedad.empleado_apellido || ""}`.trim() || "—";
  const diasHabiles = calcularDiasHabiles(novedad.fecha_desde, novedad.fecha_hasta);
  const estado = obtenerEstado(novedad);
  const estadoWF = estadoWorkflowMap[novedad.estado || "aprobado"] || estadoWorkflowMap.aprobado;
  const nombreSolicitante = novedad.solicitante_nombre
    ? `${novedad.solicitante_nombre} ${novedad.solicitante_apellido || ""}`.trim()
    : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}
    >
      {/* Barra de acento según tipo */}
      <Box sx={{ height: 4, bgcolor: tipoCfg.color }} />

      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", pt: 2.5, pb: 0 }}>
        <Box>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
            Detalle de la novedad
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#6B7280", mt: 0.3 }}>
            {nombreEmpleado}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Chip icon={estadoWF.icon} label={estadoWF.label} size="small"
            sx={{ fontWeight: 600, fontSize: 11, bgcolor: estadoWF.bg, color: estadoWF.color, borderRadius: "8px" }} />
          <Chip label={estado.label} size="small"
            sx={{ fontWeight: 600, fontSize: 11, bgcolor: estado.bg, color: estado.color, borderRadius: "8px", px: 0.5 }} />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, pb: 1 }}>
        {/* Info principal tipo fecha */}
        <Box sx={{ bgcolor: "#F9FAFB", borderRadius: "12px", p: 2, mb: 2 }}>
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            <Box sx={{ flex: "1 1 140px", minWidth: 0 }}>
              <FilaInfo icon={<FileText size={16} />} label="Tipo / Modalidad" valor={
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip icon={tipoCfg.icon} label={tipoCfg.label} size="small"
                    sx={{ height: 24, fontSize: 12, fontWeight: 600, bgcolor: tipoCfg.bg, color: tipoCfg.color, borderRadius: "8px" }} />
                  <Chip icon={durCfg.icon} label={durCfg.label} size="small"
                    sx={{ height: 24, fontSize: 12, fontWeight: 600, bgcolor: durCfg.bg, color: durCfg.color, borderRadius: "8px" }} />
                </Box>
              } />
            </Box>
            <Box sx={{ flex: "1 1 160px", minWidth: 0 }}>
              <FilaInfo icon={<Calendar size={16} />} label="Días hábiles"
                valor={<Chip label={`${diasHabiles} día${diasHabiles !== 1 ? "s" : ""}`} size="small"
                  sx={{ height: 24, fontSize: 12, fontWeight: 600, bgcolor: "#E8F5E9", color: "#1B5E20", borderRadius: "8px" }} />} />
            </Box>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            <Box sx={{ flex: "1 1 140px", minWidth: 0 }}>
              <FilaInfo icon={<CalendarDays size={16} />} label="Desde"
                valor={formatearFechaCorta(novedad.fecha_desde)} />
            </Box>
            <Box sx={{ flex: "1 1 140px", minWidth: 0 }}>
              <FilaInfo icon={<CalendarDays size={16} />} label="Hasta"
                valor={formatearFechaCorta(novedad.fecha_hasta)} />
            </Box>
          </Box>

          {/* Horario (solo tipo horas) */}
          {novedad.tipo === "horas" && novedad.hora_desde && (
            <>
              <Divider sx={{ my: 1 }} />
              <FilaInfo icon={<Clock size={16} />} label="Horario"
                valor={`${(novedad.hora_desde || "").substring(0, 5)} – ${(novedad.hora_hasta || "").substring(0, 5)}`} />
            </>
          )}
        </Box>

        {/* Motivo */}
        <Box sx={{ bgcolor: "#F9FAFB", borderRadius: "12px", p: 2, mb: 2 }}>
          <FilaInfo icon={<FileText size={16} />} label="Motivo"
            valor={novedad.motivo || "—"} />
        </Box>

        {/* Archivos */}
        {(novedad.archivo_solicitud || novedad.archivo_firmado) && (
          <Box sx={{ bgcolor: "#F9FAFB", borderRadius: "12px", p: 2, mb: 2 }}>
            {novedad.archivo_solicitud && (
              <FilaInfo icon={<Download size={16} />} label="Solicitud"
                valor={<Link href={novedad.archivo_solicitud} target="_blank" underline="hover"
                  sx={{ fontSize: 14, fontWeight: 500, color: "#1565C0", cursor: "pointer" }}>
                  Ver PDF
                </Link>} />
            )}
            {novedad.archivo_firmado && (
              <FilaInfo icon={<Download size={16} />} label="Respuesta firmada"
                valor={<Link href={novedad.archivo_firmado} target="_blank" underline="hover"
                  sx={{ fontSize: 14, fontWeight: 500, color: "#1565C0", cursor: "pointer" }}>
                  Ver PDF
                </Link>} />
            )}
            {novedad.motivo_rechazo && (
              <FilaInfo icon={<XCircle size={16} />} label="Motivo de rechazo"
                valor={<Typography sx={{ fontSize: 14, color: "#DC2626", fontWeight: 500 }}>{novedad.motivo_rechazo}</Typography>} />
            )}
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Footer info */}
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#9CA3AF", mb: 0.2 }}>
              Registrado por
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
              {novedad.registrado_por_nombre || "—"}
            </Typography>
          </Box>
          {nombreSolicitante && (
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#9CA3AF", mb: 0.2 }}>
                Solicitado por
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
                {nombreSolicitante}
              </Typography>
            </Box>
          )}
          <Box sx={{ textAlign: "right" }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#9CA3AF", mb: 0.2 }}>
              Fecha registro
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
              {formatFecha(novedad.creado_en)}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onClose}
          sx={{ textTransform: "none", fontWeight: 600, fontSize: 13, color: "#6B7280", px: 3, borderRadius: "10px" }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
