import { Box, Typography, Paper } from "@mui/material";

export default function CopiasSeguridadPage() {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>Inicio / Gestión del sistema / Copias de Seguridad</Typography>
      <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid #ECECEC" }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>Copias de Seguridad</Typography>
        <Typography sx={{ fontSize: 13, color: "#6B7280", mt: 1 }}>
          Esta sección está en construcción.
        </Typography>
      </Paper>
    </Box>
  );
}
