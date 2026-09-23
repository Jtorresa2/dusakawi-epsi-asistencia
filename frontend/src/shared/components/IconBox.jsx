import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { COLORES } from "../constants/colores.js";

export default function IconBox({
  icon,
  color = COLORES.primario,
  size = 48,
  iconSize = 22,
  sx = {},
}) {
  const colorBase = color || COLORES.primario;

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "12px",
        bgcolor: alpha(colorBase, 0.12), // Equivale al 88% de aclarado
        color: colorBase,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        "& svg": { width: iconSize, height: iconSize },
        ...sx,
      }}
    >
      {icon}
    </Box>
  );
}