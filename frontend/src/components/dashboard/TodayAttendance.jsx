import { Paper, Typography, Stack } from "@mui/material";

export default function TodayAttendance() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        border: "1px solid #ECECEC",
        height: 350,
      }}
    >
      <Typography
        variant="h6"
        fontWeight={700}
        mb={3}
      >
        Asistencia de hoy
      </Typography>

      <Stack spacing={2}>
        <Typography>✅ Presentes: 138</Typography>

        <Typography>❌ Ausentes: 12</Typography>

        <Typography>⏰ Tardanzas: 8</Typography>

        <Typography>📄 Permisos: 5</Typography>
      </Stack>
    </Paper>
  );
}