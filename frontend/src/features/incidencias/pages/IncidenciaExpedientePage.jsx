import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, Chip, Button, Avatar, TextField, Select, MenuItem,
  IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import {
  ArrowLeft, FileText, Download, Upload, Clock, CheckCircle, XCircle,
  User, AlertTriangle, Eye, Shield, FileSignature, ChevronRight,
  MapPin, Timer, RefreshCw, CircleDollarSign,
} from "lucide-react";
import { aprobarConFirma } from "../incidencia.api";
import PDFPreviewModal from "../../../shared/components/PDFPreviewModal";

const API = "/api";
const TIPOS = { falla_biometrica: "Falla biométrica", tardanza_justificada: "Tardanza justificada", otro: "Otro" };
const ESTADO_STYLES = {
  pendiente: { bg: "#FEF3C7", color: "#92400E", label: "Pendiente" },
  aprobado: { bg: "#D1FAE5", color: "#065F46", label: "Aprobada" },
  rechazado: { bg: "#FEE2E2", color: "#991B1B", label: "Rechazada" },
};

const PRIORIDADES = { baja: { label: "Baja", color: "#6B7280", bg: "#F3F4F6" }, media: { label: "Media", color: "#92400E", bg: "#FEF3C7" }, alta: { label: "Alta", color: "#991B1B", bg: "#FEE2E2" } };

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function formatHoraProg(hora) {
  if (!hora) return "—";
  const [h, m] = hora.split(":").map(Number);
  const ampm = h >= 12 ? "p. m." : "a. m.";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatHora12h(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function descargarArchivo(url, nombre) {
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre || url.split("/").pop();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function TimelineItem({ icon, label, fecha, responsable, activo, ultimo, iconColor }) {
  return (
    <Box sx={{ display: "flex", gap: 1.5, position: "relative", pb: ultimo ? 0 : 2.5 }}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Box sx={{
          width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0,
          bgcolor: activo ? "#D1FAE5" : "#F3F4F6",
          color: iconColor || (activo ? "#16A34A" : "#9CA3AF"),
          transition: "all 0.2s",
        }}>
          {icon}
        </Box>
        {!ultimo && <Box sx={{ width: 1.5, flex: 1, bgcolor: activo ? "#BBF7D0" : "#E5E7EB", my: 0.5 }} />}
      </Box>
      <Box sx={{ pb: ultimo ? 0 : 1 }}>
        <Typography sx={{ fontSize: 13, fontWeight: activo ? 500 : 400, color: iconColor || (activo ? "#111827" : "#9CA3AF") }}>
          {label}
        </Typography>
        {(fecha || responsable) && (
          <Typography sx={{ fontSize: 11, color: "#9CA3AF", mt: 0.2 }}>
            {[fecha, responsable].filter(Boolean).join(" · ")}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function SectionCard({ title, children, action, sx }) {
  return (
    <Paper elevation={0} sx={{ borderRadius: "16px", border: "1px solid #ECECEC", overflow: "hidden", ...sx }}>
      <Box sx={{ px: 2.5, py: 1.75, borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 }}>
          {title}
        </Typography>
        {action}
      </Box>
      <Box sx={{ p: 2.5 }}>
        {children}
      </Box>
    </Paper>
  );
}

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function IncidenciaExpedientePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const firmaInputRef = useRef(null);

  const [cargando, setCargando] = useState(true);
  const [incidencia, setIncidencia] = useState(null);
  const [pageError, setPageError] = useState("");
  const [usuario, setUsuario] = useState({ rol: "" });
  const [observacion, setObservacion] = useState("");

  const [prioridad, setPrioridad] = useState("media");
  const [accionando, setAccionando] = useState(false);
  const [actionError, setActionError] = useState("");
  const [firmaFile, setFirmaFile] = useState(null);
  const [firmaPreviewUrl, setFirmaPreviewUrl] = useState(null);
  const [firmaModalOpen, setFirmaModalOpen] = useState(false);
  const [subiendoFirma, setSubiendoFirma] = useState(false);
  const [plantillaPreviewUrl, setPlantillaPreviewUrl] = useState(null);
  const [firmadoPreviewUrl, setFirmadoPreviewUrl] = useState(null);

  const rol = usuario.rol;
  const esAdmin = rol === "admin";
  const esTTHH = rol === "talento_humano";
  const esEmpleado = rol === "empleado";
  const puedeGestionar = (esAdmin || esTTHH) && incidencia?.estado === "pendiente";

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("usuario") || "{}");
      setUsuario(u);
    } catch {}
  }, []);

  useEffect(() => {
    if (!id) return;
    setCargando(true);
    fetch(`${API}/incidencias/${id}`, { headers })
      .then(async (res) => {
        if (!res.ok) throw new Error("No encontrada");
        const data = await res.json();
        setIncidencia(data);
        setPrioridad(data.prioridad || "media");
      })
      .catch(() => setPageError("No se pudo cargar la incidencia"))
      .finally(() => setCargando(false));
  }, [id]);

  const handleRefresh = () => {
    fetch(`${API}/incidencias/${id}`, { headers })
      .then((res) => res.json())
      .then((data) => setIncidencia(data))
      .catch(() => {});
  };

  const handleFirmaSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (firmaPreviewUrl) URL.revokeObjectURL(firmaPreviewUrl);
    setFirmaFile(file);
    setFirmaPreviewUrl(URL.createObjectURL(file));
    setFirmaModalOpen(true);
    e.target.value = "";
  };

  const handleConfirmarFirma = async () => {
    if (!firmaFile || !incidencia) return;
    setSubiendoFirma(true);
    setActionError("");
    try {
      await aprobarConFirma(incidencia.id, firmaFile);
      if (firmaPreviewUrl) URL.revokeObjectURL(firmaPreviewUrl);
      setFirmaModalOpen(false);
      setFirmaFile(null);
      setFirmaPreviewUrl(null);
      handleRefresh();
    } catch (e) {
      setActionError(e.message || "Error al subir PDF firmado");
    } finally {
      setSubiendoFirma(false);
    }
  };

  const handleSolicitarCorreccion = async () => {
    if (!observacion.trim()) return;
    setAccionando(true);
    setActionError("");
    try {
      const res = await fetch(`${API}/incidencias/${incidencia.id}/solicitar-correccion`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ observacion: observacion.trim() }),
      });
      if (!res.ok) throw new Error("No se pudo solicitar corrección");
      handleRefresh();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setAccionando(false);
    }
  };

  const handleRechazar = async () => {
    setAccionando(true);
    setActionError("");
    try {
      const res = await fetch(`${API}/incidencias/${incidencia.id}/rechazar`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: "" }),
      });
      if (!res.ok) throw new Error("No se pudo rechazar");
      handleRefresh();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setAccionando(false);
    }
  };

  if (cargando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <CircularProgress size={32} sx={{ color: "#1B5E20" }} />
      </Box>
    );
  }

  if (pageError || !incidencia) {
    return (
      <Box sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <AlertTriangle size={48} color="#DC2626" />
        <Typography sx={{ color: "#DC2626", fontSize: 16, fontWeight: 600 }}>{pageError || "Incidencia no encontrada"}</Typography>
        <Button variant="outlined" startIcon={<ArrowLeft size={16} />} onClick={() => navigate("/incidencias")}
          sx={{ borderRadius: "10px", textTransform: "none" }}>
          Volver a incidencias
        </Button>
      </Box>
    );
  }

  const ec = ESTADO_STYLES[incidencia.estado] || ESTADO_STYLES.pendiente;
  const pc = PRIORIDADES[prioridad] || PRIORIDADES.media;
  const anio = new Date().getFullYear();
  const isImageFile = (url) => /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
  const fechaCreacion = incidencia.created_at || incidencia.fecha;
  const estadoAjuste = incidencia.estado === "pendiente" ? { label: "Pendiente", bg: "#FEF3C7", color: "#92400E" }
    : incidencia.estado === "aprobado" ? { label: "Aplicado", bg: "#D1FAE5", color: "#065F46" }
    : { label: "No aplicado", bg: "#FEE2E2", color: "#DC2626" };

  return (
    <Box sx={{ px: 2.5, py: 2, display: "flex", flexDirection: "column", gap: 2, maxWidth: 1400, mx: "auto" }}>
      {/* Breadcrumb */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <Button size="small" onClick={() => navigate("/incidencias")}
          sx={{ borderRadius: "8px", textTransform: "none", fontSize: 12, color: "#6B7280", minWidth: 0, p: 0.5 }}>
          <ArrowLeft size={16} />
        </Button>
        <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>Incidencias</Typography>
        <ChevronRight size={14} color="#9CA3AF" />
        <Typography sx={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>
          INC-{anio}-{String(incidencia.id).padStart(5, "0")}
        </Typography>
      </Box>

      {/* Header */}
      <Paper elevation={0} sx={{ borderRadius: "16px", border: "1px solid #ECECEC", p: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: "#1B5E20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={22} color="#FFF" />
          </Box>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.3 }}>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
                INC-{anio}-{String(incidencia.id).padStart(5, "0")}
              </Typography>
              <Chip label={ec.label} size="small" sx={{ borderRadius: "6px", fontSize: 11, fontWeight: 600, bgcolor: ec.bg, color: ec.color }} />
              <Chip label={pc.label} size="small" sx={{ borderRadius: "6px", fontSize: 11, fontWeight: 600, bgcolor: pc.bg, color: pc.color }} />
            </Box>
            <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
              Creada el {formatDate(fechaCreacion)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Two-column layout */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.6fr 1fr" }, gap: 2.5, alignItems: "start" }}>

        {/* ===== LEFT COLUMN ===== */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

          {/* Info General */}
          <SectionCard title="Información general">
            <Box sx={{ display: "flex", gap: 2.5 }}>
              <Avatar sx={{ width: 56, height: 56, borderRadius: "12px", bgcolor: "#1B5E20", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                {(incidencia.empleado_nombre || "?").charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, flex: 1 }}>
                <Box>
                  <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>Nombre completo</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>{incidencia.empleado_nombre}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>Cédula</Typography>
                  <Typography sx={{ fontSize: 14, color: "#374151" }}>{incidencia.cedula}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>Cargo</Typography>
                  <Typography sx={{ fontSize: 14, color: "#374151" }}>{incidencia.cargo || "—"}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>Área</Typography>
                  <Typography sx={{ fontSize: 14, color: "#374151" }}>{incidencia.area || "—"}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>Tipo de incidencia</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>{TIPOS[incidencia.tipo] || incidencia.tipo}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>Fecha del reporte</Typography>
                  <Typography sx={{ fontSize: 14, color: "#374151" }}>{formatDateShort(incidencia.fecha)}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>Hora registrada</Typography>
                  <Typography sx={{ fontSize: 14, color: "#374151" }}>
                    {fechaCreacion ? new Date(fechaCreacion).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>Registrado por</Typography>
                  <Typography sx={{ fontSize: 14, color: "#374151" }}>{incidencia.empleado_nombre || "—"}</Typography>
                </Box>
              </Box>
            </Box>
          </SectionCard>

          {/* Descripción */}
          <SectionCard title="Descripción">
            <Box sx={{ bgcolor: "#F9FAFB", borderRadius: "10px", p: 2, border: "1px solid #F3F4F6" }}>
              <Typography sx={{ fontSize: 13, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {incidencia.descripcion || "Sin descripción"}
              </Typography>
            </Box>
          </SectionCard>

          {/* Evidencias */}
          <SectionCard title="Evidencias">
            {incidencia.evidencia_url ? (
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                {isImageFile(incidencia.evidencia_url) ? (
                  <Box sx={{
                    width: 120, height: 120, borderRadius: "10px", overflow: "hidden",
                    border: "1px solid #ECECEC", position: "relative", cursor: "pointer",
                    "&:hover .overlay": { opacity: 1 },
                  }}
                    onClick={() => window.open(incidencia.evidencia_url, "_blank")}>
                    <Box component="img" src={incidencia.evidencia_url}
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <Box className="overlay" sx={{
                      position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.5)",
                      display: "flex", alignItems: "center", justifyContent: "center", opacity: 0,
                      transition: "opacity 0.2s",
                    }}>
                      <Eye size={20} color="#FFF" />
                    </Box>
                  </Box>
                ) : (
                  <Button variant="outlined" startIcon={<FileText size={16} />}
                    href={incidencia.evidencia_url} target="_blank"
                    sx={{ borderRadius: "8px", textTransform: "none", fontSize: 13, color: "#6B7280", borderColor: "#D1D5DB" }}>
                    Ver PDF de evidencia
                  </Button>
                )}
              </Box>
            ) : (
              <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>Sin evidencia adjunta</Typography>
            )}
          </SectionCard>

          {/* Documentos */}
          <SectionCard title="Documentos">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, bgcolor: "#F0FDF4", borderRadius: "10px", p: 2, border: "1px solid #BBF7D0" }}>
                <Box sx={{ width: 36, height: 36, borderRadius: "8px", bgcolor: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={18} color="#16A34A" />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#065F46" }}>Plantilla de incidencia</Typography>
                  <Typography sx={{ fontSize: 11, color: "#6B7280" }}>Generada el {formatDateShort(fechaCreacion)}</Typography>
                </Box>
                <Button size="small" variant="outlined" startIcon={<Eye size={14} />}
                  onClick={() => setPlantillaPreviewUrl(`/api/pdf/incidencias/${incidencia.id}/plantilla?token=${localStorage.getItem("token")}`)}
                  sx={{ borderRadius: "6px", textTransform: "none", fontSize: 11, color: "#16A34A", borderColor: "#16A34A", minWidth: 0, px: 1.5 }}>
                  Ver
                </Button>
                <Button size="small" variant="outlined" startIcon={<Download size={14} />}
                  onClick={() => descargarArchivo(`/api/pdf/incidencias/${incidencia.id}/plantilla?token=${localStorage.getItem("token")}`, `INC-${anio}-${String(incidencia.id).padStart(5, "0")}.pdf`)}
                  sx={{ borderRadius: "6px", textTransform: "none", fontSize: 11, color: "#16A34A", borderColor: "#16A34A", minWidth: 0, px: 1.5 }}>
                  Descargar
                </Button>
              </Box>
              {incidencia.archivo_firmado && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, bgcolor: "#EFF6FF", borderRadius: "10px", p: 2, border: "1px solid #BFDBFE" }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: "8px", bgcolor: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileSignature size={18} color="#2563EB" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#1E40AF" }}>Documento firmado electrónicamente</Typography>
                    <Typography sx={{ fontSize: 11, color: "#6B7280" }}>Disponible para descarga</Typography>
                  </Box>
                  <Button size="small" variant="outlined" startIcon={<Eye size={14} />}
                    onClick={() => setFirmadoPreviewUrl(incidencia.archivo_firmado)}
                    sx={{ borderRadius: "6px", textTransform: "none", fontSize: 11, color: "#2563EB", borderColor: "#2563EB", minWidth: 0, px: 1.5 }}>
                    Ver
                  </Button>
                  <Button size="small" variant="outlined" startIcon={<Download size={14} />}
                    onClick={() => descargarArchivo(incidencia.archivo_firmado, `INC-${anio}-${String(incidencia.id).padStart(5, "0")}-firmado.pdf`)}
                    sx={{ borderRadius: "6px", textTransform: "none", fontSize: 11, color: "#2563EB", borderColor: "#2563EB", minWidth: 0, px: 1.5 }}>
                    Descargar
                  </Button>
                </Box>
              )}
            </Box>
          </SectionCard>
        </Box>

        {/* ===== RIGHT COLUMN ===== */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

          {/* Línea de tiempo */}
          <SectionCard title="Línea de tiempo">
            <TimelineItem icon={<FileText size={13} />} activo label="Incidencia creada"
              fecha={formatDate(fechaCreacion)} responsable={incidencia.empleado_nombre} />
            <TimelineItem icon={<User size={13} />}
              activo={incidencia.revisado_por || incidencia.estado !== "pendiente" || puedeGestionar}
              label="En revisión (Talento Humano)" />
            {(() => {
              const esAprobado = incidencia.estado === "aprobado";
              const esRechazado = incidencia.estado === "rechazado";
              const esCorreccion = incidencia.observacion && incidencia.estado === "pendiente";
              const esPendiente = incidencia.estado === "pendiente" && !incidencia.observacion;
              return (
                <TimelineItem
                  icon={esAprobado ? <CheckCircle size={13} /> : esRechazado ? <XCircle size={13} /> : esCorreccion ? <AlertTriangle size={13} /> : <Clock size={13} />}
                  activo={!esPendiente}
                  iconColor={esRechazado ? "#DC2626" : esCorreccion ? "#D97706" : undefined}
                  label={esAprobado ? "Incidencia aprobada" : esRechazado ? "Incidencia rechazada" : esCorreccion ? "Corrección solicitada" : "Pendiente de revisión"}
                  responsable={(esAprobado || esRechazado) ? incidencia.revisor_nombre : null}
                  ultimo
                />
              );
            })()}
          </SectionCard>

          {/* Impacto en la asistencia */}
          <SectionCard title="Impacto en la asistencia"
            action={<Clock size={16} color="#9CA3AF" />}>
            {incidencia.tipo === "otro" ? (
              <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>
                Esta incidencia no genera modificaciones en el registro de asistencia del empleado.
              </Typography>
            ) : incidencia.tipo === "tardanza_justificada" ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1, borderBottom: "1px solid #F3F4F6" }}>
                  <Clock size={16} color="#9CA3AF" />
                  <Typography sx={{ fontSize: 12, color: "#6B7280", flex: 1 }}>Horario asignado</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                    {incidencia.asistencia?.hora_entrada_programada && incidencia.asistencia?.hora_salida_programada
                      ? `${formatHoraProg(incidencia.asistencia.hora_entrada_programada)} - ${formatHoraProg(incidencia.asistencia.hora_salida_programada)}`
                      : "—"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1, borderBottom: "1px solid #F3F4F6" }}>
                  <Clock size={16} color="#9CA3AF" />
                  <Typography sx={{ fontSize: 12, color: "#6B7280", flex: 1 }}>Hora registrada</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                    {formatHora12h(incidencia.asistencia?.fecha_hora_entrada)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1, borderBottom: "1px solid #F3F4F6" }}>
                  <Timer size={16} color="#9CA3AF" />
                  <Typography sx={{ fontSize: 12, color: "#6B7280", flex: 1 }}>Minutos de retraso</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: (incidencia.asistencia?.minutos_tardanza || 0) > 0 ? "#DC2626" : "#16A34A" }}>
                    {incidencia.asistencia?.minutos_tardanza != null ? `${incidencia.asistencia.minutos_tardanza} minutos` : "—"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1, borderBottom: "1px solid #F3F4F6" }}>
                  <CircleDollarSign size={16} color="#9CA3AF" />
                  <Typography sx={{ fontSize: 12, color: "#6B7280", flex: 1 }}>Descuento aplicado</Typography>
                  <Chip label={incidencia.estado === "aprobado" && (incidencia.asistencia?.minutos_tardanza || 0) > 0 ? "Sí" : "No"} size="small"
                    sx={{ borderRadius: "6px", fontSize: 11, fontWeight: 600, height: 24,
                      bgcolor: incidencia.estado === "aprobado" && (incidencia.asistencia?.minutos_tardanza || 0) > 0 ? "#D1FAE5" : "#F3F4F6",
                      color: incidencia.estado === "aprobado" && (incidencia.asistencia?.minutos_tardanza || 0) > 0 ? "#065F46" : "#6B7280" }} />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <RefreshCw size={16} color="#9CA3AF" />
                  <Typography sx={{ fontSize: 12, color: "#6B7280", flex: 1 }}>Estado del ajuste</Typography>
                  <Chip label={estadoAjuste.label} size="small"
                    sx={{ borderRadius: "6px", fontSize: 11, fontWeight: 600, height: 24, bgcolor: estadoAjuste.bg, color: estadoAjuste.color }} />
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1, borderBottom: "1px solid #F3F4F6" }}>
                  <MapPin size={16} color="#9CA3AF" />
                  <Typography sx={{ fontSize: 12, color: "#6B7280", flex: 1 }}>Tipo de marcación afectada</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                    {(() => {
                      const tm = incidencia.asistencia?.tipo_marcacion;
                      if (tm) return tm === "entrada" ? "Entrada" : "Salida";
                      return new Date(fechaCreacion).getHours() < 12 ? "Entrada" : "Salida";
                    })()}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1, borderBottom: "1px solid #F3F4F6" }}>
                  <MapPin size={16} color="#9CA3AF" />
                  <Typography sx={{ fontSize: 12, color: "#6B7280", flex: 1 }}>Estado de la marcación</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                    {incidencia.asistencia?.estado_marcacion
                      ? incidencia.asistencia.estado_marcacion.charAt(0).toUpperCase() + incidencia.asistencia.estado_marcacion.slice(1)
                      : incidencia.estado === "aprobado" ? "Corregida" : "No marcada"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1, borderBottom: "1px solid #F3F4F6" }}>
                  <AlertTriangle size={16} color="#9CA3AF" />
                  <Typography sx={{ fontSize: 12, color: "#6B7280", flex: 1 }}>Impacto en la asistencia</Typography>
                  <Chip label="Sí" size="small"
                    sx={{ borderRadius: "6px", fontSize: 11, fontWeight: 600, height: 24,
                      bgcolor: "#D1FAE5", color: "#065F46" }} />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <RefreshCw size={16} color="#9CA3AF" />
                  <Typography sx={{ fontSize: 12, color: "#6B7280", flex: 1 }}>Estado del ajuste</Typography>
                  <Chip label={estadoAjuste.label} size="small"
                    sx={{ borderRadius: "6px", fontSize: 11, fontWeight: 600, height: 24, bgcolor: estadoAjuste.bg, color: estadoAjuste.color }} />
                </Box>
              </Box>
            )}
          </SectionCard>

          {/* Gestión de la incidencia */}
          {puedeGestionar && (
            <Paper elevation={0} sx={{
              borderRadius: "16px", overflow: "hidden",
              border: "2px solid #1B5E20",
              boxShadow: "0 4px 20px rgba(27,94,32,0.12)",
            }}>
              <Box sx={{
                px: 2.5, py: 1.75,
                borderBottom: "1px solid #1B5E20",
                bgcolor: "#1B5E20",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <Typography sx={{
                  fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
                  color: "#FFF",
                }}>
                  Gestión de la incidencia
                </Typography>
                <Shield size={16} color="#A5D6A7" />
              </Box>
              <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>

                {actionError && (
                  <Box sx={{ px: 1.5, py: 1, bgcolor: "#FEE2E2", borderRadius: "8px", display: "flex", alignItems: "center", gap: 1 }}>
                    <AlertTriangle size={14} color="#DC2626" />
                    <Typography sx={{ fontSize: 12, color: "#DC2626" }}>{actionError}</Typography>
                  </Box>
                )}

                {incidencia.observacion && (
                  <Box sx={{ bgcolor: "#FFFBEB", borderRadius: "8px", p: 1.5, border: "1px solid #FDE68A" }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#92400E", mb: 0.5 }}>Observación de revisión anterior</Typography>
                    <Typography sx={{ fontSize: 12, color: "#78350F" }}>{incidencia.observacion}</Typography>
                  </Box>
                )}

                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", mb: 0.5, textTransform: "uppercase" }}>Prioridad</Typography>
                  <Select value={prioridad} onChange={e => setPrioridad(e.target.value)} size="small" fullWidth
                    sx={{ borderRadius: "8px", fontSize: 13, bgcolor: "#FFF" }}>
                    <MenuItem value="baja">Baja</MenuItem>
                    <MenuItem value="media">Media</MenuItem>
                    <MenuItem value="alta">Alta</MenuItem>
                  </Select>
                </Box>
                <TextField multiline rows={2} value={observacion} onChange={e => setObservacion(e.target.value)}
                  placeholder="Escribe una observación (requerido para solicitar corrección)"
                  fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13, bgcolor: "#FFF" } }} />
                <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <>
                    <input type="file" accept=".pdf" ref={firmaInputRef}
                      onChange={handleFirmaSelect} style={{ display: "none" }} />
                    <Button variant="contained" onClick={() => firmaInputRef.current?.click()} disabled={subiendoFirma}
                      sx={{ borderRadius: "8px", textTransform: "none", fontSize: 13, fontWeight: 600, bgcolor: "#16A34A", "&:hover": { bgcolor: "#15803D" }, px: 3 }}>
                      {subiendoFirma ? "Subiendo..." : "Subir PDF firmado"}
                    </Button>
                  </>
                  <Button variant="contained" onClick={handleSolicitarCorreccion}
                    disabled={accionando || !observacion.trim()}
                    sx={{ borderRadius: "8px", textTransform: "none", fontSize: 13, fontWeight: 600, bgcolor: "#CA8A04", "&:hover": { bgcolor: "#B45309" }, px: 3 }}>
                    Solicitar corrección
                  </Button>
                  <Button variant="contained" onClick={handleRechazar}
                    disabled={accionando}
                    sx={{ borderRadius: "8px", textTransform: "none", fontSize: 13, fontWeight: 600, bgcolor: "#DC2626", "&:hover": { bgcolor: "#B91C1C" }, px: 3 }}>
                    Rechazar incidencia
                  </Button>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Plantilla preview modal */}
      <PDFPreviewModal
        open={Boolean(plantillaPreviewUrl)}
        onClose={() => setPlantillaPreviewUrl(null)}
        url={plantillaPreviewUrl}
        titulo="Plantilla de incidencia"
      />

      {/* PDF firmado preview modal */}
      <PDFPreviewModal
        open={Boolean(firmadoPreviewUrl)}
        onClose={() => setFirmadoPreviewUrl(null)}
        url={firmadoPreviewUrl}
        titulo="Documento firmado"
      />

      {/* Firma preview modal */}
      <Dialog open={firmaModalOpen} onClose={() => { setFirmaModalOpen(false); if (firmaPreviewUrl) URL.revokeObjectURL(firmaPreviewUrl); setFirmaFile(null); setFirmaPreviewUrl(null); }}
        maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 1.5 }}>
          <FileSignature size={20} />
          Vista previa - PDF firmado
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: "#52525B", height: "60vh" }}>
          {firmaFile && firmaPreviewUrl ? (
            firmaFile.type === "application/pdf" ? (
              <iframe src={firmaPreviewUrl} width="100%" height="100%" style={{ border: "none" }} title="Vista previa PDF" />
            ) : (
              <Box component="img" src={firmaPreviewUrl} sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
            )
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, borderTop: "1px solid #ECECEC" }}>
          <Button onClick={() => { setFirmaModalOpen(false); if (firmaPreviewUrl) URL.revokeObjectURL(firmaPreviewUrl); setFirmaFile(null); setFirmaPreviewUrl(null); }}
            sx={{ borderRadius: "8px", textTransform: "none", fontSize: 13, color: "#6B7280" }}>
            Cancelar
          </Button>
          <Button variant="contained" startIcon={<Upload size={16} />}
            onClick={handleConfirmarFirma} disabled={subiendoFirma}
            sx={{ borderRadius: "8px", textTransform: "none", fontSize: 13, fontWeight: 600, bgcolor: "#16A34A", "&:hover": { bgcolor: "#15803D" } }}>
            {subiendoFirma ? "Subiendo..." : "Subir PDF firmado"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
