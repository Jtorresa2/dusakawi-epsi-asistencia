import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Select, MenuItem,
  IconButton, Menu,
} from "@mui/material";
import { FileText, Search, Download, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import PageHeader from "../../../shared/components/PageHeader";
import PDFPreviewModal from "../../../shared/components/PDFPreviewModal";
import useRol from "../../../shared/hooks/useRol";

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
  const [exportAnchor, setExportAnchor] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const navigate = useNavigate();
  const { rol } = useRol();

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

  const pendientes = incidencias.filter(i => i.estado === "pendiente").length;
  const aprobadas = incidencias.filter(i => i.estado === "aprobado").length;
  const rechazadas = incidencias.filter(i => i.estado === "rechazado").length;

  const STATS = [
    { label: "Pendientes", value: pendientes, color: "#92400E", bg: "#FEF3C7" },
    { label: "Aprobadas", value: aprobadas, color: "#065F46", bg: "#D1FAE5" },
    { label: "Rechazadas", value: rechazadas, color: "#991B1B", bg: "#FEE2E2" },
  ];

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
              {["Empleado", "Tipo", "Fecha", "Estado", "Acciones"].map(h => (
                <TableCell key={h} sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", borderBottom: "1px solid #F3F4F6" }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {cargando ? (
              <TableRow><TableCell colSpan={5} sx={{ textAlign: "center", py: 4, color: "#9CA3AF" }}>Cargando...</TableCell></TableRow>
            ) : incidencias.length === 0 ? (
              <TableRow><TableCell colSpan={5} sx={{ textAlign: "center", py: 4, color: "#9CA3AF" }}>No hay incidencias</TableCell></TableRow>
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
                  <TableCell sx={{ fontSize: 13, color: "#6B7280" }}>{new Date(inc.fecha).toLocaleDateString("es-CO")}</TableCell>
                  <TableCell>
                    <Chip label={inc.estado} size="small" sx={{ borderRadius: "8px", fontSize: 11, fontWeight: 600, bgcolor: ec.bg, color: ec.color }} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Button size="small" onClick={() => navigate(`/incidencias/${inc.id}`)}
                        sx={{ borderRadius: "8px", textTransform: "none", fontSize: 11, color: "#1565C0", minWidth: 0 }}>
                        Ver detalle
                      </Button>
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

      <PDFPreviewModal
        open={Boolean(pdfPreviewUrl)}
        onClose={() => setPdfPreviewUrl(null)}
        url={pdfPreviewUrl}
        titulo="Vista previa - Incidencias"
      />
    </Box>
  );
}
