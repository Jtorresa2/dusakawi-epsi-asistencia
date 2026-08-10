import { useState, useEffect } from "react";
import { Box, Paper, Typography, Chip, CircularProgress } from "@mui/material";
import { Clock, CalendarDays, Coffee, Star } from "lucide-react";
import IconBox from "../../../shared/components/IconBox";
import { obtenerMiHorario } from "../../horarios/horario.api";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const horaCorta = (v) => (v ? String(v).slice(0, 5) : "—");

const chipModalidad = (modalidad) =>
  modalidad === "flexible"
    ? { bgcolor: "#FFF7ED", color: "#D97706" }
    : { bgcolor: "#F0FDF4", color: "#1B5E20" };

export default function MiHorarioPage() {
  const [cargando, setCargando] = useState(true);
  const [data, setData] = useState(null);
  const hoy = DIAS[(new Date().getDay() + 6) % 7];

  useEffect(() => {
    (async () => {
      try {
        setData(await obtenerMiHorario());
      } catch {
        setData({ asignado: false });
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  if (cargando) {
    return (
      <Box sx={{ p: 3, bgcolor: "#F5F7F8", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress size={28} sx={{ color: "#1B5E20" }} />
      </Box>
    );
  }

  const horario = data?.asignado ? data.horario : null;
  const detalles = (horario?.detalles || [])
    .filter((d) => DIAS.includes(d.dia_semana))
    .sort((a, b) => DIAS.indexOf(a.dia_semana) - DIAS.indexOf(b.dia_semana));
  const esPorHoras = horario?.tipo_jornada === "por_horas";

  return (
    <Box sx={{ p: 3, bgcolor: "#F5F7F8", minHeight: "100vh" }}>
      <Typography sx={{ fontSize: 13, color: "#9CA3AF", mb: 3 }}>Inicio / Mi horario</Typography>

      {!horario ? (
        <Paper elevation={0} sx={{ borderRadius: "20px", border: "1px solid #ECECEC", p: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, textAlign: "center" }}>
          <IconBox icon={<Clock />} color="#1B5E20" size={72} iconSize={34} />
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>Sin horario asignado</Typography>
          <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>Solicita la asignación a tu administrador</Typography>
        </Paper>
      ) : (
        <>
          {/* Header del horario */}
          <Paper elevation={0} sx={{ borderRadius: "20px", border: "1px solid #ECECEC", p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <IconBox icon={<CalendarDays />} color="#2E7D32" size={52} iconSize={24} />
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{horario.nombre}</Typography>
                {horario.descripcion && (
                  <Typography sx={{ fontSize: 13, color: "#6B7280", mt: 0.3 }}>{horario.descripcion}</Typography>
                )}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip label={horario.modalidad === "flexible" ? "Flexible" : "Estricto"} size="small"
                  sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 11, ...chipModalidad(horario.modalidad) }} />
                <Chip label={esPorHoras ? "Por horas" : "Fija"} size="small"
                  sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 11, bgcolor: "#F3F4F6", color: "#6B7280" }} />
                {esPorHoras && horario.horas_esperadas && (
                  <Chip label={`Horas esperadas: ${parseFloat(horario.horas_esperadas)} h`} size="small"
                    sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 11, bgcolor: "#FFF7ED", color: "#D97706" }} />
                )}
                {horario.es_por_defecto && (
                  <Chip label="Por defecto" size="small" icon={<Star size={12} />}
                    sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 11, bgcolor: "#FEF3C7", color: "#92400E" }} />
                )}
                <Chip label={`Tol: ${horario.tolerancia_minutos ?? 0}/${horario.tolerancia_salida_minutos ?? 0} min`} size="small"
                  sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 11, bgcolor: "#F3F4F6", color: "#6B7280" }} />
              </Box>
            </Box>
          </Paper>

          {/* Grilla de días */}
          <Paper elevation={0} sx={{ borderRadius: "20px", border: "1px solid #ECECEC", overflow: "hidden" }}>
            <Box sx={{ bgcolor: "#F0FDF4", px: 3, py: 2 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1B5E20" }}>Detalle de días</Typography>
            </Box>
            {detalles.length === 0 ? (
              <Box sx={{ p: 6, textAlign: "center" }}>
                <Typography sx={{ fontSize: 14, color: "#9CA3AF" }}>Este horario no tiene días configurados.</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "1.6fr 1fr 1fr 1fr 1fr" }, gap: "1px", bgcolor: "#ECECEC" }}>
                {["Día", "Ent. mañana", "Sal. mañana", "Ent. tarde", "Sal. tarde"].map((h) => (
                  <Box key={h} sx={{ bgcolor: "#F9FAFB", px: 2.5, py: 1.5, fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", display: { xs: "none", sm: "block" } }}>{h}</Box>
                ))}
                {detalles.map((d) => {
                  const esHoy = d.dia_semana === hoy;
                  return (
                    <Box key={d.dia_semana}
                      sx={{ display: "contents" }}>
                      <Box sx={{ bgcolor: esHoy ? "#F0FDF4" : "#fff", px: 2.5, py: 1.8, display: "flex", alignItems: "center", gap: 1, fontWeight: 600, fontSize: 14, color: "#111827" }}>
                        {d.dia_semana}
                        {esHoy && (
                          <Chip label="Hoy" size="small"
                            sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: "#1B5E20", color: "#fff", borderRadius: "6px" }} />
                        )}
                      </Box>
                      {[d.hora_entrada_manana, d.hora_salida_manana, d.hora_entrada_tarde, d.hora_salida_tarde].map((v, i) => (
                        <Box key={i} sx={{ bgcolor: esHoy ? "#F0FDF4" : "#fff", px: 2.5, py: 1.8, display: "flex", alignItems: "center", fontSize: 14, fontWeight: 600, color: v ? "#2E7D32" : "#9CA3AF", fontVariantNumeric: "tabular-nums" }}>
                          {horaCorta(v)}
                        </Box>
                      ))}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>

          {/* Nota */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 3 }}>
            <Coffee size={16} style={{ color: "#9CA3AF" }} />
            <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
              {esPorHoras
                ? "Tu jornada se define por horas acumuladas. Consulta las horas esperadas y coordina con tu administrador."
                : "Los horarios pueden tener tolerancia en la entrada y en la salida. Verifica con tu administrador."}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}
