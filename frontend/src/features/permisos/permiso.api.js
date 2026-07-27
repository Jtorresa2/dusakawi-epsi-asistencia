import { apiFetch } from "../../shared/api/api";

export const obtenerPermisos = () => apiFetch("/permisos");

export const crearPermiso = (data) =>
  apiFetch("/permisos", {
    method: "POST",
    body: JSON.stringify(data),
  });
