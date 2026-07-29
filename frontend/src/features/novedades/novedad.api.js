import { apiFetch } from "../../shared/api/api";

export const obtenerNovedades = () => apiFetch("/novedades");

export const crearNovedad = (data) =>
  apiFetch("/novedades", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const actualizarNovedad = (id, data) =>
  apiFetch(`/novedades/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const eliminarNovedad = (id) =>
  apiFetch(`/novedades/${id}`, {
    method: "DELETE",
  });
