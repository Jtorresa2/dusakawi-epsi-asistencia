import { IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export const cargoColumns = (onEditar, onEliminar) => [
  {
    field: "nombre",
    headerName: "Cargo",
    flex: 1,
    minWidth: 220,
  },
  {
    field: "descripcion",
    headerName: "Descripción",
    flex: 2,
    minWidth: 300,
  },
  {
    field: "acciones",
    headerName: "Acciones",
    width: 130,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => (
      <>
        <Tooltip title="Editar">
          <IconButton
            color="primary"
            size="small"
            onClick={() => onEditar(row)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Eliminar">
          <IconButton
            color="error"
            size="small"
            onClick={() => onEliminar(row)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </>
    ),
  },
];