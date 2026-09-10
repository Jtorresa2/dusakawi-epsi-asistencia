import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { COLORES } from "../../../shared/constants/colores.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ usuario: "", password: "" });
  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    localStorage.clear();
  }, []);

  const handleLogin = async () => {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: form.usuario, password: form.password })
    });

    const data = await res.json();

    if (!res.ok) {
      // Forced password reset: server sent a reset email, show message
      if (res.status === 403 && data.password_reset_required) {
        setResetEmailSent(true);
        return;
      }
      alert(data.mensaje || "Error en login");
      return;
    }

    localStorage.setItem("token", data.token);
    const rolesMap = { "Administrador": "admin", "Talento Humano": "talento_humano", "Empleado": "empleado" };
    const user = { ...data.user, rol: rolesMap[data.user.rol] || data.user.rol };
    localStorage.setItem("usuario", JSON.stringify(user));
    navigate("/dashboard");

  } catch (error) {
    console.error(error);
    alert("Error de conexion con el servidor");
  }
};

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div style={{
      minHeight: "100vh", background: COLORES.verdeVariante3,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden", fontFamily: "Segoe UI, sans-serif"
    }}>

      {/* Puntos decorativos izquierda */}
      <div style={{ position: "absolute", top: "60px", left: "60px", display: "grid", gridTemplateColumns: "repeat(6, 10px)", gap: "6px" }}>
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: COLORES.primarioClaro2 }} />
        ))}
      </div>

      {/* Arco decorativo derecha */}
      <div style={{
        position: "absolute", top: "40px", right: "-40px",
        width: "120px", height: "120px", borderRadius: "50%",
        border: `2px solid ${COLORES.primarioClaro2}`, background: "transparent"
      }} />

      {/* Contenido principal */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1, width: "100%", maxWidth: "500px", padding: "0 1rem" }}>

        <img
          src="/logo.png"
          alt="Logo"
          style={{ width: "120px", marginBottom: "1rem" }}
        />  

        {/* Titulo */}
        <h1 style={{ fontSize: "32px", fontWeight: 700, color: COLORES.primarioOscuro, margin: "0 0 4px" }}>
          Dusakawi EPSI
        </h1>
        <p style={{ fontSize: "15px", color: COLORES.textoMuted, marginBottom: "2rem" }}>
          Sistema de control de asistencia 
        </p>

        {/* Formulario */}
        <div style={{
          background: COLORES.fondoBlanco, borderRadius: "16px", padding: "2rem",
          width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          border: `1px solid ${COLORES.primarioClaro}`
        }}>
          {resetEmailSent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{
                background: COLORES.successClaro, color: COLORES.primarioOscuro, padding: "14px 18px",
                borderRadius: "8px", fontSize: "14px", marginBottom: "1.5rem", textAlign: "center",
                lineHeight: "1.5"
              }}>
                <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Enlace de restablecimiento enviado</p>
                <p style={{ margin: 0 }}>
                  Se envio un enlace a tu correo electronico para cambiar tu contrasena.
                  Debes completar ese proceso antes de poder acceder al sistema.
                </p>
              </div>
              <button
                onClick={() => setResetEmailSent(false)}
                style={{
                  width: "100%", padding: "13px", borderRadius: "8px",
                  border: "none", background: COLORES.primario, color: COLORES.fondoBlanco,
                  fontSize: "15px", fontWeight: 600, cursor: "pointer"
                }}
                onMouseEnter={e => e.target.style.background = COLORES.primarioOscuro}
                onMouseLeave={e => e.target.style.background = COLORES.primario}
              >
                Volver al login
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "14px", fontWeight: 600, color: COLORES.grisOscuro, display: "block", marginBottom: "6px" }}>
                  Usuario
                </label>
                <input
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={form.usuario}
                  onChange={e => setForm({ ...form, usuario: e.target.value })}
                  onKeyDown={handleKeyDown}
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: "8px",
                    border: `1px solid ${COLORES.grisSuave}`, fontSize: "14px", outline: "none",
                    color: COLORES.grisCasiNegro, boxSizing: "border-box"
                  }}
                  onFocus={e => e.target.style.borderColor = COLORES.primario}
                  onBlur={e => e.target.style.borderColor = COLORES.grisSuave}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ fontSize: "14px", fontWeight: 600, color: COLORES.grisOscuro, display: "block", marginBottom: "6px" }}>
                  Contrasena
                </label>
                <input
                  type="password"
                  placeholder="Ingresa tu contrasena"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onKeyDown={handleKeyDown}
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: "8px",
                    border: `1px solid ${COLORES.grisSuave}`, fontSize: "14px", outline: "none",
                    color: COLORES.grisCasiNegro, boxSizing: "border-box"
                  }}
                  onFocus={e => e.target.style.borderColor = COLORES.primario}
                  onBlur={e => e.target.style.borderColor = COLORES.grisSuave}
                />
              </div>

              <button
                onClick={handleLogin}
                style={{
                  width: "100%", padding: "13px", borderRadius: "8px",
                  border: "none", background: COLORES.primario, color: COLORES.fondoBlanco,
                  fontSize: "15px", fontWeight: 600, cursor: "pointer"
                }}
                onMouseEnter={e => e.target.style.background = COLORES.primarioOscuro}
                onMouseLeave={e => e.target.style.background = COLORES.primario}
              >
                Acceder al sistema
              </button>

              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                <Link
                  to="/olvide-contrasena"
                  style={{
                    background: "none", border: "none", color: COLORES.primario,
                    fontSize: "13px", cursor: "pointer", textDecoration: "underline",
                    padding: "4px"
                  }}
                >
                  ¿Olvidaste tu contrasena?
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Olas verdes abajo */}
      <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", lineHeight: 0 }}>
        <svg viewBox="0 0 1440 220" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
          <path d="M0,100 C200,160 400,40 600,100 C800,160 1000,40 1200,100 C1300,130 1380,110 1440,100 L1440,220 L0,220 Z" fill={COLORES.acento} opacity="0.3" />
          <path d="M0,130 C180,80 360,180 540,130 C720,80 900,180 1080,130 C1260,80 1380,150 1440,130 L1440,220 L0,220 Z" fill={COLORES.primario} opacity="0.5" />
          <path d="M0,160 C150,120 300,180 500,155 C700,130 900,180 1100,155 C1250,135 1370,165 1440,160 L1440,220 L0,220 Z" fill={COLORES.primario} />
        </svg>
      </div>
    </div>
  );
 
}
