import Chip from "@mui/material/Chip";

function estadoChip(estado) {
  switch (estado) {
    case "Entrada":
      return <Chip label="Entrada" color="success" size="small" />;

    case "Salida":
      return <Chip label="Salida" color="primary" size="small" />;

    case "Tardanza":
      return <Chip label="Tardanza" color="warning" size="small" />;

    case "Permiso":
      return <Chip label="Permiso" color="info" size="small" />;

    default:
      return <Chip label={estado} size="small" />;
  }
}

export const columns = [
  {
    field: "hora",
    headerName: "Hora",
    width: 120,
  },
  {
    field: "empleado",
    headerName: "Empleado",
    flex: 1,
  },
  {
    field: "cargo",
    headerName: "Cargo",
    flex: 1,
  },
  {
    field: "estado",
    headerName: "Estado",
    width: 150,
    renderCell: ({ value }) => estadoChip(value),
  },
];