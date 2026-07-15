import { Box, Button } from "@mui/material";

export default function FormActions({
  onCancel,
  onSave,
  loading = false,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 2,
        mt: 3,
      }}
    >
      <Button
        variant="outlined"
        onClick={onCancel}
      >
        Cancelar
      </Button>

      <Button
        variant="contained"
        color="success"
        onClick={onSave}
        disabled={loading}
      >
        {loading ? "Guardando..." : "Guardar"}
      </Button>
    </Box>
  );
}