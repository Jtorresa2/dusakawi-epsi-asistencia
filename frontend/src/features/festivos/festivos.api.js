import { apiFetch } from "../../shared/api/api";

export const obtenerFestivos = () => apiFetch("/festivos");
export const crearFestivo = (d) => apiFetch("/festivos", { method: "POST", body: JSON.stringify(d) });
export const eliminarFestivo = (id) => apiFetch(`/festivos/${id}`, { method: "DELETE" });
