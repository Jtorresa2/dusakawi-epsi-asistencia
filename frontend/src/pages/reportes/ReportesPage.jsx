import { useState, useEffect } from "react";
import { Box, Paper, Typography, Button, Chip } from "@mui/material";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Search, Download, Filter } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/PageContainer";
import AppCard from "../../components/common/AppCard";

const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function ReportesPage() {
  const [tipoReporte, setTipoReporte] = useState("diario");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);

  const token = localStorage.getItem("token");

  const fetchReporte = async () => {
    try {
      setCargando(true);
      let url = "";
      if (tipoReporte === "diario") {
        url = `http://localhost:5000/api/reportes/diario?fecha=${fecha}`;
      } else {
        url = `http://localhost:5000/api/reportes/mensual?mes=${mes}&anio=${anio}`;
      }
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { fetchReporte(); }, []);

  const resumen = data?.resumen || {};
  const registros = data?.registros || [];
  const porDia = (data?.porDia || []).map(d => ({
    fecha: new Date(d.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }),
    Asistencia: Number(d.porcentaje_asistencia),
    Puntuales: Number(d.puntuales),
    Ausentes: Number(d.ausentes),
  }));
  const porArea = data?.porArea || [];

  const KPI_LIST = [
    { label: "TOTAL REGISTROS", value: resumen.total_registros || resumen.total || 0, color: "#1B5E20", bg: "#E8F5E9" },
    { label: "PUNTUALES", value: resumen.puntuales || 0, color: "#065F46", bg: "#D1FAE5" },
    { label: "TARDANZAS", value: resumen.tardanzas || 0, color: "#92400E", bg: "#FEF3C7" },
    { label: "AUSENTES", value: resumen.ausentes || 0, color: "#991B1B", bg: "#FEE2E2" },
    { label: "% ASISTENCIA", value: `${resumen.porcentaje_asistencia || 0}%`, color: "#1B5E20", bg: "#E8F5E9" },
    { label: "% PUNTUALIDAD", value: `${resumen.porcentaje_puntualidad || 0}%`, color: "#0284C7", bg: "#F0F9FF" },
    { label: "HORAS EXTRA", value: `${resumen.total_horas_extra || 0}h`, color: "#7C3AED", bg: "#FAF5FF" },
  ];

  const inputSx = {
    "& input, & select": {
      p: "8px 12px", borderRadius: "8px", border: "1px solid #E0E7EF",
      fontSize: "13px", outline: "none", color: "#111827", background: "#fff", width: "100%",
      boxSizing: "border-box", fontFamily: "inherit"
    }
  };

  return (
    <PageContainer>
      <PageHeader
        titulo="Reportes"
        subtitulo={`${tipoReporte === "diario" ? "Vista diaria" : "Vista mensual"} — ${registros.length} registros`}
      />

      {/* Filtros */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", border: "1px solid #ECECEC" }}>
        <Box sx={{ display: "flex", gap: 3, alignItems: "flex-end", flexWrap: "wrap" }}>
          {/* Tipo */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Tipo de reporte
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {["diario", "mensual"].map(t => (
                <Chip
                  key={t}
                  label={t.charAt(0).toUpperCase() + t.slice(1)}
                  onClick={() => setTipoReporte(t)}
                  sx={{
                    borderRadius: "8px", fontWeight: 600, fontSize: 13, cursor: "pointer", textTransform: "capitalize",
                    bgcolor: tipoReporte === t ? "#E8F5E9" : "#F3F4F6",
                    color: tipoReporte === t ? "#1B5E20" : "#6B7280",
                    border: tipoReporte === t ? "1px solid #1B5E20" : "1px solid transparent",
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Fecha */}
          {tipoReporte === "diario" ? (
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Fecha
              </Typography>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #E0E7EF", fontSize: "13px", outline: "none", color: "#111827" }} />
            </Box>
          ) : (
            <>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Mes
                </Typography>
                <select value={mes} onChange={e => setMes(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #E0E7EF", fontSize: "13px", outline: "none", color: "#111827", background: "#fff" }}>
                  {meses.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6B7280", mb: 0.5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Año
                </Typography>
                <select value={anio} onChange={e => setAnio(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #E0E7EF", fontSize: "13px", outline: "none", color: "#111827", background: "#fff" }}>
                  {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </Box>
            </>
          )}

          <Button variant="contained" startIcon={<Search size={16} />} onClick={fetchReporte}
            sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, fontWeight: 600, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" }, px: 3, py: 1 }}>
            Generar
          </Button>

          <Button variant="outlined" startIcon={<Download size={16} />} onClick={() => window.print()}
            sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, fontWeight: 600, color: "#6B7280", borderColor: "#E0E7EF", "&:hover": { borderColor: "#1B5E20", color: "#1B5E20" }, px: 3, py: 1, ml: "auto" }}>
            Exportar
          </Button>
        </Box>
      </Paper>

      {cargando ? (
        <Box sx={{ textAlign: "center", py: 6, color: "#9CA3AF" }}>
          <Typography>Generando reporte...</Typography>
        </Box>
      ) : !data ? null : (
        <>
          {/* KPIs */}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 2 }}>
            {KPI_LIST.map((k, i) => (
              <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid #ECECEC" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.05em" }}>{k.label}</Typography>
                  <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: k.bg, display: "flex", alignItems: "center", justifyContent: "center" }} />
                </Box>
                <Typography sx={{ fontSize: 28, fontWeight: 700, color: k.color, mt: 1 }}>{k.value}</Typography>
              </Paper>
            ))}
          </Box>

          {/* Charts — solo mensual */}
          {tipoReporte === "mensual" && porDia.length > 0 && (
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5 }}>
              <AppCard>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827", mb: 2 }}>% Asistencia diaria</Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={porDia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} unit="%" domain={[0,100]} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px" }} formatter={v => `${v}%`} />
                    <Line type="monotone" dataKey="Asistencia" stroke="#1B5E20" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </AppCard>
              <AppCard>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827", mb: 2 }}>Presentes vs Ausentes por día</Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={porDia} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="Puntuales" fill="#1B5E20" radius={[4,4,0,0]} />
                    <Bar dataKey="Ausentes" fill="#EF4444" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </AppCard>
            </Box>
          )}

          {/* Tabla por área — mensual */}
          {tipoReporte === "mensual" && porArea.length > 0 && (
            <AppCard>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827", mb: 2 }}>Asistencia por área</Typography>
              <Box sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr>
                      {["Área","Piso","Total","Puntuales","Tardanzas","Ausentes","% Asistencia"].map(h => (
                        <th key={h} style={{ textAlign: "left", fontWeight: 500, fontSize: "11px", color: "#9CA3AF", padding: "6px 8px", borderBottom: "1px solid #F3F4F6" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {porArea.map((a, i) => (
                      <tr key={i} onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "9px 8px", borderBottom: "1px solid #F9FAFB", color: "#111827", fontWeight: 500 }}>{a.area}</td>
                        <td style={{ padding: "9px 8px", borderBottom: "1px solid #F9FAFB", color: "#6B7280" }}>P{a.piso}</td>
                        <td style={{ padding: "9px 8px", borderBottom: "1px solid #F9FAFB", color: "#111827" }}>{a.total}</td>
                        <td style={{ padding: "9px 8px", borderBottom: "1px solid #F9FAFB", color: "#065F46" }}>{a.puntuales}</td>
                        <td style={{ padding: "9px 8px", borderBottom: "1px solid #F9FAFB", color: "#92400E" }}>{a.tardanzas}</td>
                        <td style={{ padding: "9px 8px", borderBottom: "1px solid #F9FAFB", color: "#991B1B" }}>{a.ausentes}</td>
                        <td style={{ padding: "9px 8px", borderBottom: "1px solid #F9FAFB" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box sx={{ flex: 1, height: 6, borderRadius: "3px", bgcolor: "#F3F4F6", overflow: "hidden" }}>
                              <Box sx={{ width: `${a.porcentaje_asistencia}%`, height: "100%", bgcolor: a.porcentaje_asistencia >= 90 ? "#1B5E20" : a.porcentaje_asistencia >= 75 ? "#F59E0B" : "#EF4444", borderRadius: "3px" }} />
                            </Box>
                            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#111827", minWidth: 35 }}>{a.porcentaje_asistencia}%</Typography>
                          </Box>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </AppCard>
          )}

          {/* Tabla detalle — diario */}
          {tipoReporte === "diario" && (
            <AppCard>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                  Detalle del {new Date(fecha + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </Typography>
                <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>{registros.length} registros</Typography>
              </Box>
              {registros.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6, color: "#9CA3AF" }}>
                  <Typography sx={{ fontSize: 13 }}>No hay registros para esta fecha</Typography>
                </Box>
              ) : (
                <Box sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr>
                        {["Empleado","Cédula","Área","Piso","Entrada","Salida","Horas","Extra","Tardanza","Marcación","Estado"].map(h => (
                          <th key={h} style={{ textAlign: "left", fontWeight: 500, fontSize: "11px", color: "#9CA3AF", padding: "6px 8px", borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {registros.map((r, i) => (
                        <tr key={i} onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "9px 8px", borderBottom: "1px solid #F9FAFB", color: "#111827", whiteSpace: "nowrap" }}>
                            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                              <Box sx={{ width: 24, height: 24, borderRadius: "50%", bgcolor: "#EDE9FE", color: "#5B21B6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 500 }}>
                                {r.empleado?.split(" ").map(n => n[0]).join("").slice(0,2)}
                              </Box>
                              {r.empleado}
                            </Box>
                          </td>
                          <td style={{ padding: "9px 8px", borderBottom: "1px solid #F9FAFB", color: "#6B7280" }}>{r.cedula}</td>
                          <td style={{ padding: "9px 8px", borderBottom: "1px solid #F9FAFB", color: "#6B7280" }}>{r.area}</td>
                          <td style={{ padding: "9px 8px", borderBottom: "1px solid #F9FAFB", color: "#6B7280", textAlign: "center" }}>P{r.piso}</td>
                          <td style={{ padding: "9px 8px", borderBottom: "1px solid #F9FAFB", color: "#374151" }}>
                            {r.fecha_hora_entrada ? new Date(r.fecha_hora_entrada).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td style={{ padding: "9px 8px", borderBottom: "1px solid #F9FAFB", color: "#374151" }}>
                            {r.fecha_hora_salida ? new Date(r.fecha_hora_salida).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td style={{ padding: "9px 8px", borderBottom: "1px solid #F9FAFB", color: "#374151" }}>{r.horas_trabajadas ? `${r.horas_trabajadas}h` : "—"}</td>
                          <td style={{ padding: "9px 8px", borderBottom: "1px solid #F9FAFB", color: r.horas_extra > 0 ? "#7C3AED" : "#9CA3AF" }}>{r.horas_extra > 0 ? `${r.horas_extra}h` : "—"}</td>
                          <td style={{ padding: "9px 8px", borderBottom: "1px solid #F9FAFB", color: r.minutos_tardanza > 0 ? "#D97706" : "#9CA3AF" }}>{r.minutos_tardanza > 0 ? `${r.minutos_tardanza} min` : "—"}</td>
                          <td style={{ padding: "9px 8px", borderBottom: "1px solid #F9FAFB", color: "#6B7280" }}>{r.tipo_marcacion || "—"}</td>
                          <td style={{ padding: "9px 8px", borderBottom: "1px solid #F9FAFB" }}>
                            <Chip label={r.estado} size="small" sx={{
                              borderRadius: "8px", fontSize: 10, fontWeight: 500,
                              bgcolor: r.estado === "puntual" ? "#D1FAE5" : r.estado === "tardanza" ? "#FEF3C7" : r.estado === "ausente" ? "#FEE2E2" : "#DBEAFE",
                              color: r.estado === "puntual" ? "#065F46" : r.estado === "tardanza" ? "#92400E" : r.estado === "ausente" ? "#991B1B" : "#1E40AF",
                            }} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              )}
            </AppCard>
          )}
        </>
      )}
    </PageContainer>
  );
}
