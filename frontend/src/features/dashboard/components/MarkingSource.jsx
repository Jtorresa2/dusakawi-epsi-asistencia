import { Paper, Typography, Box, Stack, Divider } from "@mui/material";

const MOCK_SOURCES = [
  { label: "Huella", value: 85, color: "#2E7D32" },
  { label: "Facial", value: 10, color: "#1565C0" },
  { label: "Tarjeta", value: 3, color: "#D97706" },
  { label: "Manual", value: 2, color: "#7C3AED" },
];

export default function MarkingSource() {
  const total = MOCK_SOURCES.reduce((s, i) => s + i.value, 0);

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #ECECEC", height: "100%" }}>
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827", mb: 2 }}>
        Fuente de marcación
      </Typography>
      <Stack spacing={1.5}>
        {MOCK_SOURCES.map((item, i) => (
          <Box key={item.label}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.3}>
              <Typography sx={{ fontSize: 13, color: "#6B7280" }}>{item.label}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{item.value}%</Typography>
            </Box>
            <Box sx={{ height: 6, borderRadius: 3, bgcolor: "#F3F4F6", overflow: "hidden" }}>
              <Box sx={{ width: `${item.value}%`, height: "100%", borderRadius: 3, bgcolor: item.color }} />
            </Box>
            {i < MOCK_SOURCES.length - 1 && <Divider sx={{ mt: 1 }} />}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
