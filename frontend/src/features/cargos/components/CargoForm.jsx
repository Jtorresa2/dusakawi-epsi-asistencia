import { TextField, Stack, MenuItem } from "@mui/material";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    "& fieldset": { borderColor: "#6B7280" },
    "&:hover fieldset": { borderColor: "#374151" },
    "&.Mui-focused fieldset": { borderColor: "#1B5E20" },
  },
};

export default function CargoForm({
  form,
  onChange,
  errors = {},
  areas = [],
}) {
  return (
    <Stack spacing={2.5}>
      <TextField
        label="Nombre del cargo"
        name="nombre"
        value={form.nombre}
        onChange={onChange}
        error={!!errors.nombre}
        helperText={errors.nombre}
        fullWidth
        required
        sx={fieldSx}
      />

      <TextField
        select
        label="Área"
        name="area_id"
        value={form.area_id ?? ""}
        onChange={onChange}
        fullWidth
        sx={fieldSx}
      >
        <MenuItem value="">
          <em>Sin área</em>
        </MenuItem>
        {areas.map((a) => (
          <MenuItem key={a.id} value={a.id}>
            {a.nombre}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="Descripción"
        name="descripcion"
        value={form.descripcion}
        onChange={onChange}
        multiline
        rows={3}
        fullWidth
        sx={fieldSx}
      />

      <TextField
        select
        label="Estado"
        name="estado"
        value={form.estado || "activo"}
        onChange={onChange}
        fullWidth
        sx={fieldSx}
      >
        <MenuItem value="activo">Activo</MenuItem>
        <MenuItem value="inactivo">Inactivo</MenuItem>
      </TextField>
    </Stack>
  );
}
