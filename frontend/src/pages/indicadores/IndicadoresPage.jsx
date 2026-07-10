import { useState } from "react";
import { Box, Paper, Typography, Chip } from "@mui/material";
import { Clock3, Clock, CheckCircle, XCircle, AlertTriangle, FileText } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/PageContainer";

const MOCK = {
  puntualidad: 94,
  presentes: 142,
  ausentes: 8,
  tardanzas: 11,
  horasExtras: 5,
  permisos: 4,
};

export default function IndicadoresPage() {
  const [data] = useState(MOCK);

  const KPI = [
    { title: "Puntualidad", value: `${data.puntualidad}%`, icon: <Clock3 />, color: "#2E7D32", bg: "#E8F5E9" },
    { title: "Presentes hoy", value: String(data.presentes), icon: <CheckCircle />, color: "#1565C0", bg: "#E3F2FD" },
    { title: "Ausentes hoy", value: String(data.ausentes), icon: <XCircle />, color: "#DC2626", bg: "#FEE2E2" },
    { title: "Tardanzas", value: String(data.tardanzas), icon: <AlertTriangle />, color: "#D97706", bg: "#FEF3C7" },
    { title: "Horas extra", value: String(data.horasExtras), icon: <Clock />, color: "#7C3AED", bg: "#FAF5FF" },
    { title: "Permisos", value: String(data.permisos), icon: <FileText />, color: "#0891B2", bg: "#E0F2FE" },
  ];

  return (
    <PageContainer>
      <PageHeader titulo="Indicadores" subtitulo="Métricas generales del personal — Hoy" />

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2.5 }}>
        {KPI.map((k, i) => (
          <Paper key={i} elevation={0} sx={{ p: 3, borderRadius: "20px", border: "1px solid #ECECEC", display: "flex", alignItems: "center", gap: 2.5 }}>
            <Box sx={{ width: 52, height: 52, borderRadius: "14px", bgcolor: k.bg, display: "flex", alignItems: "center", justifyContent: "center", color: k.color }}>
              {k.icon}
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" }}>{k.title}</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>
    </PageContainer>
  );
}