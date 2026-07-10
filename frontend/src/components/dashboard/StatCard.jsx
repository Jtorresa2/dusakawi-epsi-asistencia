import { Paper, Typography, Box } from "@mui/material";

export default function StatCard({
  title,
  value,
 subtitle,
  icon,
  color = "#1B5E20",
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 5,
        border: "1px solid #ECECEC",
        transition: ".25s",
        cursor: "pointer",

        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: "0 15px 35px rgba(0,0,0,.08)",
        },
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography
          fontWeight={600}
          color="text.secondary"
        >
          {title}
        </Typography>

        <Box
          sx={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: `${color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
          }}
        >
          {icon}
        </Box>
      </Box>

      <Typography
        variant="h3"
        fontWeight={700}
        mt={3}
      >
        {value}
      </Typography>

      <Typography
        color="text.secondary"
        mt={1}
      >
        {subtitle}
      </Typography>

      <Typography
        mt={2}
        fontWeight={600}
        sx={{
          color,
          fontSize: 14,
        }}
      >
        ▲ +8% respecto al mes anterior
      </Typography>
    </Paper>
  );
}