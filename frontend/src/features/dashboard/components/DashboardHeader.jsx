import { Paper, Typography, Box } from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

export default function DashboardHeader({ usuario }) {
  const fecha = new Date().toLocaleDateString("es-CO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        px: 5,
        py: 3,
        height: 140,
        borderRadius: "22px",
        background: "linear-gradient(135deg, #1B5E20 0%, #388E3C 50%, #43A047 100%)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Box>
        <Typography sx={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2 }}>
          Hola, {usuario?.nombre || "Usuario"} 👋
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 15, opacity: 0.85 }}>
          Bienvenido al sistema de control de asistencia
        </Typography>
      </Box>
      <Box display="flex" alignItems="center" gap={1.5} sx={{ opacity: 0.8 }}>
        <CalendarTodayIcon sx={{ fontSize: 18 }} />
        <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{fecha}</Typography>
      </Box>
    </Paper>
  );
}
