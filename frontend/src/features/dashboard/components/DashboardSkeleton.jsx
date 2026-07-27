import { Box, Skeleton, Paper } from "@mui/material";

export default function DashboardSkeleton() {
  return (
    <Box sx={{ p: 0 }}>
      <Paper elevation={0} sx={{ height: 140, borderRadius: "22px", mb: 3, p: 5, background: "#F0FDF4" }}>
        <Skeleton variant="text" width={280} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={200} height={20} />
      </Paper>

      <Box sx={{ display: "flex", gap: 2.5, mb: 2.5 }}>
        {[...Array(6)].map((_, i) => (
          <Paper key={i} elevation={0} sx={{ flex: 1, height: 150, borderRadius: "20px", p: 2.5, border: "1px solid #ECECEC" }}>
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="40%" height={44} sx={{ mt: 3 }} />
            <Skeleton variant="text" width="30%" height={16} sx={{ mt: 0.5 }} />
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: "flex", gap: 2.5, mb: 2.5 }}>
        {[...Array(4)].map((_, i) => (
          <Paper key={i} elevation={0} sx={{ flex: 1, height: 220, borderRadius: "20px", p: 3, border: "1px solid #ECECEC" }}>
            <Skeleton variant="text" width="50%" height={20} sx={{ mb: 3 }} />
            <Skeleton variant="rectangular" width="100%" height="75%" sx={{ borderRadius: 2 }} />
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
