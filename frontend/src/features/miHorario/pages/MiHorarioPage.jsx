import { useState, useEffect } from "react";
import { Box, Paper, Typography, Chip, CircularProgress } from "@mui/material";
import { Clock, CalendarDays, Coffee, Star } from "lucide-react";
import IconBox from "../../../shared/components/IconBox";
import { obtenerMiHorario } from "../../horarios/horario.api";
import { COLORES } from "../../../shared/constants/colores.js";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const horaCorta = (v) => (v ? String(v).slice(0, 5) : "—");

const chipModalidad = (modalidad) =>
  modalidad === "flexible"
    ? { bgcolor: COLORES.warningFondo, color: COLORES.warningOscuro }
    : { bgcolor: COLORES.successClaro, color: COLORES.primarioOscuro };

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
      <Box sx={{ p: 3, bgcolor: COLORES.grisAzulado, minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress size={28} sx={{ color: COLORES.primarioOscuro }} />
      </Box>
    );
  }

  const horario = data?.asignado ? data.horario : null;
  const detalles = (horario?.detalles || [])
    .filter((d) => DIAS.includes(d.dia_semana))
    .sort((a, b) => DIAS.indexOf(a.dia_semana) - DIAS.indexOf(b.dia_semana));
  const esPorHoras = horario?.tipo_jornada === "por_horas";

  return (
    <Box sx={{ p: 3, bgcolor: COLORES.grisAzulado, minHeight: "100vh" }}>
      <Typography sx={{ fontSize: 13, color: COLORES.textoMuted, mb: 3 }}>Inicio / Mi horario</Typography>

      {!horario ? (
        <Paper elevation={0} sx={{ borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}`, p: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, textAlign: "center" }}>
          <IconBox icon={<Clock />} color={COLORES.primarioOscuro} size={72} iconSize={34} />
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: COLORES.textoPrimario }}>Sin horario asignado</Typography>
          <Typography sx={{ fontSize: 13, color: COLORES.textoSuave }}>Solicita la asignación a tu administrador</Typography>
        </Paper>
      ) : (
        <>
          {/* Header del horario */}
          <Paper elevation={0} sx={{ borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}`, p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <IconBox icon={<CalendarDays />} color={COLORES.primario} size={52} iconSize={24} />
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: COLORES.textoPrimario }}>{horario.nombre}</Typography>
                {horario.descripcion && (
                  <Typography sx={{ fontSize: 13, color: COLORES.textoTerciario, mt: 0.3 }}>{horario.descripcion}</Typography>
                )}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip label={horario.modalidad === "flexible" ? "Flexible" : "Estricto"} size="small"
                  sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 11, ...chipModalidad(horario.modalidad) }} />
                <Chip label={esPorHoras ? "Por horas" : "Fija"} size="small"
                  sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 11, bgcolor: COLORES.fondoGris2, color: COLORES.textoTerciario }} />
                {esPorHoras && horario.horas_esperadas && (
                  <Chip label={`Horas esperadas: ${parseFloat(horario.horas_esperadas)} h`} size="small"
                    sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 11, bgcolor: COLORES.warningFondo, color: COLORES.warningOscuro }} />
                )}
                {horario.es_por_defecto && (
                  <Chip label="Por defecto" size="small" icon={<Star size={12} />}
                    sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 11, bgcolor: COLORES.warningFondo, color: COLORES.warningOscuro }} />
                )}
                <Chip label={`Tol: ${horario.tolerancia_minutos ?? 0}/${horario.tolerancia_salida_minutos ?? 0} min`} size="small"
                  sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 11, bgcolor: COLORES.fondoGris2, color: COLORES.textoTerciario }} />
              </Box>
            </Box>
          </Paper>

          {/* Grilla de días */}
          <Paper elevation={0} sx={{ borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}`, overflow: "hidden" }}>
            <Box sx={{ bgcolor: COLORES.successClaro, px: 3, py: 2 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORES.primarioOscuro }}>Detalle de días</Typography>
            </Box>
            {detalles.length === 0 ? (
              <Box sx={{ p: 6, textAlign: "center" }}>
                <Typography sx={{ fontSize: 14, color: COLORES.textoSuave }}>Este horario no tiene días configurados.</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "1.6fr 1fr 1fr 1fr 1fr" }, gap: "1px", bgcolor: COLORES.grisContorno }}>
                {["Día", "Ent. mañana", "Sal. mañana", "Ent. tarde", "Sal. tarde"].map((h) => (
                  <Box key={h} sx={{ bgcolor: COLORES.fondoGris, px: 2.5, py: 1.5, fontSize: 11, fontWeight: 600, color: COLORES.textoTerciario, textTransform: "uppercase", display: { xs: "none", sm: "block" } }}>{h}</Box>
                ))}
                {detalles.map((d) => {
                  const esHoy = d.dia_semana === hoy;
                  return (
                    <Box key={d.dia_semana}
                      sx={{ display: "contents" }}>
                      <Box sx={{ bgcolor: esHoy ? COLORES.successClaro : COLORES.fondoBlanco, px: 2.5, py: 1.8, display: "flex", alignItems: "center", gap: 1, fontWeight: 600, fontSize: 14, color: COLORES.textoPrimario }}>
                        {d.dia_semana}
                        {esHoy && (
                          <Chip label="Hoy" size="small"
                            sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: COLORES.primarioOscuro, color: COLORES.fondoBlanco, borderRadius: "6px" }} />
                        )}
                      </Box>
                      {[d.hora_entrada_manana, d.hora_salida_manana, d.hora_entrada_tarde, d.hora_salida_tarde].map((v, i) => (
                        <Box key={i} sx={{ bgcolor: esHoy ? COLORES.successClaro : COLORES.fondoBlanco, px: 2.5, py: 1.8, display: "flex", alignItems: "center", fontSize: 14, fontWeight: 600, color: v ? COLORES.primario : COLORES.textoSuave, fontVariantNumeric: "tabular-nums" }}>
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
            <Coffee size={16} style={{ color: COLORES.textoSuave }} />
            <Typography sx={{ fontSize: 12, color: COLORES.textoSuave }}>
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
