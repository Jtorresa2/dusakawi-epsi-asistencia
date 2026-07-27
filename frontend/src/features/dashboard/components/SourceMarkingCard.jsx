import { Paper, Typography, Box, Divider } from "@mui/material";
import { Smartphone, Monitor, Radio, Wifi } from "lucide-react";
import IconBox from "../../../shared/components/IconBox";

const INDICADORES = [
  { label: "Dispositivo", value: "12", icon: <Monitor />, color: "#2E7D32" },
  { label: "Aplicación móvil", value: "8", icon: <Smartphone />, color: "#1565C0" },
  { label: "Disp. activos", value: "15", icon: <Radio />, color: "#7C3AED" },
  { label: "Disp. inactivos", value: "3", icon: <Wifi />, color: "#DC2626" },
];

export default function SourceMarkingCard() {
  return (
    <Paper elevation={0} sx={{
      p: 3, borderRadius: "20px", border: "1px solid #ECECEC",
      height: 320,
      display: "flex", flexDirection: "column", justifyContent: "space-between",
    }}>
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
        Fuente de marcado
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, flex: 1, alignContent: "center" }}>
        {INDICADORES.map((item) => (
          <Box key={item.label} display="flex" alignItems="center" gap={1.5}>
            <IconBox icon={item.icon} color={item.color} size={40} iconSize={20} />
            <Box>
              <Typography sx={{ fontSize: 12, color: "#6B7280", lineHeight: 1.2 }}>{item.label}</Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{item.value}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
      <Box>
        <Divider sx={{ mb: 1.5 }} />
        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Typography sx={{ fontSize: 12, color: "#6B7280" }}>Conectividad del sistema</Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#2E7D32" }}>98%</Typography>
        </Box>
        <Box sx={{ height: 6, borderRadius: 3, bgcolor: "#F3F4F6", overflow: "hidden" }}>
          <Box sx={{ width: "98%", height: "100%", borderRadius: 3, bgcolor: "#2E7D32" }} />
        </Box>
      </Box>
    </Paper>
  );
}
