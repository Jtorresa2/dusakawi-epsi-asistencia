import { apiFetch } from "../../shared/api/api";

/**
 * Seguimiento de Asistencia — API de consulta (solo lectura).
 * Contrato: GET /api/seguimiento (filtros + kpis + paginación, cap 500) y
 * GET /api/pdf/seguimiento SIEMPRE con Authorization Bearer (REQ-13).
 */

function armarQuery(params = {}) {
  const query = new URLSearchParams();
  if (params.fecha_desde) query.append("fecha_desde", params.fecha_desde);
  if (params.fecha_hasta) query.append("fecha_hasta", params.fecha_hasta);
  if (params.area) query.append("area", params.area);
  if (params.piso) query.append("piso", params.piso);
  if (params.situacion) query.append("situacion", params.situacion);
  if (params.busqueda) query.append("busqueda", params.busqueda);
  if (params.page) query.append("page", params.page);
  if (params.pageSize) query.append("pageSize", params.pageSize);
  return query.toString();
}

/**
 * Obtiene la lista paginada + KPIs del módulo.
 * Respuesta esperada: { rows, total, page, pageSize, kpis:{total,ausencia,
 * falta_manana,falta_tarde,salida_no_registrada,jornada_abierta} }.
 */
export const obtenerSeguimiento = (params = {}) => {
  const qs = armarQuery(params);
  return apiFetch(`/seguimiento${qs ? `?${qs}` : ""}`);
};

/**
 * Descarga el PDF del módulo con autenticación: fetch → blob con el header
 * Authorization (NO window.open sin token). La descarga se dispara desde el
 * blob ya autenticado.
 */
export const descargarPdfSeguimiento = async (params = {}) => {
  const qs = armarQuery(params);
  const token = localStorage.getItem("token");
  const response = await fetch(`/api/pdf/seguimiento${qs ? `?${qs}` : ""}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    let mensaje = "Error al generar el PDF";
    try {
      const data = await response.json();
      if (data?.mensaje) mensaje = data.mensaje;
    } catch {
      // cuerpo no JSON
    }
    throw new Error(mensaje);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "seguimiento_asistencia.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};
