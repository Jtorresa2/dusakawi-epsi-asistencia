import { apiFetch } from "../../shared/api/api";

export const obtenerIndicadores = (periodo) => {
  const params = periodo && periodo !== "Hoy" ? `?periodo=${encodeURIComponent(periodo)}` : "";
  return apiFetch(`/dashboard/indicadores${params}`);
};

export const obtenerResumenPorArea = () => apiFetch("/dashboard/resumen-areas");
