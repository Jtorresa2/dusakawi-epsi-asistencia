import { useState } from "react";
import { Box, Paper, Typography, Button, TextField, Select, MenuItem, Alert } from "@mui/material";
import { Upload, Send, Image, FileText, Info, Clock, CheckCircle2, Lightbulb } from "lucide-react";
import PageHeader from "../../../shared/components/PageHeader";

const API = "/api";

const INFO_CARDS = [
  {
    title: "Qué puedes reportar",
    desc: "Fallos biométricos, tardanzas justificadas, problemas con marcación manual o cualquier novedad relacionada con tu asistencia.",
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
    title: "Estado del proceso",
    desc: "Recibirás una notificación cuando tu incidencia sea aprobada o rechazada. Puedes dar seguimiento desde Mis solicitudes.",
    icon: <CheckCircle2 size={20} />,
    color: "#16A34A",
    bg: "#D1FAE5",
  },
  {
    title: "Recomendaciones",
    desc: "Adjunta una foto o PDF como evidencia. Describe claramente lo sucedido para agilizar la revisión.",
    icon: <Lightbulb size={20} />,
    color: "#D97706",
    bg: "#FEF3C7",
  },
];

export default function ReportarIncidenciaPage() {
  const [tipo, setTipo] = useState("falla_biometrica");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");

  const handleArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArchivo(file);
    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!descripcion.trim()) return setError("La descripción es obligatoria");
    setError("");
    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("tipo", tipo);
      formData.append("descripcion", descripcion);
      formData.append("fecha", fecha);
      if (archivo) formData.append("evidencia", archivo);
      const res = await fetch(`${API}/incidencias`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.mensaje || "Error"); }
      setExito(true);
      setDescripcion("");
      setArchivo(null);
      setPreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3, maxWidth: 1400, mx: "auto", width: "100%" }}>
      <PageHeader titulo="Reportar incidencia" subtitulo="Notifica una falla biométrica o justifica tu tardanza" />

      {exito && (
        <Alert severity="success" onClose={() => setExito(false)}
          sx={{ borderRadius: "12px" }}>
          Incidencia reportada correctamente. Talento Humano la revisará pronto.
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError("")}
          sx={{ borderRadius: "12px" }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "7fr 3fr" }, gap: 3, alignItems: "start" }}>
        {/* Columna izquierda — Formulario */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", border: "1px solid #ECECEC" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", mb: 0.5, textTransform: "uppercase" }}>Tipo de incidencia</Typography>
              <Select fullWidth size="small" value={tipo} onChange={e => setTipo(e.target.value)}
                sx={{ borderRadius: "8px", fontSize: 13 }}>
                <MenuItem value="falla_biometrica">Falla biométrica</MenuItem>
                <MenuItem value="tardanza_justificada">Tardanza justificada</MenuItem>
                <MenuItem value="otro">Otro</MenuItem>
              </Select>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", mb: 0.5, textTransform: "uppercase" }}>Fecha</Typography>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #C0D0E0", fontSize: "13px", outline: "none", color: "#111827", width: "100%", boxSizing: "border-box" }} />
            </Box>

            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", mb: 0.5, textTransform: "uppercase" }}>Descripción *</Typography>
              <TextField fullWidth multiline rows={4} value={descripcion} onChange={e => setDescripcion(e.target.value)}
                placeholder="Describe lo sucedido... ej: el lector biométrico no reconoció mi huella y no pude marcar entrada"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }} />
            </Box>

            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", mb: 0.5, textTransform: "uppercase" }}>
                Evidencia {archivo ? "(1 archivo adjunto)" : "(opcional — foto o PDF)"}
              </Typography>
              <Button variant="outlined" component="label" startIcon={archivo ? (preview ? <Image size={16} /> : <FileText size={16} />) : <Upload size={16} />}
                sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, color: "#6B7280", borderColor: "#E0E7EF", justifyContent: "flex-start", width: "100%", "&:hover": { borderColor: "#1B5E20" } }}>
                {archivo ? archivo.name : "Adjuntar archivo"}
                <input type="file" hidden accept=".jpg,.jpeg,.png,.webp,.gif,.pdf" onChange={handleArchivo} />
              </Button>
              {preview && (
                <Box component="img" src={preview} sx={{ mt: 1, maxWidth: "100%", maxHeight: 200, borderRadius: "8px", border: "1px solid #ECECEC" }} />
              )}
            </Box>
          </Box>
        </Paper>

        {/* Columna derecha — Info panel */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {INFO_CARDS.map((card, i) => (
            <Paper key={i} elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #ECECEC" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>
                  {card.icon}
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{card.title}</Typography>
              </Box>
              <Typography sx={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{card.desc}</Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Botones */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: "20px", border: "1px solid #ECECEC", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
        <Button variant="outlined" onClick={() => window.history.back()}
          sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, color: "#6B7280", borderColor: "#E0E7EF" }}>
          Cancelar
        </Button>
        <Button variant="contained" startIcon={<Send size={16} />} onClick={handleSubmit} disabled={enviando}
          sx={{ borderRadius: "10px", textTransform: "none", fontSize: 14, fontWeight: 600, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" }, py: 1, px: 3 }}>
          {enviando ? "Enviando..." : "Enviar incidencia"}
        </Button>
      </Paper>
    </Box>
  );
}
