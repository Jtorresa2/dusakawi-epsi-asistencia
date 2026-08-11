import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Chip,
  Divider,
  Link,
  IconButton,
} from "@mui/material";
import {
  FileText, CalendarDays, Clock, Sun, Moon, Calendar, Timer, UserCheck,
  CheckCircle, XCircle, Hourglass, Download, AlertCircle, ShieldAlert, X,
} from "lucide-react";
import { COLORES } from "../../../shared/constants/colores.js";
import { PALETA } from "../../../shared/constants/paleta.js";

const tipoNovedadConfig = {
  permiso: { label: "Permiso" },
  vacaciones: { label: "Vacaciones" },
  incapacidad: { label: "Incapacidad" },
  comision: { label: "Comisión" },
  licencia: { label: "Licencia" },
  suspension: { label: "Suspensión" },
};

const modalidadConfig = {
  dia_completo: { label: "Día completo", icon: <CalendarDays size={15} /> },
  manana: { label: "Solo mañana", icon: <Sun size={15} /> },
  tarde: { label: "Solo tarde", icon: <Moon size={15} /> },
  horas: { label: "Por horas", icon: <Timer size={15} /> },
};

const estadoWorkflowMap = {
  aprobado: { label: "Aprobado", color: PALETA.verdeOscuro, bg: PALETA.verdeClaro, icon: <CheckCircle size={13} /> },
  pendiente: { label: "Pendiente", color: PALETA.amber, bg: PALETA.amberBg, icon: <Hourglass size={13} /> },
  rechazado: { label: "Rechazado", color: PALETA.rojo, bg: COLORES.dangerFondo, icon: <XCircle size={13} /> },
};

function obtenerEstado(novedad) {
  const hoy = new Date().toISOString().split("T")[0];
  if (novedad.fecha_desde > hoy) return { label: "Programado", color: PALETA.amber, bg: PALETA.amberBg };
  if (novedad.fecha_hasta < hoy) return { label: "Finalizado", color: PALETA.grisTexto, bg: PALETA.grisClaro };
  return { label: "Activo", color: PALETA.verdeOscuro, bg: PALETA.verdeClaro };
}

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

function calcularDiasTotales(desde, hasta) {
  if (!desde || !hasta) return 0;
  return Math.max(0, Math.round((new Date(hasta) - new Date(desde)) / 86400000) + 1);
}

function obtenerDuracion(novedad) {
  if (novedad.tipo === "horas" && novedad.hora_desde && novedad.hora_hasta) {
    const [hi, mi] = (novedad.hora_desde || "").split(":").map(Number);
    const [hf, mf] = (novedad.hora_hasta || "").split(":").map(Number);
    if (!isNaN(hi) && !isNaN(hf)) {
      const horas = (hf * 60 + mf - (hi * 60 + mi)) / 60;
      if (horas > 0) return `${horas} h`;
    }
  }
  const dias = calcularDiasTotales(novedad.fecha_desde, novedad.fecha_hasta);
  return `${dias} ${dias === 1 ? "día" : "días"}`;
}

function obtenerJornada(novedad) {
  if (novedad.tipo === "horas" && novedad.hora_desde && novedad.hora_hasta) {
    return `${(novedad.hora_desde || "").substring(0, 5)} – ${(novedad.hora_hasta || "").substring(0, 5)}`;
  }
  const map = {
    dia_completo: "Jornada completa",
    manana: "Media jornada · mañana",
    tarde: "Media jornada · tarde",
    horas: "—",
  };
  return map[novedad.tipo] || "—";
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-CO", {
    year: "numeric", month: "short", day: "numeric",
  });
}

const infoCardSx = {
  border: `1px solid ${PALETA.borde}`,
  borderRadius: "14px",
  bgcolor: COLORES.fondoBlanco,
  p: 1.5,
  transition: "all 0.2s ease",
  "&:hover": { borderColor: PALETA.gris, boxShadow: "0 4px 14px rgba(0,0,0,0.06)" },
};

const infoLabelSx = { fontSize: 10.5, color: PALETA.gris, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" };
const infoValueSx = { fontSize: 13.5, fontWeight: 700, color: PALETA.texto, mt: 0.4, wordBreak: "break-word" };

const InfoCard = ({ icon, label, valor }) => (
  <Box sx={infoCardSx}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.4 }}>
      <Box sx={{ color: PALETA.gris, display: "flex" }}>{icon}</Box>
      <Typography sx={infoLabelSx}>{label}</Typography>
    </Box>
    <Typography sx={infoValueSx}>{valor}</Typography>
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
  const tieneAdjuntos = Boolean(novedad.archivo_solicitud || novedad.archivo_firmado || novedad.motivo_rechazo);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      transitionDuration={200}
      slotProps={{
        paper: {
          sx: {
            borderRadius: "18px",
            position: "relative",
            boxShadow: "0 24px 70px rgba(0,0,0,0.25)",
            backgroundColor: COLORES.fondoBlanco,
            overflow: "hidden",
          },
        },
      }}
      sx={{ "& .MuiBackdrop-root": { bgcolor: "rgba(17, 24, 39, 0.5)", backdropFilter: "blur(4px)" } }}
    >
      {/* HEADER */}
      <DialogTitle sx={{ px: 3, py: 2, pr: 7, bgcolor: COLORES.fondoBlanco }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
          <Box sx={{ flex: "1 1 200px", minWidth: 0 }}>
            <Typography sx={{ fontSize: 17, fontWeight: 700, color: PALETA.texto, lineHeight: 1.25 }}>
              Detalle de la novedad
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: PALETA.grisTexto, mt: 0.15 }}>
              {nombreEmpleado}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", pr: 0.5 }}>
            <Chip icon={estado.icon} label={estado.label} size="small"
              sx={{ height: 24, fontWeight: 600, fontSize: 11.5, bgcolor: estado.bg, color: estado.color, borderRadius: "8px" }} />
            <Chip icon={estadoWF.icon} label={estadoWF.label} size="small"
              sx={{ height: 24, fontWeight: 600, fontSize: 11.5, bgcolor: estadoWF.bg, color: estadoWF.color, borderRadius: "8px" }} />
          </Box>
        </Box>
        <IconButtonCorner onClose={onClose} />
      </DialogTitle>
      <Divider />

      {/* FILA 1 — Tipo / Modalidad / Días hábiles / Jornada */}
      <DialogContent sx={{ px: 3, py: 1.5, bgcolor: COLORES.fondoBlanco }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "1fr 1fr 1fr 1fr" }, gap: 1.25 }}>
          <InfoCard icon={<FileText size={14} />} label="Tipo" valor={tipoCfg.label} />
          <InfoCard icon={durCfg.icon} label="Modalidad" valor={durCfg.label} />
          <InfoCard icon={<CalendarDays size={14} />} label="Días hábiles" valor={`${diasHabiles} día${diasHabiles !== 1 ? "s" : ""}`} />
          <InfoCard icon={<Clock size={14} />} label="Jornada" valor={obtenerJornada(novedad)} />
        </Box>
      </DialogContent>

      {/* FILA 2 — Fecha inicio / Fecha fin / Duración */}
      <DialogContent sx={{ px: 3, py: 0.5, bgcolor: COLORES.fondoBlanco }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 1.25 }}>
          <InfoCard icon={<Calendar size={14} />} label="Fecha inicio" valor={formatFecha(novedad.fecha_desde)} />
          <InfoCard icon={<Calendar size={14} />} label="Fecha fin" valor={formatFecha(novedad.fecha_hasta)} />
          <InfoCard icon={<Timer size={14} />} label="Duración" valor={obtenerDuracion(novedad)} />
        </Box>
      </DialogContent>

      {/* FILA 3 — Motivo (ancho completo) */}
      <DialogContent sx={{ px: 3, py: 0.5, bgcolor: COLORES.fondoBlanco }}>
        <Box sx={infoCardSx}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.4 }}>
            <FileText size={14} style={{ color: PALETA.gris }} />
            <Typography sx={infoLabelSx}>Motivo</Typography>
          </Box>
          <Typography sx={infoValueSx}>{novedad.motivo || "—"}</Typography>
        </Box>
      </DialogContent>

      {/* FILA 4 — Información del registro */}
      <DialogContent sx={{ px: 3, py: 1, bgcolor: COLORES.fondoBlanco }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: nombreSolicitante ? "1fr 1fr 1fr" : "1fr 1fr" }, gap: 1.25 }}>
          <InfoCard icon={<UserCheck size={14} />} label="Registrado por" valor={novedad.registrado_por_nombre || "—"} />
          <InfoCard icon={<Clock size={14} />} label="Fecha de registro" valor={formatFecha(novedad.creado_en)} />
          {nombreSolicitante && (
            <InfoCard icon={<UserCheck size={14} />} label="Solicitado por" valor={nombreSolicitante} />
          )}
        </Box>
      </DialogContent>

      {/* ADJUNTOS (solo si existen) */}
      {tieneAdjuntos && (
        <DialogContent sx={{ px: 3, py: 1, pb: 2, bgcolor: COLORES.fondoBlanco }}>
          <Box sx={infoCardSx}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
              <Download size={14} style={{ color: PALETA.gris }} />
              <Typography sx={infoLabelSx}>Adjuntos</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              {novedad.archivo_solicitud && (
                <Link href={novedad.archivo_solicitud} target="_blank" underline="hover"
                  sx={{ fontSize: 12.5, fontWeight: 600, color: COLORES.primarioOscuro, cursor: "pointer" }}>
                  Ver solicitud
                </Link>
              )}
              {novedad.archivo_firmado && (
                <Link href={novedad.archivo_firmado} target="_blank" underline="hover"
                  sx={{ fontSize: 12.5, fontWeight: 600, color: COLORES.primarioOscuro, cursor: "pointer" }}>
                  Ver respuesta firmada
                </Link>
              )}
              {novedad.motivo_rechazo && (
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: PALETA.rojo }}>
                  Rechazo: {novedad.motivo_rechazo}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
      )}
    </Dialog>
  );
}

function IconButtonCorner({ onClose }) {
  return (
    <IconButton
      onClick={onClose}
      size="small"
      aria-label="Cerrar"
      sx={{
        position: "absolute",
        top: 14,
        right: 14,
        color: PALETA.gris,
        bgcolor: PALETA.grisClaro,
        "&:hover": { color: PALETA.texto, bgcolor: PALETA.borde },
      }}
    >
      <X size={17} />
    </IconButton>
  );
}
