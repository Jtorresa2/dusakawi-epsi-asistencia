import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Chip, Button, Snackbar, Alert, Divider,
} from "@mui/material";
import { ShieldCheck, Badge, UserRound, Plus, Eye, Info, Layers, Users } from "lucide-react";
import { obtenerRoles, obtenerPermisosRol } from "../roles.api";
import RolDrawer from "../components/RolDrawer";
import { MODULOS_PERMISOS, ACCIONES } from "../config/modulosPermisos";
import { COLORES } from "../../../shared/constants/colores.js";

const ROL_ESTILO = {
  Administrador: { icon: <ShieldCheck size={26} />, bg: COLORES.warningFondo, color: COLORES.warningOscuro },
  "Talento Humano": { icon: <Badge size={26} />, bg: COLORES.primarioClaro, color: COLORES.primarioOscuro },
};

const estiloFallback = { icon: <ShieldCheck size={26} />, bg: COLORES.fondoGris2, color: COLORES.textoSecundario };

const todosModulos = MODULOS_PERMISOS.flatMap((s) => s.modulos);

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [permisosPorRol, setPermisosPorRol] = useState({});
  const [rolDrawer, setRolDrawer] = useState(null);
  const [snack, setSnack] = useState(null);

  const cargarRoles = async () => {
    try {
      setCargando(true);
      const data = await obtenerRoles();
      const lista = data.roles || [];
      setRoles(lista);
      setError(null);

      // Permisos reales por rol (para contar módulos con acceso y mostrar la matriz)
      const mapa = {};
      await Promise.all(
        lista.map(async (r) => {
          try {
            const res = await obtenerPermisosRol(r.id);
            mapa[r.id] = new Set(res.permissions || []);
          } catch {
            mapa[r.id] = new Set();
          }
        })
      );
      setPermisosPorRol(mapa);
    } catch (err) {
      setError(err.message || "Error al cargar los roles");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarRoles(); }, []);

  const contarModulos = (rol) => {
    const set = permisosPorRol[rol.id] || new Set();
    return todosModulos.filter((m) => ACCIONES.some((a) => set.has(`${m.clave}.${a}`))).length;
  };

  const handleGuardado = (mensaje) => {
    setRolDrawer(null);
    cargarRoles();
    setSnack({ tipo: "success", mensaje });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* ENCABEZADO */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography sx={{ fontSize: 13, color: COLORES.textoMuted, mb: 0.5 }}>
            Inicio / Gestión del Sistema / Roles
          </Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: COLORES.textoPrimario }}>
            Roles del sistema
          </Typography>
          <Typography sx={{ fontSize: 13, color: COLORES.textoTerciario, mt: 0.3 }}>
            Administra los roles y permisos que definen el acceso y las acciones dentro del sistema.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={17} />}
          onClick={() => setSnack({ tipo: "info", mensaje: "La creación de roles se administra desde la base de datos del sistema" })}
          sx={{ borderRadius: "11px", textTransform: "none", fontWeight: 600, fontSize: 13.5, px: 3, height: 42, bgcolor: COLORES.primarioOscuro, "&:hover": { bgcolor: COLORES.primario } }}
        >
          Nuevo rol
        </Button>
      </Box>

      {/* TARJETAS */}
      {cargando ? (
        <Typography sx={{ fontSize: 14, color: COLORES.textoSuave, py: 6, textAlign: "center" }}>Cargando roles...</Typography>
      ) : error ? (
        <Typography sx={{ fontSize: 14, color: COLORES.danger, py: 6, textAlign: "center" }}>{error}</Typography>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }, gap: 2.5 }}>
          {roles.map((r) => {
            const estilo = ROL_ESTILO[r.nombre] || estiloFallback;
            const modulos = contarModulos(r);
            const usuarios = Number(r.cantidad_usuarios) || 0;
            return (
              <Paper
                key={r.id}
                elevation={0}
                sx={{
                  p: 2.75,
                  borderRadius: "18px",
                  border: `1px solid ${COLORES.grisContorno}`,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  transition: "all .25s ease",
                  "&:hover": { transform: "translateY(-3px)", boxShadow: "0 8px 25px rgba(0,0,0,.07)" },
                }}
              >
                {/* Icono + estado */}
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: "13px", bgcolor: estilo.bg, color: estilo.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {estilo.icon}
                  </Box>
                  <Chip label="Activo" size="small" sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: COLORES.successFondo, color: COLORES.verdeTexto }} />
                </Box>

                {/* Nombre */}
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: COLORES.textoPrimario, mt: 1.75 }}>
                  {r.nombre}
                </Typography>

                {/* Descripción */}
                <Typography sx={{ fontSize: 12.5, color: COLORES.textoTerciario, mt: 0.5, lineHeight: 1.55, flexGrow: 1 }}>
                  {r.descripcion || "Rol del sistema de gestión de asistencia y Talento Humano."}
                </Typography>

                {/* Resumen módulos / usuarios */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mt: 2, mb: 2 }}>
                  <Box sx={{ p: 1.5, borderRadius: "12px", border: `1px solid ${COLORES.grisContorno}`, bgcolor: COLORES.fondoBlanco }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 0.5 }}>
                      <Layers size={13} style={{ color: COLORES.primarioOscuro }} />
                      <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        Módulos con acceso
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 17, fontWeight: 700, color: COLORES.textoPrimario, lineHeight: 1.1 }}>
                      {modulos}
                      <Typography component="span" sx={{ fontSize: 12, fontWeight: 500, color: COLORES.textoTerciario, ml: 0.5 }}>
                        módulos
                      </Typography>
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, borderRadius: "12px", border: `1px solid ${COLORES.grisContorno}`, bgcolor: COLORES.fondoBlanco }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 0.5 }}>
                      <Users size={13} style={{ color: COLORES.primarioOscuro }} />
                      <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        Usuarios asignados
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 17, fontWeight: 700, color: COLORES.textoPrimario, lineHeight: 1.1 }}>
                      {usuarios}
                      <Typography component="span" sx={{ fontSize: 12, fontWeight: 500, color: COLORES.textoTerciario, ml: 0.5 }}>
                        usuarios
                      </Typography>
                    </Typography>
                  </Box>
                </Box>

                {/* Separador + acción */}
                <Divider sx={{ borderColor: COLORES.grisContorno }} />
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 1.75 }}>
                  <Typography sx={{ fontSize: 12, color: COLORES.textoSuave }}>
                    Matriz de permisos
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Eye size={14} />}
                    onClick={() => setRolDrawer(r)}
                    sx={{ borderRadius: "9px", textTransform: "none", fontSize: 12.5, fontWeight: 600, px: 2, py: 0.7, color: COLORES.primarioOscuro, borderColor: COLORES.acento, "&:hover": { borderColor: COLORES.primarioOscuro, bgcolor: COLORES.successClaro } }}
                  >
                    Ver detalles
                  </Button>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* SECCIÓN INFORMATIVA */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", gap: 1.5, alignItems: "flex-start", bgcolor: COLORES.fondoBlanco }}>
        <Box sx={{ width: 32, height: 32, borderRadius: "10px", bgcolor: COLORES.primarioClaro, color: COLORES.primarioOscuro, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Info size={16} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORES.textoPrimario }}>
            Administración de roles
          </Typography>
          <Typography sx={{ fontSize: 12, color: COLORES.textoTerciario, mt: 0.3, lineHeight: 1.55 }}>
            Los roles determinan qué módulos y acciones puede ejecutar cada usuario dentro del sistema. Los tres roles
            (Administrador, Talento Humano y Empleado) son fijos de la plataforma; sus permisos pueden ajustarse desde
            "Ver detalles" en cada tarjeta.
          </Typography>
        </Box>
      </Paper>

      {/* DRAWER ROL (ver + editar) */}
      <RolDrawer
        open={!!rolDrawer}
        rol={rolDrawer}
        permisosIniciales={rolDrawer ? permisosPorRol[rolDrawer.id] : null}
        onClose={() => setRolDrawer(null)}
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
