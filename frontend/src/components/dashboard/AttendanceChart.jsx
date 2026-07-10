import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  Tooltip,
} from "recharts";

import { Paper, Typography } from "@mui/material";

const data = [
  { dia: "Lun", asistencia: 140 },
  { dia: "Mar", asistencia: 148 },
  { dia: "Mié", asistencia: 152 },
  { dia: "Jue", asistencia: 145 },
  { dia: "Vie", asistencia: 150 },
  { dia: "Sáb", asistencia: 70 },
  { dia: "Dom", asistencia: 20 },
];

export default function AttendanceChart() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        border: "1px solid #ECECEC",
        height: 380,
      }}
    >
      <Typography
        variant="h6"
        fontWeight={700}
        mb={2}
      >
        Asistencia semanal
      </Typography>

      <ResponsiveContainer
        width="100%"
        height="90%"
      >
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="4 4" />

          <XAxis dataKey="dia" />

          <Tooltip />

          <Bar
            dataKey="asistencia"
            radius={[8, 8, 0, 0]}
            fill="#2E7D32"
          />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}