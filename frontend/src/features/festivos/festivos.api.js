import { apiFetch } from "../../shared/api/api";

export const obtenerFestivos = () => apiFetch("/festivos");
export const crearFestivo = (d) => apiFetch("/festivos", { method: "POST", body: JSON.stringify(d) });
export const eliminarFestivo = (id) => apiFetch(`/festivos/${id}`, { method: "DELETE" });
export const actualizarFestivo = (id, d) => apiFetch(`/festivos/${id}`, { method: "PUT", body: JSON.stringify(d) });
export const generarFestivos = (year) =>
  apiFetch("/festivos/generar", { method: "POST", body: JSON.stringify({ year }) });
