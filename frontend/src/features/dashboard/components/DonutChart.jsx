import { Paper, Typography, Box } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const COLORS = ["#2E7D32", "#DC2626", "#D97706", "#0891B2"];

export default function DonutChart({ data = {} }) {
  const items = [
    { name: "Presentes", value: data.presentes ?? 0 },
    { name: "Ausentes", value: data.ausentes ?? 0 },
    { name: "Tardanzas", value: data.tardanzas ?? 0 },
    { name: "Permisos", value: data.permisos ?? 0 },
  ];

  return (
    <Paper elevation={0} sx={{
      p: 3, borderRadius: "20px", border: "1px solid #ECECEC",
      height: 320,
      display: "flex", flexDirection: "column", justifyContent: "space-between",
    }}>
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
        Estadísticas de asistencia
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, flex: 1, alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie data={items} cx="50%" cy="50%" innerRadius={22} outerRadius={42} dataKey="value" stroke="none">
                {items.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <Box>
          {items.map((item, i) => (
            <Box key={item.name} display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Box display="flex" alignItems="center" gap={0.6}>
                <Box sx={{ width: 8, height: 8, borderRadius: "3px", bgcolor: COLORS[i], flexShrink: 0 }} />
                <Typography sx={{ fontSize: 11, color: "#6B7280", whiteSpace: "nowrap" }}>{item.name}</Typography>
              </Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>{item.value}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}
