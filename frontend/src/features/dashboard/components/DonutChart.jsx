import { Paper, Typography, Box } from "@mui/material";
import { COLORES } from "../../../shared/constants/colores.js";

const COLORS = [COLORES.primario, COLORES.danger, COLORES.warning, "#2563EB"];

// Donut en SVG nativo: sin recharts, sin mediciones, renderiza siempre.
function Donut({ items, size = 160, thickness = 26 }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = items.reduce((s, i) => s + (Number(i.value) || 0), 0) || 1;

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
            />
          );
          offset += dash;
          return el;
        })}
      </g>
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
    <Paper elevation={0} sx={{
      p: 3, borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}`,
      height: 320,
      display: "flex", flexDirection: "column", justifyContent: "space-between",
    }}>
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: COLORES.textoPrimario }}>
        Estadísticas de asistencia
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <Box sx={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {total === 0 ? (
            <Box sx={{ textAlign: "center", px: 2 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORES.textoPrimario, mb: 0.5 }}>
                Sin registros hoy
              </Typography>
              <Typography sx={{ fontSize: 12, color: COLORES.textoTerciario, lineHeight: 1.5 }}>
                Aún no hay marcaciones de asistencia para la fecha actual.
              </Typography>
            </Box>
          ) : (
            <Donut items={items} />
          )}
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
          {items.map((item, i) => (
            <Box key={item.name} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.6 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, minWidth: 0 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "3px", bgcolor: COLORS[i], flexShrink: 0 }} />
                <Typography sx={{ fontSize: 11, color: COLORES.textoTerciario, whiteSpace: "nowrap" }}>{item.name}</Typography>
              </Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORES.textoPrimario }}>{item.value}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}
