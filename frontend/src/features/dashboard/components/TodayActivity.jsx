import {
  Paper,
  Typography,
  Box,
  Chip,
  Divider,
} from "@mui/material";
import { Clock3, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IconBox from "../../../shared/components/IconBox";

const ACTIVIDADES = [
  {
    hora: "08:05",
    nombre: "Carlos Pérez",
    cargo: "Médico",
    descripcion: "Entrada registrada",
    estado: "Entrada",
    color: "#2E7D32",
    fondo: "#E8F5E9",
  },
  {
    hora: "08:17",
    nombre: "María Gómez",
    cargo: "Auxiliar",
    descripcion: "Llegó con tardanza",
    estado: "Tardanza",
    color: "#D97706",
    fondo: "#FFF3E0",
  },
  {
    hora: "09:10",
    nombre: "Luis Torres",
    cargo: "Enfermero",
    descripcion: "Solicitó permiso",
    estado: "Permiso",
    color: "#0284C7",
    fondo: "#E0F2FE",
  },
  {
    hora: "09:42",
    nombre: "Ana Díaz",
    cargo: "Psicóloga",
    descripcion: "Inició vacaciones",
    estado: "Vacación",
    color: "#7C3AED",
    fondo: "#F3E8FF",
  },
  {
    hora: "10:15",
    nombre: "Pedro Martínez",
    cargo: "Médico",
    descripcion: "Registró salida",
    estado: "Salida",
    color: "#6B7280",
    fondo: "#F3F4F6",
  },
];

export default function TodayActivity() {
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        borderRadius: 4,
        border: "1px solid #ECECEC",
        px: 4,
        py: 3,
        boxShadow: "0 4px 20px rgba(0,0,0,.04)",
      }}
    >
      {/* Encabezado */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 3,
        }}
      >
        <IconBox icon={<Clock3 />} color="#2E7D32" size={44} iconSize={22} />

        <Typography
          sx={{
            fontSize: 20,
            fontWeight: 700,
            color: "#111827",
            ml: 2,
          }}
        >
          Actividad de hoy
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Box
          onClick={() => navigate("/asistencia")}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: "#2E7D32",
            cursor: "pointer",
            transition: ".2s",

            "&:hover": {
              color: "#1B5E20",
              transform: "translateX(3px)",
            },
          }}
        >
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Ver historial
          </Typography>

          <ArrowRight size={16} />
        </Box>
      </Box>

      <Divider />

      {ACTIVIDADES.map((item, index) => (
        <Box key={index}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              py: 2,
              transition: ".2s",

              "&:hover": {
                bgcolor: "#FAFAFA",
              },
            }}
          >
            {/* Hora */}
            <Typography
              sx={{
                width: 70,
                fontWeight: 700,
                color: "#111827",
                flexShrink: 0,
              }}
            >
              {item.hora}
            </Typography>

            {/* Empleado */}
            <Box
              sx={{
                width: 230,
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  color: "#111827",
                  fontSize: 14,
                }}
              >
                {item.nombre}
              </Typography>

              <Typography
                sx={{
                  fontSize: 12,
                  color: "#9CA3AF",
                }}
              >
                {item.cargo}
              </Typography>
            </Box>

            {/* Descripción */}
            <Typography
              sx={{
                flex: 1,
                color: "#4B5563",
                fontSize: 14,
              }}
            >
              {item.descripcion}
            </Typography>

            {/* Estado */}
            <Chip
              label={item.estado}
              size="small"
              sx={{
                minWidth: 95,
                fontWeight: 600,
                bgcolor: item.fondo,
                color: item.color,
                borderRadius: 2,
              }}
            />
          </Box>

          {index !== ACTIVIDADES.length - 1 && (
            <Divider sx={{ borderColor: "#F3F4F6" }} />
          )}
        </Box>
      ))}
    </Paper>
  );
}
