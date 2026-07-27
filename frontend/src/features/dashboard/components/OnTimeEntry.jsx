import { Paper, Typography, Box } from "@mui/material";
import { Clock3 } from "lucide-react";
import IconBox from "../../../shared/components/IconBox";

export default function OnTimeEntry({ data = {} }) {
  const rate = data.puntualidad ?? 96;

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #ECECEC", height: "100%" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
          Entrada puntual
        </Typography>
        <IconBox icon={<Clock3 />} color="#2E7D32" size={40} iconSize={20} />
      </Box>

      <Box sx={{ position: "relative", display: "inline-flex", mb: 1 }}>
        <svg width={80} height={80} viewBox="0 0 36 36">
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5E7EB" strokeWidth={3} />
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#2E7D32" strokeWidth={3} strokeDasharray={`${rate}, 100`} />
        </svg>
        <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{rate}%</Typography>
        </Box>
      </Box>

      <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>de asistencias registradas hoy</Typography>
    </Paper>
  );
}
