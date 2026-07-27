import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { menuPorRol } from "../menu";

const EXPANDIDO = 260;
const COLAPSADO = 72;

const scrollStyle = `
.menu-scroll::-webkit-scrollbar { width: 4px; }
.menu-scroll::-webkit-scrollbar-track { background: transparent; }
.menu-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.2); border-radius: 4px; }
.menu-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.35); }
.menu-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.2) transparent; }
`;

export default function Sidebar({ abierto, setAbierto, isMobile }) {
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef(null);
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const menu = menuPorRol[usuario.rol] || [];

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAbierto(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  const ancho = isMobile ? EXPANDIDO : (abierto ? EXPANDIDO : COLAPSADO);

  const baseStyle = {
    background: "#1B5E20",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "8px 0 40px -4px rgba(0,0,0,.3)",
  };

  const mobileStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    width: EXPANDIDO,
    zIndex: 1300,
    transform: `translateX(${abierto ? 0 : '-100%'})`,
    transition: "transform .3s cubic-bezier(.4,0,.2,1)",
  };

  const desktopStyle = {
    width: ancho,
    flexShrink: 0,
    transition: "width .3s cubic-bezier(.4,0,.2,1)",
  };

  return (
    <aside style={{ ...baseStyle, ...(isMobile ? mobileStyle : desktopStyle) }}>
      <div style={{
        height: 78,
        padding: abierto ? "0 20px" : "0 12px",
        borderBottom: "1px solid rgba(255,255,255,.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: abierto ? "space-between" : "center",
        boxSizing: "border-box",
        flexShrink: 0,
        overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
          <img src="/logo.png" alt="Dusakawi" style={{ width: 38, height: 38, objectFit: "contain", flexShrink: 0 }} />
          {abierto && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, whiteSpace: "nowrap" }}>Dusakawi EPSI</div>
              <div style={{ color: "rgba(255,255,255,.5)", fontSize: 11, whiteSpace: "nowrap" }}>Control de asistencia</div>
            </div>
          )}
        </div>
        {abierto && !isMobile && (
          <button onClick={() => setAbierto(false)} style={{
            border: "none", background: "rgba(255,255,255,.1)",
            color: "#fff", borderRadius: 8, width: 30, height: 30,
            cursor: "pointer", fontSize: 16, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>✕</button>
        )}
      </div>

      <style>{scrollStyle}</style>
      <div className="menu-scroll" style={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        padding: abierto ? "20px 16px" : "20px 0",
      }}>
        {menu.map((grupo) => (
          <div key={grupo.section} style={{ marginBottom: 20 }}>
            {abierto && (
              <div style={{
                color: "rgba(255,255,255,.35)",
                fontSize: 10, fontWeight: 700,
                letterSpacing: "1.5px", marginBottom: 8,
                paddingLeft: 12,
              }}>
                {grupo.section}
              </div>
            )}
            {grupo.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => { if (isMobile) setAbierto(false); }}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  justifyContent: abierto ? "flex-start" : "center",
                  gap: 12,
                  textDecoration: "none",
                  borderRadius: 10,
                  marginBottom: 3,
                  marginLeft: abierto ? 0 : 8,
                  marginRight: abierto ? 0 : 8,
                  padding: abierto ? "10px 14px" : "10px 0",
                  color: isActive ? "#fff" : "rgba(255,255,255,.7)",
                  background: isActive ? "rgba(255,255,255,.13)" : "transparent",
                  transition: "all .2s",
                })}
              >
                <div style={{ display: "flex", opacity: 0.9, flexShrink: 0 }}>{item.icon}</div>
                {abierto && <span style={{ fontSize: 14, whiteSpace: "nowrap" }}>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <div ref={menuRef} style={{
        borderTop: "1px solid rgba(255,255,255,.08)",
        padding: abierto ? 16 : "16px 0",
      }}>
        <button onClick={() => setMenuAbierto(!menuAbierto)} style={{
          width: "100%", border: "none", background: "transparent",
          color: "#fff", display: "flex", alignItems: "center",
          justifyContent: abierto ? "flex-start" : "center",
          gap: 12, cursor: "pointer",
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "rgba(255,255,255,.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 14, flexShrink: 0,
          }}>
            {usuario.nombre ? usuario.nombre[0].toUpperCase() : "U"}
          </div>
          {abierto && (
            <div style={{ flex: 1, textAlign: "left", overflow: "hidden" }}>
              <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {usuario.nombre || "Usuario"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {usuario.rol}
              </div>
            </div>
          )}
        </button>
        {menuAbierto && abierto && (
          <div style={{ marginTop: 10, borderRadius: 10, background: "#fff", overflow: "hidden" }}>
            <button onClick={handleLogout} style={{
              width: "100%", border: "none", background: "transparent",
              padding: 11, cursor: "pointer", color: "#dc2626", fontSize: 13, fontWeight: 500,
            }}>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
