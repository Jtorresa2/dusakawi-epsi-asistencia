// Central permissions store for the signed-in user.
// Fetched once from /api/auth/permisos and shared across the app.
import { useEffect, useState } from "react";
import { apiFetch } from "./api/api";

let cache = null;        // Set<string> | null (null = not loaded yet)
let inflight = null;
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn(cache));
}

export async function refreshPermissions(force = false) {
  const token = localStorage.getItem("token");
  if (!token) {
    cache = new Set();
    emit();
    return cache;
  }
  if (cache && !force) return cache;
  if (inflight) return inflight;
  inflight = apiFetch("/auth/permisos")
    .then((res) => {
      cache = new Set(res.permissions || []);
      return cache;
    })
    .catch(() => {
      cache = new Set();
      return cache;
    })
    .finally(() => {
      inflight = null;
      emit();
    });
  return inflight;
}

export function usePermissions() {
  const [perms, setPerms] = useState(cache);
  useEffect(() => {
    const fn = (p) => setPerms(p);
    listeners.add(fn);
    refreshPermissions();
    return () => listeners.delete(fn);
  }, []);
  return perms; // Set<string> | null
}

/** Can the given permission set do `accion` on `modulo`? */
export function puedeConjunto(perms, modulo, accion = "ver") {
  if (!perms || !modulo) return false;
  return perms.has(`${modulo}.${accion}`);
}
