import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { menuPorRol } from "../../config/menu";

const SIDEBAR_WIDTH = 260;
const SIDEBAR_WIDTH_COLLAPSED = 70;

export default function Sidebar({ abierto }) {
  const navigate = useNavigate();

  const [menuAbierto, setMenuAbierto] = useState(false);

  const menuRef = useRef(null);

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  const menu = menuPorRol[usuario.rol] || [];

  useEffect(() => {
    const handleClick = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setMenuAbierto(false);
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClick
      );
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  return (
    <aside
      style={{
        width: abierto
          ? SIDEBAR_WIDTH
          : SIDEBAR_WIDTH_COLLAPSED,

        height: "100vh",

        background: "#1B5E20",

        display: "flex",

        flexDirection: "column",

        transition: ".25s",

        overflow: "hidden",

        flexShrink: 0,
      }}
    >
      {/* Logo */}

      <div
        style={{
          padding: "24px 20px",
          borderBottom:
            "1px solid rgba(255,255,255,.08)",

          display: "flex",

          alignItems: "center",

          gap: "12px",
        }}
      >
        <img
          src="/logo.png"
          alt="Dusakawi"
          style={{
            width: 50,
            height: 50,
            objectFit: "contain",
          }}
        />

        {abierto && (
          <div>

            <div
              style={{
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              Dusakawi EPSI
            </div>

            <div
              style={{
                color: "rgba(255,255,255,.6)",
                fontSize: 12,
              }}
            >
              Control de asistencia
            </div>

          </div>
        )}
      </div>

      {/* MENÚ */}

      <div
        style={{
          flex: 1,

          overflowY: "auto",

          padding: "20px 12px",
        }}
      >
        {menu.map((grupo) => (

          <div
            key={grupo.section}
            style={{
              marginBottom: 24,
            }}
          >

            {abierto && (
              <div
                style={{
                  color:
                    "rgba(255,255,255,.45)",

                  fontSize: 11,

                  fontWeight: 700,

                  letterSpacing: 1,

                  marginBottom: 10,

                  paddingLeft: 12,
                }}
              >
                {grupo.section}
              </div>
            )}

            {grupo.items.map((item) => (

              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: "flex",

                  alignItems: "center",

                  gap: 12,

                  textDecoration: "none",

                  borderRadius: 10,

                  marginBottom: 4,

                  padding: abierto
                    ? "11px 14px"
                    : "11px",

                  justifyContent: abierto
                    ? "flex-start"
                    : "center",

                  color: isActive
                    ? "#fff"
                    : "rgba(255,255,255,.75)",

                  background: isActive
                    ? "rgba(255,255,255,.12)"
                    : "transparent",

                  transition: ".2s",
                })}
              >
                {item.icon}

                {abierto && (
                  <span
                    style={{
                      fontSize: 14,
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </NavLink>

            ))}

          </div>

        ))}
      </div>

      {/* PERFIL */}

      <div
        ref={menuRef}
        style={{
          borderTop:
            "1px solid rgba(255,255,255,.08)",

          padding: 16,
        }}
      >
        <button
          onClick={() =>
            setMenuAbierto(!menuAbierto)
          }
          style={{
            width: "100%",

            border: "none",

            background: "transparent",

            color: "#fff",

            display: "flex",

            alignItems: "center",

            gap: 12,

            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 40,

              height: 40,

              borderRadius: "50%",

              background:
                "rgba(255,255,255,.15)",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              fontWeight: 700,
            }}
          >
            {usuario.nombre
              ? usuario.nombre[0].toUpperCase()
              : "U"}
          </div>

          {abierto && (

            <div
              style={{
                flex: 1,

                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontSize: 14,

                  fontWeight: 600,
                }}
              >
                {usuario.nombre ||
                  "Usuario"}
              </div>

              <div
                style={{
                  fontSize: 11,

                  color:
                    "rgba(255,255,255,.6)",
                }}
              >
                {usuario.rol}
              </div>
            </div>

          )}
        </button>

        {menuAbierto && (

          <div
            style={{
              marginTop: 12,

              borderRadius: 10,

              background: "#fff",

              overflow: "hidden",
            }}
          >
            <button
              onClick={handleLogout}
              style={{
                width: "100%",

                border: "none",

                background: "transparent",

                padding: 12,

                cursor: "pointer",

                color: "#dc2626",
              }}
            >
              Cerrar sesión
            </button>

          </div>

        )}

      </div>

    </aside>
  );
}