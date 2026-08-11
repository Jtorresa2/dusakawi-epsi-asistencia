import { Paper, Typography, Box, Chip } from "@mui/material";
import { Clock3, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IconBox from "../../../shared/components/IconBox";
import { COLORES } from "../../../shared/constants/colores.js";

const ACTIVIDADES = [
  { hora: "08:05", nombre: "Carlos Pérez", cargo: "Médico", descripcion: "Entrada registrada", estado: "Entrada", color: COLORES.primario, fondo: COLORES.primarioClaro },
  { hora: "08:17", nombre: "María Gómez", cargo: "Auxiliar", descripcion: "Llegó con tardanza", estado: "Tardanza", color: COLORES.warningOscuro, fondo: COLORES.warningFondo },
  { hora: "09:10", nombre: "Luis Torres", cargo: "Enfermero", descripcion: "Solicitó permiso", estado: "Permiso", color: COLORES.verdeTexto, fondo: COLORES.primarioClaro },
  { hora: "09:42", nombre: "Ana Díaz", cargo: "Psicóloga", descripcion: "Inició vacaciones", estado: "Vacación", color: COLORES.primario, fondo: COLORES.primarioClaro },
  { hora: "10:15", nombre: "Pedro Martínez", cargo: "Médico", descripcion: "Registró salida", estado: "Salida", color: COLORES.textoMuted, fondo: COLORES.fondoGris2 },
];

export default function TodayActivity() {
  const navigate = useNavigate();

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
        <Box onClick={() => navigate("/asistencia")}
          sx={{ display: "flex", alignItems: "center", gap: 0.3, color: COLORES.primario, cursor: "pointer", fontSize: 11, fontWeight: 600, "&:hover": { color: COLORES.primarioOscuro } }}>
          Ver <ArrowRight size={12} />
        </Box>
      </Box>

      {/* Lista */}
      <Box sx={{ flex: 1, overflowY: "auto", mx: -2, px: 2 }}>
        {ACTIVIDADES.map((item, i) => (
          <Box key={i}
            sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.75, borderBottom: i < ACTIVIDADES.length - 1 ? `1px solid ${COLORES.fondoGris2}` : "none" }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORES.textoPrimario, flexShrink: 0, width: 36 }}>
              {item.hora}
            </Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoPrimario, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.nombre}
            </Typography>
            <Chip label={item.estado} size="small"
              sx={{ height: 20, fontSize: 10, fontWeight: 600, bgcolor: item.fondo, color: item.color, borderRadius: "4px", flexShrink: 0 }} />
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
