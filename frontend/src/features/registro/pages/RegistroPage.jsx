import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { verificarCedula, registro } from "../../auth/authService.api";

export default function RegistroPage() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [cedula, setCedula] = useState("");
  const [empleadoInfo, setEmpleadoInfo] = useState(null);
  const [form, setForm] = useState({ username: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const handleVerificar = async () => {
    setError("");
    if (!cedula.trim()) { setError("Ingresa tu cédula"); return; }
    setGuardando(true);
    try {
      const data = await verificarCedula(cedula.trim());
      setEmpleadoInfo(data);
      setPaso(2);
    } catch (e) {
      setError(e.message || "Cédula no encontrada");
    } finally {
      setGuardando(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.username || !form.password) { setError("Completa todos los campos"); return; }
    if (form.password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (form.password !== form.confirmPassword) { setError("Las contraseñas no coinciden"); return; }

    setGuardando(true);
    try {
      const data = await registro({ cedula: cedula.trim(), username: form.username, password: form.password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (e) {
      setError(e.message || "Error al registrarse");
    } finally {
      setGuardando(false);
    }
  };

  const iSx = {
    width: "100%", padding: "11px 14px", borderRadius: "8px",
    border: "1px solid #ddd", fontSize: "14px", outline: "none",
    color: "#111", boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f5faf5",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "Segoe UI, sans-serif",
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "420px", padding: "0 1rem" }}>
        <img src="/logo.png" alt="Logo" style={{ width: "100px", marginBottom: "0.8rem" }} />
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1b5e20", margin: "0 0 4px" }}>
          {paso === 1 ? "Registro" : "Crear acceso"}
        </h1>
        <p style={{ fontSize: "14px", color: "#555", marginBottom: "1.5rem" }}>
          {paso === 1 ? "Ingresa tu cédula para verificar tu identidad" : `Hola ${empleadoInfo?.nombre}, crea tu acceso`}
        </p>

        <div style={{
          background: "#fff", borderRadius: "16px", padding: "2rem",
          width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          border: "1px solid #e8f5e9",
        }}>
          {error && (
            <div style={{ background: "#FEF2F2", color: "#DC2626", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "1rem", textAlign: "center" }}>
              {error}
            </div>
          )}

          {paso === 1 && (
            <>
              <label style={{ fontSize: "14px", fontWeight: 600, color: "#222", display: "block", marginBottom: "6px" }}>Cédula *</label>
              <input placeholder="Ingresa tu número de cédula" value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerificar()}
                onFocus={e => e.target.style.borderColor = "#2e7d32"}
                onBlur={e => e.target.style.borderColor = "#ddd"}
                style={iSx} />

              <button onClick={handleVerificar} disabled={guardando}
                style={{
                  width: "100%", padding: "13px", borderRadius: "8px", marginTop: "1.2rem",
                  border: "none", background: guardando ? "#9CA3AF" : "#2e7d32", color: "#fff",
                  fontSize: "15px", fontWeight: 600, cursor: guardando ? "not-allowed" : "pointer",
                }}
                onMouseEnter={e => { if (!guardando) e.target.style.background = "#1b5e20"; }}
                onMouseLeave={e => { if (!guardando) e.target.style.background = "#2e7d32"; }}>
                {guardando ? "Verificando..." : "Verificar cédula"}
              </button>
            </>
          )}

          {paso === 2 && (
            <>
              <div style={{ background: "#F0FFF4", borderRadius: "10px", padding: "12px 16px", marginBottom: "1.5rem" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "#1B5E20", fontWeight: 600 }}>
                  {empleadoInfo?.nombre}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6B7280" }}>
                  {empleadoInfo?.correo}
                </p>
              </div>

              <label style={{ fontSize: "14px", fontWeight: 600, color: "#222", display: "block", marginBottom: "6px" }}>Nombre de usuario *</label>
              <input placeholder="Elige un nombre de usuario" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                style={{ ...iSx, marginBottom: "12px" }}
                onFocus={e => e.target.style.borderColor = "#2e7d32"}
                onBlur={e => e.target.style.borderColor = "#ddd"} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "1.5rem" }}>
                <div>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "#222", display: "block", marginBottom: "6px" }}>Contraseña *</label>
                  <input type="password" placeholder="Mín. 6 caracteres" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    onFocus={e => e.target.style.borderColor = "#2e7d32"}
                    onBlur={e => e.target.style.borderColor = "#ddd"}
                    style={iSx} />
                </div>
                <div>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "#222", display: "block", marginBottom: "6px" }}>Confirmar *</label>
                  <input type="password" placeholder="Repite la contraseña" value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    onFocus={e => e.target.style.borderColor = "#2e7d32"}
                    onBlur={e => e.target.style.borderColor = "#ddd"}
                    style={iSx} />
                </div>
              </div>

              <button onClick={handleSubmit} disabled={guardando}
                style={{
                  width: "100%", padding: "13px", borderRadius: "8px",
                  border: "none", background: guardando ? "#9CA3AF" : "#2e7d32", color: "#fff",
                  fontSize: "15px", fontWeight: 600, cursor: guardando ? "not-allowed" : "pointer",
                }}
                onMouseEnter={e => { if (!guardando) e.target.style.background = "#1b5e20"; }}
                onMouseLeave={e => { if (!guardando) e.target.style.background = "#2e7d32"; }}>
                {guardando ? "Creando cuenta..." : "Crear cuenta y entrar"}
              </button>

              <p style={{ fontSize: "13px", color: "#6B7280", textAlign: "center", marginTop: "12px" }}>
                <span onClick={() => { setPaso(1); setError(""); }}
                  style={{ color: "#1B5E20", fontWeight: 600, cursor: "pointer" }}>
                  ← Otra cédula
                </span>
              </p>
            </>
          )}

          <p style={{ fontSize: "13px", color: "#6B7280", textAlign: "center", marginTop: paso === 1 ? "16px" : "8px" }}>
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" style={{ color: "#1B5E20", fontWeight: 600, textDecoration: "none" }}>
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}