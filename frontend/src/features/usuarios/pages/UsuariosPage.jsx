import { useState, useEffect } from "react";
import { Edit3, Trash2 } from "lucide-react";

const API = "/api";

const getToken = () => localStorage.getItem("token");

const ROL_BADGE = {
  "Administrador":  { bg: "#FFF3E0", color: "#E65100" },
  "Talento Humano": { bg: "#E8F5E9", color: "#1B5E20" },
  "Empleado":     { bg: "#E3F2FD", color: "#0D47A1" },
};

const inputStyle = {
  width: "100%", padding: "9px 12px", border: "1.5px solid #E0E7EF",
  borderRadius: "8px", fontSize: "13px", outline: "none",
  boxSizing: "border-box", color: "#111827", background: "#fff"
};

const labelStyle = {
  display: "block", fontSize: "11px", fontWeight: 600,
  color: "#6b7280", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.04em"
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState(null);
  const [modalGenerar, setModalGenerar] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [resultadoGen, setResultadoGen] = useState(null);

  const [form, setForm] = useState({
    empleado_id: "", rol_id: "", username: "", password: "", activo: 1
  });

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resU, resR, resE] = await Promise.all([
        fetch(`${API}/usuarios`, { headers }),
        fetch(`${API}/usuarios/roles`, { headers }),
        fetch(`${API}/empleados`, { headers }),
      ]);
      const dataU = await resU.json();
      const dataR = await resR.json();
      const dataE = await resE.json();
      setUsuarios(dataU.usuarios || []);
      setRoles(dataR.roles || []);
      setEmpleados(dataE.empleados || dataE || []);
    } catch (err) {
      setError("Error al cargar datos");
    } finally {
      setCargando(false);
    }
  };

  const mostrarToast = (msg, tipo = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const abrirCrear = () => {
    setForm({ empleado_id: "", rol_id: "", username: "", password: "", activo: 1 });
    setModoEdicion(false);
    setUsuarioActual(null);
    setModalAbierto(true);
  };

  const abrirEditar = (u) => {
    setForm({ empleado_id: u.empleado_id || "", rol_id: u.rol_id || roles.find(r => r.nombre === u.rol)?.id || "", username: u.username, password: "", activo: u.activo });
    setModoEdicion(true);
    setUsuarioActual(u);
    setModalAbierto(true);
  };

  const cerrarModal = () => { setModalAbierto(false); setUsuarioActual(null); };

  const handleGuardar = async () => {
    if (!form.username || !form.rol_id) return mostrarToast("Completa los campos obligatorios", "err");
    if (!modoEdicion && !form.password) return mostrarToast("La contrasena es obligatoria (o se usara la cedula)", "err");
    setGuardando(true);
    try {
      const url = modoEdicion ? `${API}/usuarios/${usuarioActual.id}` : `${API}/usuarios`;
      const method = modoEdicion ? "PUT" : "POST";
      const body = { ...form };
      if (modoEdicion && !body.password) delete body.password;
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) return mostrarToast(data.mensaje || "Error", "err");
      mostrarToast(data.mensaje + (data.password ? ` (contrasena: ${data.password})` : ""));
      cerrarModal();
      cargarDatos();
    } catch {
      mostrarToast("Error de conexion", "err");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    try {
      const res = await fetch(`${API}/usuarios/${id}`, { method: "DELETE", headers });
      const data = await res.json();
      mostrarToast(data.mensaje);
      setConfirmEliminar(null);
      cargarDatos();
    } catch {
      mostrarToast("Error al eliminar", "err");
    }
  };

  const toggleActivo = async (u) => {
    try {
      const rolId = roles.find(r => r.nombre === u.rol)?.id;
      await fetch(`${API}/usuarios/${u.id}`, {
        method: "PUT", headers,
        body: JSON.stringify({ rol_id: rolId, username: u.username, activo: u.activo ? 0 : 1 })
      });
      cargarDatos();
    } catch {
      mostrarToast("Error al cambiar estado", "err");
    }
  };

  const handleGenerarMasivos = async () => {
    setGenerando(true);
    try {
      const res = await fetch(`${API}/usuarios/generar-masivos`, { method: "POST", headers });
      const data = await res.json();
      setResultadoGen(data);
      cargarDatos();
    } catch {
      mostrarToast("Error al generar usuarios", "err");
    } finally {
      setGenerando(false);
    }
  };

  const descargarReporte = () => {
    if (!resultadoGen?.resultados?.length) return;
    const filas = resultadoGen.resultados.map(r => `${r.empleado}\t${r.username}\t${r.password}\t${r.correo}\t${r.email_enviado ? 'SI' : 'NO'}`).join('\n');
    const csv = `EMPLEADO\tUSUARIO\tCONTRASENA\tCORREO\tEMAIL_ENVIADO\n${filas}`;
    const blob = new Blob([csv], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'usuarios_generados.tsv'; a.click();
    URL.revokeObjectURL(url);
  };
    
  const usuariosFiltrados = usuarios.filter(u =>
    u.empleado?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.username?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.rol?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.cedula?.includes(busqueda)
  );

  const pendientes = empleados.length - usuarios.length;

  if (cargando) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: "12px" }}>
      <div style={{ width: "36px", height: "36px", border: "3px solid #e5e7eb", borderTop: "3px solid #1b5e20", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <p style={{ color: "#9ca3af", fontSize: "13px" }}>Cargando usuarios...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: "2rem", textAlign: "center", color: "#dc2626" }}>
      <p>{error}</p>
      <button onClick={cargarDatos} style={{ marginTop: "1rem", padding: "8px 16px", borderRadius: "8px", border: "1px solid #dc2626", background: "#fff", color: "#dc2626", cursor: "pointer" }}>Reintentar</button>
    </div>
  );

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif" }}>
        <p style={{ fontSize: 13, color: "#9CA3AF" }}>Inicio / Administración / Usuarios</p>
      {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          {/* Izquierda */}
          <div>
            {pendientes > 0 && (
              <button
                onClick={() => setModalGenerar(true)}
                style={{
                  padding: "9px 18px",
                  background: "#0284C7",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                Generar faltantes ({pendientes})
              </button>
            )}
          </div>

          {/* Derecha */}
          <button
            onClick={abrirCrear}
            style={{
              padding: "9px 18px",
              background: "#1b5e20",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            + Nuevo usuario
          </button>
        </div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "Total usuarios",  value: usuarios.length,                              color: "#1b5e20", bg: "#f0fdf4", icon: "👥" },
          { label: "Activos",         value: usuarios.filter(u => u.activo).length,        color: "#0d9488", bg: "#f0fdfa", icon: "✅" },
          { label: "Inactivos",       value: usuarios.filter(u => !u.activo).length,       color: "#dc2626", bg: "#fef2f2", icon: "🚫" },
          { label: "Administradores", value: usuarios.filter(u => u.rol === "Administrador").length, color: "#d97706", bg: "#fffbeb", icon: "🔑" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: "12px", padding: "16px 20px", border: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: "#9ca3af" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div style={{ background: "#fff", borderRadius: "12px", padding: "16px 20px", border: "1px solid #f3f4f6", marginBottom: "16px" }}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, usuario, cedula o rol..."
          style={{ ...inputStyle, maxWidth: "400px" }}
        />
      </div>

      {/* Tabla */}
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #f3f4f6", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Empleado","Usuario","Rol","Area","Ultimo acceso","Estado","Acciones"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "#9ca3af", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                  No se encontraron usuarios
                </td>
              </tr>
            ) : usuariosFiltrados.map((u, i) => {
              const badge = ROL_BADGE[u.rol] || { bg: "#f3f4f6", color: "#374151" };
              return (
                <tr key={u.id} style={{ borderBottom: i < usuariosFiltrados.length - 1 ? "1px solid #f9fafb" : "none" }}>
                  <td style={{ padding: "12px 16px", color: "#111827" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#1b5e20", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 600, flexShrink: 0 }}>
                        {u.empleado?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{u.empleado}</div>
                        <div style={{ fontSize: "11px", color: "#9ca3af" }}>{u.cedula} &middot; {u.correo}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#374151", fontFamily: "monospace", fontSize: "12px" }}>{u.username}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: badge.bg, color: badge.color, borderRadius: "20px", padding: "2px 10px", fontSize: "11px", fontWeight: 600 }}>{u.rol}</span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "12px" }}>
                    {u.area} {u.piso ? `/ P${u.piso}` : ""}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#9ca3af", fontSize: "12px" }}>
                    {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleDateString("es-CO") : "Nunca"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => toggleActivo(u)} style={{
                      padding: "3px 12px", borderRadius: "20px", border: "none", cursor: "pointer",
                      fontSize: "11px", fontWeight: 600,
                      background: u.activo ? "#d1fae5" : "#fee2e2",
                      color: u.activo ? "#065f46" : "#991b1b"
                    }}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <button onClick={() => abrirEditar(u)} title="Editar" style={{
                        width: 34, height: 34, borderRadius: "9px", border: "none",
                        background: "#EFF6FF", color: "#1565C0", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all .2s",
                      }}>
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => setConfirmEliminar(u)} title="Eliminar" style={{
                        width: 34, height: 34, borderRadius: "9px", border: "none",
                        background: "#FEE2E2", color: "#dc2626", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all .2s",
                      }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal crear/editar */}
      {modalAbierto && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                {modoEdicion ? "Editar usuario" : "Nuevo usuario"}
              </h2>
              <button onClick={cerrarModal} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#9ca3af" }}>X</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Empleado asociado *</label>
                <select value={form.empleado_id} onChange={e => setForm({ ...form, empleado_id: e.target.value })} style={inputStyle}>
                  <option value="">Seleccione un empleado</option>
                  {empleados.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre} {e.apellido} &mdash; {e.cedula}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Usuario *</label>
                <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="nombre.apellido" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Contrasena {modoEdicion ? "(dejar vacio para no cambiar)" : "(dejar vacio = cedula del empleado)"}</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="88888888" style={inputStyle} />
                {!modoEdicion && <p style={{ fontSize: "11px", color: "#6B7280", margin: "4px 0 0" }}>Si se deja vacio, se usara la cedula del empleado como contrasena inicial</p>}
              </div>

              <div>
                <label style={labelStyle}>Rol *</label>
                <select value={form.rol_id} onChange={e => setForm({ ...form, rol_id: e.target.value })} style={inputStyle}>
                  <option value="">Seleccione un rol</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>

              {modoEdicion && (
                <div>
                  <label style={labelStyle}>Estado</label>
                  <select value={form.activo} onChange={e => setForm({ ...form, activo: Number(e.target.value) })} style={inputStyle}>
                    <option value={1}>Activo</option>
                    <option value={0}>Inactivo</option>
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <button onClick={cerrarModal} style={{ flex: 1, padding: "10px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
                Cancelar
              </button>
              <button onClick={handleGuardar} disabled={guardando} style={{ flex: 2, padding: "10px", background: "#1b5e20", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
                {guardando ? "Guardando..." : modoEdicion ? "Guardar cambios" : "Crear usuario"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmEliminar && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "380px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>X</div>
            <h3 style={{ margin: "0 0 8px", fontSize: "16px", color: "#111827" }}>Eliminar usuario?</h3>
            <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "20px" }}>
              Se eliminara el usuario <strong>{confirmEliminar.username}</strong> de forma permanente.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setConfirmEliminar(null)} style={{ flex: 1, padding: "10px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
                Cancelar
              </button>
              <button onClick={() => handleEliminar(confirmEliminar.id)} style={{ flex: 1, padding: "10px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal generar masivos */}
      {modalGenerar && !resultadoGen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "420px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>+</div>
            <h3 style={{ margin: "0 0 8px", fontSize: "16px", color: "#111827" }}>Generar usuarios faltantes?</h3>
            <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "20px" }}>
              Se crearan usuarios para <strong>{pendientes} empleados</strong> que aun no tienen acceso.
              Username se genera automaticamente y la contrasena es la cedula.
              {pendientes > 0 && <><br/><br/>Se enviara correo a cada empleado si SMTP esta configurado.</>}
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setModalGenerar(false)} style={{ flex: 1, padding: "10px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
                Cancelar
              </button>
              <button onClick={() => { handleGenerarMasivos(); }} disabled={generando} style={{ flex: 1, padding: "10px", background: generando ? "#9CA3AF" : "#0284C7", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
                {generando ? "Generando..." : "Generar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal resultado generacion */}
      {resultadoGen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "500px", maxHeight: "80vh", overflow: "auto" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px", textAlign: "center" }}>OK</div>
            <h3 style={{ margin: "0 0 12px", fontSize: "16px", color: "#111827", textAlign: "center" }}>Resultado</h3>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginBottom: "16px" }}>
              <div style={{ textAlign: "center", background: "#F0FDF4", borderRadius: "10px", padding: "12px 20px" }}>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#1B5E20" }}>{resultadoGen.creados || 0}</div>
                <div style={{ fontSize: "11px", color: "#6B7280" }}>Creados</div>
              </div>
              <div style={{ textAlign: "center", background: "#EFF6FF", borderRadius: "10px", padding: "12px 20px" }}>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#0284C7" }}>{resultadoGen.emails_enviados || 0}</div>
                <div style={{ fontSize: "11px", color: "#6B7280" }}>Emails enviados</div>
              </div>
              <div style={{ textAlign: "center", background: "#FEF2F2", borderRadius: "10px", padding: "12px 20px" }}>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#DC2626" }}>{resultadoGen.emails_fallados || 0}</div>
                <div style={{ fontSize: "11px", color: "#6B7280" }}>Fallos</div>
              </div>
            </div>
            {resultadoGen.resultados?.length > 0 && (
              <div style={{ maxHeight: "200px", overflow: "auto", marginBottom: "12px", border: "1px solid #E5E7EB", borderRadius: "8px" }}>
                <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
                  <thead><tr style={{ background: "#F9FAFB" }}>
                    <th style={{ padding: "6px 8px", textAlign: "left" }}>Empleado</th>
                    <th style={{ padding: "6px 8px", textAlign: "left" }}>Usuario</th>
                    <th style={{ padding: "6px 8px", textAlign: "left" }}>Contrasena</th>
                    <th style={{ padding: "6px 8px", textAlign: "left" }}>Email</th>
                  </tr></thead>
                  <tbody>
                    {resultadoGen.resultados.map((r, i) => (
                      <tr key={i} style={{ borderTop: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "5px 8px" }}>{r.empleado}</td>
                        <td style={{ padding: "5px 8px", fontFamily: "monospace" }}>{r.username}</td>
                        <td style={{ padding: "5px 8px", fontFamily: "monospace" }}>{r.password}</td>
                        <td style={{ padding: "5px 8px" }}>{r.email_enviado ? 'OK' : r.correo || 'SIN CORREO'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={descargarReporte} style={{ flex: 1, padding: "10px", background: "#1B5E20", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
                Descargar reporte
              </button>
              <button onClick={() => { setModalGenerar(false); setResultadoGen(null); }} style={{ flex: 1, padding: "10px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px",
          background: toast.tipo === "err" ? "#dc2626" : "#1b5e20",
          color: "#fff", borderRadius: "10px", padding: "12px 20px",
          fontSize: "13px", fontWeight: 500, zIndex: 9999,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
        }}>
          {toast.tipo === "err" ? "X " : "OK "}{toast.msg}
        </div>
      )}
    </div>
  );
}
