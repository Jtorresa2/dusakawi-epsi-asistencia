import { apiFetch } from "../../shared/api/api";

export const obtenerAreas = () => apiFetch("/areas");

export const obtenerArea = (id) => apiFetch(`/areas/${id}`);

export const crearArea = (data) =>
  apiFetch("/areas", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const actualizarArea = (id, data) =>
  apiFetch(`/areas/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const eliminarArea = (id) =>
  apiFetch(`/areas/${id}`, {
    method: "DELETE",
  });

export const obtenerEmpleadosPorArea = (id) => apiFetch(`/areas/${id}/empleados`);
