import { Paper, Typography, Box } from "@mui/material";
import IconBox from "../../../shared/components/IconBox";
import { COLORES } from "../../../shared/constants/colores.js";

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = COLORES.primarioOscuro,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: "20px",
        border: `1px solid ${COLORES.grisContorno}`,
        height: 150,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "all .25s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 8px 30px rgba(0,0,0,.07)",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography sx={{ color: COLORES.textoTerciario, fontSize: 15, fontWeight: 600, letterSpacing: "0.02em" }}>
          {title}
        </Typography>
        <IconBox icon={icon} color={color} size={52} iconSize={24} />
      </Box>

      <Box>
        <Typography sx={{ fontSize: 44, fontWeight: 700, lineHeight: 1, color: COLORES.textoPrimario }}>
          {value}
        </Typography>
        <Typography sx={{ mt: 0.5, color: COLORES.textoSuave, fontSize: 14 }}>
          {subtitle}
        </Typography>
      </Box>
    </Paper>
  );
}
