import { Box, Typography } from "@mui/material";
import { CircleArrowOutUpRight, CircleCheckBig, Ban, Clock, Fingerprint, Eye } from "lucide-react";
import { COLORES } from "../../../shared/constants/colores.js";

const badgeColors = {
  on_time: { bg: COLORES.successFondo, color: COLORES.verdeTexto },
  late: { bg: COLORES.warningFondo, color: COLORES.warningOscuro },
  absent: { bg: COLORES.dangerFondo, color: COLORES.dangerOscuro },
  justified: { bg: COLORES.primarioClaro2, color: COLORES.primarioOscuro },
};

const jornadaBadgeColors = {
  complete: { bg: COLORES.successFondo, color: COLORES.verdeTexto },
  open: { bg: COLORES.warningFondo, color: COLORES.warningOscuro },
};

const estadoLabels = { on_time: "Puntual", late: "Tardanza", absent: "Ausente", justified: "Justificado" };
const jornadaLabels = { complete: "Completa", open: "Abierta" };

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

export const asistenciaColumns = ({ getPiso, onDetalle }) => [
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
    field: "entrada1",
    headerName: "Entrada AM",
    width: 95,
    sortable: false,
    renderCell: ({ value }) => (
      <Typography sx={{ fontSize: 12, color: COLORES.textoSecundario }}>{value || "—"}</Typography>
    ),
  },
  {
    field: "salida1",
    headerName: "Salida AM",
    width: 95,
    sortable: false,
    renderCell: ({ value }) => (
      <Typography sx={{ fontSize: 12, color: COLORES.textoSecundario }}>{value || "—"}</Typography>
    ),
  },
  {
    field: "entrada2",
    headerName: "Entrada PM",
    width: 95,
    sortable: false,
    renderCell: ({ value }) => (
      <Typography sx={{ fontSize: 12, color: COLORES.textoSecundario }}>{value || "—"}</Typography>
    ),
  },
  {
    field: "salida2",
    headerName: "Salida PM",
    width: 95,
    sortable: false,
    renderCell: ({ value }) => (
      <Typography sx={{ fontSize: 12, color: COLORES.textoSecundario }}>{value || "—"}</Typography>
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
    field: "marcacion_estado",
    headerName: "Jornada",
    width: 100,
    sortable: false,
    renderCell: ({ value }) => {
      const c = jornadaBadgeColors[value] || { bg: COLORES.fondoGris2, color: COLORES.textoTerciario };
      return <Badge label={jornadaLabels[value] || value || "—"} bg={c.bg} color={c.color} />;
    },
  },
  {
    field: "estado",
    headerName: "Estado",
    width: 95,
    renderCell: ({ value }) => {
      const c = badgeColors[value] || { bg: COLORES.fondoGris2, color: COLORES.textoTerciario };
      return <Badge label={estadoLabels[value] || value || "—"} bg={c.bg} color={c.color} />;
    },
  },
  {
    field: "acciones",
    headerName: "Ver",
    width: 60,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => (
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", justifyContent: "center" }}>
        <Box
          sx={{ ...btnBase, bgcolor: COLORES.primarioClaro, color: COLORES.primario, "&:hover": { bgcolor: COLORES.primarioClaro2 } }}
          title="Ver detalle"
          onClick={(e) => { e.stopPropagation(); onDetalle(row); }}
        >
          <Eye size={15} />
        </Box>
      </Box>
    ),
  },
];
