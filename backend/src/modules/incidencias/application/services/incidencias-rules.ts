// Reglas y helpers del dominio de incidencias.

// El legacy construía created_at como `${fecha} 12:00:00+00` (o null) y lo
// insertaba con COALESCE(?::timestamptz, NOW()).
export function calcularCreatedAt(fecha?: string): string | null {
  return fecha ? `${fecha} 12:00:00+00` : null;
}

// FIX autorizado 2026-09-24: la BD y el frontend usan prioridades en inglés
// (high/medium/low). El legacy insertaba español ('Media'). Se normaliza
// cualquier entrada (español o inglés) al valor canónico en inglés.
const MAPA_PRIORIDAD_ES: Record<string, string> = {
  alta: 'high',
  media: 'medium',
  baja: 'low',
};

export function normalizarPrioridad(prioridad?: string): string {
  if (!prioridad) return 'medium';
  const lower = prioridad.toLowerCase().trim();
  return MAPA_PRIORIDAD_ES[lower] ?? lower;
}

// El frontend envía tipos canónicos en inglés (incidenciaTipos.js: keys
// estables en la BD). Se normalizan variantes en español por tolerancia.
const MAPA_TIPOS_ES: Record<string, string> = {
  'falla biometrica': 'biometric_failure',
  'falla biométrica': 'biometric_failure',
  'falla de biometria': 'biometric_failure',
  'falla de biometría': 'biometric_failure',
  'biometrico': 'biometric_failure',
  'biométrico': 'biometric_failure',
  'retraso': 'late',
  'llegada tarde': 'late',
  'salida sin registrar': 'unregistered_exit',
  'salida no registrada': 'unregistered_exit',
  'ausencia tarde': 'afternoon_absence',
  'ausencia en la tarde': 'afternoon_absence',
  'otro': 'other',
  'otros': 'other',
};

export function normalizarTipo(tipo?: string): string | null {
  if (!tipo) return null;
  const lower = tipo.toLowerCase().trim();
  return MAPA_TIPOS_ES[lower] ?? tipo;
}