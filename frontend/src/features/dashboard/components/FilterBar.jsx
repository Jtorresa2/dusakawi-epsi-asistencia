import { useState } from "react";
import { Box, Button, Menu, MenuItem } from "@mui/material";
import { Download, FileText } from "lucide-react";

const FILTROS = ["Hoy", "Esta semana", "Este mes", "Último año"];

export default function FilterBar({ onExport }) {
  const [activo, setActivo] = useState("Hoy");
  const [anchor, setAnchor] = useState(null);

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
      <Box sx={{ display: "flex", gap: 1 }}>
        {FILTROS.map((f) => (
          <Button
            key={f}
            onClick={() => setActivo(f)}
            sx={{
              px: 2.5,
              py: 0.8,
              borderRadius: "10px",
              fontSize: 13,
              fontWeight: 600,
              textTransform: "none",
              background: activo === f ? "#E8F5E9" : "#fff",
              color: activo === f ? "#1B5E20" : "#6B7280",
              border: "1px solid",
              borderColor: activo === f ? "#A5D6A7" : "#ECECEC",
              "&:hover": { background: activo === f ? "#C8E6C9" : "#F9FAFB" },
            }}
          >
            {f}
          </Button>
        ))}
      </Box>
      <Box>
        <Button
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{
            px: 3,
            py: 0.8,
            borderRadius: "10px",
            fontSize: 13,
            fontWeight: 600,
            textTransform: "none",
            background: "#1B5E20",
            color: "#fff",
            "&:hover": { background: "#2E7D32" },
          }}
        >
          Exportar informe
        </Button>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
          transformOrigin={{ horizontal: "right", vertical: "top" }} anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{ sx: { borderRadius: "12px", mt: 0.5, minWidth: 180, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } }}>
          <MenuItem onClick={() => { setAnchor(null); onExport?.("excel"); }} sx={{ borderRadius: "8px", mx: 0.5, fontSize: 13, gap: 1 }}>
            <FileText size={16} /> Exportar Excel
          </MenuItem>
          <MenuItem onClick={() => { setAnchor(null); onExport?.("preview"); }} sx={{ borderRadius: "8px", mx: 0.5, fontSize: 13, gap: 1 }}>
            <FileText size={16} /> Vista previa PDF
          </MenuItem>
          <MenuItem onClick={() => { setAnchor(null); onExport?.("pdf"); }} sx={{ borderRadius: "8px", mx: 0.5, fontSize: 13, gap: 1 }}>
            <Download size={16} /> Exportar PDF
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
