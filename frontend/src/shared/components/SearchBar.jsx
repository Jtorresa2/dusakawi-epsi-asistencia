import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { COLORES } from "../constants/colores.js";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Buscar..."
}) {
  return (
    <TextField
      fullWidth
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon color="action" />
          </InputAdornment>
        ),
      }}
      sx={{
        backgroundColor: COLORES.fondoBlanco,
        borderRadius: 2,
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
        },
      }}
    />
  );
}