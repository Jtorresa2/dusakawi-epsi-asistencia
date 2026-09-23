import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Bell, User, Settings, LogOut, AlertTriangle } from "lucide-react";
import {
  Menu as MuiMenu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Popover,
  Box,
  Typography,
  Badge,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText as MuiListItemText,
} from "@mui/material";
import { obtenerIncidencias } from "../../features/incidencias/incidencia.api";
import { COLORES } from "../constants/colores.js";

const TIPOS_ALERTA = {
  falla_biometrica: "Falla biométrica",
  tardanza_justificada: "Tardanza justificada",
  otro: "Otro",
};

function formatFechaCorta(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }); }
  catch { return "—"; }
}

const TITULOS = {
  "/dashboard": "Panel",
  "/asistencia": "Asistencia",
  "/reportes": "Reportes",
  "/personal": "Personal",
  "/cargos": "Cargos",
  "/horarios": "Horarios",
  "/areas": "Áreas",
  "/incidencias": "Incidencias",
  "/configuracion": "Configuración",
  "/copias-seguridad": "Copias de Seguridad",
  "/perfil": "Mi perfil",
  "/mi-asistencia": "Mi asistencia",
  "/reportar-incidencia": "Reportar incidencia",
  "/novedades": "Novedades Laborales",
  "/mis-solicitudes": "Mis solicitudes",
  "/integraciones": "Integraciones",
  "/seguimiento": "Seguimiento de Asistencia",
  "/festivos": "Festivos",
  "/roles": "Roles",
  "/mi-horario": "Mi horario",
};

export default function Navbar({ abierto, setAbierto, isMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const titulo =
    TITULOS[location.pathname] ||
    (location.pathname.startsWith("/incidencias/") ? "Incidencias" : "Panel");
  const inicial = usuario.nombre ? usuario.nombre[0].toUpperCase() : "U";
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [alertas, setAlertas] = useState([]);

  const rol = usuario.rol;
  const puedeVerAlertas = rol === "admin" || rol === "talento_humano";

  useEffect(() => {
    let montado = true;

    const cargarAlertas = async () => {
      if (!puedeVerAlertas) return;
      try {
        const data = await obtenerIncidencias({ estado: "pending", prioridad: "high" });
        if (montado) setAlertas(Array.isArray(data) ? data : []);
      } catch {
        // silencioso
      }
    };

    cargarAlertas();
    const intervalo = setInterval(cargarAlertas, 30000);

    return () => {
      montado = false;
      clearInterval(intervalo);
    };
  }, [puedeVerAlertas]);

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
        <Box sx={{ position: "relative", display: "inline-flex" }}>
          <Badge
            badgeContent={puedeVerAlertas ? alertas.length : 0}
            color="error"
            overlap="circular"
            slotProps={{ badge: { sx: { fontSize: 10, minWidth: 16, height: 16, fontWeight: 700, display: alertas.length > 0 ? "flex" : "none" } } }}
          >
            <Bell size={19} color={COLORES.textoTerciario} style={{ cursor: "pointer" }} onClick={(e) => setNotifAnchor(e.currentTarget)} />
          </Badge>
        </Box>

        <Popover
          open={Boolean(notifAnchor)}
          anchorEl={notifAnchor}
          onClose={() => setNotifAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ paper: { sx: { borderRadius: "12px", mt: 1, width: 320, maxHeight: 360, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } } }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${COLORES.grisContorno}` }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORES.textoPrimario }}>
              Alertas pendientes
            </Typography>
            <Typography sx={{ fontSize: 11, color: COLORES.textoSuave }}>
              {alertas.length > 0 ? `${alertas.length} incidencias de alta prioridad` : "Sin alertas"}
            </Typography>
          </Box>
          {alertas.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <AlertTriangle size={24} color={COLORES.borde2} />
              <Typography sx={{ mt: 1, fontSize: 12, color: COLORES.textoSuave }}>No hay alertas pendientes</Typography>
            </Box>
          ) : (
            <List disablePadding sx={{ maxHeight: 260, overflowY: "auto" }}>
              {alertas.slice(0, 10).map((a) => (
                <ListItemButton key={a.id} divider sx={{ px: 2, py: 1.2 }} onClick={() => { setNotifAnchor(null); navigate("/incidencias"); }}>
                  <ListItemAvatar sx={{ minWidth: 36 }}>
                    <Avatar sx={{ width: 28, height: 28, bgcolor: COLORES.dangerFondo, color: COLORES.danger, fontSize: 12 }}>
                      <AlertTriangle size={14} />
                    </Avatar>
                  </ListItemAvatar>
                  <MuiListItemText
                    primary={`${a.empleado_nombre || "—"} ${a.apellido || ""}`}
                    secondary={`${a.tipo ? TIPOS_ALERTA[a.tipo] || a.tipo : ""} · ${formatFechaCorta(a.fecha)}`}
                    primaryTypographyProps={{ fontSize: 13, fontWeight: 600, color: COLORES.textoPrimario }}
                    secondaryTypographyProps={{ fontSize: 11, color: COLORES.textoSuave }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Popover>
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