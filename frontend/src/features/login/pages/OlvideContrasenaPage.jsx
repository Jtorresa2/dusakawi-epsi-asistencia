import { useState } from "react";
import { Link } from "react-router-dom";
import { COLORES } from "../../../shared/constants/colores.js";

const API = "/api";

export default function OlvideContrasenaPage() {
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!correo.trim()) return setError("Ingresa tu correo electronico");

    setCargando(true);
    try {
      const res = await fetch(`${API}/auth/olvide-contrasena`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.mensaje || "Error");
      setEnviado(true);
    } catch {
      setError("Error de conexion");
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  const iSx = {
    width: "100%", padding: "11px 14px", borderRadius: "8px",
    border: `1px solid ${COLORES.grisSuave}`, fontSize: "14px", outline: "none",
    color: COLORES.grisCasiNegro, boxSizing: "border-box",
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
          Recupera el acceso a tu cuenta
        </p>

        {/* Formulario */}
        <div style={{
          background: COLORES.fondoBlanco, borderRadius: "16px", padding: "2rem",
          width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          border: `1px solid ${COLORES.primarioClaro}`
        }}>
          {enviado ? (
            <div style={{ textAlign: "center" }}>
              <div style={{
                background: COLORES.successClaro, color: COLORES.primarioOscuro, padding: "10px 14px",
                borderRadius: "8px", fontSize: "13px", marginBottom: "1rem", textAlign: "center"
              }}>
                Si el correo esta registrado, recibiras un enlace para restablecer tu contraseña
              </div>
              <Link
                to="/login"
                style={{
                  display: "inline-block", width: "100%", padding: "13px 0", borderRadius: "8px",
                  background: COLORES.primario, color: COLORES.fondoBlanco, fontSize: "15px", fontWeight: 600,
                  textAlign: "center", textDecoration: "none", boxSizing: "border-box"
                }}
              >
                Volver al inicio de sesion
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div style={{ background: COLORES.dangerFondo2, color: COLORES.danger, padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "1rem", textAlign: "center" }}>{error}</div>
              )}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ fontSize: "14px", fontWeight: 600, color: COLORES.grisOscuro, display: "block", marginBottom: "6px" }}>
                  Correo electronico
                </label>
                <input
                  type="email"
                  placeholder="Ingresa tu correo"
                  value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={iSx}
                  onFocus={e => e.target.style.borderColor = COLORES.primario}
                  onBlur={e => e.target.style.borderColor = COLORES.grisSuave}
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={cargando}
                style={{
                  width: "100%", padding: "13px", borderRadius: "8px",
                  border: "none", background: cargando ? COLORES.textoSuave : COLORES.primario, color: COLORES.fondoBlanco,
                  fontSize: "15px", fontWeight: 600, cursor: cargando ? "not-allowed" : "pointer"
                }}
                onMouseEnter={e => { if (!cargando) e.target.style.background = COLORES.primarioOscuro }}
                onMouseLeave={e => { if (!cargando) e.target.style.background = COLORES.primario }}
              >
                {cargando ? "Enviando..." : "Enviar enlace"}
              </button>
              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                <Link
                  to="/login"
                  style={{
                    background: "none", border: "none", color: COLORES.primario,
                    fontSize: "13px", cursor: "pointer", textDecoration: "underline",
                    padding: "4px"
                  }}
                >
                  Volver al inicio de sesion
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
