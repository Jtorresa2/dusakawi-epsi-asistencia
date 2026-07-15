import { apiFetch } from "../../shared/api/api";

export const obtenerIncidencias = (params = {}) => {
  const query = new URLSearchParams();
  if (params.tipo) query.append("tipo", params.tipo);
  if (params.estado) query.append("estado", params.estado);
  if (params.area) query.append("area", params.area);
  if (params.fecha) query.append("fecha", params.fecha);
  if (params.search) query.append("search", params.search);
  const qs = query.toString();
  return apiFetch(`/incidencias${qs ? `?${qs}` : ""}`);
};

export const crearIncidencia = (data) =>
  apiFetch("/incidencias", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const actualizarIncidencia = (id, data) =>
  apiFetch(`/incidencias/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const eliminarIncidencia = (id) =>
  apiFetch(`/incidencias/${id}`, {
    method: "DELETE",
  });

export const descargarPlantilla = (id) => {
  const token = localStorage.getItem("token");
  window.open(`/api/pdf/incidencias/${id}/plantilla?token=${token}`, "_blank");
};

export const aprobarConFirma = (id, file) => {
  const formData = new FormData();
  formData.append("archivo_firmado", file);
  return apiFetch(`/incidencias/${id}/aprobar-con-firma`, {
    method: "PUT",
    body: formData,
  });
};
