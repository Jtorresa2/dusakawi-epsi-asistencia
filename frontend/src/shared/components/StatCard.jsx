import { Paper, Typography, Box } from "@mui/material";

export default function StatCard({
  titulo,
  valor,
  icono,
  color = "#2e7d32",
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid #E5E7EB",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#fff",
        minHeight: 110,
        transition: ".25s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 8px 20px rgba(0,0,0,.08)",
        },
      }}
    >
      <Box>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {titulo}
        </Typography>

        <Typography
          variant="h4"
          fontWeight={700}
          mt={1}
        >
          {valor}
        </Typography>
      </Box>

      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: color,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#fff",
        }}
      >
        {icono}
      </Box>
    </Paper>
  );
}