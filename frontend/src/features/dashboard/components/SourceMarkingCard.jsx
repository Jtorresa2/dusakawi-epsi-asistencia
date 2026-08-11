import { Paper, Typography, Box, Divider } from "@mui/material";
import { Smartphone, Monitor, Radio, Wifi } from "lucide-react";
import IconBox from "../../../shared/components/IconBox";
import { COLORES } from "../../../shared/constants/colores.js";

const INDICADORES = [
  { label: "Dispositivo", value: "12", icon: <Monitor />, color: COLORES.primario },
  { label: "Aplicación móvil", value: "8", icon: <Smartphone />, color: COLORES.primarioOscuro },
  { label: "Disp. activos", value: "15", icon: <Radio />, color: COLORES.primario },
  { label: "Disp. inactivos", value: "3", icon: <Wifi />, color: COLORES.danger },
];

export default function SourceMarkingCard() {
  return (
    <Paper elevation={0} sx={{
      p: 3, borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}`,
      height: 320,
      display: "flex", flexDirection: "column", justifyContent: "space-between",
    }}>
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: COLORES.textoPrimario }}>
        Fuente de marcado
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, flex: 1, alignContent: "center" }}>
        {INDICADORES.map((item) => (
          <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconBox icon={item.icon} color={item.color} size={40} iconSize={20} />
            <Box>
              <Typography sx={{ fontSize: 12, color: COLORES.textoTerciario, lineHeight: 1.2 }}>{item.label}</Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: COLORES.textoPrimario }}>{item.value}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
      <Box>
        <Divider sx={{ mb: 1.5 }} />
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography sx={{ fontSize: 12, color: COLORES.textoTerciario }}>Conectividad del sistema</Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.primario }}>98%</Typography>
        </Box>
        <Box sx={{ height: 6, borderRadius: 3, bgcolor: COLORES.fondoGris2, overflow: "hidden" }}>
          <Box sx={{ width: "98%", height: "100%", borderRadius: 3, bgcolor: COLORES.primario }} />
        </Box>
      </Box>
    </Paper>
  );
}
