import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "/api";
const getToken = () => localStorage.getItem("token");

export default function CambiarPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ actual: "", nueva: "", confirmar: "" });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!form.actual || !form.nueva || !form.confirmar) return setError("Completa todos los campos");
    if (form.nueva.length < 8) return setError("La contrasena debe tener al menos 8 caracteres");
    if (form.nueva !== form.confirmar) return setError("Las contrasenas no coinciden");
    if (form.actual === form.nueva) return setError("La nueva contrasena debe ser diferente a la actual");

    setGuardando(true);
    try {
      const res = await fetch(`${API}/auth/cambiar-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ password_actual: form.actual, password_nuevo: form.nueva }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.mensaje || "Error");
      localStorage.setItem("token", data.token);
      setExito(true);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch {
      setError("Error de conexion");
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
    <div style={{ minHeight: "100vh", background: "#f5faf5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Segoe UI, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "420px", padding: "0 1rem" }}>
        <img src="/logo.png" alt="Logo" style={{ width: "100px", marginBottom: "0.8rem", display: "block", marginLeft: "auto", marginRight: "auto" }} />
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1b5e20", textAlign: "center", margin: "0 0 4px" }}>Cambiar contrasena</h1>
        <p style={{ fontSize: "14px", color: "#555", textAlign: "center", marginBottom: "1.5rem" }}>
          {exito ? "Contrasena cambiada exitosamente. Redirigiendo..." : "Es la primera vez que ingresas. Cambia tu contrasena."}
        </p>

        {!exito && (
          <div style={{ background: "#fff", borderRadius: "16px", padding: "2rem", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e8f5e9" }}>
            {error && (
              <div style={{ background: "#FEF2F2", color: "#DC2626", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "1rem", textAlign: "center" }}>{error}</div>
            )}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, color: "#222", display: "block", marginBottom: "6px" }}>Contrasena actual *</label>
              <input type="password" placeholder="Tu contrasena inicial" value={form.actual}
                onChange={e => setForm({...form, actual: e.target.value})}
                style={iSx} onFocus={e => e.target.style.borderColor="#2e7d32"} onBlur={e => e.target.style.borderColor="#ddd"} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, color: "#222", display: "block", marginBottom: "6px" }}>Nueva contrasena *</label>
              <input type="password" placeholder="Min. 8 caracteres" value={form.nueva}
                onChange={e => setForm({...form, nueva: e.target.value})}
                style={iSx} onFocus={e => e.target.style.borderColor="#2e7d32"} onBlur={e => e.target.style.borderColor="#ddd"} />
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, color: "#222", display: "block", marginBottom: "6px" }}>Confirmar contrasena *</label>
              <input type="password" placeholder="Repite la nueva contrasena" value={form.confirmar}
                onChange={e => setForm({...form, confirmar: e.target.value})}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                style={iSx} onFocus={e => e.target.style.borderColor="#2e7d32"} onBlur={e => e.target.style.borderColor="#ddd"} />
            </div>
            <button onClick={handleSubmit} disabled={guardando}
              style={{ width: "100%", padding: "13px", borderRadius: "8px", border: "none", background: guardando ? "#9CA3AF" : "#2e7d32", color: "#fff", fontSize: "15px", fontWeight: 600, cursor: guardando ? "not-allowed" : "pointer" }}
              onMouseEnter={e => { if (!guardando) e.target.style.background = "#1b5e20" }}
              onMouseLeave={e => { if (!guardando) e.target.style.background = "#2e7d32" }}>
              {guardando ? "Cambiando..." : "Cambiar contrasena"}
            </button>
          </div>
        )}

        {exito && (
          <div style={{ textAlign: "center", color: "#1B5E20", fontSize: "16px", fontWeight: 600 }}>
            Redirigiendo al dashboard...
          </div>
        )}
      </div>
    </div>
  );
}
