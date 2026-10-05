import { Box, Skeleton, Paper } from "@mui/material";
import { COLORES } from "../../../shared/constants/colores.js";

export default function DashboardSkeleton() {
  return (
    <Box sx={{ p: 0 }}>
      <Paper elevation={0} sx={{ minHeight: 90, borderRadius: "20px", mb: 2.5, p: 3, background: COLORES.successClaro }}>
        <Skeleton variant="text" width={260} height={36} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width={180} height={18} />
      </Paper>

      {/* 5 KPIs */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", lg: "repeat(5, 1fr)" }, gap: 2, mb: 2.5 }}>
        {[...Array(5)].map((_, i) => (
          <Paper key={i} elevation={0} sx={{ height: 125, borderRadius: "20px", p: 2, border: `1px solid ${COLORES.grisContorno}` }}>
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="40%" height={40} sx={{ mt: 2 }} />
          </Paper>
        ))}
      </Box>

      {/* 2 Gráficos */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "5fr 7fr" }, gap: 2.5, mb: 2.5 }}>
        <Paper elevation={0} sx={{ height: 320, borderRadius: "20px", p: 3, border: `1px solid ${COLORES.grisContorno}` }}>
          <Skeleton variant="text" width="50%" height={24} sx={{ mb: 2 }} />
          <Skeleton variant="circular" width={160} height={160} sx={{ mx: "auto", my: 2 }} />
        </Paper>
        <Paper elevation={0} sx={{ height: 320, borderRadius: "20px", p: 3, border: `1px solid ${COLORES.grisContorno}` }}>
          <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={220} sx={{ borderRadius: 2 }} />
        </Paper>
      </Box>
    </Box>
  );
}
