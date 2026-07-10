import { Box, Typography, Button } from "@mui/material";

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
        background: "#fff",
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
        <Typography
          variant="h4"
          fontWeight={700}
          color="#1b5e20"
        >
          {titulo}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          mt={0.5}
        >
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
            background: "#2e7d32",
            "&:hover": {
              background: "#1b5e20",
            },
          }}
        >
          {textoBoton}
        </Button>
      )}
    </Box>
  );
}