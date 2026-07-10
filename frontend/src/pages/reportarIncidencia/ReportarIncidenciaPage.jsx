import { useState } from "react";
import {
  Box, Paper, Typography, Button, TextField, Select, MenuItem,
  Alert
} from "@mui/material";
import { Upload, Send, Image, FileText } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/PageContainer";

const API = "http://localhost:5000/api";

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
    <PageContainer>
      <PageHeader titulo="Reportar incidencia" subtitulo="Notifica una falla biométrica o justifica tu tardanza" />

      <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", border: "1px solid #ECECEC", maxWidth: 600 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {exito && (
            <Alert severity="success" onClose={() => setExito(false)}
              sx={{ borderRadius: "10px" }}>
              Incidencia reportada correctamente. Talento Humano la revisará pronto.
            </Alert>
          )}
          {error && (
            <Alert severity="error" onClose={() => setError("")}
              sx={{ borderRadius: "10px" }}>
              {error}
            </Alert>
          )}

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

          <Button variant="contained" startIcon={<Send size={16} />} onClick={handleSubmit} disabled={enviando}
            sx={{ borderRadius: "10px", textTransform: "none", fontSize: 14, fontWeight: 600, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" }, py: 1.2 }}>
            {enviando ? "Enviando..." : "Enviar incidencia"}
          </Button>
        </Box>
      </Paper>
    </PageContainer>
  );
}