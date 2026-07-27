import { Paper, Typography, Box } from "@mui/material";
import { Clock } from "lucide-react";
import IconBox from "../../../shared/components/IconBox";

export default function OvertimeStats({ data = {} }) {
  const horas = data.horasExtras ?? 6;

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #ECECEC", height: "100%" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
          Horas extra
        </Typography>
        <IconBox icon={<Clock />} color="#7C3AED" size={40} iconSize={20} />
      </Box>

      <Box display="flex" alignItems="baseline" gap={0.5}>
        <Typography sx={{ fontSize: 38, fontWeight: 700, color: "#111827", lineHeight: 1 }}>{horas}</Typography>
        <Typography sx={{ fontSize: 16, color: "#6B7280", fontWeight: 500 }}>horas</Typography>
      </Box>

      <Typography sx={{ fontSize: 13, color: "#9CA3AF", mt: 0.5 }}>
        {horas > 0 ? `${horas} empleados con horas extra hoy` : "Sin registros hoy"}
      </Typography>
    </Paper>
  );
}
