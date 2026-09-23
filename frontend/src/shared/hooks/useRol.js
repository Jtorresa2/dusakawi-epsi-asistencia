import { useState, useEffect } from "react";
import { puede as puedeEstatico } from "../novedades";
import { usePermissions, puedeConjunto } from "../permissions";

export default function useRol() {
  const [rol, setRol] = useState(null);
  const perms = usePermissions();

  useEffect(() => {
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
      setRol(usuario.rol || null);
    } catch {
      setRol(null);
    }
  }, []);

  function puedeAcceder(modulo, accion = "ver") {
    // Prefer the real permissions once loaded; fall back to the static role
    // map only while the permissions request is in flight.
    if (perms) return puedeConjunto(perms, modulo, accion);
    if (!rol) return false;
    return puedeEstatico(rol, modulo, accion);
  }

  return { rol, puede: puedeAcceder };
}
