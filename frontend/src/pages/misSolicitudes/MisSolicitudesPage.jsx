import { useState } from "react";
import { Box, Paper, Typography, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from "@mui/material";
import { FileText, Eye } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/PageContainer";

const MOCK = [
  { id: 1, tipo: "Permiso", motivo: "Cita médica", fecha: "2026-07-02", estado: "Aprobado", comentario: "Presentar certificado" },
  { id: 2, tipo: "Incapacidad", motivo: "Control médico", fecha: "2026-06-28", estado: "Pendiente" },
  { id: 3, tipo: "Permiso", motivo: "Asunto personal", fecha: "2026-06-25", estado: "Rechazado", comentario: "Sin justificación" },
  { id: 4, tipo: "Vacaciones", motivo: "Periodo de descanso", fecha: "2026-06-20", estado: "Aprobado" },
  { id: 5, tipo: "Permiso", motivo: "Diligencias bancarias", fecha: "2026-06-15", estado: "Aprobado" },
];

const ESTADO_COLORS = {
  Aprobado: { bg: "#D1FAE5", color: "#065F46" },
  Pendiente: { bg: "#FEF3C7", color: "#92400E" },
  Rechazado: { bg: "#FEE2E2", color: "#991B1B" },
};

export default function MisSolicitudesPage() {
  const [solicitudes] = useState(MOCK);

  return (
    <PageContainer>
      <PageHeader titulo="Mis solicitudes" subtitulo={`${solicitudes.length} solicitudes registradas`} />

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
        {[
          { label: "Total", value: solicitudes.length, color: "#1B5E20", bg: "#E8F5E9" },
          { label: "Aprobadas", value: solicitudes.filter(s => s.estado === "Aprobado").length, color: "#065F46", bg: "#D1FAE5" },
          { label: "Pendientes", value: solicitudes.filter(s => s.estado === "Pendiente").length, color: "#92400E", bg: "#FEF3C7" },
        ].map((s, i) => (
          <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid #ECECEC" }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" }}>{s.label}</Typography>
            <Typography sx={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</Typography>
          </Paper>
        ))}
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "16px", border: "1px solid #ECECEC" }}>
        <Table>
          <TableHead>
            <TableRow>
              {["Tipo", "Motivo", "Fecha", "Estado", "Comentario", "Acciones"].map(h => (
                <TableCell key={h} sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", borderBottom: "1px solid #F3F4F6" }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {solicitudes.map((s, i) => {
              const ec = ESTADO_COLORS[s.estado] || { bg: "#F3F4F6", color: "#374151" };
              return (
                <TableRow key={s.id} sx={{ "&:last-child td": { border: 0 }, "&:hover": { bgcolor: "#F9FAFB" } }}>
                  <TableCell>
                    <Chip label={s.tipo} size="small" sx={{ borderRadius: "8px", fontSize: 11, fontWeight: 600, bgcolor: "#F3F4F6", color: "#374151" }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: "#111827" }}>{s.motivo}</TableCell>
                  <TableCell sx={{ fontSize: 13, color: "#6B7280" }}>{new Date(s.fecha).toLocaleDateString("es-CO")}</TableCell>
                  <TableCell>
                    <Chip label={s.estado} size="small" sx={{ borderRadius: "8px", fontSize: 11, fontWeight: 600, bgcolor: ec.bg, color: ec.color }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: "#6B7280" }}>{s.comentario || "—"}</TableCell>
                  <TableCell>
                    <Button size="small" startIcon={<Eye size={14} />}
                      sx={{ borderRadius: "8px", textTransform: "none", fontSize: 12, color: "#6B7280" }}>
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </PageContainer>
  );
}