import { apiFetch } from "../../shared/api/api";

export const obtenerIndicadores = () => apiFetch("/dashboard/indicadores");

export const obtenerDashboard = async () => {
  const data = await apiFetch("/dashboard/indicadores");
  return data;
};
