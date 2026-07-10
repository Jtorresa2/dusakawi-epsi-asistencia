export function filtrarDatos(datos, texto, campos) {
  if (!texto) return datos;

  const busqueda = texto.toLowerCase();

  return datos.filter((item) =>
    campos.some((campo) =>
      String(item[campo] ?? "")
        .toLowerCase()
        .includes(busqueda)
    )
  );
}