import { apiFetch } from "../../shared/api/api";

export const obtenerRegistros = (params = {}) => {
  const query = new URLSearchParams();
  if (params.fecha) query.append("fecha", params.fecha);
  if (params.fecha_desde) query.append("fecha_desde", params.fecha_desde);
  if (params.fecha_hasta) query.append("fecha_hasta", params.fecha_hasta);
  if (params.area) query.append("area", params.area);
  if (params.piso) query.append("piso", params.piso);
  if (params.estado) query.append("estado", params.estado);
  const qs = query.toString();
  return apiFetch(`/asistencia${qs ? `?${qs}` : ""}`);
};

export const registrarManual = (data) =>
  apiFetch("/asistencia/manual", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const justificarAusencia = (id, data) =>
  apiFetch(`/asistencia/${id}/justificar`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const eliminarRegistro = (id) =>
  apiFetch(`/asistencia/${id}`, { method: "DELETE" });

export const actualizarRegistro = (id, data) =>
  apiFetch(`/asistencia/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
