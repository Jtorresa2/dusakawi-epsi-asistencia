import { useState, useEffect } from "react";
import {
  Drawer, Box, Typography, Chip, IconButton, Tabs, Tab, TextField,
  Button, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, FormControlLabel, Tooltip, CircularProgress,
} from "@mui/material";
import { X, Pencil, Check, Minus, Save, ShieldCheck, Badge, UserRound } from "lucide-react";
import { MODULOS_PERMISOS, ACCIONES } from "../config/modulosPermisos";
import { obtenerPermisosRol, guardarRol } from "../roles.api";
import { COLORES } from "../../../shared/constants/colores.js";

const ACCION_LABELS = {
  ver: "Ver",
  crear: "Crear",
  editar: "Editar",
  eliminar: "Eliminar",
  aprobar: "Aprobar",
  exportar: "Exportar",
};

const ROL_ICON = {
  Administrador: { icon: <ShieldCheck size={22} />, bg: COLORES.warningFondo, color: COLORES.warningOscuro },
  "Talento Humano": { icon: <Badge size={22} />, bg: COLORES.primarioClaro, color: COLORES.primarioOscuro },
  Empleado: { icon: <UserRound size={22} />, bg: COLORES.primarioClaro, color: COLORES.primarioOscuro },
};
const fallbackIcon = { icon: <ShieldCheck size={22} />, bg: COLORES.fondoGris2, color: COLORES.textoSecundario };

const verdeBoton = { bgcolor: COLORES.primarioOscuro, "&:hover": { bgcolor: COLORES.primario } };

// Drawer unificado de rol: modo "ver" (matriz de solo lectura ✓/—) y modo "editar"
// (información + permisos con checkboxes). El flujo de edición existente se mantiene.
export default function RolDrawer({ open, rol, permisosIniciales, onClose, onSuccess, onError }) {
  const [modo, setModo] = useState("ver"); // "ver" | "editar"
  const [tab, setTab] = useState(0);
  const [descripcion, setDescripcion] = useState("");
  const [permisos, setPermisos] = useState(() => new Set());
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargarPermisos = async (id) => {
    setCargando(true);
    try {
      const data = await obtenerPermisosRol(id);
      setPermisos(new Set(data.permisos || []));
    } catch (err) {
      onError?.(err.message || "Error al cargar los permisos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (open && rol) {
      setModo("ver");
      setTab(0);
      setDescripcion(rol.descripcion || "");
      if (permisosIniciales && permisosIniciales.size) {
        setPermisos(new Set(permisosIniciales));
        setCargando(false);
      } else {
        cargarPermisos(rol.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rol]);

  const togglePermiso = (clave) => {
    setPermisos((prev) => {
      const next = new Set(prev);
      if (next.has(clave)) next.delete(clave);
      else next.add(clave);
      return next;
    });
  };

  const toggleSeccion = (seccion) => {
    const claves = seccion.modulos.flatMap((m) =>
      ACCIONES.map((a) => `${m.clave}.${a}`)
    );
    setPermisos((prev) => {
      const next = new Set(prev);
      const todasMarcadas = claves.every((c) => next.has(c));
      if (todasMarcadas) claves.forEach((c) => next.delete(c));
      else claves.forEach((c) => next.add(c));
      return next;
    });
  };

  const seccionCompleta = (seccion) => {
    const claves = seccion.modulos.flatMap((m) =>
      ACCIONES.map((a) => `${m.clave}.${a}`)
    );
    return claves.every((c) => permisos.has(c));
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const lista = [];
      MODULOS_PERMISOS.forEach((seccion) =>
        seccion.modulos.forEach((m) =>
          ACCIONES.forEach((a) => {
            if (permisos.has(`${m.clave}.${a}`)) lista.push(`${m.clave}.${a}`);
          })
        )
      );
      await guardarRol(rol.id, { descripcion, permisos: lista });
      onSuccess?.("Cambios guardados correctamente");
    } catch (err) {
      onError?.(err.message || "Error al guardar los cambios");
    } finally {
      setGuardando(false);
    }
  };

  if (!rol) return null;

  const estilo = ROL_ICON[rol.nombre] || fallbackIcon;
  const activos = (modulo) => ACCIONES.filter((a) => permisos.has(`${modulo.clave}.${a}`)).length;
  const modulosConAcceso = MODULOS_PERMISOS.flatMap((s) => s.modulos).filter((m) => activos(m) > 0).length;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: { sx: { bgcolor: "rgba(17,24,39,0.12)" } },
        paper: {
          sx: {
            width: { xs: "100%", sm: 680 },
            borderLeft: `1px solid ${COLORES.grisContorno}`,
            borderRadius: 0,
            background: COLORES.fondoBlanco,
          },
        },
      }}
    >
      {/* HEADER */}
      <Box sx={{ px: 3, py: 1.75, display: "flex", alignItems: "center", gap: 1.5, borderBottom: `1px solid ${COLORES.grisContorno}` }}>
        <Box sx={{ width: 42, height: 42, borderRadius: "12px", bgcolor: estilo.bg, color: estilo.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {estilo.icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: COLORES.textoPrimario }}>{rol.nombre}</Typography>
            <Chip label="Activo" size="small" sx={{ height: 20, fontSize: 11, fontWeight: 600, bgcolor: COLORES.successFondo, color: COLORES.verdeTexto }} />
          </Box>
          <Typography sx={{ fontSize: 12, color: COLORES.textoTerciario, mt: 0.2 }}>
            {rol.descripcion || "Sin descripción"}
          </Typography>
        </Box>
        <IconButton aria-label="Cerrar" onClick={onClose} size="small" sx={{ color: COLORES.textoSuave, "&:hover": { color: COLORES.textoTerciario, bgcolor: COLORES.fondoGris2 } }}>
          <X size={20} />
        </IconButton>
      </Box>

      {/* RESUMEN */}
      <Box sx={{ px: 3, py: 1.5, display: "flex", gap: 2, borderBottom: `1px solid ${COLORES.grisContorno}`, bgcolor: COLORES.fondoGris }}>
        <Box>
          <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase", letterSpacing: "0.03em" }}>Usuarios asignados</Typography>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario, mt: 0.3 }}>
            {Number(rol.cantidad_usuarios) || 0} usuarios
          </Typography>
        </Box>
        <Box sx={{ width: 1, bgcolor: COLORES.grisContorno }} />
        <Box>
          <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase", letterSpacing: "0.03em" }}>Módulos con acceso</Typography>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario, mt: 0.3 }}>
            {modulosConAcceso} módulos
          </Typography>
        </Box>
      </Box>

      {/* MODO VER: tabs de edición / badge de solo lectura */}
      {modo === "ver" ? (
        <Box sx={{ px: 3, py: 1.5, borderBottom: `1px solid ${COLORES.grisContorno}`, display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: COLORES.textoPrimario }}>Matriz de permisos</Typography>
          <Chip label="Solo lectura" size="small" sx={{ height: 20, fontSize: 10.5, fontWeight: 600, bgcolor: COLORES.fondoGris2, color: COLORES.textoTerciario }} />
        </Box>
      ) : (
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: `1px solid ${COLORES.grisContorno}`, minHeight: 44, "& .MuiTab-root": { textTransform: "none", fontSize: 13, fontWeight: 600, minHeight: 44, color: COLORES.textoTerciario }, "& .Mui-selected": { color: COLORES.primarioOscuro }, "& .MuiTabs-indicator": { bgcolor: COLORES.primarioOscuro } }}>
          <Tab label="Información General" />
          <Tab label="Permisos" />
        </Tabs>
      )}

      {/* CONTENIDO */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {cargando ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} sx={{ color: COLORES.primarioOscuro }} />
          </Box>
        ) : modo === "ver" ? (
          /* ── MODO VER: matriz de solo lectura ── */
          <Box sx={{ px: 3, py: 2 }}>
            <TableContainer sx={{ border: `1px solid ${COLORES.grisContorno}`, borderRadius: "12px", overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: 11, fontWeight: 600, color: COLORES.textoTerciario, bgcolor: COLORES.fondoGris, py: 1 }}>Módulo</TableCell>
                    {ACCIONES.map((a) => (
                      <TableCell key={a} align="center" sx={{ fontSize: 11, fontWeight: 600, color: COLORES.textoTerciario, bgcolor: COLORES.fondoGris, py: 1, whiteSpace: "nowrap" }}>
                        {ACCION_LABELS[a]}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {MODULOS_PERMISOS.map((seccion) => (
                    <TableRow key={seccion.id} sx={{ "& > td": { borderBottom: "none", p: 0 }, "&:last-child td": { pb: 0 } }}>
                      <TableCell colSpan={1 + ACCIONES.length} sx={{ p: 0 }}>
                        <Box sx={{ bgcolor: COLORES.fondoGris, px: 1.5, py: 0.75, borderTop: `1px solid ${COLORES.grisContorno}` }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORES.textoSuave, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            {seccion.titulo}
                          </Typography>
                        </Box>
                        <Table size="small" sx={{ width: "100%" }}>
                          <TableBody>
                            {seccion.modulos.map((m) => (
                              <TableRow key={m.clave} sx={{ "&:hover": { bgcolor: COLORES.fondoGris } }}>
                                <TableCell sx={{ fontSize: 13, color: COLORES.textoSecundario, borderBottom: `1px solid ${COLORES.fondoGris2}`, py: 0.5, pl: 1.5 }}>{m.nombre}</TableCell>
                                {ACCIONES.map((a) => {
                                  const habilitado = permisos.has(`${m.clave}.${a}`);
                                  return (
                                    <TableCell key={a} align="center" sx={{ borderBottom: `1px solid ${COLORES.fondoGris2}`, py: 0.5 }}>
                                      {habilitado ? (
                                        <Tooltip title={`${m.nombre}: ${ACCION_LABELS[a]} habilitado`}>
                                          <Check size={15} style={{ color: COLORES.primario, display: "block", margin: "0 auto" }} />
                                        </Tooltip>
                                      ) : (
                                        <Minus size={15} style={{ color: COLORES.borde2, display: "block", margin: "0 auto" }} />
                                      )}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 1.5, display: "flex", gap: 1.5, alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Check size={14} style={{ color: COLORES.primario }} />
                <Typography sx={{ fontSize: 11.5, color: COLORES.textoTerciario }}>Permiso habilitado</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Minus size={14} style={{ color: COLORES.borde2 }} />
                <Typography sx={{ fontSize: 11.5, color: COLORES.textoTerciario }}>No disponible</Typography>
              </Box>
            </Box>
          </Box>
        ) : tab === 0 ? (
          /* ── MODO EDITAR: información general ── */
          <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase", letterSpacing: "0.03em", mb: 0.5 }}>
                  Nombre
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: COLORES.textoPrimario }}>{rol.nombre}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase", letterSpacing: "0.03em", mb: 0.5 }}>
                  Estado
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: COLORES.textoPrimario }}>Activo</Typography>
              </Box>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase", letterSpacing: "0.03em", mb: 0.5 }}>
                Cantidad de usuarios
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: COLORES.textoPrimario }}>
                {rol.cantidad_usuarios ?? 0} usuarios
              </Typography>
            </Box>
            <TextField
              label="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              multiline
              minRows={3}
              fullWidth
              slotProps={{ inputLabel: { sx: { fontSize: 13 } } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  "& fieldset": { borderColor: COLORES.textoTerciario },
                  "&:hover fieldset": { borderColor: COLORES.textoSecundario },
                  "&.Mui-focused fieldset": { borderColor: COLORES.primarioOscuro },
                },
              }}
            />
          </Box>
        ) : (
          /* ── MODO EDITAR: permisos ── */
          <Box sx={{ p: 3 }}>
            <TableContainer sx={{ border: `1px solid ${COLORES.grisContorno}`, borderRadius: "12px", overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: 11, fontWeight: 600, color: COLORES.textoTerciario, bgcolor: COLORES.fondoGris, py: 1 }}>Módulo</TableCell>
                    {ACCIONES.map((a) => (
                      <TableCell key={a} align="center" sx={{ fontSize: 11, fontWeight: 600, color: COLORES.textoTerciario, bgcolor: COLORES.fondoGris, py: 1, whiteSpace: "nowrap" }}>
                        {ACCION_LABELS[a]}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {MODULOS_PERMISOS.map((seccion) => (
                    <TableRow key={seccion.id} sx={{ "& > td": { borderBottom: "none", p: 0 }, "&:last-child td": { pb: 0 } }}>
                      <TableCell colSpan={1 + ACCIONES.length} sx={{ p: 0 }}>
                        <Box sx={{ bgcolor: COLORES.fondoGris, px: 1.5, py: 0.75, display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${COLORES.grisContorno}` }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORES.textoSuave, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            {seccion.titulo}
                          </Typography>
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                checked={seccionCompleta(seccion)}
                                onChange={() => toggleSeccion(seccion)}
                                sx={{ p: 0.5, color: COLORES.textoSuave, "&.Mui-checked": { color: COLORES.primarioOscuro } }}
                              />
                            }
                            label={<Typography sx={{ fontSize: 11, color: COLORES.textoSuave }}>Todo</Typography>}
                            sx={{ m: 0 }}
                          />
                        </Box>
                        <Table size="small" sx={{ width: "100%" }}>
                          <TableBody>
                            {seccion.modulos.map((m) => (
                              <TableRow key={m.clave} sx={{ "&:hover": { bgcolor: COLORES.fondoGris } }}>
                                <TableCell sx={{ fontSize: 13, color: COLORES.textoSecundario, borderBottom: `1px solid ${COLORES.fondoGris2}`, py: 0.5, pl: 1.5 }}>{m.nombre}</TableCell>
                                {ACCIONES.map((a) => {
                                  const clave = `${m.clave}.${a}`;
                                  const marcado = permisos.has(clave);
                                  return (
                                    <TableCell key={a} align="center" sx={{ borderBottom: `1px solid ${COLORES.fondoGris2}`, py: 0.5 }}>
                                      <Tooltip title={marcado ? "Quitar" : "Marcar"}>
                                        <Checkbox
                                          size="small"
                                          checked={marcado}
                                          onChange={() => togglePermiso(clave)}
                                          sx={{ p: 0.75, color: COLORES.borde2, "&.Mui-checked": { color: COLORES.primarioOscuro } }}
                                        />
                                      </Tooltip>
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>

      <Divider sx={{ borderColor: COLORES.grisContorno }} />

      {/* FOOTER */}
      <Box sx={{ px: 3, py: 2, display: "flex", justifyContent: "flex-end", gap: 1.5, background: COLORES.fondoGris }}>
        {modo === "ver" ? (
          <>
            <Button onClick={onClose}
              sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, color: COLORES.textoTerciario, borderColor: COLORES.borde2 }} variant="outlined">
              Cerrar
            </Button>
            <Button
              variant="contained"
              startIcon={<Pencil size={15} />}
              onClick={() => setModo("editar")}
              sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, fontWeight: 600, ...verdeBoton }}
            >
              Editar permisos
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setModo("ver")} disabled={guardando}
              sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, color: COLORES.textoTerciario, borderColor: COLORES.borde2 }} variant="outlined">
              Cancelar
            </Button>
            <Button variant="contained" startIcon={<Save size={15} />} onClick={handleGuardar} disabled={guardando}
              sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, fontWeight: 600, ...verdeBoton }}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </Button>
          </>
        )}
      </Box>
    </Drawer>
  );
}
