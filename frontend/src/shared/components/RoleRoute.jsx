import { Navigate } from "react-router-dom";

export default function RoleRoute({ children, roles }) {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const rolesMap = { "Administrador": "admin", "Talento Humano": "talento_humano", "Empleado": "empleado" };
  const rol = rolesMap[usuario.rol] || usuario.rol;

  if (!rol) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}