import { Box, Typography, Chip, IconButton } from "@mui/material";
import { Edit3, Eye, MoreVertical } from "lucide-react";

const tipoStyles = {
  "Tardanza": { bg: "#FEF3C7", color: "#92400E" },
  "Permiso": { bg: "#DBEAFE", color: "#1E40AF" },
  "Incapacidad": { bg: "#EDE9FE", color: "#5B21B6" },
  "Vacaciones": { bg: "#D1FAE5", color: "#065F46" },
  "Ausencia": { bg: "#FEE2E2", color: "#991B1B" },
  "Salida anticipada": { bg: "#F5E6D3", color: "#78350F" },
  "Olvido de marcación": { bg: "#F3F4F6", color: "#4B5563" },
};

const estadoStyles = {
  "Pendiente": { bg: "#FEF3C7", color: "#92400E" },
  "Aprobada": { bg: "#D1FAE5", color: "#065F46" },
  "Rechazada": { bg: "#FEE2E2", color: "#991B1B" },
};

const btnSx = {
  width: 36, height: 36, borderRadius: "10px",
  bgcolor: "#F8FAFC", border: "1px solid #E5E7EB",
  color: "#6B7280",
  "&:hover": { bgcolor: "#F3F4F6", color: "#1B5E20" },
};

function ChipCell({ label, styles }) {
  const s = styles?.[label] || { bg: "#F3F4F6", color: "#6B7280" };
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        height: 26, fontSize: 12, fontWeight: 600,
        bgcolor: s.bg, color: s.color,
      }}
    />
  );
}

export const incidenciaColumns = ({ onEditar, onVer, onMenuOpen }) => [
  {
    field: "empleado",
    headerName: "Empleado",
    flex: 1.5,
    minWidth: 240,
    renderCell: ({ row }) => (
      <Box sx={{ alignSelf: "flex-start", pt: 1 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>
          {row.empleado}
        </Typography>
        <Typography sx={{ fontSize: 11, color: "#9CA3AF", mt: 0.2 }}>
          {row.cargo}
        </Typography>
      </Box>
    ),
  },
  {
    field: "tipo",
    headerName: "Tipo",
    width: 140,
    renderCell: ({ value }) => <ChipCell label={value} styles={tipoStyles} />,
  },
  {
    field: "fecha",
    headerName: "Fecha",
    width: 110,
    renderCell: ({ value }) => {
      if (!value) return <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>—</Typography>;
      try {
        const d = new Date(value + (value.includes("T") ? "" : "T00:00:00"));
        const f = d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
        return <Typography sx={{ fontSize: 12, color: "#374151" }}>{f}</Typography>;
      } catch {
        return <Typography sx={{ fontSize: 12, color: "#374151" }}>{value}</Typography>;
      }
    },
  },
  {
    field: "estado",
    headerName: "Estado",
    width: 120,
    renderCell: ({ value }) => <ChipCell label={value} styles={estadoStyles} />,
  },
  {
    field: "responsable",
    headerName: "Responsable",
    flex: 1,
    minWidth: 180,
    renderCell: ({ row }) => (
      <Box sx={{ alignSelf: "flex-start", pt: 1 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#111827", lineHeight: 1.3 }}>
          {row.responsable || "—"}
        </Typography>
        <Typography sx={{ fontSize: 11, color: "#9CA3AF", mt: 0.2 }}>
          {row.responsable_cargo || ""}
        </Typography>
      </Box>
    ),
  },
  {
    field: "acciones",
    headerName: "Acciones",
    width: 170,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => (
      <Box display="flex" gap={0.5} alignItems="center">
        <IconButton sx={btnSx} title="Editar" onClick={(e) => { e.stopPropagation(); onEditar(row); }}>
          <Edit3 size={15} />
        </IconButton>
        <IconButton sx={btnSx} title="Ver" onClick={(e) => { e.stopPropagation(); onVer(row); }}>
          <Eye size={15} />
        </IconButton>
        <IconButton sx={btnSx} title="Más opciones" onClick={(e) => { e.stopPropagation(); onMenuOpen(e, row); }}>
          <MoreVertical size={15} />
        </IconButton>
      </Box>
    ),
  },
];
