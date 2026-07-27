import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
} from "@mui/material";
import { X } from "lucide-react";

import CargoForm from "./CargoForm";

export default function CargoModal({
  open,
  onClose,
  onGuardar,
  cargo,
  form,
  errors,
  onChange,
  areas = [],
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: { borderRadius: "16px", position: "relative" },
      }}
      sx={{ "& .MuiPaper-root": { backgroundColor: "#E8F5E9" } }}
    >
      <DialogTitle sx={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
        {cargo ? "Editar Cargo" : "Nuevo Cargo"}
        <IconButton onClick={onClose} size="small" sx={{ position: "absolute", top: 8, right: 8, color: "#9CA3AF", "&:hover": { color: "#6B7280", bgcolor: "#F3F4F6" } }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <CargoForm
          form={form}
          errors={errors}
          onChange={onChange}
          areas={areas}
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
