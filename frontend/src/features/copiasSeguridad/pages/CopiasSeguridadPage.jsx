import { Box, Typography, Paper } from "@mui/material";
import { COLORES } from "../../../shared/constants/colores.js";

export default function CopiasSeguridadPage() {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Typography sx={{ fontSize: 13, color: COLORES.textoMuted }}>Inicio / Gestión del sistema / Copias de Seguridad</Typography>
      <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}` }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: COLORES.textoPrimario }}>Copias de Seguridad</Typography>
        <Typography sx={{ fontSize: 13, color: COLORES.textoTerciario, mt: 1 }}>
          Esta sección está en construcción.
        </Typography>
      </Paper>
    </Box>
  );
}
