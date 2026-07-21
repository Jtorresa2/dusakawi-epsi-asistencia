import { useState, useEffect } from "react";
import { Box, Button, Paper, TextField, Typography, Chip } from "@mui/material";
import { Clock, Save, RotateCcw, RefreshCw } from "lucide-react";
import IconBox from "../../../shared/components/IconBox";
import { obtenerHorarios, actualizarHorario } from "../horario.api";

const CARD_IDS = [1, 6];
const DIAS_ORDEN = { Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6, Domingo: 7 };

export default function HorariosPage() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const esAdmin = usuario.rol === "admin";
  const [horarios, setHorarios] = useState([]);
  const [guardado, setGuardado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const data = await obtenerHorarios();
      const filtrados = data.filter((h) => CARD_IDS.includes(h.id));
      filtrados.forEach(h => {
        if (h.detalles) {
          h.detalles.sort((a, b) => (DIAS_ORDEN[a.dia_semana] || 99) - (DIAS_ORDEN[b.dia_semana] || 99));
        }
      });
      setHorarios(filtrados);
    } catch {
      setHorarios([]);
    } finally {
      setLoading(false);
    }
  }

  function actualizarSimple(horarioId, campo, valor) {
    setHorarios((prev) =>
      prev.map((h) =>
        h.id === horarioId && h.detalles?.length > 0
          ? { ...h, detalles: h.detalles.map((d) => ({ ...d, [campo]: valor })) }
          : h
      )
    );
  }

  async function guardar(horarioId) {
    const h = horarios.find((x) => x.id === horarioId);
    if (!h) return;
    try {
      await actualizarHorario(horarioId, {
        nombre: h.nombre,
        tolerancia_minutos: h.tolerancia_minutos,
        detalles: h.detalles.map((d) => ({
          id: d.id,
          dia_semana: d.dia_semana,
          hora_entrada_manana: d.hora_entrada_manana || null,
          hora_salida_manana: d.hora_salida_manana || null,
          hora_entrada_tarde: d.hora_entrada_tarde || null,
          hora_salida_tarde: d.hora_salida_tarde || null,
        })),
      });
      await cargar();
      setGuardado(horarioId);
      setTimeout(() => setGuardado(null), 2000);
    } catch {
      setGuardado("error");
      setTimeout(() => setGuardado(null), 2000);
    }
  }

  function restaurar() {
    cargar();
    setGuardado("restaurado");
    setTimeout(() => setGuardado(null), 2000);
  }

  const inputSx = { borderRadius: "10px", fontSize: 13, height: 40, py: 0, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#ECECEC" } };
  const labelSx = { borderRadius: "10px", fontSize: 13, height: 44, py: 0, bgcolor: "#F9FAFB", "& fieldset": { borderColor: "#ECECEC" } };

  if (loading) {
    return (
      <Box sx={{ p: 3, bgcolor: "#F5F7F8", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <RefreshCw size={24} style={{ animation: "spin 1s linear infinite" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: "#F5F7F8", minHeight: "100vh" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
        <Box>
          <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>Inicio / Configuración / Horarios</Typography>
        </Box>
        <Button variant="outlined" startIcon={<RotateCcw size={16} />} onClick={restaurar}
          sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 2.5, color: "#DC2626", borderColor: "#FECACA", "&:hover": { borderColor: "#DC2626", bgcolor: "#FEF2F2" } }}>
          Recargar
        </Button>
      </Box>

      {guardado === "restaurado" && (
        <Typography sx={{ fontSize: 13, color: "#6B7280", mb: 2, fontWeight: 500 }}>Datos recargados desde el servidor</Typography>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {horarios.map((h) => {
          const esCompleta = h.id === 1;
          const tieneAM = h.id === 2 || h.id === 6 || h.id === 3;
          const tienePM = h.id === 2 || h.id === 6 || h.id === 4;

          return (
            <Paper key={h.id} elevation={0} sx={{ borderRadius: "20px", border: "1px solid #ECECEC", p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                <IconBox icon={<Clock />} color="#2E7D32" size={48} iconSize={22} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{h.nombre}</Typography>
                </Box>
                <Chip label={`Tol: ${h.tolerancia_minutos} min`} size="small"
                  sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 11, bgcolor: "#F3F4F6", color: "#6B7280" }} />
              </Box>

              {esCompleta ? (
                /* JORNADA COMPLETA — tabla read-only */
                h.detalles?.length > 0 && (
                  <Box>
                    {/* Grupo Lunes-Martes */}
                    <Box sx={{ bgcolor: "#F0FDF4", borderRadius: "12px", p: 2, mb: 1.5 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1B5E20", mb: 1 }}>Lunes - Martes</Typography>
                      <Box sx={{ overflowX: "auto" }}>
                        <Box sx={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr 1fr 1fr", gap: 1.5, alignItems: "center" }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", px: 1 }}>Día</Typography>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", px: 1 }}>Entrada</Typography>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", px: 1 }}>Salida</Typography>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", px: 1 }}>Entrada</Typography>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", px: 1 }}>Salida</Typography>
                          {h.detalles.filter(d => d.dia_semana === "Lunes" || d.dia_semana === "Martes").map(d => (
                            <Box key={d.id} sx={{ display: "contents" }}>
                              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827", px: 1 }}>{d.dia_semana}</Typography>
                              <TextField type="time" value={d.hora_entrada_manana?.slice(0, 5) || ""} disabled slotProps={{ input: { sx: inputSx } }} />
                              <TextField type="time" value={d.hora_salida_manana?.slice(0, 5) || ""} disabled slotProps={{ input: { sx: inputSx } }} />
                              <TextField type="time" value={d.hora_entrada_tarde?.slice(0, 5) || ""} disabled slotProps={{ input: { sx: inputSx } }} />
                              <TextField type="time" value={d.hora_salida_tarde?.slice(0, 5) || ""} disabled
                                slotProps={{ input: { sx: { ...inputSx, "& input": { color: "#1B5E20", fontWeight: 700 } } } }} />
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </Box>

                    {/* Grupo Miércoles-viernes */}
                    <Box sx={{ bgcolor: "#FFF7ED", borderRadius: "12px", p: 2 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#D97706", mb: 1 }}>Miércoles - Viernes</Typography>
                      <Box sx={{ overflowX: "auto" }}>
                        <Box sx={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr 1fr 1fr", gap: 1.5, alignItems: "center" }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", px: 1 }}>Día</Typography>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", px: 1 }}>Entrada</Typography>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", px: 1 }}>Salida</Typography>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", px: 1 }}>Entrada</Typography>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", px: 1 }}>Salida</Typography>
                          {h.detalles.filter(d => d.dia_semana === "Miércoles" || d.dia_semana === "Jueves" || d.dia_semana === "Viernes").map(d => (
                            <Box key={d.id} sx={{ display: "contents" }}>
                              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827", px: 1 }}>{d.dia_semana}</Typography>
                              <TextField type="time" value={d.hora_entrada_manana?.slice(0, 5) || ""} disabled slotProps={{ input: { sx: inputSx } }} />
                              <TextField type="time" value={d.hora_salida_manana?.slice(0, 5) || ""} disabled slotProps={{ input: { sx: inputSx } }} />
                              <TextField type="time" value={d.hora_entrada_tarde?.slice(0, 5) || ""} disabled slotProps={{ input: { sx: inputSx } }} />
                              <TextField type="time" value={d.hora_salida_tarde?.slice(0, 5) || ""} disabled
                                slotProps={{ input: { sx: { ...inputSx, "& input": { color: "#D97706", fontWeight: 700 } } } }} />
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                )
              ) : (
                /* TARJETA SIMPLE — editable */
                <Box sx={{ display: "grid", gridTemplateColumns: (tieneAM && tienePM) ? "1fr 1fr" : "1fr", gap: 2.5 }}>
                  {tieneAM && (
                    <Box sx={{ bgcolor: "#F0FFF4", borderRadius: "12px", p: 2.5 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1B5E20", mb: 2 }}>Mañana</Typography>
                      <Box sx={{ display: "flex", gap: 1.5 }}>
                        <TextField label="Entrada" type="time" size="small"
                          value={h.detalles?.[0]?.hora_entrada_manana?.slice(0, 5) || ""}
                          disabled={!esAdmin}
                          onChange={(e) => actualizarSimple(h.id, "hora_entrada_manana", e.target.value + ":00")}
                          slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: labelSx } }} fullWidth />
                        <TextField label="Salida" type="time" size="small"
                          value={h.detalles?.[0]?.hora_salida_manana?.slice(0, 5) || ""}
                          disabled={!esAdmin}
                          onChange={(e) => actualizarSimple(h.id, "hora_salida_manana", e.target.value + ":00")}
                          slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: labelSx } }} fullWidth />
                      </Box>
                    </Box>
                  )}
                  {tienePM && (
                    <Box sx={{ bgcolor: "#FFF7ED", borderRadius: "12px", p: 2.5 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#D97706", mb: 2 }}>Tarde</Typography>
                      <Box sx={{ display: "flex", gap: 1.5 }}>
                        <TextField label="Entrada" type="time" size="small"
                          value={h.detalles?.[0]?.hora_entrada_tarde?.slice(0, 5) || ""}
                          disabled={!esAdmin}
                          onChange={(e) => actualizarSimple(h.id, "hora_entrada_tarde", e.target.value + ":00")}
                          slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: labelSx } }} fullWidth />
                        <TextField label="Salida" type="time" size="small"
                          value={h.detalles?.[0]?.hora_salida_tarde?.slice(0, 5) || ""}
                          disabled={!esAdmin}
                          onChange={(e) => actualizarSimple(h.id, "hora_salida_tarde", e.target.value + ":00")}
                          slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: labelSx } }} fullWidth />
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {esAdmin && !esCompleta && (
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                  <Button variant="contained" startIcon={<Save size={16} />} onClick={() => guardar(h.id)}
                    sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 40, px: 4, bgcolor: guardado === h.id ? "#16A34A" : "#1B5E20", "&:hover": { bgcolor: guardado === h.id ? "#15803D" : "#2E7D32" }, transition: "background .3s" }}>
                    {guardado === h.id ? "¡Guardado!" : "Guardar"}
                  </Button>
                </Box>
              )}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
