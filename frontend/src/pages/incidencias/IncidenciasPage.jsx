import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from "@mui/material";
import { CheckCircle2, XCircle, Eye, ThumbsUp, ThumbsDown, Image, FileText, Search } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/PageContainer";
import { useRol } from "../../hooks/useRol";

const API = "http://localhost:5000/api";
const TIPOS = { falla_biometrica: "Falla biométrica", tardanza_justificada: "Tardanza justificada", otro: "Otro" };
const ESTADO_COLORS = {
  pendiente: { bg: "#FEF3C7", color: "#92400E" },
  aprobado: { bg: "#D1FAE5", color: "#065F46" },
  rechazado: { bg: "#FEE2E2", color: "#991B1B" },
};

export default function IncidenciasPage() {
  const [incidencias, setIncidencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [selected, setSelected] = useState(null);
  const [openDetalle, setOpenDetalle] = useState(false);
  const [rechazoModal, setRechazoModal] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [accionando, setAccionando] = useState(false);
  const { puede } = useRol();

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  const cargar = async () => {
    try {
      setCargando(true);
      const params = new URLSearchParams();
      if (filtroEstado) params.set("estado", filtroEstado);
      if (filtroTipo) params.set("tipo", filtroTipo);
      const res = await fetch(`${API}/incidencias?${params}`, { headers });
      const data = await res.json();
      setIncidencias(data);
    } catch { } finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const handleAprobar = async (id) => {
    setAccionando(true);
    try {
      await fetch(`${API}/incidencias/${id}/aprobar`, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" } });
      cargar();
    } finally { setAccionando(false); }
  };

  const handleRechazar = async () => {
    if (!motivoRechazo.trim()) return;
    setAccionando(true);
    try {
      await fetch(`${API}/incidencias/${rechazoModal}/rechazar`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: motivoRechazo }),
      });
      setRechazoModal(null);
      setMotivoRechazo("");
      cargar();
    } finally { setAccionando(false); }
  };

  const pendientes = incidencias.filter(i => i.estado === "pendiente").length;
  const aprobadas = incidencias.filter(i => i.estado === "aprobado").length;
  const rechazadas = incidencias.filter(i => i.estado === "rechazado").length;

  const STATS = [
    { label: "Pendientes", value: pendientes, color: "#92400E", bg: "#FEF3C7" },
    { label: "Aprobadas", value: aprobadas, color: "#065F46", bg: "#D1FAE5" },
    { label: "Rechazadas", value: rechazadas, color: "#991B1B", bg: "#FEE2E2" },
  ];

  const isImage = (url) => /\.(jpg|jpeg|png|webp|gif)$/i.test(url);

  return (
    <PageContainer>
      <PageHeader titulo="Incidencias" subtitulo={`${incidencias.length} registros`} />

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
        {STATS.map((s, i) => (
          <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid #ECECEC" }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" }}>{s.label}</Typography>
            <Typography sx={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</Typography>
          </Paper>
        ))}
      </Box>

      <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid #ECECEC", display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <Select size="small" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} displayEmpty
          sx={{ borderRadius: "8px", fontSize: 13, minWidth: 140 }}>
          <MenuItem value="">Todos los estados</MenuItem>
          <MenuItem value="pendiente">Pendiente</MenuItem>
          <MenuItem value="aprobado">Aprobado</MenuItem>
          <MenuItem value="rechazado">Rechazado</MenuItem>
        </Select>
        <Select size="small" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} displayEmpty
          sx={{ borderRadius: "8px", fontSize: 13, minWidth: 160 }}>
          <MenuItem value="">Todos los tipos</MenuItem>
          {Object.entries(TIPOS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
        </Select>
        <Button variant="contained" startIcon={<Search size={16} />} onClick={cargar}
          sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}>
          Filtrar
        </Button>
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "16px", border: "1px solid #ECECEC" }}>
        <Table>
          <TableHead>
            <TableRow>
              {["Empleado", "Tipo", "Descripción", "Evidencia", "Fecha", "Estado", "Acciones"].map(h => (
                <TableCell key={h} sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", borderBottom: "1px solid #F3F4F6" }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {cargando ? (
              <TableRow><TableCell colSpan={7} sx={{ textAlign: "center", py: 4, color: "#9CA3AF" }}>Cargando...</TableCell></TableRow>
            ) : incidencias.length === 0 ? (
              <TableRow><TableCell colSpan={7} sx={{ textAlign: "center", py: 4, color: "#9CA3AF" }}>No hay incidencias</TableCell></TableRow>
            ) : incidencias.map((inc) => {
              const ec = ESTADO_COLORS[inc.estado] || { bg: "#F3F4F6", color: "#374151" };
              return (
                <TableRow key={inc.id} sx={{ "&:last-child td": { border: 0 }, "&:hover": { bgcolor: "#F9FAFB" } }}>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{inc.empleado_nombre}</Typography>
                    <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>{inc.cedula}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={TIPOS[inc.tipo] || inc.tipo} size="small" sx={{ borderRadius: "8px", fontSize: 11, fontWeight: 600, bgcolor: "#F3F4F6", color: "#374151" }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: "#6B7280", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inc.descripcion}</TableCell>
                  <TableCell>
                    {inc.evidencia_url ? (
                      <Button size="small" onClick={() => { setSelected(inc); setOpenDetalle(true); }}
                        sx={{ borderRadius: "8px", textTransform: "none", fontSize: 11, color: "#1565C0", minWidth: 0, gap: 0.5 }}>
                        {isImage(inc.evidencia_url) ? <Image size={14} /> : <FileText size={14} />}
                        Ver
                      </Button>
                    ) : (
                      <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>—</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: "#6B7280" }}>{new Date(inc.fecha).toLocaleDateString("es-CO")}</TableCell>
                  <TableCell>
                    <Chip label={inc.estado} size="small" sx={{ borderRadius: "8px", fontSize: 11, fontWeight: 600, bgcolor: ec.bg, color: ec.color }} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton size="small" onClick={() => { setSelected(inc); setOpenDetalle(true); }}
                        sx={{ borderRadius: "8px", color: "#6B7280" }}><Eye size={16} /></IconButton>
                      {inc.estado === "pendiente" && puede("incidencias", "aprobar") && (
                        <>
                          <IconButton size="small" onClick={() => handleAprobar(inc.id)} disabled={accionando}
                            sx={{ borderRadius: "8px", color: "#16A34A" }}><ThumbsUp size={16} /></IconButton>
                          <IconButton size="small" onClick={() => setRechazoModal(inc.id)}
                            sx={{ borderRadius: "8px", color: "#DC2626" }}><ThumbsDown size={16} /></IconButton>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detalle modal */}
      <Dialog open={openDetalle} onClose={() => setOpenDetalle(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: "16px", maxHeight: "90vh", overflow: "auto" } }}>
        {selected && (
          <>
            <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
              Incidencia #{selected.id}
            </DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Box><Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase" }}>Empleado</Typography><Typography sx={{ fontSize: 14 }}>{selected.empleado_nombre}</Typography></Box>
                <Box><Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase" }}>Cédula</Typography><Typography sx={{ fontSize: 14 }}>{selected.cedula}</Typography></Box>
                <Box><Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase" }}>Tipo</Typography><Chip label={TIPOS[selected.tipo] || selected.tipo} size="small" sx={{ borderRadius: "8px", fontSize: 12, bgcolor: "#F3F4F6" }} /></Box>
                <Box><Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase" }}>Estado</Typography><Chip label={selected.estado} size="small" sx={{ borderRadius: "8px", fontSize: 12, bgcolor: ESTADO_COLORS[selected.estado]?.bg, color: ESTADO_COLORS[selected.estado]?.color }} /></Box>
                <Box sx={{ gridColumn: "1/-1" }}><Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase" }}>Descripción</Typography><Typography sx={{ fontSize: 14 }}>{selected.descripcion || "—"}</Typography></Box>
                {selected.motivo_rechazo && (
                  <Box sx={{ gridColumn: "1/-1" }}><Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase" }}>Motivo de rechazo</Typography><Typography sx={{ fontSize: 14, color: "#DC2626" }}>{selected.motivo_rechazo}</Typography></Box>
                )}
              </Box>
              {selected.evidencia_url && (
                <Box>
                  <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", mb: 1 }}>Evidencia</Typography>
                  {isImage(selected.evidencia_url) ? (
                    <Box component="img" src={`http://localhost:5000${selected.evidencia_url}`} sx={{ maxWidth: "100%", maxHeight: 400, borderRadius: "12px", border: "1px solid #ECECEC" }} />
                  ) : (
                    <Button variant="outlined" startIcon={<FileText size={16} />} href={`http://localhost:5000${selected.evidencia_url}`} target="_blank"
                      sx={{ borderRadius: "8px", textTransform: "none" }}>Ver PDF</Button>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenDetalle(false)} sx={{ borderRadius: "8px", textTransform: "none", color: "#374151", bgcolor: "#F3F4F6" }}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Rechazo modal */}
      <Dialog open={!!rechazoModal} onClose={() => setRechazoModal(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Rechazar incidencia</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", mt: 1, mb: 0.5, textTransform: "uppercase" }}>Motivo del rechazo *</Typography>
          <TextField fullWidth multiline rows={3} value={motivoRechazo} onChange={e => setMotivoRechazo(e.target.value)}
            placeholder="Indica por qué se rechaza la incidencia..."
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }} />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setRechazoModal(null)} sx={{ borderRadius: "8px", textTransform: "none", color: "#374151", bgcolor: "#F3F4F6" }}>Cancelar</Button>
          <Button onClick={handleRechazar} disabled={!motivoRechazo.trim() || accionando} variant="contained" color="error"
            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600 }}>Rechazar</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}