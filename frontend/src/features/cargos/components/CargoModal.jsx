import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

import CargoForm from "./CargoForm";

export default function CargoModal({
  open,
  onClose,
  onGuardar,
  cargo,
  form,
  errors,
  onChange,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: { borderRadius: "16px" },
      }}
    >
      <DialogTitle sx={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
        {cargo ? "Editar Cargo" : "Nuevo Cargo"}
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <CargoForm
          form={form}
          errors={errors}
          onChange={onChange}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 0 }}>
        <Button
          onClick={onClose}
          sx={{
            textTransform: "none", fontWeight: 600, fontSize: 13,
            color: "#6B7280", px: 3, borderRadius: "10px",
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={onGuardar}
          sx={{
            textTransform: "none", fontWeight: 600, fontSize: 13,
            bgcolor: "#1B5E20", px: 3, borderRadius: "10px",
            "&:hover": { bgcolor: "#2E7D32" },
          }}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
