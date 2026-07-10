import { Navigate } from "react-router-dom";

export default function RoleRoute({ children, roles }) {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  // Si aún no hay usuario
  if (!usuario.rol) {
    return <Navigate to="/login" replace />;
  }

  // Si el rol no tiene permiso
  if (!roles.includes(usuario.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}