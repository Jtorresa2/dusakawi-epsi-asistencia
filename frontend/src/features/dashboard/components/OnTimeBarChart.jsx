import { Paper, Typography, Box, Tooltip } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import IconBox from "../../../shared/components/IconBox";
import { COLORES } from "../../../shared/constants/colores.js";

const DIA_MAP = {
  monday: "Lun", lunes: "Lun",
  tuesday: "Mar", martes: "Mar",
  wednesday: "Mié", miercoles: "Mié", miércoles: "Mié",
  thursday: "Jue", jueves: "Jue",
  friday: "Vie", viernes: "Vie",
  saturday: "Sáb", sabado: "Sáb", sábado: "Sáb",
  sunday: "Dom", domingo: "Dom",
};

export default function OnTimeBarChart({ data = [] }) {
  const chartData = Array.isArray(data) && data.length > 0
    ? data.map((d) => {
        const rawDia = String(d.dia || "").toLowerCase().trim();
        return {
          dia: DIA_MAP[rawDia] || rawDia.slice(0, 3) || "Día",
          Presentes: Number(d.presentes) || 0,
          Ausentes: Number(d.ausentes) || 0,
        };
      })
    : [
        { dia: "Lun", Presentes: 0, Ausentes: 0 },
        { dia: "Mar", Presentes: 0, Ausentes: 0 },
        { dia: "Mié", Presentes: 0, Ausentes: 0 },
        { dia: "Jue", Presentes: 0, Ausentes: 0 },
        { dia: "Vie", Presentes: 0, Ausentes: 0 },
      ];

  const sinDatos = chartData.every((d) => d.Presentes === 0 && d.Ausentes === 0);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: "20px",
        border: `1px solid ${COLORES.grisContorno}`,
        boxShadow: "0 4px 20px rgba(0,0,0,.04)",
        height: 320,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <IconBox icon={<TrendingUp />} color={COLORES.primario} size={32} iconSize={16} />
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>
            Tendencia semanal
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: COLORES.textoSuave }}>
          Últimos 7 días
        </Typography>
      </Box>

      {sinDatos ? (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
          <Typography sx={{ fontSize: 13, color: COLORES.textoTerciario, fontWeight: 500 }}>
            Sin marcaciones registradas en la semana
          </Typography>
          <Typography sx={{ fontSize: 11, color: COLORES.textoSuave }}>
            Los datos se sincronizarán cuando el dispositivo biométrico sincronice con el sistema
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, mt: 1, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="20%" margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="dia" tick={{ fontSize: 11, fill: COLORES.textoSuave }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: COLORES.textoSuave }} axisLine={false} tickLine={false} />
              <RechartsTooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: `1px solid ${COLORES.grisContorno}`,
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
              <Bar dataKey="Presentes" radius={[5, 5, 0, 0]} fill={COLORES.primarioOscuro} />
              <Bar dataKey="Ausentes" radius={[5, 5, 0, 0]} fill={COLORES.danger} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
}
