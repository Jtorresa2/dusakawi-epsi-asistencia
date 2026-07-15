import {
  Paper,
  Typography,
  Stack,
  Avatar,
  Chip,
  Divider,
  Box,
} from "@mui/material";

const registros = [
  {
    id: 1,
    hora: "08:01",
    nombre: "Carlos Pérez",
    cargo: "Médico",
    estado: "Entrada",
    color: "success",
  },
  {
    id: 2,
    hora: "08:12",
    nombre: "María Gómez",
    cargo: "Auxiliar",
    estado: "Entrada",
    color: "success",
  },
  {
    id: 3,
    hora: "08:18",
    nombre: "Juan Torres",
    cargo: "Enfermero",
    estado: "Tardanza",
    color: "warning",
  },
  {
    id: 4,
    hora: "08:30",
    nombre: "Ana López",
    cargo: "Psicóloga",
    estado: "Permiso",
    color: "info",
  },
];

export default function LastRecords() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        border: "1px solid #ECECEC",
      }}
    >
      <Typography
        variant="h6"
        fontWeight={700}
        mb={3}
      >
        Últimos registros
      </Typography>

      <Stack spacing={2}>
        {registros.map((registro, index) => (
          <Box key={registro.id}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box display="flex" gap={2} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: "#E8F5E9",
                    color: "#2E7D32",
                    width: 42,
                    height: 42,
                    fontSize: 16,
                  }}
                >
                  {registro.nombre.charAt(0)}
                </Avatar>

                <Box>
                  <Typography
                    fontWeight={600}
                    fontSize={14}
                  >
                    {registro.nombre}
                  </Typography>

                  <Typography
                    fontSize={12}
                    color="text.secondary"
                  >
                    {registro.cargo}
                  </Typography>
                </Box>
              </Box>

              <Box textAlign="right">
                <Typography
                  fontWeight={600}
                  fontSize={13}
                >
                  {registro.hora}
                </Typography>

                <Chip
                  label={registro.estado}
                  size="small"
                  color={registro.color}
                />
              </Box>
            </Box>

            {index !== registros.length - 1 && (
              <Divider sx={{ mt: 2 }} />
            )}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}