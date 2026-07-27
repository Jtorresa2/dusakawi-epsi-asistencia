import { Box, Button } from "@mui/material";

const FILTROS = ["Hoy", "Esta semana", "Este mes", "Último año"];

export default function FilterBar({ activo, onChange }) {
  return (
    <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
      {FILTROS.map((f) => (
        <Button
          key={f}
          onClick={() => onChange?.(f)}
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
  );
}
