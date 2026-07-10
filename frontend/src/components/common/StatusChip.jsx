import { Chip } from "@mui/material";

export default function StatusChip({
  activo
}) {
  return (
    <Chip
      label={activo ? "Activo" : "Inactivo"}
      color={activo ? "success" : "default"}
      size="small"
    />
  );
}