import { useState, useEffect } from "react";
import {
  Drawer, Box, Typography, Chip, IconButton, Tabs, Tab, TextField,
  Button, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, FormControlLabel, Tooltip, CircularProgress,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { MODULOS_PERMISOS, ACCIONES } from "../config/modulosPermisos";
import { obtenerPermisosRol, guardarRol } from "../roles.api";

const ACCION_LABELS = {
  ver: "Ver",
  crear: "Crear",
  editar: "Editar",
  eliminar: "Eliminar",
  aprobar: "Aprobar",
  exportar: "Exportar",
};

const verdeBoton = { bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } };

export default function RolDrawer({ open, rol, onClose, onSuccess, onError }) {
  const [tab, setTab] = useState(0);
  const [descripcion, setDescripcion] = useState("");
  const [permisos, setPermisos] = useState(() => new Set());
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open && rol) {
      setTab(0);
      setDescripcion(rol.descripcion || "");
      cargarPermisos(rol.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rol]);

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

  const campoInfo = (label, value) => (
    <Box>
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.03em", mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{value}</Typography>
    </Box>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 640 },
          borderLeft: "1px solid #ECECEC",
          borderRadius: 0,
          background: "#fff",
        },
      }}
      slotProps={{ backdrop: { sx: { bgcolor: "rgba(17,24,39,0.12)" } } }}
    >
      {/* HEADER */}
      <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #ECECEC" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{rol?.nombre || "Rol"}</Typography>
          <Chip label="Activo" size="small" sx={{ height: 20, fontSize: 11, fontWeight: 600, bgcolor: "#D1FAE5", color: "#065F46" }} />
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#9CA3AF", "&:hover": { color: "#6B7280", bgcolor: "#F3F4F6" } }}>
          <Close />
        </IconButton>
      </Box>

      {/* TABS */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: "1px solid #ECECEC", minHeight: 44, "& .MuiTab-root": { textTransform: "none", fontSize: 13, fontWeight: 600, minHeight: 44, color: "#6B7280" }, "& .Mui-selected": { color: "#1B5E20" }, "& .MuiTabs-indicator": { bgcolor: "#1B5E20" } }}>
        <Tab label="Información General" />
        <Tab label="Permisos" />
      </Tabs>

      {/* CONTENIDO */}
      {tab === 0 ? (
        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            {campoInfo("Nombre", rol?.nombre || "—")}
            {campoInfo("Estado", "Activo")}
          </Box>
          {campoInfo("Cantidad de usuarios", `${rol?.cantidad_usuarios ?? 0} usuarios`)}
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
                "& fieldset": { borderColor: "#6B7280" },
                "&:hover fieldset": { borderColor: "#374151" },
                "&.Mui-focused fieldset": { borderColor: "#1B5E20" },
              },
            }}
          />
        </Box>
      ) : (
        <Box sx={{ p: 3 }}>
          {cargando ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={28} sx={{ color: "#1B5E20" }} />
            </Box>
          ) : (
            <TableContainer sx={{ border: "1px solid #ECECEC", borderRadius: "12px", overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", bgcolor: "#F9FAFB", py: 1 }}>Módulo</TableCell>
                    {ACCIONES.map((a) => (
                      <TableCell key={a} align="center" sx={{ fontSize: 11, fontWeight: 600, color: "#6B7280", bgcolor: "#F9FAFB", py: 1, whiteSpace: "nowrap" }}>
                        {ACCION_LABELS[a]}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {MODULOS_PERMISOS.map((seccion) => (
                    <TableRow key={seccion.id} sx={{ "& > td": { borderBottom: "none", p: 0 }, "&:last-child td": { pb: 0 } }}>
                      <TableCell colSpan={1 + ACCIONES.length} sx={{ p: 0 }}>
                        <Box sx={{ bgcolor: "#F9FAFB", px: 1.5, py: 0.75, display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #ECECEC" }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            {seccion.titulo}
                          </Typography>
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                checked={seccionCompleta(seccion)}
                                onChange={() => toggleSeccion(seccion)}
                                sx={{ p: 0.5, color: "#9CA3AF", "&.Mui-checked": { color: "#1B5E20" } }}
                              />
                            }
                            label={<Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>Todo</Typography>}
                            sx={{ m: 0 }}
                          />
                        </Box>
                        <Table size="small" sx={{ width: "100%" }}>
                          <TableBody>
                            {seccion.modulos.map((m) => (
                              <TableRow key={m.clave} sx={{ "&:hover": { bgcolor: "#F9FAFB" } }}>
                                <TableCell sx={{ fontSize: 13, color: "#374151", borderBottom: "1px solid #F3F4F6", py: 0.5, pl: 1.5 }}>{m.nombre}</TableCell>
                                {ACCIONES.map((a) => {
                                  const clave = `${m.clave}.${a}`;
                                  const marcado = permisos.has(clave);
                                  return (
                                    <TableCell key={a} align="center" sx={{ borderBottom: "1px solid #F3F4F6", py: 0.5 }}>
                                      <Tooltip title={marcado ? "Quitar" : "Marcar"}>
                                        <Checkbox
                                          size="small"
                                          checked={marcado}
                                          onChange={() => togglePermiso(clave)}
                                          sx={{ p: 0.75, color: "#D1D5DB", "&.Mui-checked": { color: "#1B5E20" } }}
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
          )}
        </Box>
      )}

      <Divider sx={{ borderColor: "#ECECEC", mt: "auto" }} />

      {/* FOOTER */}
      <Box sx={{ px: 3, py: 2, display: "flex", justifyContent: "flex-end", gap: 1.5, background: "#FCFDFC" }}>
        <Button onClick={onClose} disabled={guardando}
          sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, color: "#6B7280", borderColor: "#D1D5DB" }} variant="outlined">
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleGuardar} disabled={guardando}
          sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, ...verdeBoton }}>
          {guardando ? "Guardando..." : "Guardar cambios"}
        </Button>
      </Box>
    </Drawer>
  );
}
