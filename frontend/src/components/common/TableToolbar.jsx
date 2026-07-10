import {
  Box,
  Typography,
  Button,
} from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";
import SearchBar from "./SearchBar";

export default function TableToolbar({
  busqueda,
  setBusqueda,
  total = 0,
  placeholder = "Buscar...",
  mostrarExportar = false,
  onExportar,
}) {
  return (
    <Box
      sx={{
        mb: 3,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 280 }}>
        <SearchBar
          value={busqueda}
          onChange={setBusqueda}
          placeholder={placeholder}
        />
      </Box>

      <Box
        display="flex"
        alignItems="center"
        gap={2}
      >
        <Typography
          color="text.secondary"
          fontWeight={600}
        >
          Total: {total}
        </Typography>

        {mostrarExportar && (
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={onExportar}
          >
            Exportar
          </Button>
        )}
      </Box>
    </Box>
  );
}