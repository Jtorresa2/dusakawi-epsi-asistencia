import { apiFetch } from "../../shared/api/api";

export const obtenerHorarios = () => apiFetch("/horarios");

export const obtenerHorario = (id) => apiFetch(`/horarios/${id}`);

export const obtenerMiHorario = () => apiFetch("/horarios/mi-horario");

export const actualizarHorario = (id, data) =>
  apiFetch(`/horarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const crearHorario = (data) =>
  apiFetch("/horarios", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const eliminarHorario = (id) =>
  apiFetch(`/horarios/${id}`, {
    method: "DELETE",
  });

export const asignarHorario = (data) =>
  apiFetch("/horarios/asignar", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const asignarMasivo = (data) =>
  apiFetch("/horarios/asignar-masivo", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const desasignarHorario = (usuarioId) =>
  apiFetch("/horarios/desasignar", {
    method: "POST",
    body: JSON.stringify({ usuario_id: usuarioId }),
  });

export const obtenerAsignados = (id) => apiFetch(`/horarios/${id}/asignados`);

export const obtenerHistorial = (usuarioId) =>
  apiFetch(`/horarios/usuarios/${usuarioId}/historial`);

export const obtenerHistorialGlobal = () => apiFetch("/horarios/historial-global");

export const establecerPorDefecto = (id, esPorDefecto) =>
  apiFetch(`/horarios/${id}/por-defecto`, {
    method: "POST",
    body: JSON.stringify({ es_por_defecto: esPorDefecto }),
  });

export const obtenerUsuarios = () => apiFetch("/usuarios");
