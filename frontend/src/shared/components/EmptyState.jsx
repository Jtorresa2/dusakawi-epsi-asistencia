import { Box, Typography } from "@mui/material";
import { Inbox } from "lucide-react";
import IconBox from "./IconBox";
import { COLORES } from "../constants/colores.js";

export default function EmptyState({
  mensaje = "No hay registros."
}) {
  return (
    <Box
      sx={{
        py: 8,
        textAlign: "center",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <IconBox icon={<Inbox size={40} />} color={COLORES.textoSuave} size={80} iconSize={40} />
      </Box>

      <Typography
        mt={2}
        color="text.secondary"
      >
        {mensaje}
      </Typography>
    </Box>
  );
}
