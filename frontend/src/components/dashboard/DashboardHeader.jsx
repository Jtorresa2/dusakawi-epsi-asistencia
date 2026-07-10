import { Paper, Typography, Box, Avatar } from "@mui/material";
import WavingHandIcon from "@mui/icons-material/WavingHand";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

export default function DashboardHeader({ usuario }) {

  const fecha = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 4,
        p: 4,
        borderRadius: 5,
        border: "1px solid #ECECEC",
        background:
          "linear-gradient(135deg,#1B5E20 0%, #2E7D32 100%)",
        color: "#fff",
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            sx={{
              width: 58,
              height: 58,
              bgcolor: "rgba(255,255,255,.15)",
            }}
          >
            <WavingHandIcon />
          </Avatar>

          <Box>
            <Typography
              variant="h4"
              fontWeight={700}
            >
              Hola, {usuario?.nombre || "Usuario"} 👋
            </Typography>

            <Typography
              sx={{
                opacity: .9,
                mt: .5,
              }}
            >
              Bienvenido al sistema de control de asistencia
            </Typography>
          </Box>
        </Box>

        <Box
          display="flex"
          alignItems="center"
          gap={1}
        >
          <CalendarTodayIcon />

          <Typography fontWeight={500}>
            {fecha}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}