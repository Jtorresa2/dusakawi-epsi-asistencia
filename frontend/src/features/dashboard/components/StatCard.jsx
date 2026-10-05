import { Paper, Typography, Box } from "@mui/material";
import IconBox from "../../../shared/components/IconBox";
import { COLORES } from "../../../shared/constants/colores.js";

export default function StatCard({
  title,
  value,
  subtitle = "Hoy",
  icon,
  color = COLORES.primarioOscuro,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.75, sm: 2.2 },
        borderRadius: "18px",
        border: `1px solid ${color}22`,
        bgcolor: COLORES.fondoBlanco,
        minHeight: 120,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        transition: "all .25s ease",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          bgcolor: color,
          opacity: 0.85,
        },
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `0 10px 24px ${color}18`,
          borderColor: `${color}44`,
        },
      }}
    >
      {/* 1. TÍTULO Y SUBTÍTULO ENCABEZADO */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
        <Typography
          sx={{
            color: COLORES.textoSecundario,
            fontSize: { xs: 12, sm: 13 },
            fontWeight: 600,
            lineHeight: 1.25,
            letterSpacing: "0.01em",
          }}
        >
          {title}
        </Typography>

        <IconBox
          icon={icon}
          color={color}
          size={30}
          iconSize={15}
          sx={{
            bgcolor: `${color}14`,
            borderRadius: "9px",
            flexShrink: 0,
          }}
        />
      </Box>

      {/* 2.  VALOR Y BAGDE*/}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          mt: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: 24, sm: 28, md: 30 },
            fontWeight: 700,
            lineHeight: 1,
            color: COLORES.textoPrimario,
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </Typography>
        

        {subtitle && (
          <Box
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: "6px",
              bgcolor: `${color}10`,
              color: color,
              fontSize: 10.5,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {subtitle}
          </Box>
        )}
      </Box>
    </Paper>
  );
}