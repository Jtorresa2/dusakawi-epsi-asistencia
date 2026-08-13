import { Box, Typography } from "@mui/material";
import { CircleArrowOutUpRight, CircleCheckBig, Ban, Clock, Fingerprint, Eye, Edit3, Trash2 } from "lucide-react";
import { COLORES } from "../../../shared/constants/colores.js";

const badgeColors = {
  puntual: { bg: COLORES.successFondo, color: COLORES.verdeTexto },
  tardanza: { bg: COLORES.warningFondo, color: COLORES.warningOscuro },
  ausente: { bg: COLORES.dangerFondo, color: COLORES.dangerOscuro },
  justificado: { bg: COLORES.primarioClaro2, color: COLORES.primarioOscuro },
};

const tipoIcon = {
  huella: <Fingerprint size={14} />,
  facial: <CircleArrowOutUpRight size={14} />,
  tarjeta: <CircleCheckBig size={14} />,
  manual: <Ban size={14} />,
};

function Badge({ label, bg, color }) {
  return (
    <Typography
      sx={{
        fontSize: 11, fontWeight: 600, px: 1.2, py: 0.3, borderRadius: "8px",
        bgcolor: bg, color, display: "inline-block", textTransform: "capitalize",
      }}
    >
      {label}
    </Typography>
  );
}

const btnBase = {
  width: 32, height: 32, borderRadius: "8px", border: "none",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", flexShrink: 0, transition: "all .2s ease",
};

export const asistenciaColumns = ({ getPiso, onDetalle, onEditar, onEliminar }) => [
  {
    field: "empleado",
    headerName: "Empleado",
    flex: 0.7,
    minWidth: 160,
    renderCell: ({ row }) => (
      <Typography
        onClick={() => onDetalle?.(row)}
        sx={{ fontSize: 13, fontWeight: 500, color: COLORES.textoPrimario, alignSelf: "flex-start", pt: 1, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
      >
        {row.empleado}
      </Typography>
    ),
  },
  {
    field: "area",
    headerName: "Área",
    width: 100,
    renderCell: ({ value }) => {
      const label = value && typeof value === "object" ? (value.nombre || value.name) : value;
      return <Typography sx={{ fontSize: 12, color: COLORES.textoTerciario }}>{label || "—"}</Typography>;
    },
  },
  {
    field: "piso",
    headerName: "Piso",
    width: 60,
    sortable: false,
    renderCell: ({ row }) => {
      const piso = getPiso ? getPiso(row.area) : row.piso;
      return (
        <Typography sx={{ fontSize: 12, color: COLORES.textoTerciario, textAlign: "center", width: "100%" }}>
          {piso ? `P${piso}` : "—"}
        </Typography>
      );
    },
  },
  {
    field: "maniana",
    headerName: "Mañana",
    width: 120,
    sortable: false,
    renderCell: ({ row }) => (
      <Typography sx={{ fontSize: 12, color: COLORES.textoSecundario }}>
        {row.entrada1 && row.salida1 ? `${row.entrada1} → ${row.salida1}` : "—"}
      </Typography>
    ),
  },
  {
    field: "tarde",
    headerName: "Tarde",
    width: 120,
    sortable: false,
    renderCell: ({ row }) => (
      <Typography sx={{ fontSize: 12, color: COLORES.textoSecundario }}>
        {row.entrada2 && row.salida2 ? `${row.entrada2} → ${row.salida2}` : "—"}
      </Typography>
    ),
  },
  {
    field: "horas_trabajadas",
    headerName: "Horas",
    width: 75,
    renderCell: ({ value }) => (
      <Typography sx={{ fontSize: 12, color: COLORES.textoSecundario }}>{value ? `${value}h` : "—"}</Typography>
    ),
  },
  {
    field: "horas_extra",
    headerName: "Extra",
    width: 65,
    renderCell: ({ value }) => (
      <Typography sx={{ fontSize: 12, color: value > 0 ? COLORES.primario : COLORES.textoSuave }}>
        {value > 0 ? `${value}h` : "—"}
      </Typography>
    ),
  },
  {
    field: "minutos_tardanza",
    headerName: "Tardanza",
    width: 130,
    renderCell: ({ value }) => (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
        {value > 0 && <Clock size={14} color={COLORES.warning} style={{ flexShrink: 0 }} />}
        {value > 0 ? (
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORES.warningOscuro }}>
            {value} min
          </span>
        ) : (
          <span style={{ fontSize: 12, color: COLORES.textoSuave }}>—</span>
        )}
      </span>
    ),
  },
  {
    field: "tipo_marcacion",
    headerName: "Marcación",
    width: 125,
    renderCell: ({ value }) => (
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
        {tipoIcon[value] || null}
        <span style={{ fontSize: 12, color: COLORES.textoTerciario, textTransform: "capitalize" }}>
          {value || "—"}
        </span>
      </span>
    ),
  },
  {
    field: "estado",
    headerName: "Estado",
    width: 95,
    renderCell: ({ value }) => {
      const c = badgeColors[value] || { bg: COLORES.fondoGris2, color: COLORES.textoTerciario };
      return <Badge label={value || "—"} bg={c.bg} color={c.color} />;
    },
  },
  {
    field: "acciones",
    headerName: "Acciones",
    width: 160,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => (
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
        <Box
          sx={{ ...btnBase, bgcolor: COLORES.primarioClaro, color: COLORES.primario, "&:hover": { bgcolor: COLORES.primarioClaro2 } }}
          title="Ver detalle"
          onClick={(e) => { e.stopPropagation(); onDetalle(row); }}
        >
          <Eye size={15} />
        </Box>
        <Box
          sx={{ ...btnBase, bgcolor: COLORES.primarioClaro, color: COLORES.primario, "&:hover": { bgcolor: COLORES.primarioClaro2 } }}
          title="Editar"
          onClick={(e) => { e.stopPropagation(); onEditar(row); }}
        >
          <Edit3 size={15} />
        </Box>
        <Box
          sx={{ ...btnBase, bgcolor: COLORES.dangerFondo, color: COLORES.danger, "&:hover": { bgcolor: COLORES.dangerBorde } }}
          title="Eliminar"
          onClick={(e) => { e.stopPropagation(); onEliminar?.(row); }}
        >
          <Trash2 size={15} />
        </Box>
      </Box>
    ),
  },
];
