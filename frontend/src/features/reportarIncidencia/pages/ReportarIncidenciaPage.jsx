import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Paper, Typography, Button, TextField, Select, MenuItem } from "@mui/material";
import { Upload, Send, Image, FileText, Info, Clock, CheckCircle2, Lightbulb, Shield, X, AlertTriangle, Check } from "lucide-react";
import PageHeader from "../../../shared/components/PageHeader";
import { COLORES } from "../../../shared/constants/colores.js";

const API = "/api";
const MAX_CHARS = 500;

const INFO_CARDS = [
  {
    title: "Información importante",
    desc: "Reporta fallos biométricos, problemas con marcación manual o cualquier novedad relacionada con tu asistencia.",
    icon: <Info size={20} />,
    color: COLORES.primarioOscuro,
    bg: COLORES.primarioClaro,
  },
  {
    title: "Tiempo de respuesta",
    desc: "Talento Humano revisa y responde las incidencias en un plazo máximo de 24 a 48 horas hábiles.",
    icon: <Clock size={20} />,
    color: COLORES.primario,
    bg: COLORES.primarioClaro,
  },
  {
    title: "Tipos de incidencias permitidas",
    desc: "Falla biométrica, y otros motivos relacionados con el control de asistencia.",
    icon: <FileText size={20} />,
    color: COLORES.warningOscuro,
    bg: COLORES.warningFondo,
  },
  {
    title: "Consejos para la descripción",
    desc: "Describe clara y cronológicamente lo sucedido. Incluye fechas, horas aproximadas y cualquier detalle relevante que ayude a entender tu situación.",
    icon: <Lightbulb size={20} />,
    color: COLORES.verdeTexto,
    bg: COLORES.successFondo,
  },
  {
    title: "Estado del proceso",
    desc: "Recibirás una notificación cuando tu incidencia sea aprobada o rechazada. Puedes dar seguimiento desde Mis solicitudes.",
    icon: <CheckCircle2 size={20} />,
    color: COLORES.verdeTexto,
    bg: COLORES.successFondo,
  },
];

const TIPOS = [
  { value: "biometric_failure", label: "Falla biométrica", desc: "El lector no reconoció tu huella o no pudiste marcar" },
  
  { value: "other", label: "Otro", desc: "Cualquier otra novedad relacionada con tu asistencia" },
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
          bgcolor: paso === 1 ? COLORES.primarioOscuro : COLORES.primarioOscuro, color: COLORES.fondoBlanco, fontSize: 13, fontWeight: 700,
          transition: "all 0.3s",
        }}>
          {paso === 2 ? <Check size={16} /> : 1}
        </Box>
        <Typography sx={{ fontSize: 13, fontWeight: paso === 1 ? 600 : 400, color: paso >= 1 ? COLORES.textoPrimario : COLORES.textoSuave }}>
          Información de la incidencia
        </Typography>
      </Box>
      <Box sx={{ width: 40, height: 1, mx: 2, bgcolor: paso >= 2 ? COLORES.primarioOscuro : COLORES.borde, transition: "all 0.3s" }} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{
          width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          bgcolor: paso === 2 ? COLORES.primarioOscuro : COLORES.fondoGris2, color: paso === 2 ? COLORES.fondoBlanco : COLORES.textoSuave, fontSize: 13, fontWeight: 700,
          transition: "all 0.3s",
        }}>
          2
        </Box>
        <Typography sx={{ fontSize: 13, fontWeight: paso === 2 ? 600 : 400, color: paso >= 2 ? COLORES.textoPrimario : COLORES.textoSuave }}>
          Incidencia registrada
        </Typography>
      </Box>
    </Box>
  );
}

export default function ReportarIncidenciaPage() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [tipo, setTipo] = useState("biometric_failure");
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
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3, maxWidth: 1400, mx: "auto", width: "100%", boxSizing: "border-box" }}>
        
        <Paper elevation={0} sx={{ p: 6, borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}`, textAlign: "center", maxWidth: 520, mx: "auto", width: "100%" }}>
          <Box sx={{ width: 72, height: 72, borderRadius: "50%", bgcolor: COLORES.verdeTextoFondo, display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2.5 }}>
            <CheckCircle2 size={36} color={COLORES.success} />
          </Box>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: COLORES.textoPrimario, mb: 1 }}>
            Incidencia reportada
          </Typography>
          <Typography sx={{ fontSize: 14, color: COLORES.textoTerciario, mb: 3, lineHeight: 1.6, maxWidth: 360, mx: "auto" }}>
            Tu incidencia ha sido enviada correctamente. Talento Humano la revisará y recibirás una notificación con la respuesta.
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, bgcolor: COLORES.fondoGris, borderRadius: "12px", p: 2, mb: 3, textAlign: "left" }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, textTransform: "uppercase" }}>Resumen</Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: 13, color: COLORES.textoTerciario }}>Tipo</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: COLORES.textoPrimario }}>{TIPOS.find(t => t.value === tipo)?.label}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: 13, color: COLORES.textoTerciario }}>Fecha</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: COLORES.textoPrimario }}>{new Date().toLocaleDateString("es-CO")}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: 13, color: COLORES.textoTerciario }}>Estado</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: COLORES.verdeTexto }}>Pendiente</Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center" }}>
            <Button variant="outlined" onClick={() => navigate("/dashboard")}
              sx={{ borderRadius: "10px", textTransform: "none", fontSize: 14, fontWeight: 600, color: COLORES.textoTerciario, borderColor: COLORES.borde2, "&:hover": { borderColor: COLORES.primarioOscuro, color: COLORES.primarioOscuro }, py: 1.2, px: 4 }}>
              Volver al inicio
            </Button>
            <Button variant="contained" onClick={() => { setPaso(1); setTipo("biometric_failure"); }}
              sx={{ borderRadius: "10px", textTransform: "none", fontSize: 14, fontWeight: 600, bgcolor: COLORES.primarioOscuro, "&:hover": { bgcolor: COLORES.primario }, py: 1.2, px: 4 }}>
              Reportar otra incidencia
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3, maxWidth: 1400, mx: "auto", width: "100%", boxSizing: "border-box" }}>
     <Typography sx={{ fontSize: 13, color: COLORES.textoMuted }}>
                Inicio / Gestión / Reportar incidencia
      </Typography>

      {error && (
        <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", bgcolor: COLORES.dangerFondo, display: "flex", alignItems: "center", gap: 1.5 }}>
          <AlertTriangle size={18} color={COLORES.danger} />
          <Typography sx={{ fontSize: 13, color: COLORES.danger }}>{error}</Typography>
        </Paper>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "7fr 3fr" }, gap: 3, alignItems: "start" }}>
        {/* Formulario */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}` }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Tipo */}
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5, textTransform: "uppercase" }}>Tipo de incidencia</Typography>
              <Select fullWidth size="small" value={tipo} onChange={e => setTipo(e.target.value)}
                sx={{ borderRadius: "8px", fontSize: 13, bgcolor: COLORES.fondoGris, "& fieldset": { borderColor: COLORES.grisContorno } }}>
                {TIPOS.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
              <Typography sx={{ fontSize: 12, color: COLORES.textoSuave, mt: 0.5 }}>
                {TIPOS.find(t => t.value === tipo)?.desc}
              </Typography>
            </Box>

            {/* Descripción */}
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5, textTransform: "uppercase" }}>
                Descripción detallada *
              </Typography>
              <TextField fullWidth multiline rows={4} value={descripcion} onChange={e => setDescripcion(e.target.value.slice(0, MAX_CHARS))}
                placeholder="Describe lo sucedido... ej: el lector biométrico no reconoció mi huella y no pude marcar entrada"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13, bgcolor: COLORES.fondoGris } }} />
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
                <Typography sx={{ fontSize: 11, color: descripcion.length >= MAX_CHARS ? COLORES.danger : COLORES.textoSuave }}>
                  {descripcion.length}/{MAX_CHARS}
                </Typography>
              </Box>
            </Box>

            {/* Evidencia */}
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5, textTransform: "uppercase" }}>
                Adjuntar evidencia {archivo ? "(1 archivo)" : "(opcional — foto o PDF)"}
              </Typography>
              <Box ref={dropRef} onDrop={handleDrop} onDragOver={handleDragOver}
                onClick={() => inputRef.current?.click()}
                sx={{
                  border: `2px dashed ${COLORES.borde2}`, borderRadius: "12px", p: archivo ? 2 : 4,
                  textAlign: "center", cursor: "pointer", transition: "all 0.2s",
                  bgcolor: archivo ? COLORES.fondoGris : "transparent",
                  "&:hover": { borderColor: COLORES.primarioOscuro, bgcolor: COLORES.fondoGris },
                }}>
                <input ref={inputRef} type="file" hidden accept=".jpg,.jpeg,.png,.webp,.gif,.pdf" onChange={handleInputChange} />
                {archivo ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: "10px", bgcolor: archivo.type.startsWith("image/") ? COLORES.primarioClaro : COLORES.warningFondo, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {archivo.type.startsWith("image/") ? <Image size={22} color={COLORES.primarioOscuro} /> : <FileText size={22} color={COLORES.warning} />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: COLORES.textoPrimario, truncate: true }}>{archivo.name}</Typography>
                      <Typography sx={{ fontSize: 11, color: COLORES.textoSuave }}>{formatSize(archivo.size)}</Typography>
                    </Box>
                    <Button size="small" onClick={(e) => { e.stopPropagation(); limpiarArchivo(); }}
                      sx={{ minWidth: 32, width: 32, height: 32, borderRadius: "8px", color: COLORES.textoSuave, "&:hover": { bgcolor: COLORES.dangerFondo, color: COLORES.danger } }}>
                      <X size={16} />
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <Box sx={{ width: 48, height: 48, borderRadius: "12px", bgcolor: COLORES.fondoGris2, display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 1.5 }}>
                      <Upload size={22} color={COLORES.textoTerciario} />
                    </Box>
                    <Typography sx={{ fontSize: 13, color: COLORES.textoTerciario }}>
                      <Typography component="span" sx={{ color: COLORES.primarioOscuro, fontWeight: 600 }}>Haz clic</Typography> o arrastra un archivo aquí
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: COLORES.textoSuave, mt: 0.3 }}>JPG, PNG, WebP, GIF o PDF — Máx 10 MB</Typography>
                  </Box>
                )}
              </Box>
              {archivoPreview && (
                <Box component="img" src={archivoPreview} sx={{ mt: 1.5, maxWidth: "100%", maxHeight: 200, borderRadius: "10px", border: `1px solid ${COLORES.grisContorno}` }} />
              )}
            </Box>


          </Box>
        </Paper>

        {/* Info panel */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {INFO_CARDS.map((card, i) => (
            <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}` }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.8 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>
                  {card.icon}
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORES.textoPrimario }}>{card.title}</Typography>
              </Box>
              <Typography sx={{ fontSize: 12, color: COLORES.textoTerciario, lineHeight: 1.5 }}>{card.desc}</Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Confidentiality */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", alignItems: "center", gap: 1.5, justifyContent: "center" }}>
        <Shield size={16} color={COLORES.textoSuave} />
        <Typography sx={{ fontSize: 12, color: COLORES.textoSuave }}>
          Toda la información proporcionada será tratada de forma confidencial conforme a la política de protección de datos de Dusakawi EPSI.
        </Typography>
      </Paper>

      {/* Actions */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Button variant="outlined" onClick={() => window.history.back()}
          sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, color: COLORES.textoTerciario, borderColor: COLORES.borde, "&:hover": { borderColor: COLORES.textoSuave } }}>
          Cancelar
        </Button>
        <Button variant="contained" startIcon={<Send size={16} />} onClick={handleSubmit} disabled={enviando || !descripcion.trim()}
          sx={{ borderRadius: "10px", textTransform: "none", fontSize: 14, fontWeight: 600, bgcolor: COLORES.primarioOscuro, "&:hover": { bgcolor: COLORES.primario }, py: 1, px: 3 }}>
          {enviando ? "Enviando..." : "Enviar incidencia"}
        </Button>
      </Paper>
    </Box>
  );
}