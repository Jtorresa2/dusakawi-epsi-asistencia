import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, User, Settings, LogOut } from "lucide-react";
import {
  Menu as MuiMenu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { COLORES } from "../constants/colores.js";

const TITULOS = {
  "/dashboard": "Panel",
  "/asistencia": "Asistencia",
  "/seguimiento": "Seguimiento de Asistencia",
  "/reportes": "Reportes",
  "/personal": "Personal",
  "/cargos": "Cargos",
  "/horarios": "Horarios",
  "/areas": "Áreas",
  "/novedades": "Novedades Laborales",
  "/festivos": "Festivos",
  "/configuracion": "Configuración",
  "/roles": "Roles",
  "/copias-seguridad": "Copias de Seguridad",
  "/perfil": "Mi perfil",
};

export default function Navbar({ abierto, setAbierto, isMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const titulo = TITULOS[location.pathname] || "Panel";
  const inicial = usuario.nombre ? usuario.nombre[0].toUpperCase() : "U";
  const [menuAnchor, setMenuAnchor] = useState(null);
  const rol = usuario.rol;

  const fecha = new Date().toLocaleDateString("es-CO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  return (
    <header
      style={{
        height: 78,
        background: COLORES.fondoBlanco,
        borderBottom: `1px solid ${COLORES.borde}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: isMobile ? "0 16px" : "0 32px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 20 }}>
        <button onClick={() => setAbierto(!abierto)} style={{
          border: "none", background: "transparent", cursor: "pointer", padding: 6,
        }}>
          <Menu size={22} color={COLORES.textoSecundario} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, color: COLORES.textoPrimario, fontWeight: 700, lineHeight: 1.2 }}>{titulo}</h2>
          {!isMobile && <span style={{ fontSize: 12, color: COLORES.textoSuave }}>{fecha}</span>}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 20 }}>
        <div
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: COLORES.primarioOscuro, color: COLORES.fondoBlanco,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}
        >
          {inicial}
        </div>

        <MuiMenu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          slotProps={{
            paper: { sx: { borderRadius: "12px", mt: 1, minWidth: 200, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } },
          }}
        >
          <MenuItem onClick={() => { setMenuAnchor(null); navigate("/perfil"); }}>
            <ListItemIcon><User size={18} /></ListItemIcon>
            <ListItemText>Mi perfil</ListItemText>
          </MenuItem>
          {rol === "admin" && (
            <MenuItem onClick={() => { setMenuAnchor(null); navigate("/configuracion"); }}>
              <ListItemIcon><Settings size={18} /></ListItemIcon>
              <ListItemText>Configuración</ListItemText>
            </MenuItem>
          )}
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon><LogOut size={18} color={COLORES.danger} /></ListItemIcon>
            <ListItemText sx={{ color: COLORES.danger }}>Cerrar sesión</ListItemText>
          </MenuItem>
        </MuiMenu>
      </div>
    </header>
  );
}