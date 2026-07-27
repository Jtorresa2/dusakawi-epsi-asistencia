import { apiFetch } from "../../shared/api/api";

export const obtenerConfig = () => apiFetch("/config");

export const actualizarConfig = (data) =>
  apiFetch("/config", {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const respaldarBD = () => apiFetch("/config/respaldar");
