import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Bell, User, Settings, LogOut } from "lucide-react";
import {
  Menu as MuiMenu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";

const TITULOS = {
  "/dashboard": "Panel",
  "/asistencia": "Asistencia",
  "/reportes": "Reportes",
  "/usuarios": "Usuarios",
  "/cargos": "Cargos",
  "/empleados": "Empleados",
  "/horarios": "Horarios",
  "/areas": "Áreas",
  "/incidencias": "Incidencias",
  "/indicadores": "Indicadores",
  "/configuracion": "Configuración",
  "/perfil": "Mi perfil",
};

export default function Navbar({ abierto, setAbierto, isMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const titulo = TITULOS[location.pathname] || "Panel";
  const inicial = usuario.nombre ? usuario.nombre[0].toUpperCase() : "U";
  const [menuAnchor, setMenuAnchor] = useState(null);

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
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
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
          <Menu size={22} color="#374151" />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, color: "#111827", fontWeight: 700, lineHeight: 1.2 }}>{titulo}</h2>
          {!isMobile && <span style={{ fontSize: 12, color: "#9CA3AF" }}>{fecha}</span>}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 20 }}>
        <Bell size={19} color="#6B7280" style={{ cursor: "pointer" }} />
        <div
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "#1B5E20", color: "#fff",
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
          PaperProps={{
            sx: { borderRadius: "12px", mt: 1, minWidth: 200, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
          }}
        >
          <MenuItem onClick={() => { setMenuAnchor(null); navigate("/perfil"); }}>
            <ListItemIcon><User size={18} /></ListItemIcon>
            <ListItemText>Mi perfil</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setMenuAnchor(null); navigate("/configuracion"); }}>
            <ListItemIcon><Settings size={18} /></ListItemIcon>
            <ListItemText>Configuración</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon><LogOut size={18} color="#DC2626" /></ListItemIcon>
            <ListItemText sx={{ color: "#DC2626" }}>Cerrar sesión</ListItemText>
          </MenuItem>
        </MuiMenu>
      </div>
    </header>
  );
}
