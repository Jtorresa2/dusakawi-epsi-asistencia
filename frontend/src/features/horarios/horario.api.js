import { apiFetch } from "../../shared/api/api";

export const obtenerHorarios = () => apiFetch("/horarios");

export const obtenerHorario = (id) => apiFetch(`/horarios/${id}`);

export const actualizarHorario = (id, data) =>
  apiFetch(`/horarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
