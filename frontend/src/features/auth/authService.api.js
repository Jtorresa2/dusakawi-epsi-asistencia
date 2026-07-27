import { apiFetch } from "../../shared/api/api";

export const login = (credenciales) =>
  apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(credenciales),
  });

export const verificarCedula = (cedula) =>
  apiFetch("/auth/verificar-cedula", {
    method: "POST",
    body: JSON.stringify({ cedula }),
  });

export const registro = (data) =>
  apiFetch("/auth/registro", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const obtenerPerfil = () =>
  apiFetch("/auth/perfil");