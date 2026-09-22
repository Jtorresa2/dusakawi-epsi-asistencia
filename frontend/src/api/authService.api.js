import { apiFetch } from "./api";

export const login = (credenciales) =>
  apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(credenciales),
  });

export const cambiarPassword = (data) =>
  apiFetch("/auth/cambiar-password", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const obtenerPerfil = () =>
  apiFetch("/auth/perfil");