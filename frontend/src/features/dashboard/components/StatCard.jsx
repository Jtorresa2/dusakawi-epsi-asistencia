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
        p: { xs: 1.5, sm: 2 },
        borderRadius: "20px",
        border: `1px solid ${COLORES.grisContorno}`,
        bgcolor: COLORES.fondoBlanco,
        minHeight: 125,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "all .25s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 8px 30px rgba(0,0,0,.06)",
        },
      }}
    >
      {/* 1. TÍTULO ARRIBA A TODO LO ANCHO */}
      <Box sx={{ width: "100%", minHeight: 32 }}>
        <Typography
          sx={{
            color: COLORES.textoPrimario,
            fontSize: { xs: 13, sm: 14, md: 15 },
            fontWeight: 600,
            lineHeight: 1.25,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </Typography>
      </Box>

      {/* 2. VALOR Y ÍCONO EN LA MITAD / ABAJO */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 0.5,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: { xs: 22, sm: 28, md: 32 },
              fontWeight: 700,
              lineHeight: 1.1,
              color: COLORES.textoPrimario,
            }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography
              sx={{
                mt: 0.3,
                color: COLORES.textoSuave,
                fontSize: { xs: 11, sm: 12 },
                fontWeight: 500,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        <IconBox
          icon={icon}
          color={color}
          size={32}
          iconSize={16}
          sx={{ flexShrink: 0 }}
        />
      </Box>
    </Paper>
  );
}