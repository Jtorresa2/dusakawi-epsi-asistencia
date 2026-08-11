import { Box } from "@mui/material";
import { COLORES } from "../constants/colores.js";

function lighten(hex, intensity = 0.88) {
  if (!hex) return COLORES.fondoGris2;
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const lr = Math.round(r + (255 - r) * intensity);
  const lg = Math.round(g + (255 - g) * intensity);
  const lb = Math.round(b + (255 - b) * intensity);
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

export default function IconBox({
  icon,
  color = COLORES.primario,
  size = 48,
  iconSize = 22,
}) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "12px",
        bgcolor: lighten(color),
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        "& svg": { width: iconSize, height: iconSize },
      }}
    >
      {icon}
    </Box>
  );
}
