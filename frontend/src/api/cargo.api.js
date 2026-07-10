import { apiFetch } from "./api";

export const obtenerCargos = () =>
  apiFetch("/cargos");

export const crearCargo = (data) =>
  apiFetch("/cargos", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const actualizarCargo = (id, data) =>
  apiFetch(`/cargos/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const eliminarCargo = (id) =>
  apiFetch(`/cargos/${id}`, {
    method: "DELETE",
  });