import { apiFetch } from "./api";

export const obtenerEmpleados = () =>
  apiFetch("/empleados");

export const obtenerEmpleado = (id) =>
  apiFetch(`/empleados/${id}`);

export const crearEmpleado = (data) =>
  apiFetch("/empleados", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const actualizarEmpleado = (id, data) =>
  apiFetch(`/empleados/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const eliminarEmpleado = (id) =>
  apiFetch(`/empleados/${id}`, {
    method: "DELETE",
  });