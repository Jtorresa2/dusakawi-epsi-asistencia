import { Box, Typography } from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";

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
      <InboxIcon
        sx={{
          fontSize: 70,
          color: "#C7C7C7",
        }}
      />

      <Typography
        mt={2}
        color="text.secondary"
      >
        {mensaje}
      </Typography>
    </Box>
  );
}