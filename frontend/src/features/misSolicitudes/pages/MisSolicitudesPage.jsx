import { useState, useEffect } from "react";
import { Box, Paper, Typography, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from "@mui/material";
import { Calendar, CheckCircle, XCircle, Clock, Eye, Image, FileText, X } from "lucide-react";
import { COLORES } from "../../../shared/constants/colores.js";

const API = "/api";
const TIPOS = { falla_biometrica: "Falla biométrica", tardanza_justificada: "Tardanza justificada", otro: "Otro" };
const ESTADO_COLORS = {
  pendiente: { bg: COLORES.warningFondo, color: COLORES.warningOscuro },
  aprobado: { bg: COLORES.successFondo, color: COLORES.verdeTexto },
  rechazado: { bg: COLORES.dangerFondo, color: COLORES.dangerOscuro },
};

export default function MisSolicitudesPage() {
  const [incidencias, setIncidencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [selected, setSelected] = useState(null);
  const [openDetalle, setOpenDetalle] = useState(false);

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/incidencias`, { headers });
        const data = await res.json();
        setIncidencias(Array.isArray(data) ? data : []);
      } catch {} finally { setCargando(false); }
    })();
  }, []);

  const pendientes = incidencias.filter(i => i.estado === "pendiente").length;
  const aprobadas = incidencias.filter(i => i.estado === "aprobado").length;
  const rechazadas = incidencias.filter(i => i.estado === "rechazado").length;

  const isImage = (url) => /\.(jpg|jpeg|png|webp|gif)$/i.test(url);

  const KPI = [
    { label: "Pendientes", value: pendientes, icon: <Clock size={22} />, color: COLORES.warningOscuro, bg: COLORES.warningFondo },
    { label: "Aprobadas", value: aprobadas, icon: <CheckCircle size={22} />, color: COLORES.verdeTexto, bg: COLORES.successFondo },
    { label: "Rechazadas", value: rechazadas, icon: <XCircle size={22} />, color: COLORES.dangerOscuro, bg: COLORES.dangerFondo },
  ];

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3, maxWidth: 1400, mx: "auto", width: "100%", boxSizing: "border-box" }}>
      <Typography sx={{ fontSize: 13, color: COLORES.textoMuted }}>
                Inicio / Gestión / Mis solicitudes
      </Typography>
      
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2.5 }}>
        {KPI.map((k, i) => (
          <Paper key={i} elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", alignItems: "center", gap: 2.5 }}>
            <Box sx={{ width: 52, height: 52, borderRadius: "14px", bgcolor: k.bg, display: "flex", alignItems: "center", justifyContent: "center", color: k.color }}>
              {k.icon}
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase" }}>{k.label}</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}` }}>
        <Table>
          <TableHead>
            <TableRow>
              {["Tipo", "Descripción", "Fecha", "Estado", "Acciones"].map(h => (
                <TableCell key={h} sx={{ fontSize: 11, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase", borderBottom: `1px solid ${COLORES.fondoGris2}` }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {cargando ? (
              <TableRow><TableCell colSpan={5} sx={{ textAlign: "center", py: 4, color: COLORES.textoSuave }}>Cargando...</TableCell></TableRow>
            ) : incidencias.length === 0 ? (
              <TableRow><TableCell colSpan={5} sx={{ textAlign: "center", py: 4, color: COLORES.textoSuave }}>No has reportado incidencias aún</TableCell></TableRow>
            ) : incidencias.map((inc) => {
              const ec = ESTADO_COLORS[inc.estado] || { bg: COLORES.fondoGris2, color: COLORES.textoSecundario };
              return (
                <TableRow key={inc.id} sx={{ "&:last-child td": { border: 0 }, "&:hover": { bgcolor: COLORES.fondoGris } }}>
                  <TableCell>
                    <Chip label={TIPOS[inc.tipo] || inc.tipo} size="small" sx={{ borderRadius: "8px", fontSize: 11, fontWeight: 600, bgcolor: COLORES.fondoGris2, color: COLORES.textoSecundario }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: COLORES.textoTerciario, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inc.descripcion}</TableCell>
                  <TableCell sx={{ fontSize: 13, color: COLORES.textoTerciario }}>{new Date(inc.fecha).toLocaleDateString("es-CO")}</TableCell>
                  <TableCell>
                    <Chip label={inc.estado} size="small" sx={{ borderRadius: "8px", fontSize: 11, fontWeight: 600, bgcolor: ec.bg, color: ec.color }} />
                  </TableCell>
                  <TableCell>
                    <Box onClick={() => { setSelected(inc); setOpenDetalle(true); }}
                      sx={{ width: 32, height: 32, borderRadius: "10px", bgcolor: COLORES.primarioClaro, display: "flex", alignItems: "center", justifyContent: "center", color: COLORES.primario, cursor: "pointer", transition: "all 0.2s", "&:hover": { bgcolor: COLORES.primarioClaro2 } }}>
                      <Eye size={15} />
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDetalle} onClose={() => setOpenDetalle(false)} maxWidth="md" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px", maxHeight: "90vh", overflow: "auto" } } }}>
        {selected && (
          <>
            <DialogTitle sx={{ fontSize: 16, fontWeight: 700, color: COLORES.textoPrimario }}>
              Incidencia #{selected.id}
              <IconButton aria-label="Cerrar" onClick={() => setOpenDetalle(false)} size="small" sx={{ position: "absolute", top: 8, right: 8, color: COLORES.textoSuave, "&:hover": { bgcolor: COLORES.fondoGris2 } }}>
                <X size={18} />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Box><Typography sx={{ fontSize: 11, color: COLORES.textoSuave, fontWeight: 600, textTransform: "uppercase" }}>Tipo</Typography><Chip label={TIPOS[selected.tipo] || selected.tipo} size="small" sx={{ borderRadius: "8px", fontSize: 12, bgcolor: COLORES.fondoGris2 }} /></Box>
                <Box><Typography sx={{ fontSize: 11, color: COLORES.textoSuave, fontWeight: 600, textTransform: "uppercase" }}>Fecha</Typography><Typography sx={{ fontSize: 14 }}>{new Date(selected.fecha).toLocaleDateString("es-CO")}</Typography></Box>
                <Box><Typography sx={{ fontSize: 11, color: COLORES.textoSuave, fontWeight: 600, textTransform: "uppercase" }}>Estado</Typography><Chip label={selected.estado} size="small" sx={{ borderRadius: "8px", fontSize: 12, bgcolor: ESTADO_COLORS[selected.estado]?.bg, color: ESTADO_COLORS[selected.estado]?.color, fontWeight: 600 }} /></Box>
                <Box><Typography sx={{ fontSize: 11, color: COLORES.textoSuave, fontWeight: 600, textTransform: "uppercase" }}>Revisado por</Typography><Typography sx={{ fontSize: 14 }}>{selected.revisado_por ? `#${selected.revisado_por}` : "—"}</Typography></Box>
                <Box sx={{ gridColumn: "1/-1" }}><Typography sx={{ fontSize: 11, color: COLORES.textoSuave, fontWeight: 600, textTransform: "uppercase" }}>Descripción</Typography><Typography sx={{ fontSize: 14 }}>{selected.descripcion || "—"}</Typography></Box>
                {selected.motivo_rechazo && (
                  <Box sx={{ gridColumn: "1/-1" }}><Typography sx={{ fontSize: 11, color: COLORES.textoSuave, fontWeight: 600, textTransform: "uppercase" }}>Motivo de rechazo</Typography><Typography sx={{ fontSize: 14, color: COLORES.danger }}>{selected.motivo_rechazo}</Typography></Box>
                )}
              </Box>
              {selected.evidencia_url && (
                <Box>
                  <Typography sx={{ fontSize: 11, color: COLORES.textoSuave, fontWeight: 600, textTransform: "uppercase", mb: 1 }}>Evidencia</Typography>
                  {isImage(selected.evidencia_url) ? (
                    <Box component="img" src={selected.evidencia_url} sx={{ maxWidth: "100%", maxHeight: 400, borderRadius: "12px", border: `1px solid ${COLORES.grisContorno}` }} />
                  ) : (
                    <Button variant="outlined" startIcon={<FileText size={16} />} href={selected.evidencia_url} target="_blank"
                      sx={{ borderRadius: "8px", textTransform: "none" }}>Ver PDF</Button>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenDetalle(false)} sx={{ borderRadius: "8px", textTransform: "none", color: COLORES.textoSecundario, bgcolor: COLORES.fondoGris2 }}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
