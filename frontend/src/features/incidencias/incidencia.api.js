import { apiFetch } from "../../shared/api/api";

export const obtenerIncidencias = (params = {}) => {
  const query = new URLSearchParams();
  if (params.tipo) query.append("tipo", params.tipo);
  if (params.estado) query.append("estado", params.estado);
  if (params.prioridad) query.append("prioridad", params.prioridad);
  if (params.area_id) query.append("area_id", params.area_id);
  if (params.cargo_id) query.append("cargo_id", params.cargo_id);
  if (params.fecha_desde) query.append("fecha_desde", params.fecha_desde);
  if (params.fecha_hasta) query.append("fecha_hasta", params.fecha_hasta);
  if (params.busqueda) query.append("busqueda", params.busqueda);
  const qs = query.toString();
  return apiFetch(`/incidencias${qs ? `?${qs}` : ""}`);
};

export const obtenerStatsIncidencias = () => apiFetch("/incidencias/stats");

export const obtenerActividadIncidencias = () => apiFetch("/incidencias/activity");

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
