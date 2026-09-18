import { Box, Typography } from "@mui/material";
import { Eye, TriangleAlert } from "lucide-react";
import { COLORES } from "../../../shared/constants/colores.js";

/**
 * Columnas del módulo Seguimiento de Asistencia (REQ-08/10).
 * Situación y tramo como badges, estado de la incidencia vinculada y
 * acciones SOLO de lectura: Ver detalle y Ver en Incidencias
 * (este último únicamente cuando existe incidencia formal — REQ-10).
 */

export const SITUACION_STYLES = {
  absence: { bg: COLORES.dangerFondo, color: COLORES.dangerOscuro, label: "Ausencia" },
  missing_morning: { bg: COLORES.warningFondo, color: COLORES.warningOscuro, label: "Falta mañana" },
  missing_afternoon: { bg: COLORES.warningFondo, color: COLORES.warningOscuro2, label: "Falta tarde" },
  unregistered_exit: { bg: COLORES.primarioClaro, color: COLORES.primarioOscuro, label: "Salida no registrada" },
  open_day: { bg: COLORES.fondoGris2, color: COLORES.textoSecundario, label: "Jornada abierta" },
};

export const TRAMO_STYLES = {
  morning: { bg: COLORES.fondoGris2, color: COLORES.textoTerciario, label: "Mañana" },
  afternoon: { bg: COLORES.fondoGris2, color: COLORES.textoTerciario, label: "Tarde" },
  full: { bg: COLORES.successClaro, color: COLORES.verdeTexto, label: "Completo" },
};

export const INCIDENCIA_ESTADO_STYLES = {
  pending: { bg: COLORES.warningFondo, color: COLORES.warningOscuro, label: "Pendiente" },
  under_review: { bg: COLORES.primarioClaro, color: COLORES.primarioOscuro, label: "En revisión" },
  approved: { bg: COLORES.successFondo, color: COLORES.verdeTexto, label: "Aprobada" },
  rejected: { bg: COLORES.dangerFondo, color: COLORES.dangerOscuro, label: "Rechazada" },
};

function Badge({ style, value }) {
  return (
    <Typography
      sx={{
        fontSize: 11,
        fontWeight: 600,
        px: 1.2,
        py: 0.4,
        borderRadius: "8px",
        bgcolor: style?.bg || COLORES.fondoGris2,
        color: style?.color || COLORES.textoSecundario,
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {style?.label ?? value ?? "—"}
    </Typography>
  );
}

const btnBase = {
  width: 32,
  height: 32,
  borderRadius: "8px",
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
  transition: "all .2s ease",
};

export const seguimientoColumns = ({ onDetalle, onVerIncidencia }) => [
  {
    field: "empleado",
    headerName: "Empleado",
    flex: 1,
    minWidth: 190,
    renderCell: ({ row }) => (
      <Box>
        <Typography
          onClick={() => onDetalle?.(row)}
          sx={{ fontSize: 13, fontWeight: 500, color: COLORES.textoPrimario, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
        >
          {row.empleado}
        </Typography>
        <Typography sx={{ fontSize: 11, color: COLORES.textoSuave }}>C.C. {row.cedula || "—"}</Typography>
      </Box>
    ),
  },
  {
    field: "area",
    headerName: "Área",
    width: 140,
    renderCell: ({ value }) => (
      <Typography sx={{ fontSize: 12, color: COLORES.textoTerciario }}>{value || "—"}</Typography>
    ),
  },
  {
    field: "piso",
    headerName: "Piso",
    width: 70,
    sortable: false,
    renderCell: ({ value }) => (
      <Typography sx={{ fontSize: 12, color: COLORES.textoTerciario, textAlign: "center", width: "100%" }}>
        {value ? `P${value}` : "—"}
      </Typography>
    ),
  },
  {
    field: "situacion",
    headerName: "Situación",
    width: 160,
    sortable: false,
    renderCell: ({ value }) => <Badge style={SITUACION_STYLES[value]} value={value} />,
  },
  {
    field: "tramo",
    headerName: "Tramo",
    width: 105,
    sortable: false,
    renderCell: ({ value }) => <Badge style={TRAMO_STYLES[value]} value={value} />,
  },
  {
    field: "incidencia",
    headerName: "Incidencia",
    width: 120,
    sortable: false,
    renderCell: ({ row }) => {
      if (!row.tiene_incidencia || !row.incidencia_estado) {
        return <Typography sx={{ fontSize: 12, color: COLORES.textoSuave }}>—</Typography>;
      }
      return <Badge style={INCIDENCIA_ESTADO_STYLES[row.incidencia_estado]} value={row.incidencia_estado} />;
    },
  },
  {
    field: "fecha",
    headerName: "Fecha",
    width: 105,
    renderCell: ({ value }) => (
      <Typography sx={{ fontSize: 12, color: COLORES.textoTerciario, whiteSpace: "nowrap" }}>{value || "—"}</Typography>
    ),
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
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", justifyContent: "center" }}>
        <Box
          sx={{ ...btnBase, bgcolor: COLORES.primarioClaro, color: COLORES.primario, "&:hover": { bgcolor: COLORES.primarioClaro2 } }}
          title="Ver detalle"
          onClick={(e) => { e.stopPropagation(); onDetalle?.(row); }}
        >
          <Eye size={15} />
        </Box>
        {row.tiene_incidencia && row.incidencia_id && (
          <Box
            sx={{ ...btnBase, bgcolor: COLORES.warningFondo, color: COLORES.warningOscuro, "&:hover": { bgcolor: "#FDE68A" } }}
            title="Ver en Incidencias"
            onClick={(e) => { e.stopPropagation(); onVerIncidencia?.(row); }}
          >
            <TriangleAlert size={15} />
          </Box>
        )}
      </Box>
    ),
  },
];
