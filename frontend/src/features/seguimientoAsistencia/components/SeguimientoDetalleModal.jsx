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
import { X, Clock, User, Sun, Moon, FileText, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IconBox from "../../../shared/components/IconBox";
import { COLORES } from "../../../shared/constants/colores.js";
import { SITUACION_STYLES, TRAMO_STYLES, INCIDENCIA_ESTADO_STYLES } from "./columns";

function formatFechaLarga(fechaStr) {
  if (!fechaStr) return "—";
  try {
    const fecha = new Date(`${fechaStr}T00:00:00`);
    if (isNaN(fecha.getTime())) return fechaStr;
    return fecha.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return fechaStr;
  }
}

/**
 * Modal de detalle del módulo Seguimiento (REQ-08/10) — patrón
 * DetalleAsistenciaModal adaptado al shape de /api/seguimiento: badge de
 * situación, tramo, estado de la incidencia vinculada y comparativa
 * "Esperado vs Real" por tramo cuando el horario lo define.
 * Acciones SOLO de lectura: Ver asistencia y Ver en Incidencias.
 */
export default function SeguimientoDetalleModal({ open, onClose, row }) {
  const navigate = useNavigate();
  if (!open || !row) return null;

  const sc = SITUACION_STYLES[row.situacion] || { bg: COLORES.fondoGris2, color: COLORES.textoSecundario, label: row.situacion };
  const tc = TRAMO_STYLES[row.tramo] || { bg: COLORES.fondoGris2, color: COLORES.textoTerciario, label: row.tramo };

  const turnos = [
    {
      label: "Turno mañana",
      icon: Sun,
      entrada: row.entrada_manana,
      salida: row.salida_manana,
      esperadoE: row.esperado_entrada_manana,
      esperadoS: row.esperado_salida_manana,
    },
    {
      label: "Turno tarde",
      icon: Moon,
      entrada: row.entrada_tarde,
      salida: row.salida_tarde,
      esperadoE: row.esperado_entrada_tarde,
      esperadoS: row.esperado_salida_tarde,
    },
  ].filter((t) => t.esperadoE || t.esperadoS);

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
      {/* HEADER */}
      <DialogTitle sx={{ p: 2.5, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <IconBox icon={<Clock size={22} />} color={COLORES.primarioOscuro} size={48} />
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: COLORES.textoPrimario, lineHeight: 1.2 }}>
              Detalle de seguimiento
            </Typography>
            <Typography sx={{ fontSize: 13, color: COLORES.textoSuave, mt: 0.5 }}>
              Situación de la jornada del colaborador · {formatFechaLarga(row.fecha)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 600, px: 1.2, py: 0.4, borderRadius: "8px", bgcolor: sc.bg, color: sc.color }}>
            {sc.label}
          </Typography>
          {tc.label && (
            <Typography sx={{ fontSize: 11, fontWeight: 600, px: 1.2, py: 0.4, borderRadius: "8px", bgcolor: tc.bg, color: tc.color, textTransform: "capitalize" }}>
              {tc.label}
            </Typography>
          )}
          <IconButton
            aria-label="Cerrar"
            onClick={onClose}
            size="small"
            sx={{ color: COLORES.textoSuave, bgcolor: COLORES.fondoGris2, "&:hover": { color: COLORES.textoTerciario, bgcolor: COLORES.grisContorno } }}
          >
            <X size={18} />
          </IconButton>
        </Box>
      </DialogTitle>

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
          "&::-webkit-scrollbar": { display: "block", width: 8 },
          "&::-webkit-scrollbar-thumb": { backgroundColor: COLORES.primario, borderRadius: 4 },
          "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
        }}
      >
        {/* TARJETA 1: INFORMACIÓN DEL COLABORADOR */}
        <Box sx={{ border: `1px solid ${COLORES.grisContorno}`, borderRadius: "18px", p: 2.5, bgcolor: COLORES.fondoGris }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            <IconBox icon={<User size={16} />} color={COLORES.primarioOscuro} size={32} iconSize={16} />
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: COLORES.textoPrimario }}>{row.empleado}</Typography>
              <Typography sx={{ fontSize: 12, color: COLORES.textoSuave }}>
                {row.area || "—"} · Piso {row.piso || "—"} · C.C. {row.cedula || "—"}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* TARJETA 2: REGISTRO ESPERADO VS REAL */}
        {turnos.length > 0 && (
          <Box sx={{ border: `1px solid ${COLORES.grisContorno}`, borderRadius: "18px", p: 2.5, bgcolor: COLORES.fondoGris, display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <IconBox icon={<FileText size={16} />} color={COLORES.primarioOscuro} size={32} iconSize={16} />
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORES.textoPrimario }}>Marcaciones de la jornada</Typography>
                <Typography sx={{ fontSize: 11, color: COLORES.textoSuave }}>Comparativo esperado (horario) vs real</Typography>
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              {turnos.map((t) => {
                const IconoTurno = t.icon;
                const tieneEntrada = !!t.entrada;
                const tieneSalida = !!t.salida;
                return (
                  <Box key={t.label} sx={{ bgcolor: COLORES.fondoBlanco, p: 2, borderRadius: "14px", border: `1px solid ${COLORES.borde}` }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                      <IconoTurno size={15} color={COLORES.primarioOscuro} />
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORES.textoPrimario }}>{t.label}</Typography>
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 1.5, alignItems: "center" }}>
                      <Box>
                        <Typography sx={{ fontSize: 10, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase" }}>Esperado</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: COLORES.textoTerciario, mt: 0.3 }}>
                          {t.esperadoE || "—"} → {t.esperadoS || "—"}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORES.textoTerciario }}>vs</Typography>
                      <Box>
                        <Typography sx={{ fontSize: 10, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase" }}>Real</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: tieneEntrada || tieneSalida ? COLORES.textoPrimario : COLORES.textoSuave, mt: 0.3 }}>
                          {tieneEntrada || tieneSalida ? `${t.entrada || "—"} → ${t.salida || "—"}` : "Sin registro"}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* TARJETA 3: INCIDENCIA VINCULADA + AVISO SOLO LECTURA */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {row.tiene_incidencia && (
            <Box sx={{ border: `1px solid ${COLORES.grisContorno}`, borderRadius: "16px", p: 2, bgcolor: COLORES.fondoGris }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase" }}>
                Incidencia vinculada
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORES.textoPrimario }}>#{row.incidencia_id || "—"}</Typography>
                {(() => {
                  const ic = INCIDENCIA_ESTADO_STYLES[row.incidencia_estado] || { bg: COLORES.fondoGris2, color: COLORES.textoSecundario, label: row.incidencia_estado };
                  return (
                    <Typography sx={{ fontSize: 11, fontWeight: 600, px: 1.2, py: 0.4, borderRadius: "8px", bgcolor: ic.bg, color: ic.color }}>
                      {ic.label}
                    </Typography>
                  );
                })()}
              </Box>
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", borderRadius: "14px", px: 2, py: 1.5, bgcolor: COLORES.primarioClaro }}>
            <Info size={17} style={{ color: COLORES.primarioOscuro, flexShrink: 0, marginTop: 1 }} />
            <Typography sx={{ fontSize: 12, color: COLORES.primarioOscuro, lineHeight: 1.45 }}>
              Solo lectura — use Incidencias para gestionar. Este módulo no permite aprobar, corregir ni cerrar jornadas.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      {/* FOOTER */}
      <DialogActions sx={{ px: 2.5, pt: 2, pb: 1.5, display: "flex", justifyContent: "flex-end", gap: 1, flexWrap: "wrap" }}>
        {row.tiene_incidencia && row.incidencia_id && (
          <Button
            onClick={() => { onClose(); navigate(`/incidencias/${row.incidencia_id}`); }}
            variant="outlined"
            sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 42, px: 2.5, color: COLORES.warningOscuro, borderColor: COLORES.warningOscuro, "&:hover": { bgcolor: COLORES.warningFondo, borderColor: COLORES.warningOscuro } }}
          >
            Ver en Incidencias
          </Button>
        )}
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 600, fontSize: 13, height: 42, px: 3.5, bgcolor: COLORES.primarioOscuro, "&:hover": { bgcolor: COLORES.primario } }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
