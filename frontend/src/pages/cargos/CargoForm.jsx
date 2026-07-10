import { TextField, Stack } from "@mui/material";

export default function CargoForm({
  form,
  onChange,
  errors = {},
}) {
  return (
    <Stack spacing={2}>
      <TextField
        label="Nombre"
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
        error={!!errors.descripcion}
        helperText={errors.descripcion}
        multiline
        rows={3}
        fullWidth
      />
    </Stack>
  );
}