import { Paper, Typography, Box, Stack, Divider } from "@mui/material";

export default function AttendanceStats({ data = {} }) {
  const items = [
    { label: "Presentes", value: data.presentes ?? 0, color: "#2E7D32" },
    { label: "Ausentes", value: data.ausentes ?? 0, color: "#DC2626" },
    { label: "Tardanzas", value: data.tardanzas ?? 0, color: "#D97706" },
    { label: "Permisos", value: data.permisos ?? 0, color: "#0891B2" },
  ];
  const total = items.reduce((s, i) => s + i.value, 0);

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #ECECEC", height: "100%" }}>
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827", mb: 2 }}>
        Estadísticas de asistencia
      </Typography>
      <Stack spacing={1.5}>
        {items.map((item, i) => (
          <Box key={item.label}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontSize: 13, color: "#6B7280" }}>{item.label}</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: item.color }}>{item.value}</Typography>
            </Box>
            <Box
              sx={{
                mt: 0.5,
                height: 6,
                borderRadius: 3,
                bgcolor: "#F3F4F6",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: total > 0 ? `${(item.value / total) * 100}%` : "0%",
                  height: "100%",
                  borderRadius: 3,
                  bgcolor: item.color,
                  transition: "width .5s ease",
                }}
              />
            </Box>
            {i < items.length - 1 && <Divider sx={{ mt: 1 }} />}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
