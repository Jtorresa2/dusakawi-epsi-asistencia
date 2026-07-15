import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, Tooltip } from "recharts";
import { Paper, Typography } from "@mui/material";

export default function AttendanceChart({ data = [] }) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #ECECEC", height: "100%" }}>
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827", mb: 2 }}>
        Asistencia semanal
      </Typography>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "rgba(0,0,0,.04)" }} contentStyle={{ borderRadius: 8, border: "1px solid #ECECEC", fontSize: 13 }} />
          <Bar dataKey="asistencia" radius={[6, 6, 0, 0]} fill="#2E7D32" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}
