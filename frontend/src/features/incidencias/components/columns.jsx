import { Box, Typography, Chip, IconButton } from "@mui/material";
import { Edit3, Eye, MoreVertical } from "lucide-react";
import { COLORES } from "../../../shared/constants/colores.js";

const tipoStyles = {
  "Tardanza": { bg: COLORES.warningFondo, color: COLORES.warningOscuro },
  "Permiso": { bg: COLORES.primarioClaro2, color: COLORES.primarioOscuro },
  "Incapacidad": { bg: COLORES.primarioClaro, color: COLORES.primarioOscuro },
  "Vacaciones": { bg: COLORES.successFondo, color: COLORES.verdeTexto },
  "Ausencia": { bg: COLORES.dangerFondo, color: COLORES.dangerOscuro },
  "Salida anticipada": { bg: COLORES.warningFondo, color: COLORES.warningOscuro },
  "Olvido de marcación": { bg: COLORES.fondoGris2, color: COLORES.textoMuted },
};

const estadoStyles = {
  "Pendiente": { bg: COLORES.warningFondo, color: COLORES.warningOscuro },
  "Aprobada": { bg: COLORES.successFondo, color: COLORES.verdeTexto },
  "Rechazada": { bg: COLORES.dangerFondo, color: COLORES.dangerOscuro },
};

const btnBase = {
  width: 36, height: 36, borderRadius: "9px",
  transition: "all .2s ease",
};

function ChipCell({ label, styles }) {
  const s = styles?.[label] || { bg: COLORES.fondoGris2, color: COLORES.textoTerciario };
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
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORES.textoPrimario, lineHeight: 1.3 }}>
          {row.empleado}
        </Typography>
        <Typography sx={{ fontSize: 11, color: COLORES.textoSuave, mt: 0.2 }}>
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
      if (!value) return <Typography sx={{ fontSize: 12, color: COLORES.textoSuave }}>—</Typography>;
      try {
        const d = new Date(value + (value.includes("T") ? "" : "T00:00:00"));
        const f = d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
        return <Typography sx={{ fontSize: 12, color: COLORES.textoSecundario }}>{f}</Typography>;
      } catch {
        return <Typography sx={{ fontSize: 12, color: COLORES.textoSecundario }}>{value}</Typography>;
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
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: COLORES.textoPrimario, lineHeight: 1.3 }}>
          {row.responsable || "—"}
        </Typography>
        <Typography sx={{ fontSize: 11, color: COLORES.textoSuave, mt: 0.2 }}>
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
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
        <IconButton sx={{ ...btnBase, bgcolor: COLORES.primarioClaro, color: COLORES.primario, "&:hover": { bgcolor: COLORES.primarioClaro2 } }} title="Editar" onClick={(e) => { e.stopPropagation(); onEditar(row); }}>
          <Edit3 size={15} />
        </IconButton>
        <IconButton sx={{ ...btnBase, bgcolor: COLORES.primarioClaro, color: COLORES.primario, "&:hover": { bgcolor: COLORES.primarioClaro2 } }} title="Ver" onClick={(e) => { e.stopPropagation(); onVer(row); }}>
          <Eye size={15} />
        </IconButton>
        <IconButton sx={{ ...btnBase, bgcolor: COLORES.primarioClaro, color: COLORES.primario, "&:hover": { bgcolor: COLORES.primarioClaro2 } }} title="Más opciones" onClick={(e) => { e.stopPropagation(); onMenuOpen(e, row); }}>
          <MoreVertical size={15} />
        </IconButton>
      </Box>
    ),
  },
];
