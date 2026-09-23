import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
} from "@mui/material";
import { AlertTriangle } from "lucide-react"; // O el ícono que prefieras
import { COLORES } from "../constants/colores.js";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  titulo = "Confirmar acción",
  mensaje = "¿Está seguro de continuar con esta operación?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmColor = "error", // 'error', 'primary', 'warning', 'success'
  isDestructive = true, // Controla si mostrar ícono de alerta rojo
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: "12px",
            boxShadow: "0 10px 40px -10px rgba(0,0,0,0.2)",
          },
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pt: 3, pb: 1 }}>
        {isDestructive && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "50%",
              bgcolor: COLORES.dangerFondo || "rgba(239, 68, 68, 0.1)",
              color: COLORES.danger || "#ef4444",
            }}
          >
            <AlertTriangle size={18} />
          </Box>
        )}
        <Box sx={{ fontSize: 16, fontWeight: 700, color: COLORES.textoPrimario }}>
          {titulo}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <DialogContentText sx={{ fontSize: 14, color: COLORES.textoSuave, ml: isDestructive ? 5.5 : 0 }}>
          {mensaje}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          disableElevation
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            fontSize: 13,
            fontWeight: 600,
            color: COLORES.textoTerciario,
            "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
          }}
        >
          {cancelText}
        </Button>

        <Button
          variant="contained"
          color={confirmColor}
          disableElevation
          onClick={() => {
            onConfirm();
            onClose(); // Cerrar automáticamente al confirmar
          }}
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            fontSize: 13,
            fontWeight: 600,
            px: 3,
            ...(confirmColor === "primary" && {
              bgcolor: COLORES.primarioOscuro,
              "&:hover": { bgcolor: COLORES.primario },
            }),
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}