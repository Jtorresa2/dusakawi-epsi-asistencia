import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { COLORES } from "../../../shared/constants/colores.js";

const API = "/api";

export default function RestablecerContrasenaPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({ nueva: "", confirmar: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);
  const [estado, setEstado] = useState(token ? "cargando" : "invalido");
  const [motivo, setMotivo] = useState("");

  // Validate the token BEFORE showing the form: a used/expired link must
  // show a message instead of the password form.
  useEffect(() => {
    let activo = true;
    if (!token) {
      setEstado("invalido");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API}/auth/validar-token-reset?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!activo) return;
        setEstado(data.valido ? "valido" : "invalido");
        setMotivo(data.motivo || "invalido");
      } catch {
        if (!activo) return;
        setEstado("valido"); // no bloquees por error de red; el submit valida igual
      }
    })();
    return () => { activo = false; };
  }, [token]);

  const handleSubmit = async () => {
    setError("");
    if (!form.nueva || !form.confirmar) return setError("Completa todos los campos");
    if (form.nueva.length < 8) return setError("La contraseña debe tener al menos 8 caracteres");
    if (form.nueva !== form.confirmar) return setError("Las contraseñas no coinciden");
    if (!token) return setError("Enlace invalido o ya utilizado");

    setCargando(true);
    try {
      const res = await fetch(`${API}/auth/restablecer-contrasena`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password_nuevo: form.nueva }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.mensaje || "Error");
      setExito(true);
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
          Restablece tu contraseña
        </p>

        {/* Formulario */}
        <div style={{
          background: COLORES.fondoBlanco, borderRadius: "16px", padding: "2rem",
          width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          border: `1px solid ${COLORES.primarioClaro}`
        }}>
          {exito ? (
            <div style={{ textAlign: "center" }}>
              <div style={{
                background: COLORES.successClaro, color: COLORES.primarioOscuro, padding: "10px 14px",
                borderRadius: "8px", fontSize: "13px", marginBottom: "1rem", textAlign: "center"
              }}>
                Contraseña restablecida exitosamente. Ya puedes iniciar sesion con tu nueva contraseña.
              </div>
              <button
                onClick={() => navigate("/login")}
                style={{
                  width: "100%", padding: "13px", borderRadius: "8px",
                  border: "none", background: COLORES.primario, color: COLORES.fondoBlanco,
                  fontSize: "15px", fontWeight: 600, cursor: "pointer"
                }}
                onMouseEnter={e => e.target.style.background = COLORES.primarioOscuro}
                onMouseLeave={e => e.target.style.background = COLORES.primario}
              >
                Ir al inicio de sesion
              </button>
            </div>
          ) : estado === "cargando" ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              Validando enlace...
            </div>
          ) : estado === "invalido" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ background: COLORES.dangerFondo2, color: COLORES.danger, padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "1rem", textAlign: "center" }}>
                {motivo === "usado"
                  ? "Este enlace ya fue utilizado. Solo puede usarse una vez."
                  : motivo === "expirado"
                    ? "Este enlace ha expirado. Solicita uno nuevo."
                    : "Enlace inválido."}
              </div>
              <button
                onClick={() => navigate("/login")}
                style={{
                  width: "100%", padding: "13px", borderRadius: "8px",
                  border: "none", background: COLORES.primario, color: COLORES.fondoBlanco,
                  fontSize: "15px", fontWeight: 600, cursor: "pointer"
                }}
                onMouseEnter={e => e.target.style.background = COLORES.primarioOscuro}
                onMouseLeave={e => e.target.style.background = COLORES.primario}
              >
                Ir al inicio de sesion
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div style={{ background: COLORES.dangerFondo2, color: COLORES.danger, padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "1rem", textAlign: "center" }}>{error}</div>
              )}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "14px", fontWeight: 600, color: COLORES.grisOscuro, display: "block", marginBottom: "6px" }}>
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  placeholder="Min. 8 caracteres"
                  value={form.nueva}
                  onChange={e => setForm({ ...form, nueva: e.target.value })}
                  style={iSx}
                  onFocus={e => e.target.style.borderColor = COLORES.primario}
                  onBlur={e => e.target.style.borderColor = COLORES.grisSuave}
                />
              </div>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ fontSize: "14px", fontWeight: 600, color: COLORES.grisOscuro, display: "block", marginBottom: "6px" }}>
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  placeholder="Repite la nueva contraseña"
                  value={form.confirmar}
                  onChange={e => setForm({ ...form, confirmar: e.target.value })}
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
                {cargando ? "Guardando..." : "Restablecer contraseña"}
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
