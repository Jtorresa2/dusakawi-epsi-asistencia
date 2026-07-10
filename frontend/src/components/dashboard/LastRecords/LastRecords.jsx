import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import DataTable from "../../common/DataTable";
import { columns } from "./columns";

const rows = [
  {
    id: 1,
    hora: "08:01",
    empleado: "Carlos Pérez",
    cargo: "Médico",
    estado: "Entrada",
  },
  {
    id: 2,
    hora: "08:12",
    empleado: "María Gómez",
    cargo: "Auxiliar",
    estado: "Entrada",
  },
  {
    id: 3,
    hora: "08:18",
    empleado: "Juan Torres",
    cargo: "Enfermero",
    estado: "Tardanza",
  },
  {
    id: 4,
    hora: "08:30",
    empleado: "Ana López",
    cargo: "Psicóloga",
    estado: "Permiso",
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

      <DataTable
        rows={rows}
        columns={columns}
        pageSize={5}
      />
    </Paper>
  );
}