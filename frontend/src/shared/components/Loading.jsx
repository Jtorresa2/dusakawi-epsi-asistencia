import { Box, CircularProgress, Typography } from "@mui/material";

export default function Loading({
  texto = "Cargando..."
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        py: 6,
        gap: 2,
      }}
    >
      <CircularProgress color="success" />

      <Typography color="text.secondary">
        {texto}
      </Typography>
    </Box>
  );
}