import { Box, Button } from "@mui/material";
import { COLORES } from "../../../shared/constants/colores.js";

const FILTROS = ["Hoy", "Esta semana", "Este mes", "Último año"];

export default function FilterBar({ activo, onChange }) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
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
            background: activo === f ? COLORES.primarioClaro : COLORES.fondoBlanco,
            color: activo === f ? COLORES.primarioOscuro : COLORES.textoTerciario,
            border: "1px solid",
            borderColor: activo === f ? COLORES.primarioClaro2 : COLORES.grisContorno,
            "&:hover": { background: activo === f ? COLORES.primarioClaro2 : COLORES.fondoGris },
          }}
        >
          {f}
        </Button>
      ))}
    </Box>
  );
}
