import { Paper, Typography, Box } from "@mui/material";
import { PieChart } from "lucide-react";
import IconBox from "../../../shared/components/IconBox";
import { COLORES } from "../../../shared/constants/colores.js";

const COLORS = [COLORES.primarioOscuro, COLORES.danger, COLORES.warningOscuro, "#2563EB"];

// Donut en SVG nativo con métrica central de impacto visual
function Donut({ items, size = 170, thickness = 24 }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = items.reduce((s, i) => s + (Number(i.value) || 0), 0) || 1;
  const presentes = Number(items[0]?.value) || 0;
  const pctPresentes = Math.round((presentes / total) * 100);

  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Estadísticas de asistencia">
      {/* Fondo */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLORES.fondoGris2} strokeWidth={thickness} />
      {/* Segmentos desde las 12 en punto */}
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {items.map((item, i) => {
          const frac = (Number(item.value) || 0) / total;
          const dash = frac * c;
          const el = (
            <circle
              key={item.name}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={COLORS[i]}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += dash;
          return el;
        })}
      </g>
      {/* Métrica Central de impacto */}
      <text
        x={size / 2}
        y={size / 2 - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={COLORES.textoPrimario}
        fontSize="24"
        fontWeight="800"
        fontFamily="inherit"
      >
        {pctPresentes}%
      </text>
      <text
        x={size / 2}
        y={size / 2 + 16}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={COLORES.textoSuave}
        fontSize="10"
        fontWeight="600"
        textTransform="uppercase"
        letterSpacing="0.06em"
        fontFamily="inherit"
      >
        Asistencia
      </text>
    </svg>
  );
}

export default function DonutChart({ data = {} }) {
  const items = [
    { name: "Presentes", value: data.presentes ?? 0 },
    { name: "Ausentes", value: data.ausentes ?? 0 },
    { name: "Tardanzas", value: data.tardanzas ?? 0 },
    { name: "Novedades", value: data.permisos ?? 0 },
  ];
  const total = items.reduce((s, i) => s + (Number(i.value) || 0), 0);

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
          <IconBox icon={<PieChart />} color={COLORES.textoSecundario} size={32} iconSize={16} />
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>
            Estado de asistencia
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: COLORES.textoSuave }}>
          {total} Empleados
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: "center", justifyContent: "space-around", flex: 1, gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          {total === 0 ? (
            <Box sx={{ textAlign: "center", px: 2 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORES.textoPrimario, mb: 0.5 }}>
                Sin registros hoy
              </Typography>
              <Typography sx={{ fontSize: 11, color: COLORES.textoTerciario }}>
                Aún no hay marcaciones para hoy.
              </Typography>
            </Box>
          ) : (
            <Donut items={items} />
          )}
        </Box>

        {/* Leyenda enriquecida con badges y porcentajes */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: { sm: 160 } }}>
          {items.map((item, i) => {
            const pct = total > 0 ? Math.round((Number(item.value) / total) * 100) : 0;
            return (
              <Box
                key={item.name}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                  p: 0.6,
                  borderRadius: "8px",
                  bgcolor: `${COLORS[i]}08`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: COLORS[i], flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 500, color: COLORES.textoTerciario }}>
                    {item.name}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORES.textoPrimario }}>
                    {item.value}
                  </Typography>
                  <Typography sx={{ fontSize: 10.5, color: COLORES.textoSuave, fontWeight: 500 }}>
                    ({pct}%)
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
}
