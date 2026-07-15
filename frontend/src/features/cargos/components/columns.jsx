import { Chip, Box, Typography, Button } from "@mui/material";
import { Eye, Edit3, MoreVertical, UserRound } from "lucide-react";
import IconBox from "../../../shared/components/IconBox";

const btnSx = {
  width: 36,
  height: 36,
  borderRadius: "10px",
  bgcolor: "#F8FAFC",
  border: "1px solid #E5E7EB",
  boxShadow: "0 1px 3px rgba(0,0,0,.04)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#6B7280",
  cursor: "pointer",
  flexShrink: 0,
  transition: "all .2s ease",
  "&:hover": {
    bgcolor: "#F3F4F6",
    color: "#1B5E20",
  },
};

export const cargoColumns = ({ onEditar, onVer, onMenuOpen, onNombreClick }) => [
  {
    field: "nombre",
    headerName: "Cargo",
    flex: 1.5,
    minWidth: 240,
    renderCell: ({ row }) => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%" }}>
        <IconBox icon={<UserRound />} color="#2E7D32" size={44} iconSize={22} />
        <Button
          onClick={(e) => { e.stopPropagation(); onNombreClick?.(row); }}
          sx={{ fontSize: 14, fontWeight: 600, color: "#111827", textTransform: "none", p: 0, minWidth: 0, "&:hover": { color: "#1B5E20", bgcolor: "transparent" } }}
        >
          {row.nombre}
        </Button>
      </Box>
    ),
  },
  {
    field: "areas",
    headerName: "Área",
    flex: 1,
    minWidth: 150,
    renderCell: ({ row }) => {
      const area = row.areas || row.area;
      const label = area && typeof area === "object" ? (area.nombre || area.name) : area;
      return (
        <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
          {label || "—"}
        </Typography>
      );
    },
  },
  {
    field: "descripcion",
    headerName: "Descripción",
    flex: 2,
    minWidth: 250,
    renderCell: ({ row }) => (
      <Typography
        sx={{
          fontSize: 13,
          color: "#6B7280",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {row.descripcion || "—"}
      </Typography>
    ),
  },
  {
    field: "empleados_count",
    headerName: "Empleados",
    width: 110,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => (
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
        {row.empleados_count ?? "—"}
      </Typography>
    ),
  },
  {
    field: "estado",
    headerName: "Estado",
    width: 110,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => {
      const activo = row.estado !== "inactivo";
      return (
        <Chip
          label={activo ? "Activo" : "Inactivo"}
          size="small"
          sx={{
            height: 26,
            fontSize: 12,
            fontWeight: 600,
            bgcolor: activo ? "#E8F5E9" : "#FDECEC",
            color: activo ? "#1B5E20" : "#DC2626",
          }}
        />
      );
    },
  },
  {
    field: "acciones",
    headerName: "Acciones",
    width: 140,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => (
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
        <Box
          sx={btnSx}
          title="Editar"
          onClick={(e) => {
            e.stopPropagation();
            onEditar(row);
          }}
        >
          <Edit3 size={16} />
        </Box>
        <Box
          sx={btnSx}
          title="Ver"
          onClick={(e) => {
            e.stopPropagation();
            onVer(row);
          }}
        >
          <Eye size={16} />
        </Box>
        <Box
          sx={btnSx}
          title="Más opciones"
          onClick={(e) => {
            e.stopPropagation();
            onMenuOpen(e, row);
          }}
        >
          <MoreVertical size={16} />
        </Box>
      </Box>
    ),
  },
];
