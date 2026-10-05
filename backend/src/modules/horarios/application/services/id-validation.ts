export function isValidId(value: string): boolean {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuid.test(value) || /^\d+$/.test(value);
}

/**
 * Todos los ids de `asistencia` son uuid (users.id, schedules.id,
 * schedule_assignments.user_id/schedule_id/assigned_by). A diferencia de
 * isValidId, esta funcion NO acepta un id numerico: mandarle "123" a una
 * columna uuid hace que Postgres responda 22P02 y el error sale crudo al
 * cliente en lugar de un 400 controlado.
 */
export function isValidUuid(value: string): boolean {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuid.test(value);
}