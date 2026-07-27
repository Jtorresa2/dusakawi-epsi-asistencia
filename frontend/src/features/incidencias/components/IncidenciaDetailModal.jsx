import { useState, useRef, useCallback } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button,
  Chip, TextField, Select, MenuItem, IconButton,
} from "@mui/material";
import {
  X, FileText, Image, Download, Upload, Clock, CheckCircle, XCircle,
  User, Calendar, AlertTriangle, FileSignature, Eye, ChevronRight,
  Shield, Check,
} from "lucide-react";
import { descargarPlantilla, aprobarConFirma } from "../incidencia.api";

const API = "/api";

const TIPOS = {
  falla_biometrica: "Falla biométrica",
  tardanza_justificada: "Tardanza justificada",
  otro: "Otro",
};

const ESTADO_STYLES = {
  pendiente: { bg: "#FEF3C7", color: "#92400E", label: "Pendiente" },
  aprobado: { bg: "#D1FAE5", color: "#065F46", label: "Aprobada" },
  rechazado: { bg: "#FEE2E2", color: "#991B1B", label: "Rechazada" },
};

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function TimelineItem({ icon, label, fecha, activo, ultimo }) {
  return (
    <Box sx={{ display: "flex", gap: 1.5, position: "relative", pb: ultimo ? 0 : 2.5 }}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Box sx={{
          width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0,
          bgcolor: activo ? "#D1FAE5" : "#F3F4F6",
          color: activo ? "#16A34A" : "#9CA3AF",
        }}>
          {icon}
        </Box>
        {!ultimo && <Box sx={{ width: 1.5, flex: 1, bgcolor: activo ? "#BBF7D0" : "#E5E7EB", my: 0.5 }} />}
      </Box>
      <Box sx={{ pb: ultimo ? 0 : 1 }}>
        <Typography sx={{ fontSize: 13, fontWeight: activo ? 500 : 400, color: activo ? "#111827" : "#9CA3AF" }}>
          {label}
        </Typography>
        {fecha && (
          <Typography sx={{ fontSize: 11, color: "#9CA3AF", mt: 0.2 }}>
            {new Date(fecha).toLocaleString("es-CO")}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function IncidenciaDetailModal({ open, onClose, incidencia, rol, onRefresh }) {
  const [accionando, setAccionando] = useState(false);
  const [observacion, setObservacion] = useState("");
  const [prioridad, setPrioridad] = useState("media");
  const [firmaFile, setFirmaFile] = useState(null);
  const [firmaPreview, setFirmaPreview] = useState(null);
  const firmaInputRef = useRef(null);
  const [subiendoFirma, setSubiendoFirma] = useState(false);
  const [error, setError] = useState("");
  const [firmaModalOpen, setFirmaModalOpen] = useState(false);

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
  const esTTHH = rol === "talento_humano";
  const esAdmin = rol === "admin";
  const puedeGestionar = (esTTHH || esAdmin) && incidencia?.estado === "pendiente";

  const limpiarFirma = useCallback(() => {
    if (firmaPreview) URL.revokeObjectURL(firmaPreview);
    setFirmaFile(null);
    setFirmaPreview(null);
  }, [firmaPreview]);

  const handleFirmaSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (firmaPreview) URL.revokeObjectURL(firmaPreview);
    setFirmaFile(file);
    setFirmaPreview(URL.createObjectURL(file));
    setFirmaModalOpen(true);
    e.target.value = "";
  };

  const handleFirmaUpload = async () => {
    if (!firmaFile || !incidencia) return;
    setSubiendoFirma(true);
    setError("");
    try {
      await aprobarConFirma(incidencia.id, firmaFile);
      setFirmaModalOpen(false);
      limpiarFirma();
      onRefresh();
      onClose();
    } catch (e) {
      setError(e.message || "Error al subir PDF firmado");
    } finally {
      setSubiendoFirma(false);
    }
  };

  const handleAprobar = async () => {
    if (!incidencia) return;
    setAccionando(true);
    setError("");
    try {
      await fetch(`${API}/incidencias/${incidencia.id}/aprobar`, {
        method: "PUT", headers: { ...headers, "Content-Type": "application/json" },
      });
      onRefresh();
      onClose();
    } catch (e) {
      setError(e.message || "Error al aprobar");
    } finally {
      setAccionando(false);
    }
  };

  const handleRechazar = async () => {
    if (!incidencia || !observacion.trim()) return;
    setAccionando(true);
    setError("");
    try {
      const res = await fetch(`${API}/incidencias/${incidencia.id}/rechazar`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: observacion }),
      });
      if (!res.ok) throw new Error("No se pudo rechazar");
      onRefresh();
      onClose();
    } catch (e) {
      setError(e.message || "Error al rechazar");
    } finally {
      setAccionando(false);
    }
  };

  if (!incidencia) return null;

  const ec = ESTADO_STYLES[incidencia.estado] || ESTADO_STYLES.pendiente;
  const isImage = (url) => /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
  const anio = new Date().getFullYear();
  const fechaCreacion = incidencia.created_at || incidencia.fecha;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth
        PaperProps={{ sx: { borderRadius: "20px", maxHeight: "95vh", height: "95vh", overflow: "hidden" } }}>
        {/* ─── HEADER ─── */}
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #ECECEC", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
              INC-{anio}-{String(incidencia.id).padStart(5, "0")}
            </Typography>
            <Chip label={ec.label} size="small"
              sx={{ borderRadius: "8px", fontSize: 12, fontWeight: 600, bgcolor: ec.bg, color: ec.color }} />
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: "#9CA3AF" }}>
            <X size={20} />
          </IconButton>
        </Box>

        {/* ─── CONTENT ─── */}
        <DialogContent sx={{ p: 3, overflow: "auto", display: "flex", flexDirection: "column", gap: 0 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.8fr 1fr" }, gap: 3, alignItems: "start" }}>

            {/* ─── COLUMNA IZQUIERDA ─── */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

              {/* Info general */}
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", mb: 1.5 }}>
                  Información general
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>Empleado</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>{incidencia.empleado_nombre}</Typography>
                    <Typography sx={{ fontSize: 12, color: "#6B7280" }}>{incidencia.cedula}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>Tipo de incidencia</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>{TIPOS[incidencia.tipo] || incidencia.tipo}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>Área</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>{incidencia.area || "—"}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>Cargo</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>{incidencia.cargo || "—"}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Descripción */}
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", mb: 1 }}>
                  Descripción
                </Typography>
                <Box sx={{ bgcolor: "#F9FAFB", borderRadius: "12px", p: 2, border: "1px solid #F3F4F6" }}>
                  <Typography sx={{ fontSize: 13, color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {incidencia.descripcion || "Sin descripción"}
                  </Typography>
                </Box>
              </Box>

              {/* Evidencias */}
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", mb: 1 }}>
                  Evidencias
                </Typography>
                {incidencia.evidencia_url ? (
                  <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                    {isImage(incidencia.evidencia_url) ? (
                      <Box sx={{
                        width: 120, height: 120, borderRadius: "12px", overflow: "hidden",
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
                        sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, color: "#6B7280", borderColor: "#ECECEC" }}>
                        Ver PDF de evidencia
                      </Button>
                    )}
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>Sin evidencia adjunta</Typography>
                )}
              </Box>

              {/* Documento generado */}
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", mb: 1 }}>
                  Documento generado
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, bgcolor: "#F0FDF4", borderRadius: "12px", p: 2, border: "1px solid #BBF7D0" }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText size={20} color="#16A34A" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#065F46" }}>Plantilla de incidencia</Typography>
                    <Typography sx={{ fontSize: 11, color: "#6B7280" }}>Generada automáticamente por el sistema</Typography>
                  </Box>
                  <Button size="small" variant="outlined" startIcon={<Download size={14} />}
                    onClick={() => descargarPlantilla(incidencia.id)}
                    sx={{ borderRadius: "8px", textTransform: "none", fontSize: 12, color: "#16A34A", borderColor: "#16A34A", "&:hover": { borderColor: "#15803D" }, flexShrink: 0 }}>
                    Descargar
                  </Button>
                </Box>
              </Box>

              {/* PDF firmado */}
              {incidencia.archivo_firmado && (
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", mb: 1 }}>
                    PDF Firmado
                  </Typography>
                  <Button variant="outlined" startIcon={<FileSignature size={16} />}
                    onClick={() => window.open(incidencia.archivo_firmado, "_blank")}
                    sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, color: "#065F46", borderColor: "#BBF7D0" }}>
                    Ver documento firmado
                  </Button>
                </Box>
              )}

              {/* Motivo rechazo */}
              {incidencia.motivo_rechazo && (
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#DC2626", textTransform: "uppercase", mb: 1 }}>
                    Motivo de rechazo
                  </Typography>
                  <Box sx={{ bgcolor: "#FEE2E2", borderRadius: "12px", p: 2, border: "1px solid #FECACA" }}>
                    <Typography sx={{ fontSize: 13, color: "#991B1B", lineHeight: 1.5 }}>
                      {incidencia.motivo_rechazo}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {/* ─── COLUMNA DERECHA ─── */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

              {/* Timeline */}
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", mb: 1.5 }}>
                  Línea de tiempo
                </Typography>
                <TimelineItem icon={<FileText size={14} />} activo
                  label="Incidencia registrada" fecha={fechaCreacion} />
                <TimelineItem icon={<Download size={14} />} activo
                  label="PDF generado automáticamente" />
                <TimelineItem icon={<FileSignature size={14} />}
                  activo={!!incidencia.archivo_firmado}
                  label="Firma electrónica" fecha={incidencia.archivo_firmado ? fechaCreacion : null} />
                <TimelineItem icon={<Clock size={14} />}
                  activo={incidencia.estado !== "pendiente"}
                  label="En revisión" />
                <TimelineItem icon={incidencia.estado === "aprobado" ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  activo={incidencia.estado !== "pendiente"}
                  label={incidencia.estado === "aprobado" ? "Aprobada" : incidencia.estado === "rechazado" ? "Rechazada" : "Pendiente de revisión"}
                  ultimo />
              </Box>

              {/* Observaciones */}
              {incidencia.motivo_rechazo && (
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", mb: 1 }}>
                    Observaciones
                  </Typography>
                  <Box sx={{ bgcolor: "#F9FAFB", borderRadius: "12px", p: 2, border: "1px solid #F3F4F6" }}>
                    <Typography sx={{ fontSize: 13, color: "#374151" }}>{incidencia.motivo_rechazo}</Typography>
                  </Box>
                </Box>
              )}

              {/* Info del proceso */}
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", mb: 1.5 }}>
                  Información del proceso
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Calendar size={16} color="#9CA3AF" />
                    <Box>
                      <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>Fecha de creación</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
                        {fechaCreacion ? new Date(fechaCreacion).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <User size={16} color="#9CA3AF" />
                    <Box>
                      <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>Registrado por</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
                        {incidencia.empleado_nombre || "—"}
                      </Typography>
                    </Box>
                  </Box>
                  {incidencia.revisor_nombre && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Shield size={16} color="#9CA3AF" />
                      <Box>
                        <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>Revisado por</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
                          {incidencia.revisor_nombre}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CheckCircle size={16} color={ec.color} />
                    <Box>
                      <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>Estado actual</Typography>
                      <Chip label={ec.label} size="small"
                        sx={{ borderRadius: "6px", fontSize: 11, fontWeight: 600, bgcolor: ec.bg, color: ec.color, mt: 0.2 }} />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        {/* ─── FOOTER ─── */}
        <Box sx={{ borderTop: "1px solid #ECECEC", flexShrink: 0, bgcolor: "#F9FAFB" }}>
          {error && (
            <Box sx={{ px: 3, py: 1.5, bgcolor: "#FEE2E2", display: "flex", alignItems: "center", gap: 1 }}>
              <AlertTriangle size={16} color="#DC2626" />
              <Typography sx={{ fontSize: 13, color: "#DC2626" }}>{error}</Typography>
            </Box>
          )}

          {puedeGestionar ? (
            <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#111827", textTransform: "uppercase" }}>
                Gestión de la incidencia
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                <TextField multiline rows={2} value={observacion} onChange={e => setObservacion(e.target.value)}
                  placeholder="Escribe una observación (requerido para rechazar)"
                  sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13, bgcolor: "#FFF" } }} />
                <Select value={prioridad} onChange={e => setPrioridad(e.target.value)} size="small"
                  sx={{ borderRadius: "8px", fontSize: 13, minWidth: 120, bgcolor: "#FFF" }}>
                  <MenuItem value="baja">Baja</MenuItem>
                  <MenuItem value="media">Media</MenuItem>
                  <MenuItem value="alta">Alta</MenuItem>
                </Select>
              </Box>
              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <Button onClick={onClose}
                  sx={{ borderRadius: "8px", textTransform: "none", fontSize: 13, color: "#6B7280" }}>
                  Cancelar
                </Button>
                {esAdmin && (
                  <Button variant="contained" onClick={handleAprobar} disabled={accionando}
                    sx={{ borderRadius: "8px", textTransform: "none", fontSize: 13, fontWeight: 600, bgcolor: "#16A34A", "&:hover": { bgcolor: "#15803D" } }}>
                    {accionando ? "Aprobando..." : "Aprobar incidencia"}
                  </Button>
                )}
                {esTTHH && (
                  <>
                    <input type="file" accept=".pdf" ref={firmaInputRef}
                      onChange={handleFirmaSelect} style={{ display: "none" }} />
                    <Button variant="outlined" startIcon={<Download size={14} />}
                      onClick={() => descargarPlantilla(incidencia.id)}
                      sx={{ borderRadius: "8px", textTransform: "none", fontSize: 13, color: "#1B5E20", borderColor: "#1B5E20" }}>
                      Descargar plantilla
                    </Button>
                    <Button variant="contained" startIcon={<Upload size={14} />}
                      onClick={() => firmaInputRef.current?.click()} disabled={subiendoFirma}
                      sx={{ borderRadius: "8px", textTransform: "none", fontSize: 13, fontWeight: 600, bgcolor: "#16A34A", "&:hover": { bgcolor: "#15803D" } }}>
                      {subiendoFirma ? "Subiendo..." : "Subir PDF firmado"}
                    </Button>
                  </>
                )}
                <Button variant="contained" onClick={handleRechazar}
                  disabled={accionando || !observacion.trim()}
                  sx={{ borderRadius: "8px", textTransform: "none", fontSize: 13, fontWeight: 600, bgcolor: "#DC2626", "&:hover": { bgcolor: "#B91C1C" } }}>
                  Rechazar incidencia
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ px: 3, py: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button variant="outlined" startIcon={<Download size={16} />}
                onClick={() => descargarPlantilla(incidencia.id)}
                sx={{ borderRadius: "8px", textTransform: "none", fontSize: 13, color: "#6B7280", borderColor: "#D1D5DB" }}>
                Descargar PDF
              </Button>
              <Button onClick={onClose}
                sx={{ borderRadius: "8px", textTransform: "none", fontSize: 13, color: "#374151", bgcolor: "#F3F4F6" }}>
                Cerrar
              </Button>
            </Box>
          )}
        </Box>
      </Dialog>

      {/* Firma preview modal */}
      <Dialog open={firmaModalOpen} onClose={() => setFirmaModalOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 1.5 }}>
          <FileSignature size={20} />
          Vista previa - PDF firmado
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: "#52525B", height: "60vh" }}>
          {firmaFile && firmaPreview ? (
            firmaFile.type === "application/pdf" ? (
              <iframe src={firmaPreview} width="100%" height="100%" style={{ border: "none" }} title="Vista previa PDF" />
            ) : (
              <Box component="img" src={firmaPreview} sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
            )
          ) : null}
        </DialogContent>
        {error && (
          <Typography sx={{ px: 3, py: 1, fontSize: 13, color: "#DC2626", bgcolor: "#FEE2E2" }}>
            {error}
          </Typography>
        )}
        <DialogActions sx={{ p: 2, gap: 1, borderTop: "1px solid #ECECEC" }}>
          <Button onClick={() => { setFirmaModalOpen(false); limpiarFirma(); }}
            sx={{ borderRadius: "8px", textTransform: "none", fontSize: 13, color: "#6B7280" }}>
            Cancelar
          </Button>
          <Button variant="contained" startIcon={<Upload size={16} />}
            onClick={handleFirmaUpload} disabled={subiendoFirma}
            sx={{ borderRadius: "8px", textTransform: "none", fontSize: 13, fontWeight: 600, bgcolor: "#16A34A", "&:hover": { bgcolor: "#15803D" } }}>
            {subiendoFirma ? "Subiendo..." : "Subir PDF firmado"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}