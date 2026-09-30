import { useMemo } from "react";
import { Paper, Typography, Box, Chip } from "@mui/material";
import { Clock3, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IconBox from "../../../shared/components/IconBox";
import { COLORES } from "../../../shared/constants/colores.js";

const getEstadoEstilo = (estado) => {
  const norm = (estado || "").toLowerCase();
  if (norm.includes("puntual")) {
    return { color: COLORES.primario, fondo: COLORES.primarioClaro };
  }
  if (norm.includes("tardanza")) {
    return { color: COLORES.warningOscuro, fondo: COLORES.warningFondo };
  }
  if (norm.includes("salida")) {
    return { color: COLORES.textoMuted, fondo: COLORES.fondoGris2 };
  }
  if (norm.includes("justificado") || norm.includes("permiso")) {
    return { color: COLORES.verdeTexto, fondo: COLORES.verdeVariante1 };
  }
  if (norm.includes("entrada")) {
    return { color: COLORES.primario, fondo: COLORES.primarioClaro };
  }
  if (norm.includes("ausente")) {
    return { color: COLORES.danger, fondo: COLORES.dangerFondo };
  }
  return { color: COLORES.textoSecundario, fondo: COLORES.fondoGris2 };
};

export default function TodayActivity({ data = [] }) {
  const navigate = useNavigate();

  const actividades = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const items = [];

    data.forEach((r) => {
      if (r.hora && r.nombre && r.estado) {
        items.push(r);
        return;
      }

      const nombre = r.empleado || "Colaborador";
      const area = r.area || "";

      if (r.salida2) {
        items.push({
          hora: r.salida2,
          nombre,
          area,
          estado: "Salida",
          descripcion: "Salida tarde",
        });
      }
      if (r.entrada2) {
        items.push({
          hora: r.entrada2,
          nombre,
          area,
          estado: "Entrada",
          descripcion: "Entrada tarde",
        });
      }
      if (r.salida1) {
        items.push({
          hora: r.salida1,
          nombre,
          area,
          estado: "Salida",
          descripcion: "Salida almuerzo",
        });
      }
      if (r.entrada1) {
        const esTarde = (r.estado || "").toLowerCase().includes("tardanza") || (r.minutos_tardanza && r.minutos_tardanza > 0);
        items.push({
          hora: r.entrada1,
          nombre,
          area,
          estado: esTarde ? "Tardanza" : "Puntual",
          descripcion: esTarde ? `Llegó con tardanza (${r.minutos_tardanza}m)` : "Entrada puntual",
        });
      }

      if (!r.entrada1 && !r.salida1 && !r.entrada2 && !r.salida2) {
        const estadoNorm = (r.estado || "").toLowerCase();
        if (estadoNorm.includes("justificado") || estadoNorm.includes("permiso")) {
          items.push({
            hora: "--:--",
            nombre,
            area,
            estado: "Justificado",
            descripcion: r.observacion || "Permiso / Justificado",
          });
        }
      }
    });

    return items.sort((a, b) => {
      if (a.hora === "--:--") return 1;
      if (b.hora === "--:--") return -1;
      return b.hora.localeCompare(a.hora);
    });
  }, [data]);

  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 4,
        border: `1px solid ${COLORES.grisContorno}`,
        px: 2,
        py: 1.5,
        boxShadow: "0 4px 20px rgba(0,0,0,.04)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Encabezado */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <IconBox icon={<Clock3 />} color={COLORES.primario} size={32} iconSize={16} />
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORES.textoPrimario, flex: 1 }}>
          Actividad de hoy
        </Typography>
        <Box
          onClick={() => navigate("/asistencia")}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.3,
            color: COLORES.primario,
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            "&:hover": { color: COLORES.primarioOscuro },
          }}
        >
          Ver <ArrowRight size={12} />
        </Box>
      </Box>

      {/* Lista o estado vacío */}
      {actividades.length === 0 ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            py: 3,
            px: 2,
          }}
        >
          <Clock3 size={28} color={COLORES.textoTerciario} style={{ opacity: 0.45, marginBottom: 8 }} />
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: COLORES.textoSecundario }}>
            Sin marcaciones registradas hoy
          </Typography>
          <Typography sx={{ fontSize: 11, color: COLORES.textoTerciario, mt: 0.5 }}>
            Los registros aparecerán aquí conforme los colaboradores marquen.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflowY: "auto", mx: -2, px: 2 }}>
          {actividades.map((item, i) => {
            const estilo = getEstadoEstilo(item.estado);
            return (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  py: 0.75,
                  borderBottom: i < actividades.length - 1 ? `1px solid ${COLORES.fondoGris2}` : "none",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: COLORES.textoPrimario,
                    flexShrink: 0,
                    width: 36,
                  }}
                >
                  {item.hora}
                </Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: COLORES.textoPrimario,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.nombre}
                  </Typography>
                  {item.area && (
                    <Typography
                      sx={{
                        fontSize: 10,
                        color: COLORES.textoTerciario,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.area}
                    </Typography>
                  )}
                </Box>
                <Chip
                  label={item.estado}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 10,
                    fontWeight: 600,
                    bgcolor: estilo.fondo,
                    color: estilo.color,
                    borderRadius: "4px",
                    flexShrink: 0,
                  }}
                />
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}
