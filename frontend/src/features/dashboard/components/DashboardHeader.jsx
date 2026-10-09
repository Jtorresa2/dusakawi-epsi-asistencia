import { Paper, Typography, Box, Button } from "@mui/material";
import { CalendarDays as CalendarTodayIcon } from "lucide-react";
import { COLORES } from "../../../shared/constants/colores.js";

const FILTROS = ["Hoy", "Esta semana", "Este mes", "Último año"];

export default function DashboardHeader({ usuario, filtroActivo = "Hoy", onFiltroChange }) {
  const fecha = new Date().toLocaleDateString("es-CO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const rawNombre = usuario?.nombre || "Usuario";
  const nombreLimpio = rawNombre.toLowerCase().startsWith("administrador")
    ? "Administrador"
    : rawNombre;

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2.5,
        px: { xs: 2.5, md: 3.5 },
        py: { xs: 2, md: 2.2 },
        minHeight: 88,
        borderRadius: "20px",
        background: `linear-gradient(135deg, ${COLORES.primarioOscuro} 0%, ${COLORES.primario} 55%, ${COLORES.acento} 100%)`,
        color: COLORES.fondoBlanco,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 2,
        boxShadow: "0 8px 30px rgba(0, 71, 102, 0.16)",
      }}
    >
      {/* Saludo y subtítulo */}
      <Box>
        <Typography sx={{ fontSize: { xs: 22, md: 25 }, fontWeight: 700, lineHeight: 1.2 }}>
          Hola, {nombreLimpio} 👋
        </Typography>
        <Typography sx={{ mt: 0.3, fontSize: 13, opacity: 0.88, fontWeight: 400 }}>
          Resumen del control de asistencia
        </Typography>
      </Box>

      {/* Fecha y Control de Periodos Integrado */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: { xs: "flex-start", sm: "flex-end" }, gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, opacity: 0.9 }}>
          <CalendarTodayIcon size={14} />
          <Typography sx={{ fontSize: 12.5, fontWeight: 500, textTransform: "capitalize" }}>
            {fecha}
          </Typography>
        </Box>

        {/* Botones de periodo con estilo glassmorphism */}
        <Box
          sx={{
            display: "inline-flex",
            p: 0.4,
            borderRadius: "12px",
            bgcolor: "rgba(255, 255, 255, 0.14)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.22)",
            gap: 0.5,
          }}
        >
          {FILTROS.map((f) => {
            const activo = filtroActivo === f;
            return (
              <Button
                key={f}
                size="small"
                onClick={() => onFiltroChange?.(f)}
                sx={{
                  px: 1.5,
                  py: 0.35,
                  borderRadius: "8px",
                  fontSize: 11.5,
                  fontWeight: activo ? 700 : 500,
                  textTransform: "none",
                  minWidth: "auto",
                  color: activo ? COLORES.primarioOscuro : "#fff",
                  bgcolor: activo ? "#fff" : "transparent",
                  boxShadow: activo ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                  transition: "all .2s ease",
                  "&:hover": {
                    bgcolor: activo ? "#fff" : "rgba(255, 255, 255, 0.2)",
                  },
                }}
              >
                {f}
              </Button>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
}
