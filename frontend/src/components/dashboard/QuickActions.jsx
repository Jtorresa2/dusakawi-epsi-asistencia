import { Paper, Typography, Grid, Button } from "@mui/material";

import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ScheduleIcon from "@mui/icons-material/Schedule";

const acciones = [
  {
    titulo: "Nuevo empleado",
    icono: <PersonAddAltIcon />,
    color: "#2E7D32",
  },
  {
    titulo: "Registrar asistencia",
    icono: <AccessTimeFilledIcon />,
    color: "#1565C0",
  },
  {
    titulo: "Ver reportes",
    icono: <AssessmentIcon />,
    color: "#EF6C00",
  },
  {
    titulo: "Gestionar horarios",
    icono: <ScheduleIcon />,
    color: "#6A1B9A",
  },
];

export default function QuickActions() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        border: "1px solid #ECECEC",
        height: "100%",
      }}
    >
      <Typography
        variant="h6"
        fontWeight={700}
        mb={3}
      >
        Acciones rápidas
      </Typography>

      <Grid container spacing={2}>
        {acciones.map((accion) => (
          <Grid item xs={6} key={accion.titulo}>
            <Button
              fullWidth
              variant="outlined"
              sx={{
                height: 90,
                borderRadius: 3,
                textTransform: "none",
                display: "flex",
                flexDirection: "column",
                gap: 1,
                borderColor: "#ECECEC",

                "&:hover": {
                  borderColor: accion.color,
                  background: `${accion.color}10`,
                },
              }}
            >
              <span
                style={{
                  color: accion.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {accion.icono}
              </span>

              <Typography
                fontSize={13}
                fontWeight={600}
              >
                {accion.titulo}
              </Typography>
            </Button>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}