import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Chip, Button, Grid, Snackbar, Alert,
} from "@mui/material";
import { ShieldCheck, Badge, UserRound } from "lucide-react";
import { obtenerRoles } from "../roles.api";
import RolDrawer from "../components/RolDrawer";

const ROL_ESTILO = {
  Administrador: { icon: <ShieldCheck size={22} />, bg: "#FFF3E0", color: "#E65100" },
  "Talento Humano": { icon: <Badge size={22} />, bg: "#E8F5E9", color: "#1B5E20" },
  Empleado: { icon: <UserRound size={22} />, bg: "#E3F2FD", color: "#0D47A1" },
};

const estiloFallback = { icon: <ShieldCheck />, bg: "#F3F4F6", color: "#374151" };

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [snack, setSnack] = useState(null);

  const cargarRoles = async () => {
    try {
      setCargando(true);
      const data = await obtenerRoles();
      setRoles(data.roles || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Error al cargar los roles");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarRoles(); }, []);

  const handleGuardado = (mensaje) => {
    setRolSeleccionado(null);
    cargarRoles();
    setSnack({ tipo: "success", mensaje });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* ENCABEZADO */}
      <Box>
        <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>Inicio / Gestión del Sistema / Roles</Typography>
        <Typography sx={{ fontSize: 14, color: "#6B7280", mt: 0.5 }}>
          Consulta y administra los permisos asignados a cada rol del sistema.
        </Typography>
      </Box>

      {/* TARJETAS */}
      {cargando ? (
        <Typography sx={{ fontSize: 14, color: "#9CA3AF", py: 6, textAlign: "center" }}>Cargando roles...</Typography>
      ) : error ? (
        <Typography sx={{ fontSize: 14, color: "#DC2626", py: 6, textAlign: "center" }}>{error}</Typography>
      ) : (
        <Grid container spacing={2}>
          {roles.map((r) => {
            const estilo = ROL_ESTILO[r.nombre] || estiloFallback;
            return (
              <Grid item key={r.id} xs={12} sm={6} lg={4}>
                <Paper
                  elevation={0}
                  onClick={() => setRolSeleccionado(r)}
                  sx={{
                    p: 2.5,
                    borderRadius: "16px",
                    border: "1px solid #ECECEC",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    cursor: "pointer",
                    transition: "all .25s ease",
                    height: "100%",
                    "&:hover": { transform: "translateY(-3px)", boxShadow: "0 8px 25px rgba(0,0,0,.07)" },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: estilo.bg, color: estilo.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {estilo.icon}
                    </Box>
                    <Chip label="Activo" size="small" sx={{ height: 20, fontSize: 11, fontWeight: 600, bgcolor: "#D1FAE5", color: "#065F46" }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{r.nombre}</Typography>
                    <Typography sx={{ fontSize: 12, color: "#6B7280", mt: 0.5, lineHeight: 1.5, minHeight: 36 }}>
                      {r.descripcion || "Sin descripción"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: "auto" }}>
                    <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
                      <strong style={{ color: "#111827", fontSize: 14 }}>{Number(r.cantidad_usuarios) || 0}</strong> usuarios
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => { e.stopPropagation(); setRolSeleccionado(r); }}
                      sx={{ borderRadius: "8px", textTransform: "none", fontSize: 12, fontWeight: 600, color: "#1B5E20", borderColor: "#86B886", "&:hover": { borderColor: "#1B5E20", bgcolor: "#F0FDF4" } }}
                    >
                      Ver detalles
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* DRAWER */}
      <RolDrawer
        open={!!rolSeleccionado}
        rol={rolSeleccionado}
        onClose={() => setRolSeleccionado(null)}
        onSuccess={handleGuardado}
        onError={(mensaje) => setSnack({ tipo: "error", mensaje })}
      />

      {/* SNACKBAR */}
      <Snackbar
        open={!!snack}
        autoHideDuration={3500}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snack?.tipo || "success"} variant="filled" onClose={() => setSnack(null)} sx={{ borderRadius: "10px", fontSize: 13, fontWeight: 500 }}>
          {snack?.mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
}
