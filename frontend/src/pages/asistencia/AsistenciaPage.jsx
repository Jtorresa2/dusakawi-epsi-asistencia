import { useState, useEffect } from "react";

const estadoBadge = {
  puntual:     { bg: "#d1fae5", color: "#065f46" },
  tardanza:    { bg: "#fef3c7", color: "#92400e" },
  ausente:     { bg: "#fee2e2", color: "#991b1b" },
  justificado: { bg: "#dbeafe", color: "#1e40af" },
};

const marcacionIcon = {
  huella:  "👆",
  facial:  "🤳",
  tarjeta: "💳",
  manual:  "✍️",
};

const card = {
  background: "#fff", borderRadius: "16px",
  padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
};

export default function AsistenciaPage() {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ fecha: "", area: "", piso: "", estado: "" });
  const [modalManual, setModalManual] = useState(false);
  const [modalJustificar, setModalJustificar] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [formManual, setFormManual] = useState({
    empleado_id: "", fecha: new Date().toISOString().split("T")[0],
    fecha_hora_entrada: "", fecha_hora_salida: "", tipo_marcacion: "manual", observacion: ""
  });
  const [observacion, setObservacion] = useState("");
  const [resumen, setResumen] = useState({ total: 0, puntuales: 0, tardanzas: 0, ausentes: 0, justificados: 0 });

  const token = localStorage.getItem("token");

  const fetchRegistros = async () => {
    try {
      setCargando(true);
      const params = new URLSearchParams();
      if (filtros.fecha)  params.append("fecha",  filtros.fecha);
      if (filtros.area)   params.append("area",   filtros.area);
      if (filtros.piso)   params.append("piso",   filtros.piso);
      if (filtros.estado) params.append("estado", filtros.estado);

      const res = await fetch(`http://localhost:5000/api/asistencia?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRegistros(data.registros || []);

      const r = data.registros || [];
      setResumen({
        total:       r.length,
        puntuales:   r.filter(x => x.estado === "puntual").length,
        tardanzas:   r.filter(x => x.estado === "tardanza").length,
        ausentes:    r.filter(x => x.estado === "ausente").length,
        justificados:r.filter(x => x.estado === "justificado").length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const fetchEmpleados = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/empleados", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEmpleados(data.empleados || []);
    } catch {}
  };

  useEffect(() => { fetchRegistros(); fetchEmpleados(); }, []);

  const handleFiltrar = (e) => {
    e.preventDefault();
    fetchRegistros();
  };

  const handleRegistrarManual = async (e) => {
    e.preventDefault();
    try {
      await fetch("http://localhost:5000/api/asistencia/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formManual)
      });
      setModalManual(false);
      fetchRegistros();
    } catch (err) { console.error(err); }
  };

  const handleJustificar = async () => {
    try {
      await fetch(`http://localhost:5000/api/asistencia/${modalJustificar}/justificar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ observacion })
      });
      setModalJustificar(null);
      setObservacion("");
      fetchRegistros();
    } catch (err) { console.error(err); }
  };

  const inputStyle = {
    width: "100%", padding: "8px 12px", borderRadius: "8px",
    border: "1px solid #e5e7eb", fontSize: "13px", outline: "none",
    boxSizing: "border-box", color: "#111827"
  };

  const labelStyle = {
    fontSize: "12px", fontWeight: 500, color: "#374151",
    display: "block", marginBottom: "4px"
  };

  return (
    <div style={{ padding: "20px", background: "#f8fafc", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>

      {/* RESUMEN */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "TOTAL",        value: resumen.total,        color: "#1b5e20", bg: "#f0fdf4", icon: "👥" },
          { label: "PUNTUALES",    value: resumen.puntuales,    color: "#065f46", bg: "#d1fae5", icon: "✅" },
          { label: "TARDANZAS",    value: resumen.tardanzas,    color: "#92400e", bg: "#fef3c7", icon: "⏰" },
          { label: "AUSENTES",     value: resumen.ausentes,     color: "#991b1b", bg: "#fee2e2", icon: "🚫" },
          { label: "JUSTIFICADOS", value: resumen.justificados, color: "#1e40af", bg: "#dbeafe", icon: "📋" },
        ].map((m, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: "14px", padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.05em" }}>{m.label}</span>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>{m.icon}</div>
            </div>
            <div style={{ fontSize: "32px", fontWeight: 700, color: m.color, marginTop: "8px" }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div style={{ ...card, marginBottom: "16px" }}>
        <form onSubmit={handleFiltrar} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: "150px" }}>
            <label style={labelStyle}>Fecha</label>
            <input type="date" value={filtros.fecha} onChange={e => setFiltros({ ...filtros, fecha: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ flex: 1, minWidth: "150px" }}>
            <label style={labelStyle}>Área</label>
            <input type="text" placeholder="Buscar área..." value={filtros.area} onChange={e => setFiltros({ ...filtros, area: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ flex: 1, minWidth: "120px" }}>
            <label style={labelStyle}>Piso</label>
            <select value={filtros.piso} onChange={e => setFiltros({ ...filtros, piso: e.target.value })} style={inputStyle}>
              <option value="">Todos</option>
              {[1,2,3,4,5].map(p => <option key={p} value={p}>Piso {p}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: "140px" }}>
            <label style={labelStyle}>Estado</label>
            <select value={filtros.estado} onChange={e => setFiltros({ ...filtros, estado: e.target.value })} style={inputStyle}>
              <option value="">Todos</option>
              <option value="puntual">Puntual</option>
              <option value="tardanza">Tardanza</option>
              <option value="ausente">Ausente</option>
              <option value="justificado">Justificado</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#1b5e20", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
              Filtrar
            </button>
            <button type="button" onClick={() => { setFiltros({ fecha: "", area: "", piso: "", estado: "" }); setTimeout(fetchRegistros, 100); }}
              style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: "13px", cursor: "pointer" }}>
              Limpiar
            </button>
            <button type="button" onClick={() => setModalManual(true)}
              style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#f0fdf4", color: "#1b5e20", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
              + Registro manual
            </button>
          </div>
        </form>
      </div>

      {/* TABLA */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>Registros de asistencia</div>
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>{registros.length} registros</span>
        </div>

        {cargando ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>Cargando...</div>
        ) : registros.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af", fontSize: "13px" }}>
            No hay registros para los filtros seleccionados
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr>
                {["Colaborador","Área","Piso","Entrada","Salida","Horas","Extra","Tardanza","Marcación","Estado","Acciones"].map(h => (
                  <th key={h} style={{ textAlign: "left", fontWeight: 500, fontSize: "11px", color: "#9ca3af", padding: "6px 8px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registros.map((r, i) => (
                <tr key={i} style={{ transition: "background .1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f9fafb", color: "#111827", whiteSpace: "nowrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "50%", background: "#ede9fe", color: "#5b21b6", fontSize: "9px", fontWeight: 500, marginRight: "6px", verticalAlign: "middle" }}>
                      {r.colaborador?.split(" ").map(n => n[0]).join("").slice(0,2)}
                    </span>
                    {r.colaborador}
                  </td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f9fafb", color: "#6b7280" }}>{r.area}</td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f9fafb", color: "#6b7280", textAlign: "center" }}>P{r.piso}</td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f9fafb", color: "#374151" }}>
                    {r.fecha_hora_entrada ? new Date(r.fecha_hora_entrada).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f9fafb", color: "#374151" }}>
                    {r.fecha_hora_salida ? new Date(r.fecha_hora_salida).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f9fafb", color: "#374151" }}>{r.horas_trabajadas ? `${r.horas_trabajadas}h` : "—"}</td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f9fafb", color: r.horas_extra > 0 ? "#7c3aed" : "#9ca3af" }}>{r.horas_extra > 0 ? `${r.horas_extra}h` : "—"}</td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f9fafb", color: r.minutos_tardanza > 0 ? "#d97706" : "#9ca3af" }}>{r.minutos_tardanza > 0 ? `${r.minutos_tardanza} min` : "—"}</td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f9fafb", color: "#6b7280" }}>
                    {marcacionIcon[r.tipo_marcacion] || "—"} {r.tipo_marcacion || "—"}
                  </td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f9fafb" }}>
                    <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "8px", fontWeight: 500, background: estadoBadge[r.estado]?.bg, color: estadoBadge[r.estado]?.color }}>
                      {r.estado}
                    </span>
                  </td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f9fafb" }}>
                    {r.estado === "ausente" && (
                      <button onClick={() => setModalJustificar(r.id)}
                        style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "6px", border: "1px solid #3b82f6", background: "#eff6ff", color: "#1d4ed8", cursor: "pointer" }}>
                        Justificar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL REGISTRO MANUAL */}
      {modalManual && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: 0 }}>✍️ Registro manual</h3>
              <button onClick={() => setModalManual(false)} style={{ border: "none", background: "none", fontSize: "18px", cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>
            <form onSubmit={handleRegistrarManual} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Empleado</label>
                <select value={formManual.empleado_id} onChange={e => setFormManual({ ...formManual, empleado_id: e.target.value })} style={inputStyle} required>
                  <option value="">Seleccionar empleado...</option>
                  {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre} {e.apellido} — {e.cedula}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Fecha</label>
                <input type="date" value={formManual.fecha} onChange={e => setFormManual({ ...formManual, fecha: e.target.value })} style={inputStyle} required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Hora entrada</label>
                  <input type="time" value={formManual.fecha_hora_entrada} onChange={e => setFormManual({ ...formManual, fecha_hora_entrada: `${formManual.fecha} ${e.target.value}` })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Hora salida</label>
                  <input type="time" value={formManual.fecha_hora_salida} onChange={e => setFormManual({ ...formManual, fecha_hora_salida: `${formManual.fecha} ${e.target.value}` })} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Tipo de marcación</label>
                <select value={formManual.tipo_marcacion} onChange={e => setFormManual({ ...formManual, tipo_marcacion: e.target.value })} style={inputStyle}>
                  <option value="manual">Manual</option>
                  <option value="huella">Huella</option>
                  <option value="facial">Facial</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Observación</label>
                <textarea value={formManual.observacion} onChange={e => setFormManual({ ...formManual, observacion: e.target.value })} style={{ ...inputStyle, height: "70px", resize: "vertical" }} placeholder="Motivo del registro manual..." />
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
                <button type="button" onClick={() => setModalManual(false)} style={{ padding: "8px 20px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: "13px", cursor: "pointer" }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#1b5e20", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL jUSTIFICAR */}
      {modalJustificar && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "400px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: 0 }}>📋 Justificar ausencia</h3>
              <button onClick={() => setModalJustificar(null)} style={{ border: "none", background: "none", fontSize: "18px", cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Motivo de justificación</label>
                <textarea value={observacion} onChange={e => setObservacion(e.target.value)} style={{ ...inputStyle, height: "100px", resize: "vertical" }} placeholder="Describe el motivo de la ausencia..." />
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button onClick={() => setModalJustificar(null)} style={{ padding: "8px 20px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: "13px", cursor: "pointer" }}>
                  Cancelar
                </button>
                <button onClick={handleJustificar} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#1b5e20", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                  Justificar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
