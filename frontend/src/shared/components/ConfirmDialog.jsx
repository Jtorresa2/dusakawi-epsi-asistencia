import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  titulo = "Confirmar acción",
  mensaje = "¿Está seguro de continuar?",
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>
        ⚠️ {titulo}
      </DialogTitle>

      <DialogContent>
        <DialogContentText>
          {mensaje}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          color="inherit"
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
}