import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const card = {
  background: "#fff", borderRadius: "16px",
  padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
};

const estadoBadge = {
  puntual:     { bg: "#d1fae5", color: "#065f46" },
  tardanza:    { bg: "#fef3c7", color: "#92400e" },
  ausente:     { bg: "#fee2e2", color: "#991b1b" },
  justificado: { bg: "#dbeafe", color: "#1e40af" },
};

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
        url = `/api/reportes/diario?fecha=${fecha}`;
      } else {
        url = `/api/reportes/mensual?mes=${mes}&anio=${anio}`;
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

  const inputStyle = {
    padding: "8px 12px", borderRadius: "8px",
    border: "1px solid #e5e7eb", fontSize: "13px",
    outline: "none", color: "#111827"
  };

  const resumen = data?.resumen || {};
  const registros = data?.registros || [];
  const porDia = (data?.porDia || []).map(d => ({
    fecha: new Date(d.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }),
    Asistencia: Number(d.porcentaje_asistencia),
    Puntuales: Number(d.puntuales),
    Ausentes: Number(d.ausentes),
  }));
  const porArea = data?.porArea || [];

  return (
    <div style={{ padding: "20px", fontFamily: "Inter, sans-serif" }}>

      {/* CONTROLES */}
      <div style={{ ...card, marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>

          {/* Tipo de reporte */}
          <div>
            <div style={{ fontSize: "12px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>Tipo de reporte</div>
            <div style={{ display: "flex", gap: "6px" }}>
              {["diario", "mensual"].map(t => (
                <button key={t} onClick={() => setTipoReporte(t)} style={{
                  padding: "7px 16px", borderRadius: "8px", border: "1px solid", cursor: "pointer", fontSize: "13px", fontWeight: 500,
                  borderColor: tipoReporte === t ? "#1b5e20" : "#e5e7eb",
                  background: tipoReporte === t ? "#f0fdf4" : "#fff",
                  color: tipoReporte === t ? "#1b5e20" : "#6b7280",
                  textTransform: "capitalize"
                }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Filtros según tipo */}
          {tipoReporte === "diario" ? (
            <div>
              <div style={{ fontSize: "12px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>Fecha</div>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inputStyle} />
            </div>
          ) : (
            <>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>Mes</div>
                <select value={mes} onChange={e => setMes(e.target.value)} style={inputStyle}>
                  {meses.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>Año</div>
                <select value={anio} onChange={e => setAnio(e.target.value)} style={inputStyle}>
                  {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </>
          )}

          <button onClick={fetchReporte} style={{
            padding: "8px 20px", borderRadius: "8px", border: "none",
            background: "#1b5e20", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer"
          }}>
            Generar reporte
          </button>

          <button
            style={{
              padding: "8px 16px", borderRadius: "8px", border: "1px solid #e5e7eb",
              background: "#fff", color: "#6b7280", fontSize: "13px", cursor: "pointer",
              marginLeft: "auto", transition: "all .15s"
            }}
            onMouseEnter={e => { e.target.style.background = "#1b5e20"; e.target.style.color = "#fff"; e.target.style.borderColor = "#1b5e20"; }}
            onMouseLeave={e => { e.target.style.background = "#fff"; e.target.style.color = "#6b7280"; e.target.style.borderColor = "#e5e7eb"; }}
            onClick={() => window.print()}
          >
            🖨️ Imprimir / Exportar
          </button>
        </div>
      </div>

      {cargando ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#9ca3af" }}>Generando reporte...</div>
      ) : !data ? null : (
        <>
          {/* RESUMEN MÉTRICAS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "16px" }}>
            {[
              { label: "TOTAL REGISTROS",   value: resumen.total_registros || resumen.total || 0, color: "#1b5e20", bg: "#f0fdf4", icon: "👥" },
              { label: "PUNTUALES",          value: resumen.puntuales || 0,           color: "#065f46", bg: "#d1fae5", icon: "✅" },
              { label: "TARDANZAS",          value: resumen.tardanzas || 0,           color: "#92400e", bg: "#fef3c7", icon: "⏰" },
              { label: "",           value: resumen.ausentes || 0,            color: "#991b1b", bg: "#fee2e2", icon: "🚫" },
              { label: "% ASISTENCIA",       value: `${resumen.porcentaje_asistencia || 0}%`, color: "#1b5e20", bg: "#f0fdf4", icon: "📊" },
              { label: "% PUNTUALIDAD",      value: `${resumen.porcentaje_puntualidad || 0}%`, color: "#0284c7", bg: "#f0f9ff", icon: "⏱" },
              { label: "HORAS EXTRA",        value: `${resumen.total_horas_extra || 0}h`, color: "#7c3aed", bg: "#faf5ff", icon: "🕒" },
            ].map((m, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: "14px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.05em" }}>{m.label}</span>
                  <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>{m.icon}</div>
                </div>
                <div style={{ fontSize: "28px", fontWeight: 700, color: m.color, marginTop: "8px" }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* GRÁFICAS — solo reporte mensual */}
          {tipoReporte === "mensual" && porDia.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div style={card}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>% Asistencia diaria</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={porDia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} unit="%" domain={[0,100]} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} formatter={v => v + "%"} />
                    <Line type="monotone" dataKey="Asistencia" stroke="#1b5e20" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={card}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>Presentes vs Ausentes por día</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={porDia} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="Puntuales" fill="#1b5e20" radius={[4,4,0,0]} />
                    <Bar dataKey="Ausentes"  fill="#ef4444" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TABLA POR ÁREA — reporte mensual */}
          {tipoReporte === "mensual" && porArea.length > 0 && (
            <div style={{ ...card, marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>Asistencia por área</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr>
                    {["Área","Piso","Total","Puntuales","Tardanzas","Ausentes","% Asistencia"].map(h => (
                      <th key={h} style={{ textAlign: "left", fontWeight: 500, fontSize: "11px", color: "#9ca3af", padding: "6px 8px", borderBottom: "1px solid #f3f4f6" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {porArea.map((a, i) => (
                    <tr key={i}
                      onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "9px 8px", borderBottom: "1px solid #f9fafb", color: "#111827", fontWeight: 500 }}>{a.area}</td>
                      <td style={{ padding: "9px 8px", borderBottom: "1px solid #f9fafb", color: "#6b7280" }}>P{a.piso}</td>
                      <td style={{ padding: "9px 8px", borderBottom: "1px solid #f9fafb", color: "#111827" }}>{a.total}</td>
                      <td style={{ padding: "9px 8px", borderBottom: "1px solid #f9fafb", color: "#065f46" }}>{a.puntuales}</td>
                      <td style={{ padding: "9px 8px", borderBottom: "1px solid #f9fafb", color: "#92400e" }}>{a.tardanzas}</td>
                      <td style={{ padding: "9px 8px", borderBottom: "1px solid #f9fafb", color: "#991b1b" }}>{a.ausentes}</td>
                      <td style={{ padding: "9px 8px", borderBottom: "1px solid #f9fafb" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "#f3f4f6", overflow: "hidden" }}>
                            <div style={{ width: `${a.porcentaje_asistencia}%`, height: "100%", background: a.porcentaje_asistencia >= 90 ? "#1b5e20" : a.porcentaje_asistencia >= 75 ? "#f59e0b" : "#ef4444", borderRadius: "3px" }} />
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#111827", minWidth: "35px" }}>{a.porcentaje_asistencia}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TABLA DETALLE — reporte diario */}
          {tipoReporte === "diario" && (
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
                  Detalle del {new Date(fecha + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </div>
                <span style={{ fontSize: "11px", color: "#9ca3af" }}>{registros.length} registros</span>
              </div>
              {registros.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af", fontSize: "13px" }}>No hay registros para esta fecha</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr>
                      {["Empleado","Cédula","Área","Piso","Entrada","Salida","Horas","Extra","Tardanza","Marcación","Estado"].map(h => (
                        <th key={h} style={{ textAlign: "left", fontWeight: 500, fontSize: "11px", color: "#9ca3af", padding: "6px 8px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {registros.map((r, i) => (
                      <tr key={i}
                        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "9px 8px", borderBottom: "1px solid #f9fafb", color: "#111827", whiteSpace: "nowrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "50%", background: "#ede9fe", color: "#5b21b6", fontSize: "9px", fontWeight: 500, marginRight: "6px", verticalAlign: "middle" }}>
                            {r.empleado?.split(" ").map(n => n[0]).join("").slice(0,2)}
                          </span>
                          {r.empleado}
                        </td>
                        <td style={{ padding: "9px 8px", borderBottom: "1px solid #f9fafb", color: "#6b7280" }}>{r.cedula}</td>
                        <td style={{ padding: "9px 8px", borderBottom: "1px solid #f9fafb", color: "#6b7280" }}>{r.area}</td>
                        <td style={{ padding: "9px 8px", borderBottom: "1px solid #f9fafb", color: "#6b7280", textAlign: "center" }}>P{r.piso}</td>
                        <td style={{ padding: "9px 8px", borderBottom: "1px solid #f9fafb", color: "#374151" }}>
                          {r.fecha_hora_entrada ? new Date(r.fecha_hora_entrada).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td style={{ padding: "9px 8px", borderBottom: "1px solid #f9fafb", color: "#374151" }}>
                          {r.fecha_hora_salida ? new Date(r.fecha_hora_salida).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td style={{ padding: "9px 8px", borderBottom: "1px solid #f9fafb", color: "#374151" }}>{r.horas_trabajadas ? `${r.horas_trabajadas}h` : "—"}</td>
                        <td style={{ padding: "9px 8px", borderBottom: "1px solid #f9fafb", color: r.horas_extra > 0 ? "#7c3aed" : "#9ca3af" }}>{r.horas_extra > 0 ? `${r.horas_extra}h` : "—"}</td>
                        <td style={{ padding: "9px 8px", borderBottom: "1px solid #f9fafb", color: r.minutos_tardanza > 0 ? "#d97706" : "#9ca3af" }}>{r.minutos_tardanza > 0 ? `${r.minutos_tardanza} min` : "—"}</td>
                        <td style={{ padding: "9px 8px", borderBottom: "1px solid #f9fafb", color: "#6b7280" }}>{r.tipo_marcacion || "—"}</td>
                        <td style={{ padding: "9px 8px", borderBottom: "1px solid #f9fafb" }}>
                          <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "8px", fontWeight: 500, background: estadoBadge[r.estado]?.bg, color: estadoBadge[r.estado]?.color }}>
                            {r.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
