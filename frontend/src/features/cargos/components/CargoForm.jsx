import { TextField, Stack, MenuItem } from "@mui/material";

export default function CargoForm({
  form,
  onChange,
  errors = {},
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
      />

      <TextField
        label="Descripción"
        name="descripcion"
        value={form.descripcion}
        onChange={onChange}
        multiline
        rows={3}
        fullWidth
      />

      <TextField
        select
        label="Estado"
        name="estado"
        value={form.estado || "activo"}
        onChange={onChange}
        fullWidth
      >
        <MenuItem value="activo">Activo</MenuItem>
        <MenuItem value="inactivo">Inactivo</MenuItem>
      </TextField>
    </Stack>
  );
}
