import { Paper, Typography, Box } from "@mui/material";
import { BarChart, Bar, XAxis, ResponsiveContainer } from "recharts";

const DATA = [
  { dia: "Lun", min: 12 },
  { dia: "Mar", min: 8 },
  { dia: "Mié", min: 15 },
  { dia: "Jue", min: 10 },
  { dia: "Vie", min: 6 },
  { dia: "Sáb", min: 3 },
  { dia: "Dom", min: 1 },
];

export default function OnTimeBarChart({ data: _data }) {
  return (
    <Paper elevation={0} sx={{
      p: 3, borderRadius: "20px", border: "1px solid #ECECEC",
      height: 320,
      display: "flex", flexDirection: "column", justifyContent: "space-between",
    }}>
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
        Entrada puntual (min)
      </Typography>
      <Box sx={{ flex: 1, display: "flex", alignItems: "flex-end" }}>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={DATA} barCategoryGap="25%" margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
            <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <Bar dataKey="min" radius={[6, 6, 0, 0]} fill="#43A047" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
