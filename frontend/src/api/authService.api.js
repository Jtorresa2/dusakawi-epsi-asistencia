import { apiFetch } from "./api";

export const login = (credenciales) =>
  apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(credenciales),
  });

export const obtenerPerfil = () =>
  apiFetch("/auth/perfil");