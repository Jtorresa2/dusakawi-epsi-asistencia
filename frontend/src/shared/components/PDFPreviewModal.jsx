import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Box } from "@mui/material";
import { Download, X } from "lucide-react";

export default function PDFPreviewModal({ open, url, onClose, titulo }) {
  const pdfUrl = url ? `${url}#zoom=100` : null;

  return (
    <Dialog open={open} onClose={onClose} fullScreen
      PaperProps={{
        sx: {
          borderRadius: 0,
          overflow: "hidden",
          m: 0,
        },
      }}>
      <DialogTitle sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: { xs: 2, sm: 3 },
        py: 2,
        bgcolor: "#F9FAFB",
        borderBottom: "1px solid #ECECEC",
      }}>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
          {titulo || "Vista previa PDF"}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: "#9CA3AF" }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", flex: 1, bgcolor: "#52525B" }}>
        <Box sx={{ width: "100%", height: "100%", overflow: "auto", flex: 1 }}>
          <iframe
            src={pdfUrl}
            width="100%"
            height="100%"
            style={{ border: "none", minHeight: "70vh" }}
            title="Vista previa PDF"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{
        px: { xs: 2, sm: 3 },
        py: 1.5,
        borderTop: "1px solid #ECECEC",
        bgcolor: "#F9FAFB",
        gap: 1,
      }}>
        <Button onClick={onClose}
          sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, color: "#6B7280" }}>
          Cerrar
        </Button>
        <Button variant="contained" startIcon={<Download size={16} />}
          onClick={() => window.open(url, "_blank")}
          sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}>
          Descargar PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}
