import { Box, Typography } from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";
import IconBox from "./IconBox";

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
      <Box display="flex" justifyContent="center" mb={2}>
        <IconBox icon={<InboxIcon />} color="#9CA3AF" size={80} iconSize={40} />
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
