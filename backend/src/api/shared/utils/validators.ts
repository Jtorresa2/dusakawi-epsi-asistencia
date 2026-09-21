/**
 * Validación de ids de ruta. Los ids de features son UUID; los de roles son enteros positivos.
 * Rechaza cualquier otro formato (payloads de inyección SQL, basura) ANTES de llegar a Postgres.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function esUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function esEnteroPositivo(value: string): boolean {
  return /^\d+$/.test(value);
}

/** Un id de ruta válido es un UUID o un entero positivo. */
export function esIdValido(value: string): boolean {
  return esUuid(value) || esEnteroPositivo(value);
}