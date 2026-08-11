import { Box, Typography, Button } from "@mui/material";
import { COLORES } from "../constants/colores.js";

export default function PageHeader({
  titulo,
  subtitulo,
  textoBoton,
  icono,
  onClick,
}) {
  return (
    <Box
      sx={{
        background: COLORES.fondoBlanco,
        borderRadius: 3,
        p: 3,
        mb: 3,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 10px rgba(0,0,0,.05)",
      }}
    >
      <Box>
        {titulo && (
          <Typography variant="h4" fontWeight={700} color={COLORES.primarioOscuro}>
            {titulo}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" mt={titulo ? 0.5 : 0}>
          {subtitulo}
        </Typography>
      </Box>

      {textoBoton && (
        <Button
          variant="contained"
          startIcon={icono}
          onClick={onClick}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.2,
            background: COLORES.primario,
            "&:hover": {
              background: COLORES.primarioOscuro,
            },
          }}
        >
          {textoBoton}
        </Button>
      )}
    </Box>
  );
}