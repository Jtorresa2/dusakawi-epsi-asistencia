import { Box, Typography } from "@mui/material";
import { Construction } from "lucide-react";
import IconBox from "./IconBox";
import { COLORES } from "../constants/colores.js";

export default function PlaceholderPage({ title }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", p: 6, gap: 2 }}>
      <IconBox icon={<Construction />} color={COLORES.textoSuave} size={80} iconSize={38} />
      <Typography variant="h5" fontWeight={700} color={COLORES.primarioOscuro}>
        {title || "En construcción"}
      </Typography>
      <Typography color={COLORES.textoSuave}>
        Esta sección está en desarrollo.
      </Typography>
    </Box>
  );
}
