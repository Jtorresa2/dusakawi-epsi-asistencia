import { Navigate } from "react-router-dom";

// Toda ruta autenticada exige un rol de esta lista, incluido /dashboard.
// Un rol fuera de ella no tiene ninguna ruta alcanzable.
const ROLES_PLATAFORMA = ["admin", "talento_humano"];

export default function RoleRoute({ children, roles }) {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const rolesMap = { "Administrador": "admin", "Talento Humano": "talento_humano" };
  const rol = rolesMap[usuario.rol] || usuario.rol;

  if (!rol) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(rol)) {
    // /dashboard también está protegido por roles. Si la cuenta tampoco puede
    // entrar ahí, redirigir a /dashboard lo devolvería al mismo punto en bucle,
    // así que se manda a /login, que no depende del rol y termina el ciclo.
    const tieneDestino = ROLES_PLATAFORMA.includes(rol);
    return <Navigate to={tieneDestino ? "/dashboard" : "/login"} replace />;
  }

  return children;
}