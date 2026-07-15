import { useState } from "react";
import { Paper, Typography, Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { BarChart, Bar, XAxis, ResponsiveContainer } from "recharts";

const DATA_HORAS = [
  { dia: "Lun", valor: 4 },
  { dia: "Mar", valor: 6 },
  { dia: "Mié", valor: 3 },
  { dia: "Jue", valor: 7 },
  { dia: "Vie", valor: 5 },
  { dia: "Sáb", valor: 2 },
  { dia: "Dom", valor: 1 },
];

const DATA_EMPLEADOS = [
  { dia: "Lun", valor: 3 },
  { dia: "Mar", valor: 5 },
  { dia: "Mié", valor: 2 },
  { dia: "Jue", valor: 6 },
  { dia: "Vie", valor: 4 },
  { dia: "Sáb", valor: 2 },
  { dia: "Dom", valor: 1 },
];

export default function OvertimeBarChart({ data: _data }) {
  const [vista, setVista] = useState("horas");
  const chartData = vista === "horas" ? DATA_HORAS : DATA_EMPLEADOS;

  return (
    <Paper elevation={0} sx={{
      p: 3, borderRadius: "20px", border: "1px solid #ECECEC",
      height: 320,
      display: "flex", flexDirection: "column", justifyContent: "space-between",
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
          Horas extra
        </Typography>
        <ToggleButtonGroup
          value={vista}
          exclusive
          onChange={(_, v) => v && setVista(v)}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              fontSize: 11,
              fontWeight: 600,
              textTransform: "none",
              px: 1.2,
              py: 0.2,
              borderRadius: "8px !important",
              border: "1px solid #ECECEC !important",
              color: "#6B7280",
              "&.Mui-selected": { background: "#E8F5E9", color: "#1B5E20" },
            },
          }}
        >
          <ToggleButton value="horas">Horas</ToggleButton>
          <ToggleButton value="empleados">Empleados</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box sx={{ flex: 1, display: "flex", alignItems: "flex-end" }}>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={chartData} barCategoryGap="25%" margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
            <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <Bar dataKey="valor" radius={[6, 6, 0, 0]} fill="#7C3AED" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
