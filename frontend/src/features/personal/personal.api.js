import { apiFetch } from "../../shared/api/api";

// ─── Personal (backward compat: /api/empleados) ───────────────────────────────

export const obtenerPersonal = (params = {}) => {
  const query = new URLSearchParams();
  if (params.area) query.append("area", params.area);
  if (params.cargo) query.append("cargo", params.cargo);
  const qs = query.toString();
  return apiFetch(`/empleados${qs ? `?${qs}` : ""}`);
};

export const obtenerPersonalPorId = (id) =>
  apiFetch(`/empleados/${id}`);

export const crearPersonal = (data) =>
  apiFetch("/empleados", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const actualizarPersonal = (id, data) =>
  apiFetch(`/empleados/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const eliminarPersonal = (id) =>
  apiFetch(`/empleados/${id}`, {
    method: "DELETE",
  });

// ─── Usuarios (acceso al sistema) ─────────────────────────────────────────────

export const obtenerRoles = () =>
  apiFetch("/usuarios/roles");

export const generarUsuariosMasivos = () =>
  apiFetch("/usuarios/generar-masivos", {
    method: "POST",
  });
