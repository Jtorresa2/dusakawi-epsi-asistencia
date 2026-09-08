import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { menuPorRol } from "../menu";
import { COLORES } from "../constants/colores.js";

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
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef(null);
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const menu = menuPorRol[usuario.rol] || [];

  const [seccionesAbiertas, setSeccionesAbiertas] = useState(() => {
    const inicial = {};
    menu.forEach((grupo) => {
      inicial[grupo.section] = false;
    });
    const grupoActivo = menu.find((grupo) =>
      grupo.items.some((item) => item.path === location.pathname)
    );
    if (grupoActivo) inicial[grupoActivo.section] = true;
    return inicial;
  });

  const toggleSeccion = (section) => {
    setSeccionesAbiertas((prev) => ({ ...prev, [section]: !prev[section] }));
  };

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
    background: COLORES.primarioOscuro,
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

  const renderItem = (item) => (
    <NavLink
      key={item.path}
      to={item.path}
      title={!abierto ? item.label : undefined}
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
        color: isActive ? COLORES.fondoBlanco : "rgba(255,255,255,.7)",
        background: isActive ? "rgba(255,255,255,.13)" : "transparent",
        transition: "all .2s",
      })}
    >
      <div style={{ display: "flex", opacity: 0.9, flexShrink: 0 }}>{item.icon}</div>
      {abierto && <span style={{ fontSize: 14, whiteSpace: "nowrap" }}>{item.label}</span>}
    </NavLink>
  );

  const renderGrupo = (grupo) => {
    if (grupo.items.length === 1 && !grupo.accordion) {
      return (
        <div key={grupo.section} style={{ marginBottom: 20 }}>
          <div style={{
            color: "rgba(255,255,255,.65)",
            fontSize: 10, fontWeight: 700,
            letterSpacing: "1.5px", marginBottom: 8,
            paddingLeft: 12,
          }}>
            {grupo.section}
          </div>
          {renderItem(grupo.items[0])}
        </div>
      );
    }

    const abierta = !!seccionesAbiertas[grupo.section];

    return (
      <div key={grupo.section} style={{ marginBottom: 20 }}>
        <button
          onClick={() => toggleSeccion(grupo.section)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: "none",
            background: "transparent",
            color: "rgba(255,255,255,.65)",
            fontSize: 10, fontWeight: 700,
            letterSpacing: "1.5px",
            marginBottom: 8,
            padding: "0 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{grupo.section}</span>
          {abierta ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <div style={{
          display: "grid",
          gridTemplateRows: abierta ? "1fr" : "0fr",
          transition: "grid-template-rows .3s ease",
        }}>
          <div style={{ overflow: "hidden", minHeight: 0 }}>
            {grupo.items.map(renderItem)}
          </div>
        </div>
      </div>
    );
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
              <div style={{ color: COLORES.fondoBlanco, fontWeight: 700, fontSize: 15, whiteSpace: "nowrap" }}>Dusakawi EPSI</div>
              <div style={{ color: "rgba(255,255,255,.5)", fontSize: 11, whiteSpace: "nowrap" }}>Control de asistencia</div>
            </div>
          )}
        </div>
        {abierto && !isMobile && (
          <button onClick={() => setAbierto(false)} style={{
            border: "none", background: "rgba(255,255,255,.1)",
            color: COLORES.fondoBlanco, borderRadius: 8, width: 30, height: 30,
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
        {!abierto
          ? menu.map((grupo) => (
              <div key={grupo.section} style={{ marginBottom: 20 }}>
                {grupo.items.map(renderItem)}
              </div>
            ))
          : menu.map(renderGrupo)}
      </div>

      <div ref={menuRef} style={{
        position: "relative",
        borderTop: "1px solid rgba(255,255,255,.08)",
        padding: abierto ? 16 : "16px 0",
      }}>
        <button onClick={() => setMenuAbierto(!menuAbierto)} style={{
          width: "100%", border: "none", background: "transparent",
          color: COLORES.fondoBlanco, display: "flex", alignItems: "center",
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
          <div style={{
            position: "absolute",
            bottom: 68,
            left: 16,
            right: 16,
            borderRadius: 10,
            background: COLORES.fondoBlanco,
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
            overflow: "hidden",
            zIndex: 10,
          }}>
            <button onClick={handleLogout} style={{
              width: "100%", border: "none", background: "transparent",
              padding: 11, cursor: "pointer", color: COLORES.danger, fontSize: 13, fontWeight: 600,
            }}>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}