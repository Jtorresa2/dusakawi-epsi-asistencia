import { Box, Paper, Typography, Chip, Divider } from "@mui/material";
import { Clock3, Users, ShieldCheck, Settings as SettingsIcon, Bell, Palette } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/PageContainer";

const SECTIONS = [
  {
    icon: <Clock3 size={20} />, title: "Horario laboral", color: "#1565C0", bg: "#E3F2FD",
    items: [
      { label: "Jornada", value: "Lunes a Jueves: 07:00-12:00, 14:00-18:00" },
      { label: "Viernes", value: "07:00-12:00, 14:00-17:00" },
      { label: "Tolerancia", value: "5 minutos por turno" },
    ],
  },
  {
    icon: <Users size={20} />, title: "Personal", color: "#2E7D32", bg: "#E8F5E9",
    items: [
      { label: "Total empleados", value: "150 aprox." },
      { label: "Áreas", value: "36 áreas activas" },
    ],
  },
  {
    icon: <ShieldCheck size={20} />, title: "Roles y permisos", color: "#7C3AED", bg: "#FAF5FF",
    items: [
      { label: "Administradores", value: "Acceso total" },
      { label: "Talento Humano", value: "Gestión de asistencia e incidencias" },
      { label: "Empleados", value: "Vista personal de asistencia" },
    ],
  },
  {
    icon: <Bell size={20} />, title: "Notificaciones", color: "#D97706", bg: "#FEF3C7",
    items: [
      { label: "Recordatorio marcación", value: "No configurado" },
      { label: "Alertas tardanza", value: "No configurado" },
    ],
  },
];

export default function ConfiguracionPage() {
  return (
    <PageContainer>
      <PageHeader titulo="Configuración" subtitulo="Ajustes generales del sistema" />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
        {SECTIONS.map((sec, i) => (
          <Paper key={i} elevation={0} sx={{ p: 3, borderRadius: "20px", border: "1px solid #ECECEC" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: sec.bg, display: "flex", alignItems: "center", justifyContent: "center", color: sec.color }}>
                {sec.icon}
              </Box>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{sec.title}</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {sec.items.map((item, j) => (
                <Box key={j} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontSize: 12, color: "#6B7280" }}>{item.label}</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{item.value}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        ))}
      </Box>
    </PageContainer>
  );
}