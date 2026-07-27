import { Chip, Box, Typography, Button } from "@mui/material";
import { Eye, Edit3, MoreVertical, UserRound } from "lucide-react";
import IconBox from "../../../shared/components/IconBox";

const btnBase = {
  width: 32, height: 32, borderRadius: "8px", border: "none",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", flexShrink: 0, transition: "all .2s ease",
};

export const cargoColumns = ({ onEditar, onVer, onMenuOpen, onNombreClick }) => [
  {
    field: "nombre",
    headerName: "Cargo",
    flex: 2,
    minWidth: 160,
    renderCell: ({ row }) => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%", minWidth: 0, overflow: "hidden" }}>
        <IconBox icon={<UserRound />} color="#2E7D32" size={36} iconSize={18} sx={{ flexShrink: 0 }} />
        <Button
          onClick={(e) => { e.stopPropagation(); onNombreClick?.(row); }}
          sx={{
            fontSize: 14, fontWeight: 600, color: "#111827", textTransform: "none",
            p: 0, minWidth: 0, textAlign: "left", lineHeight: 1.3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            display: "block",
            "&:hover": { color: "#1B5E20", bgcolor: "transparent" },
          }}
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
    minWidth: 100,
    renderCell: ({ row }) => {
      const area = row.areas || row.area;
      const label = area && typeof area === "object" ? (area.nombre || area.name) : area;
      return (
        <Typography sx={{ fontSize: 13, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label || "—"}
        </Typography>
      );
    },
  },
  {
    field: "descripcion",
    headerName: "Descripción",
    flex: 1.5,
    minWidth: 120,
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
    flex: 0.5,
    minWidth: 80,
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
    flex: 0.5,
    minWidth: 80,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => {
      const activo = row.estado !== "inactivo";
      return (
        <Chip
          label={activo ? "Activo" : "Inactivo"}
          size="small"
          sx={{
            height: 24,
            fontSize: 11,
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
    width: 120,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => (
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
        <Box
          sx={{ ...btnBase, bgcolor: "#EFF6FF", color: "#1565C0", "&:hover": { bgcolor: "#DBEAFE" } }}
          title="Editar"
          onClick={(e) => {
            e.stopPropagation();
            onEditar(row);
          }}
        >
          <Edit3 size={15} />
        </Box>
        <Box
          sx={{ ...btnBase, bgcolor: "#EFF6FF", color: "#1565C0", "&:hover": { bgcolor: "#DBEAFE" } }}
          title="Ver"
          onClick={(e) => {
            e.stopPropagation();
            onVer(row);
          }}
        >
          <Eye size={15} />
        </Box>
        <Box
          sx={{ ...btnBase, bgcolor: "#FEF3C7", color: "#92400E", "&:hover": { bgcolor: "#FDE68A" } }}
          title="Más opciones"
          onClick={(e) => {
            e.stopPropagation();
            onMenuOpen(e, row);
          }}
        >
          <MoreVertical size={15} />
        </Box>
      </Box>
    ),
  },
];
