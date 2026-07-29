import { useState, useEffect } from "react";
import { puede } from "../novedades";

export default function useRol() {
  const [rol, setRol] = useState(null);

  useEffect(() => {
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
      setRol(usuario.rol || null);
    } catch {
      setRol(null);
    }
  }, []);

  function puedeAcceder(modulo, accion = "ver") {
    if (!rol) return false;
    return puede(rol, modulo, accion);
  }

  return { rol, puede: puedeAcceder };
}
