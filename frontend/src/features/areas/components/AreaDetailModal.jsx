import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Divider,
  IconButton,
  Button,
  Chip,
  TextField,
  Avatar,
  CircularProgress,
} from "@mui/material";
import {
  Building2,
  Users,
  FileText,
  X,
  Search,
  MapPin,
  Briefcase,
  Edit3,
  ChevronRight,
} from "lucide-react";
import { COLORES } from "../../../shared/constants/colores.js";
import { obtenerEmpleadosPorArea } from "../area.api.js";
import EmpleadoDetalleResumenModal from "../../personal/components/EmpleadoDetalleResumenModal.jsx";

const modalSeccionCard = {
  border: `1px solid ${COLORES.grisContorno}`,
  borderRadius: "14px",
  bgcolor: COLORES.fondoBlanco,
  p: 2,
};

const infoCardSx = {
  border: `1px solid ${COLORES.grisContorno}`,
  borderRadius: "12px",
  bgcolor: COLORES.fondoBlanco,
  p: 1.5,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const infoLabelSx = {
  fontSize: 11,
  color: COLORES.textoSuave,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
};

const infoValueSx = {
  fontSize: 14,
  fontWeight: 700,
  color: COLORES.textoPrimario,
  mt: 0.3,
};

export default function AreaDetailModal({ open, onClose, area, onEditar }) {
  const [colaboradores, setColaboradores] = useState([]);
  const [cargandoColabs, setCargandoColabs] = useState(false);
  const [busquedaColab, setBusquedaColab] = useState("");
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);

  useEffect(() => {
    if (!open || !area?.id) return;
    let cancelado = false;
    setCargandoColabs(true);
    setBusquedaColab("");
    obtenerEmpleadosPorArea(area.id)
      .then((res) => {
        if (!cancelado) {
          const lista = Array.isArray(res) ? res : res?.items || [];
          setColaboradores(lista);
        }
      })
      .catch(() => {
        if (!cancelado) setColaboradores([]);
      })
      .finally(() => {
        if (!cancelado) setCargandoColabs(false);
      });
    return () => {
      cancelado = true;
    };
  }, [open, area?.id]);

  const colabsFiltrados = useMemo(() => {
    if (!busquedaColab.trim()) return colaboradores;
    const q = busquedaColab.toLowerCase().trim();
    return colaboradores.filter((emp) => {
      const nombre = `${emp.nombre || ""} ${emp.apellido || ""}`.toLowerCase();
      const cedula = String(emp.cedula || "");
      const cargo = (emp.cargo || "").toLowerCase();
      const correo = (emp.correo || emp.email || "").toLowerCase();
      return (
        nombre.includes(q) ||
        cedula.includes(q) ||
        cargo.includes(q) ||
        correo.includes(q)
      );
    });
  }, [colaboradores, busquedaColab]);

  if (!area) return null;

  const totalActivos = colaboradores.filter(
    (c) => c.activo === 1 || c.activo === true || c.estado === "activo"
  ).length;

  return (
    <>
      <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            borderRadius: "18px",
            position: "relative",
            boxShadow: "0 24px 70px rgba(0,0,0,0.25)",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
      sx={{
        "& .MuiBackdrop-root": {
          bgcolor: "rgba(17, 24, 39, 0.5)",
          backdropFilter: "blur(4px)",
        },
      }}
    >
      {/* HEADER FIJO */}
      <DialogTitle sx={{ px: 3, py: 2, position: "relative", pb: 1.5 }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              bgcolor: COLORES.primarioClaro,
              color: COLORES.primarioOscuro,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Building2 size={20} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
              <Typography
                sx={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: COLORES.textoPrimario,
                  lineHeight: 1.2,
                }}
              >
                {area.nombre}
              </Typography>
              <Chip
                icon={<MapPin size={13} color={COLORES.primario} />}
                label={area.piso !== null && area.piso !== undefined ? `Piso ${area.piso}` : "Sin piso"}
                size="small"
                sx={{
                  height: 24,
                  fontSize: 11.5,
                  fontWeight: 600,
                  bgcolor: COLORES.primarioClaro,
                  color: COLORES.primarioOscuro,
                  borderRadius: "8px",
                }}
              />
            </Box>
            <Typography
              sx={{
                fontSize: 12,
                color: COLORES.textoTerciario,
                mt: 0.25,
              }}
            >
              Módulo de Áreas institucionales
            </Typography>
          </Box>
        </Box>
        <IconButton
          aria-label="Cerrar"
          onClick={onClose}
          size="small"
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            color: COLORES.textoSuave,
            bgcolor: COLORES.fondoGris2,
            "&:hover": { color: COLORES.textoPrimario, bgcolor: COLORES.borde },
          }}
        >
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <Divider />

      {/* CUERPO SCROLLEABLE CON SCROLL VERDE INSTITUCIONAL */}
      <DialogContent
        sx={{
          px: 3,
          py: 2,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 1.75,
          bgcolor: COLORES.fondoGris,
          scrollbarWidth: "thin",
          scrollbarColor: `${COLORES.primario} transparent`,
          "&::-webkit-scrollbar": { display: "block", width: 8 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: COLORES.primario,
            borderRadius: 4,
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: COLORES.primarioOscuro,
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
        }}
      >
        {/* MÉTRICAS / INFORMACIÓN GENERAL */}
        <Box sx={modalSeccionCard}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: COLORES.textoPrimario,
              mb: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            Detalles del área
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
              gap: 1.5,
            }}
          >
            <Box sx={infoCardSx}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.4 }}>
                <MapPin size={14} color={COLORES.textoSuave} />
                <Typography sx={infoLabelSx}>Ubicación</Typography>
              </Box>
              <Typography sx={infoValueSx}>
                {area.piso !== null && area.piso !== undefined ? `Piso ${area.piso}` : "Sin piso"}
              </Typography>
            </Box>

            <Box sx={infoCardSx}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.4 }}>
                <Users size={14} color={COLORES.textoSuave} />
                <Typography sx={infoLabelSx}>Empleados</Typography>
              </Box>
              <Typography sx={{ ...infoValueSx, color: COLORES.primarioOscuro }}>
                {colaboradores.length} asignados
              </Typography>
            </Box>

            <Box sx={infoCardSx}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.4 }}>
                <Users size={14} color={COLORES.verdeTexto} />
                <Typography sx={infoLabelSx}>Activos</Typography>
              </Box>
              <Typography sx={{ ...infoValueSx, color: COLORES.verdeTexto }}>
                {totalActivos} activos
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* DESCRIPCIÓN */}
        <Box sx={modalSeccionCard}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                bgcolor: COLORES.primarioClaro,
                color: COLORES.primarioOscuro,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={14} />
            </Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORES.textoPrimario }}>
              Descripción del área
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: 13,
              color: COLORES.textoSecundario,
              lineHeight: 1.6,
              bgcolor: COLORES.fondoGris,
              p: 2,
              borderRadius: "10px",
              border: `1px solid ${COLORES.grisContorno}`,
            }}
          >
            {area.descripcion || "No hay una descripción registrada para esta área."}
          </Typography>
        </Box>

        {/* EMPLEADOS ASIGNADOS */}
        <Box sx={modalSeccionCard}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "8px",
                  bgcolor: COLORES.primarioClaro,
                  color: COLORES.primarioOscuro,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Users size={14} />
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORES.textoPrimario }}>
                Empleados asignados
              </Typography>
              <Chip
                label={`${colaboradores.length} ${colaboradores.length === 1 ? "persona" : "personas"}`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  bgcolor: COLORES.primarioClaro,
                  color: COLORES.primarioOscuro,
                  borderRadius: "6px",
                }}
              />
            </Box>

            {colaboradores.length > 0 && (
              <TextField
                placeholder="Buscar por nombre, cédula o cargo..."
                value={busquedaColab}
                onChange={(e) => setBusquedaColab(e.target.value)}
                size="small"
                slotProps={{
                  input: {
                    startAdornment: <Search size={14} style={{ marginRight: 6, color: COLORES.textoSuave }} />,
                  },
                }}
                sx={{
                  minWidth: { xs: "100%", sm: 260 },
                  "& .MuiOutlinedInput-root": {
                    height: 32,
                    fontSize: 12,
                    bgcolor: COLORES.fondoGris,
                    borderRadius: "8px",
                    "& fieldset": { borderColor: COLORES.grisContorno },
                    "&:hover fieldset": { borderColor: COLORES.borde2 },
                    "&.Mui-focused fieldset": { borderColor: COLORES.primarioOscuro },
                  },
                }}
              />
            )}
          </Box>

          {cargandoColabs ? (
            <Box sx={{ py: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <CircularProgress size={24} sx={{ color: COLORES.primario }} />
              <Typography sx={{ fontSize: 12.5, color: COLORES.textoSuave }}>
                Cargando empleados asignados...
              </Typography>
            </Box>
          ) : colabsFiltrados.length === 0 ? (
            <Box sx={{ p: 2.5, textAlign: "center", bgcolor: COLORES.fondoGris, borderRadius: "10px", border: `1px solid ${COLORES.grisContorno}` }}>
              <Typography sx={{ fontSize: 12.5, color: COLORES.textoSuave }}>
                {busquedaColab
                  ? "No se encontraron empleados que coincidan con la búsqueda."
                  : "No hay empleados asignados a esta área actualmente."}
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              {colabsFiltrados.map((emp) => {
                const nombreCompleto = emp.empleado || `${emp.nombre || ""} ${emp.apellido || ""}`.trim() || "Empleado";
                const iniciales = `${emp.nombre?.[0] || ""}${emp.apellido?.[0] || ""}`.toUpperCase() || "E";
                const esActivo = emp.activo === 1 || emp.activo === true || emp.estado === "activo";

                return (
                  <Box
                    key={emp.id}
                    onClick={() => setEmpleadoSeleccionado(emp)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.25,
                      px: 1.5,
                      borderRadius: "10px",
                      bgcolor: COLORES.fondoGris,
                      border: `1px solid ${COLORES.grisContorno}`,
                      cursor: "pointer",
                      transition: "all .18s ease",
                      "&:hover": {
                        bgcolor: COLORES.borde2,
                        borderColor: COLORES.primario,
                        transform: "translateX(2px)",
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: 12,
                          fontWeight: 700,
                          bgcolor: COLORES.primarioClaro,
                          color: COLORES.primarioOscuro,
                        }}
                      >
                        {iniciales}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORES.textoPrimario, lineHeight: 1.2 }}>
                          {nombreCompleto}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.2, flexWrap: "wrap" }}>
                          {emp.cedula && (
                            <Typography sx={{ fontSize: 11, color: COLORES.textoTerciario }}>
                              C.C. {emp.cedula}
                            </Typography>
                          )}
                          {emp.cargo && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                              <Briefcase size={11} color={COLORES.textoSuave} />
                              <Typography sx={{ fontSize: 11, color: COLORES.textoTerciario }}>
                                {emp.cargo}
                              </Typography>
                            </Box>
                          )}
                          {(emp.correo || emp.email) && (
                            <Typography sx={{ fontSize: 11, color: COLORES.textoSuave }}>
                              • {emp.correo || emp.email}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={esActivo ? "Activo" : "Inactivo"}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: 11,
                          fontWeight: 600,
                          borderRadius: "6px",
                          bgcolor: esActivo ? COLORES.primarioClaro : COLORES.dangerFondo,
                          color: esActivo ? COLORES.primarioOscuro : COLORES.danger,
                          flexShrink: 0,
                        }}
                      />
                      <ChevronRight size={16} color={COLORES.textoSuave} />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </DialogContent>

      {/* FOOTER FIJO */}
      <Divider />
      <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
        <Box>
          {onEditar && (
            <Button
              variant="outlined"
              startIcon={<Edit3 size={15} />}
              onClick={() => {
                onClose();
                onEditar(area);
              }}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontSize: 13,
                fontWeight: 600,
                color: COLORES.textoSecundario,
                borderColor: COLORES.grisContorno,
                bgcolor: COLORES.fondoGris2,
                "&:hover": {
                  borderColor: COLORES.borde2,
                  bgcolor: COLORES.borde2,
                },
              }}
            >
              Editar área
            </Button>
          )}
        </Box>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontSize: 13,
            fontWeight: 600,
            px: 3.5,
            py: 0.75,
            bgcolor: COLORES.primarioOscuro,
            "&:hover": { bgcolor: COLORES.primario },
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>

    {/* MODAL DETALLE DE EMPLEADO */}
    <EmpleadoDetalleResumenModal
      open={Boolean(empleadoSeleccionado)}
      id={empleadoSeleccionado?.id}
      empleadoData={{
        ...empleadoSeleccionado,
        area: area.nombre,
        piso: area.piso,
      }}
      onClose={() => setEmpleadoSeleccionado(null)}
    />
  </>
  );
}
