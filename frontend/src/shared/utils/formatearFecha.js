export function formatearFecha(fecha) {
  if (!fecha) return "";

  return new Date(fecha).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}