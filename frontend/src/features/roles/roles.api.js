import { apiFetch } from "../../shared/api/api";

export const obtenerRoles = () => apiFetch("/usuarios/roles");

export const obtenerPermisosRol = (id) => apiFetch(`/usuarios/roles/${id}/permisos`);

export const guardarRol = (id, data) =>
  apiFetch(`/usuarios/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
