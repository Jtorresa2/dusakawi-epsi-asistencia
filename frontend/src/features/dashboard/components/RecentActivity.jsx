import {
  Paper,
  Typography,
  Stack,
  Divider,
} from "@mui/material";

const actividades = [
  {
    hora: "08:05",
    texto: "Carlos Pérez registró entrada",
  },
  {
    hora: "08:17",
    texto: "María Gómez reportó tardanza",
  },
  {
    hora: "09:10",
    texto: "Luis Torres solicitó permiso",
  },
  {
    hora: "09:42",
    texto: "Ana Díaz inició vacaciones",
  },
];

export default function RecentActivity() {
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
        Actividad reciente
      </Typography>

      <Stack spacing={2}>
        {actividades.map((item, index) => (
          <div key={index}>
            <Typography
              fontWeight={600}
              fontSize={13}
              color="success.main"
            >
              {item.hora}
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={14}
            >
              {item.texto}
            </Typography>

            {index !== actividades.length - 1 && (
              <Divider sx={{ mt: 2 }} />
            )}
          </div>
        ))}
      </Stack>
    </Paper>
  );
}