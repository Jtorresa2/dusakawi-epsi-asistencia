import { useState, useEffect } from "react";
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
  Avatar,
  CircularProgress,
} from "@mui/material";
import {
  User,
  Briefcase,
  Building2,
  MapPin,
  Clock,
  Mail,
  Phone,
  FileText,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { COLORES } from "../../../shared/constants/colores.js";
import { obtenerPersonalPorId } from "../personal.api.js";

const cardSx = {
  border: `1px solid ${COLORES.grisContorno}`,
  borderRadius: "14px",
  bgcolor: COLORES.fondoBlanco,
  p: 2,
};

const infoBoxSx = {
  border: `1px solid ${COLORES.grisContorno}`,
  borderRadius: "12px",
  bgcolor: COLORES.fondoGris,
  p: 1.5,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const labelSx = {
  fontSize: 11,
  color: COLORES.textoSuave,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
};

const valueSx = {
  fontSize: 13.5,
  fontWeight: 700,
  color: COLORES.textoPrimario,
  mt: 0.3,
  wordBreak: "break-word",
};

export default function EmpleadoDetalleResumenModal({
  open,
  id,
  empleadoData,
  onClose,
}) {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (empleadoData) {
      setData(empleadoData);
    }
    if (!id) return;

    let cancelado = false;
    setCargando(true);
    obtenerPersonalPorId(id)
      .then((res) => {
        if (!cancelado && res) {
          setData(res);
        }
      })
      .catch(() => {
        // Fallback to empleadoData if ID fetch fails
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [open, id, empleadoData]);

  if (!open) return null;

  const emp = data || empleadoData || {};

  const nombreCompleto =
    emp.empleado ||
    `${emp.primer_nombre || emp.nombre || ""} ${emp.segundo_nombre || ""} ${emp.primer_apellido || emp.apellido || ""} ${emp.segundo_apellido || ""}`
      .replace(/\s+/g, " ")
      .trim() ||
    "Empleado";

  const iniciales =
    `${(emp.primer_nombre || emp.nombre || "")[0] || ""}${(emp.primer_apellido || emp.apellido || "")[0] || ""}`.toUpperCase() ||
    "E";

  const esActivo =
    emp.activo === 1 ||
    emp.activo === true ||
    emp.estado === "activo" ||
    emp.user_active === true;

  const cedula = emp.cedula || emp.numero_identificacion || "—";
  const cargo = emp.cargo || emp.cargo_nombre || "—";
  const area = emp.area || emp.area_nombre || "—";
  const piso = emp.piso || emp.piso_nombre || "—";
  const horario = emp.horario || emp.horario_nombre || "—";
  const correo = emp.correo || emp.email || "—";
  const telefono = emp.telefono || emp.celular || "—";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: "18px",
            position: "relative",
            boxShadow: "0 28px 75px rgba(0,0,0,0.30)",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            zIndex: 1400,
          },
        },
      }}
      sx={{
        zIndex: 1400,
        "& .MuiBackdrop-root": {
          bgcolor: "rgba(17, 24, 39, 0.55)",
          backdropFilter: "blur(4px)",
        },
      }}
    >
      {/* HEADER */}
      <DialogTitle sx={{ px: 3, py: 2, position: "relative", pb: 1.5 }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Avatar
            sx={{
              width: 44,
              height: 44,
              borderRadius: "14px",
              bgcolor: COLORES.primarioClaro,
              color: COLORES.primarioOscuro,
              fontWeight: 700,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {iniciales}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: COLORES.textoPrimario,
                  lineHeight: 1.25,
                }}
              >
                {nombreCompleto}
              </Typography>
              <Chip
                icon={
                  esActivo ? (
                    <CheckCircle2 size={13} color={COLORES.verdeTexto} />
                  ) : (
                    <XCircle size={13} color={COLORES.danger} />
                  )
                }
                label={esActivo ? "Activo" : "Inactivo"}
                size="small"
                sx={{
                  height: 24,
                  fontSize: 11.5,
                  fontWeight: 600,
                  bgcolor: esActivo ? COLORES.primarioClaro : COLORES.dangerFondo,
                  color: esActivo ? COLORES.primarioOscuro : COLORES.danger,
                  borderRadius: "8px",
                }}
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.3, flexWrap: "wrap" }}>
              <Chip
                icon={<FileText size={12} style={{ color: "inherit" }} />}
                label={`C.C. ${cedula}`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: 11.5,
                  fontWeight: 600,
                  bgcolor: COLORES.fondoGris,
                  color: COLORES.textoTerciario,
                  border: `1px solid ${COLORES.grisContorno}`,
                }}
              />
              <Typography sx={{ fontSize: 11.5, color: COLORES.textoSuave }}>
                Expediente del empleado
              </Typography>
            </Box>
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
        {cargando && !data ? (
          <Box sx={{ py: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
            <CircularProgress size={28} sx={{ color: COLORES.primario }} />
            <Typography sx={{ fontSize: 13, color: COLORES.textoSuave }}>
              Cargando información del empleado...
            </Typography>
          </Box>
        ) : (
          <>
            {/* SECCIÓN 1: ÁREA Y CARGO */}
            <Box sx={cardSx}>
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
                <Briefcase size={15} style={{ color: COLORES.primarioOscuro }} />
                Información institucional y laboral
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.25,
                }}
              >
                <Box sx={infoBoxSx}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.3 }}>
                    <Briefcase size={13} color={COLORES.textoSuave} />
                    <Typography sx={labelSx}>Cargo</Typography>
                  </Box>
                  <Typography sx={{ ...valueSx, color: COLORES.primarioOscuro }}>
                    {cargo}
                  </Typography>
                </Box>

                <Box sx={infoBoxSx}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.3 }}>
                    <Building2 size={13} color={COLORES.textoSuave} />
                    <Typography sx={labelSx}>Área</Typography>
                  </Box>
                  <Typography sx={valueSx}>{area}</Typography>
                </Box>

                <Box sx={infoBoxSx}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.3 }}>
                    <MapPin size={13} color={COLORES.textoSuave} />
                    <Typography sx={labelSx}>Ubicación / Piso</Typography>
                  </Box>
                  <Typography sx={valueSx}>
                    {piso !== "—" ? (piso.toString().toLowerCase().includes("piso") ? piso : `Piso ${piso}`) : "—"}
                  </Typography>
                </Box>

                <Box sx={infoBoxSx}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.3 }}>
                    <Clock size={13} color={COLORES.textoSuave} />
                    <Typography sx={labelSx}>Horario laboral</Typography>
                  </Box>
                  <Typography sx={valueSx}>{horario}</Typography>
                </Box>
              </Box>
            </Box>

            {/* SECCIÓN 2: CONTACTO DEL EMPLEADO */}
            <Box sx={cardSx}>
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
                <User size={15} style={{ color: COLORES.primarioOscuro }} />
                Datos de contacto
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.25,
                }}
              >
                <Box sx={infoBoxSx}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.3 }}>
                    <Mail size={13} color={COLORES.textoSuave} />
                    <Typography sx={labelSx}>Correo electrónico</Typography>
                  </Box>
                  <Typography sx={{ ...valueSx, fontSize: 13, fontWeight: 600 }}>
                    {correo}
                  </Typography>
                </Box>

                <Box sx={infoBoxSx}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.3 }}>
                    <Phone size={13} color={COLORES.textoSuave} />
                    <Typography sx={labelSx}>Teléfono / Celular</Typography>
                  </Box>
                  <Typography sx={valueSx}>{telefono}</Typography>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>

      {/* FOOTER */}
      <Divider />
      <DialogActions sx={{ px: 3, py: 2, justifyContent: "flex-end" }}>
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
  );
}
