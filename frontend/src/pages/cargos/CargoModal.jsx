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
    >
      <DialogTitle>
        {cargo ? "Editar Cargo" : "Nuevo Cargo"}
      </DialogTitle>

      <DialogContent dividers>
        <CargoForm
          form={form}
          errors={errors}
          onChange={onChange}
        />
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          color="inherit"
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={onGuardar}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}