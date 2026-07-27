import { Paper, Typography, Box } from "@mui/material";
import IconBox from "../../../shared/components/IconBox";

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
        p: 2.5,
        borderRadius: "20px",
        border: "1px solid #ECECEC",
        height: 150,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "all .25s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 8px 30px rgba(0,0,0,.07)",
        },
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography sx={{ color: "#6B7280", fontSize: 15, fontWeight: 600, letterSpacing: "0.02em" }}>
          {title}
        </Typography>
        <IconBox icon={icon} color={color} size={52} iconSize={24} />
      </Box>

      <Box>
        <Typography sx={{ fontSize: 44, fontWeight: 700, lineHeight: 1, color: "#111827" }}>
          {value}
        </Typography>
        <Typography sx={{ mt: 0.5, color: "#9CA3AF", fontSize: 14 }}>
          {subtitle}
        </Typography>
      </Box>
    </Paper>
  );
}
