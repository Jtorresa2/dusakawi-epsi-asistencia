import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Paper, Typography, Button, TextField, Select, MenuItem } from "@mui/material";
import { Upload, Send, Image, FileText, Info, Clock, CheckCircle2, Lightbulb, Shield, X, AlertTriangle, Check } from "lucide-react";
import PageHeader from "../../../shared/components/PageHeader";

const API = "/api";
const MAX_CHARS = 500;

const INFO_CARDS = [
  {
    title: "Información importante",
    desc: "Reporta fallos biométricos, tardanzas justificadas, problemas con marcación manual o cualquier novedad relacionada con tu asistencia.",
    icon: <Info size={20} />,
    color: "#1565C0",
    bg: "#E3F2FD",
  },
  {
    title: "Tiempo de respuesta",
    desc: "Talento Humano revisa y responde las incidencias en un plazo máximo de 24 a 48 horas hábiles.",
    icon: <Clock size={20} />,
    color: "#7C3AED",
    bg: "#FAF5FF",
  },
  {
    title: "Tipos de incidencias permitidas",
    desc: "Falla biométrica, tardanza justificada y otros motivos relacionados con el control de asistencia.",
    icon: <FileText size={20} />,
    color: "#D97706",
    bg: "#FEF3C7",
  },
  {
    title: "Consejos para la descripción",
    desc: "Describe clara y cronológicamente lo sucedido. Incluye fechas, horas aproximadas y cualquier detalle relevante que ayude a entender tu situación.",
    icon: <Lightbulb size={20} />,
    color: "#059669",
    bg: "#D1FAE5",
  },
  {
    title: "Estado del proceso",
    desc: "Recibirás una notificación cuando tu incidencia sea aprobada o rechazada. Puedes dar seguimiento desde Mis solicitudes.",
    icon: <CheckCircle2 size={20} />,
    color: "#16A34A",
    bg: "#D1FAE5",
  },
];

const TIPOS = [
  { value: "falla_biometrica", label: "Falla biométrica", desc: "El lector no reconoció tu huella o no pudiste marcar" },
  { value: "tardanza_justificada", label: "Tardanza justificada", desc: "Llegaste tarde por una razón válida" },
  { value: "otro", label: "Otro", desc: "Cualquier otra novedad relacionada con tu asistencia" },
];

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StepIndicator({ paso }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0, mb: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{
          width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          bgcolor: paso === 1 ? "#1B5E20" : "#1B5E20", color: "#fff", fontSize: 13, fontWeight: 700,
          transition: "all 0.3s",
        }}>
          {paso === 2 ? <Check size={16} /> : 1}
        </Box>
        <Typography sx={{ fontSize: 13, fontWeight: paso === 1 ? 600 : 400, color: paso >= 1 ? "#111827" : "#9CA3AF" }}>
          Información de la incidencia
        </Typography>
      </Box>
      <Box sx={{ width: 40, height: 1, mx: 2, bgcolor: paso >= 2 ? "#1B5E20" : "#E5E7EB", transition: "all 0.3s" }} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{
          width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          bgcolor: paso === 2 ? "#1B5E20" : "#F3F4F6", color: paso === 2 ? "#fff" : "#9CA3AF", fontSize: 13, fontWeight: 700,
          transition: "all 0.3s",
        }}>
          2
        </Box>
        <Typography sx={{ fontSize: 13, fontWeight: paso === 2 ? 600 : 400, color: paso >= 2 ? "#111827" : "#9CA3AF" }}>
          Incidencia registrada
        </Typography>
      </Box>
    </Box>
  );
}

export default function ReportarIncidenciaPage() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [tipo, setTipo] = useState("falla_biometrica");
  const [descripcion, setDescripcion] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [archivoPreview, setArchivoPreview] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const dropRef = useRef(null);
  const inputRef = useRef(null);

  const limpiarArchivo = useCallback(() => {
    if (archivoPreview) URL.revokeObjectURL(archivoPreview);
    setArchivo(null);
    setArchivoPreview(null);
  }, [archivoPreview]);

  const procesarArchivo = useCallback((file) => {
    if (!file) return;
    if (archivoPreview) URL.revokeObjectURL(archivoPreview);
    setArchivo(file);
    if (file.type.startsWith("image/")) {
      setArchivoPreview(URL.createObjectURL(file));
    } else {
      setArchivoPreview(null);
    }
  }, [archivoPreview]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) procesarArchivo(file);
  }, [procesarArchivo]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) procesarArchivo(file);
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!descripcion.trim()) { setError("La descripción es obligatoria"); return; }
    setError("");
    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("tipo", tipo);
      formData.append("descripcion", descripcion);
      formData.append("fecha", new Date().toISOString().split("T")[0]);
      if (archivo) formData.append("evidencia", archivo);
      const res = await fetch(`${API}/incidencias`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.mensaje || "Error"); }
      setPaso(2);
      setDescripcion("");
      limpiarArchivo();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (paso === 2) {
    return (
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3, maxWidth: 1400, mx: "auto", width: "100%" }}>
        <PageHeader titulo="Reportar incidencia" subtitulo="Notifica una falla biométrica o justifica tu tardanza" />
        <StepIndicator paso={2} />
        <Paper elevation={0} sx={{ p: 6, borderRadius: "20px", border: "1px solid #ECECEC", textAlign: "center", maxWidth: 520, mx: "auto", width: "100%" }}>
          <Box sx={{ width: 72, height: 72, borderRadius: "50%", bgcolor: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2.5 }}>
            <CheckCircle2 size={36} color="#16A34A" />
          </Box>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#111827", mb: 1 }}>
            Incidencia reportada
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#6B7280", mb: 3, lineHeight: 1.6, maxWidth: 360, mx: "auto" }}>
            Tu incidencia ha sido enviada correctamente. Talento Humano la revisará y recibirás una notificación con la respuesta.
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, bgcolor: "#F9FAFB", borderRadius: "12px", p: 2, mb: 3, textAlign: "left" }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>Resumen</Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: 13, color: "#6B7280" }}>Tipo</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{TIPOS.find(t => t.value === tipo)?.label}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: 13, color: "#6B7280" }}>Fecha</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{new Date().toLocaleDateString("es-CO")}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: 13, color: "#6B7280" }}>Estado</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#16A34A" }}>Pendiente</Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center" }}>
            <Button variant="outlined" onClick={() => navigate("/dashboard")}
              sx={{ borderRadius: "10px", textTransform: "none", fontSize: 14, fontWeight: 600, color: "#6B7280", borderColor: "#D1D5DB", "&:hover": { borderColor: "#1B5E20", color: "#1B5E20" }, py: 1.2, px: 4 }}>
              Volver al inicio
            </Button>
            <Button variant="contained" onClick={() => { setPaso(1); setTipo("falla_biometrica"); }}
              sx={{ borderRadius: "10px", textTransform: "none", fontSize: 14, fontWeight: 600, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" }, py: 1.2, px: 4 }}>
              Reportar otra incidencia
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3, maxWidth: 1400, mx: "auto", width: "100%" }}>
      <PageHeader titulo="Reportar incidencia" subtitulo="Notifica una falla biométrica o justifica tu tardanza" />
      <StepIndicator paso={1} />

      {error && (
        <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", bgcolor: "#FEE2E2", display: "flex", alignItems: "center", gap: 1.5 }}>
          <AlertTriangle size={18} color="#DC2626" />
          <Typography sx={{ fontSize: 13, color: "#DC2626" }}>{error}</Typography>
        </Paper>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "7fr 3fr" }, gap: 3, alignItems: "start" }}>
        {/* Formulario */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", border: "1px solid #ECECEC" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Tipo */}
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", mb: 0.5, textTransform: "uppercase" }}>Tipo de incidencia</Typography>
              <Select fullWidth size="small" value={tipo} onChange={e => setTipo(e.target.value)}
                sx={{ borderRadius: "8px", fontSize: 13, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#ECECEC" } }}>
                {TIPOS.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
              <Typography sx={{ fontSize: 12, color: "#9CA3AF", mt: 0.5 }}>
                {TIPOS.find(t => t.value === tipo)?.desc}
              </Typography>
            </Box>

            {/* Descripción */}
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", mb: 0.5, textTransform: "uppercase" }}>
                Descripción detallada *
              </Typography>
              <TextField fullWidth multiline rows={4} value={descripcion} onChange={e => setDescripcion(e.target.value.slice(0, MAX_CHARS))}
                placeholder="Describe lo sucedido... ej: el lector biométrico no reconoció mi huella y no pude marcar entrada"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13, bgcolor: "#F9FAFB" } }} />
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
                <Typography sx={{ fontSize: 11, color: descripcion.length >= MAX_CHARS ? "#DC2626" : "#9CA3AF" }}>
                  {descripcion.length}/{MAX_CHARS}
                </Typography>
              </Box>
            </Box>

            {/* Evidencia */}
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", mb: 0.5, textTransform: "uppercase" }}>
                Adjuntar evidencia {archivo ? "(1 archivo)" : "(opcional — foto o PDF)"}
              </Typography>
              <Box ref={dropRef} onDrop={handleDrop} onDragOver={handleDragOver}
                onClick={() => inputRef.current?.click()}
                sx={{
                  border: "2px dashed #D1D5DB", borderRadius: "12px", p: archivo ? 2 : 4,
                  textAlign: "center", cursor: "pointer", transition: "all 0.2s",
                  bgcolor: archivo ? "#F9FAFB" : "transparent",
                  "&:hover": { borderColor: "#1B5E20", bgcolor: "#F9FAFB" },
                }}>
                <input ref={inputRef} type="file" hidden accept=".jpg,.jpeg,.png,.webp,.gif,.pdf" onChange={handleInputChange} />
                {archivo ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: "10px", bgcolor: archivo.type.startsWith("image/") ? "#E3F2FD" : "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {archivo.type.startsWith("image/") ? <Image size={22} color="#1565C0" /> : <FileText size={22} color="#D97706" />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#111827", truncate: true }}>{archivo.name}</Typography>
                      <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>{formatSize(archivo.size)}</Typography>
                    </Box>
                    <Button size="small" onClick={(e) => { e.stopPropagation(); limpiarArchivo(); }}
                      sx={{ minWidth: 32, width: 32, height: 32, borderRadius: "8px", color: "#9CA3AF", "&:hover": { bgcolor: "#FEE2E2", color: "#DC2626" } }}>
                      <X size={16} />
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <Box sx={{ width: 48, height: 48, borderRadius: "12px", bgcolor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 1.5 }}>
                      <Upload size={22} color="#6B7280" />
                    </Box>
                    <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
                      <Typography component="span" sx={{ color: "#1B5E20", fontWeight: 600 }}>Haz clic</Typography> o arrastra un archivo aquí
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: "#9CA3AF", mt: 0.3 }}>JPG, PNG, WebP, GIF o PDF — Máx 10 MB</Typography>
                  </Box>
                )}
              </Box>
              {archivoPreview && (
                <Box component="img" src={archivoPreview} sx={{ mt: 1.5, maxWidth: "100%", maxHeight: 200, borderRadius: "10px", border: "1px solid #ECECEC" }} />
              )}
            </Box>


          </Box>
        </Paper>

        {/* Info panel */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {INFO_CARDS.map((card, i) => (
            <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid #ECECEC" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.8 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>
                  {card.icon}
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{card.title}</Typography>
              </Box>
              <Typography sx={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{card.desc}</Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Confidentiality */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid #ECECEC", display: "flex", alignItems: "center", gap: 1.5, justifyContent: "center" }}>
        <Shield size={16} color="#9CA3AF" />
        <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
          Toda la información proporcionada será tratada de forma confidencial conforme a la política de protección de datos de Dusakawi EPSI.
        </Typography>
      </Paper>

      {/* Actions */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: "20px", border: "1px solid #ECECEC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Button variant="outlined" onClick={() => window.history.back()}
          sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, color: "#6B7280", borderColor: "#E0E7EF", "&:hover": { borderColor: "#9CA3AF" } }}>
          Cancelar
        </Button>
        <Button variant="contained" startIcon={<Send size={16} />} onClick={handleSubmit} disabled={enviando || !descripcion.trim()}
          sx={{ borderRadius: "10px", textTransform: "none", fontSize: 14, fontWeight: 600, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" }, py: 1, px: 3 }}>
          {enviando ? "Enviando..." : "Enviar incidencia"}
        </Button>
      </Paper>
    </Box>
  );
}