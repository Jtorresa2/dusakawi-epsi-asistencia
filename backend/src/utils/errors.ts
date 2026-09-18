/**
 * Helper seguro para extraer el mensaje de un error desconocido.
 * Diseñado para ser utilizado en bloques `catch (err: unknown)`.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'string' && err.trim().length > 0) {
    return err;
  }
  if (err !== null && typeof err === 'object' && 'message' in err) {
    const candidate = (err as Record<string, unknown>).message;
    if (typeof candidate === 'string') {
      return candidate;
    }
  }
  return 'Error desconocido';
}
