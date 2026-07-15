import { useState, useEffect, useRef } from "react";
import {
  Box, Paper, Typography, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Menu,
} from "@mui/material";
import { Eye, Image, FileText, Search, Download, Upload, FileSignature, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import PageHeader from "../../../shared/components/PageHeader";
import PDFPreviewModal from "../../../shared/components/PDFPreviewModal";
import useRol from "../../../shared/hooks/useRol";
import { descargarPlantilla, aprobarConFirma } from "../incidencia.api";

const API = "/api";
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
  const [exportAnchor, setExportAnchor] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [pdfFirmadoPreviewUrl, setPdfFirmadoPreviewUrl] = useState(null);
  const [subiendoFirma, setSubiendoFirma] = useState(false);
  const firmaInputRef = useRef(null);
  const [plantillaPreviewUrl, setPlantillaPreviewUrl] = useState(null);
  const { puede, rol } = useRol();

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  const cargar = async () => {
    try {
      setCargando(true);
      const params = new URLSearchParams();
      if (filtroEstado) params.set("estado", filtroEstado);
      if (filtroTipo) params.set("tipo", filtroTipo);
      const res = await fetch(`${API}/incidencias?${params}`, { headers });
      const data = await res.json();
      setIncidencias(Array.isArray(data) ? data : []);
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

  const handleSubirFirma = async (id, file) => {
    if (!file) return;
    setSubiendoFirma(true);
    try {
      await aprobarConFirma(id, file);
      cargar();
    } catch (e) {
      alert(e.message || "Error al subir PDF firmado");
    } finally { setSubiendoFirma(false); }
  };

  const esTTHH = rol === "talento_humano";

  const pendientes = incidencias.filter(i => i.estado === "pendiente").length;
  const aprobadas = incidencias.filter(i => i.estado === "aprobado").length;
  const rechazadas = incidencias.filter(i => i.estado === "rechazado").length;

  const STATS = [
    { label: "Pendientes", value: pendientes, color: "#92400E", bg: "#FEF3C7" },
    { label: "Aprobadas", value: aprobadas, color: "#065F46", bg: "#D1FAE5" },
    { label: "Rechazadas", value: rechazadas, color: "#991B1B", bg: "#FEE2E2" },
  ];

  const isImage = (url) => /\.(jpg|jpeg|png|webp|gif)$/i.test(url);

  function exportarExcel() {
    setExportAnchor(null);
    const data = incidencias.map((r, i) => ({
      "#": i + 1,
      Empleado: `${r.nombre || ""} ${r.apellido || ""}`.trim(),
      Cédula: r.cedula || "",
      Tipo: TIPOS[r.tipo] || r.tipo,
      Descripción: r.descripcion || "",
      Fecha: r.fecha ? r.fecha.split("T")[0] : "",
      Estado: r.estado || "",
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Incidencias");
    XLSX.writeFile(wb, `Incidencias_${new Date().toISOString().split("T")[0]}.xlsx`);
  }

  function exportarPDF() {
    setExportAnchor(null);
    const params = new URLSearchParams();
    if (filtroEstado) params.set("estado", filtroEstado);
    if (filtroTipo) params.set("tipo", filtroTipo);
    const qs = params.toString();
    window.open(`/api/pdf/incidencias${qs ? `?${qs}` : ""}`, "_blank");
  }

  function vistaPreviaPDF() {
    setExportAnchor(null);
    const params = new URLSearchParams();
    if (filtroEstado) params.set("estado", filtroEstado);
    if (filtroTipo) params.set("tipo", filtroTipo);
    const qs = params.toString();
    setPdfPreviewUrl(`/api/pdf/incidencias${qs ? `?${qs}&preview=1` : "?preview=1"}`);
  }

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
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
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<Download size={16} />} onClick={(e) => setExportAnchor(e.currentTarget)}
          sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 2.5, color: "#6B7280", borderColor: "#ECECEC",
            "&:hover": { borderColor: "#1B5E20", color: "#1B5E20", bgcolor: "#F9FAFB" } }}>
          Exportar
        </Button>
        <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}
          transformOrigin={{ horizontal: "right", vertical: "top" }} anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{ sx: { borderRadius: "12px", mt: 0.5, minWidth: 150, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } }}>
          <MenuItem onClick={exportarExcel} sx={{ borderRadius: "8px", mx: 0.5, fontSize: 13, gap: 1 }}>
            <FileText size={16} /> Exportar Excel
          </MenuItem>
          <MenuItem onClick={vistaPreviaPDF} sx={{ borderRadius: "8px", mx: 0.5, fontSize: 13, gap: 1 }}>
            <FileText size={16} /> Vista previa PDF
          </MenuItem>
          <MenuItem onClick={exportarPDF} sx={{ borderRadius: "8px", mx: 0.5, fontSize: 13, gap: 1 }}>
            <Download size={16} /> Exportar PDF
          </MenuItem>
        </Menu>
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "16px", border: "1px solid #ECECEC" }}>
        <Table>
          <TableHead>
            <TableRow>
              {["Empleado", "Tipo", "Descripción", "Evidencia", "Fecha", "Estado", "PDF Firmado", "Acciones"].map(h => (
                <TableCell key={h} sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", borderBottom: "1px solid #F3F4F6" }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {cargando ? (
              <TableRow><TableCell colSpan={8} sx={{ textAlign: "center", py: 4, color: "#9CA3AF" }}>Cargando...</TableCell></TableRow>
            ) : incidencias.length === 0 ? (
              <TableRow><TableCell colSpan={8} sx={{ textAlign: "center", py: 4, color: "#9CA3AF" }}>No hay incidencias</TableCell></TableRow>
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
                    {inc.archivo_firmado ? (
                      <Button size="small" startIcon={<FileText size={14} />}
                        onClick={() => setPdfFirmadoPreviewUrl(inc.archivo_firmado)}
                        sx={{ borderRadius: "8px", textTransform: "none", fontSize: 11, color: "#065F46", minWidth: 0 }}>
                        Ver PDF
                      </Button>
                    ) : (
                      <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton size="small" onClick={() => setPlantillaPreviewUrl(`/api/pdf/incidencias/${inc.id}/plantilla?preview=1&token=${localStorage.getItem("token")}`)}
                        sx={{ borderRadius: "8px", color: "#6B7280" }}><Eye size={16} /></IconButton>
                      {inc.estado === "pendiente" && puede("incidencias", "aprobar") && (
                        <>
                          {esTTHH ? (
                            <>
                              <Button size="small" variant="outlined" startIcon={<Download size={14} />}
                                onClick={() => descargarPlantilla(inc.id)}
                                sx={{ borderRadius: "10px", textTransform: "none", fontSize: 11, fontWeight: 600, color: "#1B5E20", borderColor: "#1B5E20", px: 1.5, py: 0.5, minWidth: 0 }}>
                                Descargar
                              </Button>
                              <input type="file" accept=".pdf" ref={firmaInputRef}
                                onChange={(e) => { const f = e.target.files[0]; if (f) handleSubirFirma(inc.id, f); e.target.value = ""; }}
                                style={{ display: "none" }} />
                              <Button size="small" variant="contained" startIcon={<Upload size={14} />}
                                onClick={() => firmaInputRef.current?.click()} disabled={subiendoFirma}
                                sx={{ borderRadius: "10px", textTransform: "none", fontSize: 11, fontWeight: 600, bgcolor: "#16A34A", "&:hover": { bgcolor: "#15803D" }, px: 1.5, py: 0.5, minWidth: 0 }}>
                                {subiendoFirma ? "Subiendo..." : "Subir PDF"}
                              </Button>
                            </>
                          ) : (
                            <Button size="small" variant="contained" onClick={() => handleAprobar(inc.id)} disabled={accionando}
                              sx={{ borderRadius: "10px", textTransform: "none", fontSize: 12, fontWeight: 600, bgcolor: "#16A34A", "&:hover": { bgcolor: "#15803D" }, px: 2, py: 0.5, minWidth: 0 }}>
                              Aprobar
                            </Button>
                          )}
                          <Button size="small" variant="contained" onClick={() => setRechazoModal(inc.id)}
                            sx={{ borderRadius: "10px", textTransform: "none", fontSize: 12, fontWeight: 600, bgcolor: "#DC2626", "&:hover": { bgcolor: "#B91C1C" }, px: 2, py: 0.5, minWidth: 0 }}>
                            Rechazar
                          </Button>
                        </>
                      )}
                      {rol === "admin" && (
                        <IconButton size="small" onClick={async () => {
                          if (!confirm("¿Eliminar esta incidencia?")) return;
                          try {
                            await fetch(`/api/incidencias/${inc.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
                            cargar();
                          } catch {}
                        }} sx={{ borderRadius: "8px", color: "#DC2626" }}>
                          <Trash2 size={16} />
                        </IconButton>
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
                {selected.archivo_firmado && (
                  <Box sx={{ gridColumn: "1/-1" }}><Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", mb: 0.5 }}>PDF Firmado</Typography>
                    <Button variant="outlined" startIcon={<FileText size={16} />} href={selected.archivo_firmado} target="_blank"
                      sx={{ borderRadius: "8px", textTransform: "none", fontSize: 13 }}>Ver PDF firmado</Button>
                  </Box>
                )}
              </Box>
              {selected.evidencia_url && (
                <Box>
                  <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", mb: 1 }}>Evidencia</Typography>
                  {isImage(selected.evidencia_url) ? (
                    <Box component="img" src={selected.evidencia_url} sx={{ maxWidth: "100%", maxHeight: 400, borderRadius: "12px", border: "1px solid #ECECEC" }} />
                  ) : (
                    <Button variant="outlined" startIcon={<FileText size={16} />} href={selected.evidencia_url} target="_blank"
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

      {/* PDF preview */}
      <PDFPreviewModal
        open={Boolean(pdfPreviewUrl)}
        onClose={() => setPdfPreviewUrl(null)}
        url={pdfPreviewUrl}
        titulo="Vista previa - Incidencias"
      />

      {/* Plantilla PDF preview (ojito) */}
      <PDFPreviewModal
        open={Boolean(plantillaPreviewUrl)}
        onClose={() => setPlantillaPreviewUrl(null)}
        url={plantillaPreviewUrl}
        titulo="Plantilla de incidencia"
      />

      {/* PDF Firmado preview */}
      <PDFPreviewModal
        open={Boolean(pdfFirmadoPreviewUrl)}
        onClose={() => setPdfFirmadoPreviewUrl(null)}
        url={pdfFirmadoPreviewUrl}
        titulo="PDF Firmado"
      />
    </Box>
  );
}