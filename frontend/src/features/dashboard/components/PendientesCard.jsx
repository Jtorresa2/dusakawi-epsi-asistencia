import { Paper, Typography, Box } from "@mui/material";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import IconBox from "../../../shared/components/IconBox";
import { COLORES } from "../../../shared/constants/colores.js";

const STATS = [
  {
    label: "Pendientes",
    valueKey: "pendientes",
    icon: <Clock size={18} />,
    color: COLORES.primarioOscuro,
  },
  {
    label: "Aprobadas",
    valueKey: "aprobadas",
    icon: <CheckCircle2 size={18} />,
    color: COLORES.verdeTexto,
  },
  {
    label: "Rechazadas",
    valueKey: "rechazadas",
    icon: <XCircle size={18} />,
    color: COLORES.danger,
  },
];

export default function PendientesCard({ data = { pendientes: 2, aprobadas: 0, rechazadas: 0 } }) {
  const safe = data ?? { pendientes: 0, aprobadas: 0, rechazadas: 0 };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: "20px",
        border: `1px solid ${COLORES.grisContorno}`,
        bgcolor: COLORES.fondoBlanco,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
      }}
    >
      {/* TÍTULO DE LA TARJETA */}
      <Typography
        sx={{
          fontSize: 15,
          fontWeight: 600,
          color: COLORES.textoPrimario,
          mb: 1,
        }}
      >
        Incidencias pendientes
      </Typography>

      {/* CONTENEDOR EN FILAS LIMPIAS (MISMA ESTÉTICA QUE FUENTE DE MARCADO) */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flex: 1, justifyContent: "center" }}>
        {STATS.map((stat) => {
          const value = safe[stat.valueKey] ?? 0;
          return (
            <Box
              key={stat.label}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 1.2,
                px: 2,
                borderRadius: "14px",
                bgcolor: COLORES.fondoGris || "#F8FAFC",
                border: `1px solid ${COLORES.grisContorno || "#E2E8F0"}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <IconBox
                  icon={stat.icon}
                  color={stat.color}
                  size={36}
                  iconSize={18}
                />
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORES.textoTerciario,
                  }}
                >
                  {stat.label}
                </Typography>
              </Box>

              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: stat.color,
                }}
              >
                {value}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}