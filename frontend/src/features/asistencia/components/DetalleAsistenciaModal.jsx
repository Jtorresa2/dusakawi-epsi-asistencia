import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Typography,
  IconButton,
} from "@mui/material";
import { X, Clock, User, Sun, Moon, FileText } from "lucide-react";
import IconBox from "../../../shared/components/IconBox";
import { COLORES } from "../../../shared/constants/colores.js";

function formatFechaLarga(fechaStr) {
  if (!fechaStr) return "—";
  try {
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return fechaStr;
    return fecha.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return fechaStr;
  }
}

export default function DetalleAsistenciaModal({ open, onClose, row }) {
  if (!open || !row) return null;

  const badgeColors = {
    puntual: { bg: COLORES.successFondo, color: COLORES.verdeTexto },
    tardanza: { bg: COLORES.warningFondo, color: COLORES.warningOscuro },
    ausente: { bg: COLORES.dangerFondo, color: COLORES.dangerOscuro },
    justificado: { bg: COLORES.primarioClaro2, color: COLORES.primarioOscuro },
  };
  const ec = badgeColors[row.estado] || { bg: COLORES.fondoGris2, color: COLORES.textoTerciario };
  const jornadaBadgeColors = {
    completa: { bg: COLORES.successFondo, color: COLORES.verdeTexto },
    abierta: { bg: COLORES.warningFondo, color: COLORES.warningOscuro },
  };
  const jc = jornadaBadgeColors[row.marcacion_estado] || { bg: COLORES.fondoGris2, color: COLORES.textoTerciario };

  const turnos = [
    {
      label: "Turno mañana",
      icon: Sun,
      entrada: row.entrada1,
      salida: row.salida1,
      esperadoE: row.esperado_entrada_manana,
      esperadoS: row.esperado_salida_manana,
    },
    {
      label: "Turno tarde",
      icon: Moon,
      entrada: row.entrada2,
      salida: row.salida2,
      esperadoE: row.esperado_entrada_tarde,
      esperadoS: row.esperado_salida_tarde,
    },
  ].filter((t) => t.esperadoE || t.esperadoS);

  const calculos = [
    {
      label: "Horas trabajadas",
      value: row.horas_trabajadas ? `${row.horas_trabajadas}h` : "—",
      color: COLORES.textoPrimario,
    },
    {
      label: "Minutos de tardanza",
      value: row.minutos_tardanza > 0 ? `${row.minutos_tardanza} min` : "0 min",
      color: row.minutos_tardanza > 0 ? COLORES.warningOscuro : COLORES.verdeTexto,
    },
    {
      label: "Tipo de marcación",
      value: row.tipo_marcacion || "—",
      color: COLORES.textoPrimario,
    },
  ];

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: "24px",
            p: 1,
            maxWidth: 720,
            maxHeight: "90vh",
            boxShadow: "0 25px 80px -15px rgba(0,0,0,0.2)",
            bgcolor: COLORES.fondoBlanco,
          },
        },
      }}
    >
      {/* 1. HEADER CON ESTRUCTURA DEL SISTEMA */}
      <DialogTitle
        sx={{
          p: 2.5,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <IconBox icon={<Clock size={22} />} color={COLORES.primarioOscuro} size={48} />
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: COLORES.textoPrimario, lineHeight: 1.2 }}>
              Detalle de asistencia
            </Typography>
            <Typography sx={{ fontSize: 13, color: COLORES.textoSuave, mt: 0.5 }}>
              Consulta la comparativa de marcajes de la jornada laboral.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {row.marcacion_estado && (
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 600,
                px: 1.2,
                py: 0.4,
                borderRadius: "8px",
                bgcolor: jc.bg,
                color: jc.color,
                textTransform: "capitalize",
              }}
            >
              {row.marcacion_estado}
            </Typography>
          )}
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              px: 1.2,
              py: 0.4,
              borderRadius: "8px",
              bgcolor: ec.bg,
              color: ec.color,
              textTransform: "capitalize",
            }}
          >
            {row.estado || "puntual"}
          </Typography>
          <IconButton
            aria-label="Cerrar"
            onClick={onClose}
            size="small"
            sx={{
              color: COLORES.textoSuave,
              bgcolor: COLORES.fondoGris2,
              "&:hover": { color: COLORES.textoTerciario, bgcolor: COLORES.grisContorno },
            }}
          >
            <X size={18} />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* 2. BODY CON SECCIONES EN TARJETAS (CARDS) */}
      <DialogContent
        sx={{
          px: 2.5,
          py: 1,
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: `${COLORES.primario} transparent`,
          "&::-webkit-scrollbar": {
            display: "block",
            width: 8,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: COLORES.primario,
            borderRadius: 4,
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
        }}
      >
        
        {/* TARJETA 1: INFORMACIÓN DEL COLABORADOR */}
        <Box
          sx={{
            border: `1px solid ${COLORES.grisContorno}`,
            borderRadius: "18px",
            p: 2.5,
            bgcolor: COLORES.fondoGris,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            <IconBox icon={<User size={16} />} color={COLORES.primarioOscuro} size={32} iconSize={16} />
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario }}>
                {row.empleado}
              </Typography>
              <Typography sx={{ fontSize: 12, color: COLORES.textoSuave }}>
                {row.area || "—"} · Piso {row.piso || "—"}
              </Typography>
            </Box>
          </Box>

          {row.horario_nombre && (
            <Box sx={{ pt: 1.5, borderTop: `1px dashed ${COLORES.borde}` }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORES.textoTerciario, textTransform: "uppercase" }}>
                Horario asignado
              </Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORES.textoPrimario, mt: 0.2 }}>
                {row.horario_nombre} {row.horario_modalidad ? `(${row.horario_modalidad})` : ""}
              </Typography>
            </Box>
          )}
        </Box>

        {/* TARJETA 2: DETALLE DE TURNOS */}
        <Box
          sx={{
            border: `1px solid ${COLORES.grisContorno}`,
            borderRadius: "18px",
            p: 2.5,
            bgcolor: COLORES.fondoGris,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconBox icon={<FileText size={16} />} color={COLORES.primarioOscuro} size={32} iconSize={16} />
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORES.textoPrimario }}>
                Registro de asistencia
              </Typography>
              <Typography sx={{ fontSize: 11, color: COLORES.textoSuave }}>
                {formatFechaLarga(row.fecha)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            {turnos.map((t) => {
              const IconoTurno = t.icon;
              const tieneEntrada = !!t.entrada;
              const tieneSalida = !!t.salida;

              return (
                <Box
                  key={t.label}
                  sx={{
                    bgcolor: COLORES.fondoBlanco,
                    p: 2,
                    borderRadius: "14px",
                    border: `1px solid ${COLORES.borde}`,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                    <IconoTurno size={15} color={COLORES.primarioOscuro} />
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORES.textoPrimario }}>
                      {t.label}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 1.5, alignItems: "center" }}>
                    <Box>
                      <Typography sx={{ fontSize: 10, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase" }}>
                        Esperado
                      </Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: COLORES.textoTerciario, mt: 0.3 }}>
                        {t.esperadoE || "—"} → {t.esperadoS || "—"}
                      </Typography>
                    </Box>

                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORES.textoTerciario }}>
                      vs
                    </Typography>

                    <Box>
                      <Typography sx={{ fontSize: 10, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase" }}>
                        Real
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: tieneEntrada || tieneSalida ? COLORES.textoPrimario : COLORES.textoSuave,
                          mt: 0.3,
                        }}
                      >
                        {tieneEntrada || tieneSalida ? `${t.entrada || "—"} → ${t.salida || "—"}` : "Sin registro"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* TARJETA 3: MÉTRICAS (KPIs) */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
          {calculos.map((c, i) => (
            <Box
              key={i}
              sx={{
                bgcolor: COLORES.fondoGris,
                p: 2,
                borderRadius: "16px",
                border: `1px solid ${COLORES.grisContorno}`,
                textAlign: "center",
              }}
            >
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase" }}>
                {c.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: c.color,
                  mt: 0.5,
                  textTransform: "capitalize",
                }}
              >
                {c.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>

      {/* 3. FOOTER */}
      <DialogActions
        sx={{
          px: 2.5,
          pt: 2,
          pb: 1.5,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 600,
            fontSize: 13,
            height: 42,
            px: 3.5,
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