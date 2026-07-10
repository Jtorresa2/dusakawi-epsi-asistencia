import { Box, Paper, Typography, Chip, Switch, Button } from "@mui/material";
import { Link2, Database, Mail, Settings, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/PageContainer";

const MOCK = [
  { id: 1, nombre: "Base de datos central", descripcion: "Sincronización con BD principal de personal", icono: <Database size={24} />, estado: "Activo", ultima_sync: "2026-07-06 08:00", color: "#1565C0" },
  { id: 2, nombre: "Servicio de correo", descripcion: "Envío de notificaciones por correo electrónico", icono: <Mail size={24} />, estado: "Activo", ultima_sync: "2026-07-06 07:55", color: "#D97706" },
  { id: 3, nombre: "API biométrica", descripcion: "Conexión con dispositivos de huella digital", icono: <Link2 size={24} />, estado: "Inactivo", ultima_sync: "2026-07-05 18:00", color: "#DC2626" },
  { id: 4, nombre: "Gateway de pagos", descripcion: "Integración con plataforma de nómina", icono: <Settings size={24} />, estado: "Activo", ultima_sync: "2026-07-06 06:00", color: "#7C3AED" },
];

export default function IntegracionesPage() {
  return (
    <PageContainer>
      <PageHeader titulo="Integraciones" subtitulo="Servicios y conexiones del sistema" />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5 }}>
        {MOCK.map((item) => (
          <Paper key={item.id} elevation={0} sx={{ p: 3, borderRadius: "20px", border: "1px solid #ECECEC" }}>
            <Box sx={{ display: "flex", gap: 2.5 }}>
              <Box sx={{ width: 52, height: 52, borderRadius: "14px", bgcolor: `${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: item.color }}>
                {item.icono}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{item.nombre}</Typography>
                    <Typography sx={{ fontSize: 12, color: "#6B7280", mt: 0.3 }}>{item.descripcion}</Typography>
                  </Box>
                  <Chip
                    label={item.estado}
                    size="small"
                    sx={{
                      borderRadius: "8px", fontSize: 11, fontWeight: 600,
                      bgcolor: item.estado === "Activo" ? "#D1FAE5" : "#FEE2E2",
                      color: item.estado === "Activo" ? "#065F46" : "#991B1B",
                    }}
                    icon={item.estado === "Activo" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase" }}>Última sincronización</Typography>
                    <Typography sx={{ fontSize: 13, color: "#6B7280" }}>{item.ultima_sync}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Switch size="small" defaultChecked={item.estado === "Activo"} sx={{ "& .MuiSwitch-thumb": { bgcolor: "#1B5E20" }, "& .Mui-checked+.MuiSwitch-track": { bgcolor: "#4CAF50" } }} />
                    <Button size="small" startIcon={<RefreshCw size={14} />}
                      sx={{ borderRadius: "8px", textTransform: "none", fontSize: 12, color: "#6B7280", borderColor: "#E5E7EB" }} variant="outlined">
                      Sincronizar
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>
    </PageContainer>
  );
}