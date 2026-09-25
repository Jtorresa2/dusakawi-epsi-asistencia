// Entidades del dominio de asistencia. Réplica 1:1 del contrato legacy de
// /api/asistencia (consulta con filtros, registro manual, marcación por
// puntos, mi-asistencia, justificación, baja y actualización). Las claves SQL
// expuestas por el driver legacy (string numérico) se reflejan aquí tal cual.

// ─── Consulta de registros (GET /) ────────────────────────────────────────

export interface FiltrosRegistros {
  fecha?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  area?: string;
  piso?: string;
  estado?: string;
}

// Fila cruda de getRegistros. Nótese que horas_trabajadas/horas_extra y
// dia_semana llegan como STRING (numeric/EXTRACT → texto), mientras que
// minutos_tardanza es number (integer en el legacy y en Prisma).
export interface RegistroRow {
  id: string;
  empleado_id: string;
  cedula: string;
  empleado: string;
  area: string;
  piso: string;
  fecha: string;
  entrada1: string | null;
  salida1: string | null;
  entrada2: string | null;
  salida2: string | null;
  horas_trabajadas: string;
  horas_extra: string;
  minutos_tardanza: number;
  tipo_marcacion: string;
  estado: string;
  observacion: string | null;
  dia_semana: string;
}

export interface ResultadoRegistros {
  registros: RegistroRow[];
}

// ─── Registro manual (POST /manual) ───────────────────────────────────────

export interface DatosRegistroManual {
  empleado_id: string;
  fecha: string;
  entrada1?: string;
  salida1?: string;
  entrada2?: string;
  salida2?: string;
  tipo_marcacion?: string;
  observacion?: string;
}

export interface ResultadoRegistroManual {
  mensaje: 'Asistencia registrada correctamente';
  id: string;
}

export interface InsertarRegistroManualData {
  empleado_id: string;
  fecha: string;
  t_e1: string | null;
  t_s1: string | null;
  t_e2: string | null;
  t_s2: string | null;
  mark_type: string;
  status: string;
  observacion: string | null;
  horas_trabajadas: number;
  minutos_tardanza: number;
}

export interface ActualizarRegistroManualData {
  t_e1: string | null;
  t_s1: string | null;
  t_e2: string | null;
  t_s2: string | null;
  mark_type: string;
  status: string;
  observacion: string | null;
  horas_trabajadas: number;
  minutos_tardanza: number;
}

// ─── Marcación (POST / y POST /marcar) ────────────────────────────────────

export interface DatosMarcar {
  empleado_id: string;
}

// Fila cruda de SELECT * de attendances (todo el flujo interno de marcar).
// Los timestamps llegan como Date (Prisma → timestamptz) tras el fix
// autorizado; timeToMinutes en las reglas acepta ambos (Date | string).
export interface FilaMarcar {
  id: string;
  user_id: string;
  date: string;
  entry_timestamp: Date | string | null;
  morning_departure_timestamp: Date | string | null;
  afternoon_entry_timestamp: Date | string | null;
  departure_timestamp: Date | string | null;
  status?: string | null;
  mark_type?: string | null;
  observation?: string | null;
  worked_hours?: string | number | null;
  extra_hours?: string | number | null;
  late_minutes?: number | null;
  created_at?: Date | null;
  [clave: string]: unknown;
}

export interface InsertarMarcacionData {
  empleado_id: string;
  localDate: string;
  tipo_casilla: string;
  hora: string;
  estado: string;
  late_minutes: number;
}

// tipo 'completadas' → 400 'Todas las marcaciones del día han sido completadas';
// tipo 'ok' → 200 con las claves mensaje, id, casilla, hora (en ese orden).
export type ResultadoMarcar =
  | { tipo: 'completadas' }
  | { tipo: 'ok'; mensaje: string; id: string; casilla: string; hora: string };

// ─── Mi asistencia (GET /mi-asistencia) ───────────────────────────────────

export interface ConsultaMiAsistencia {
  mes: number;
  anio: number;
  empleado_id: string;
}

// Fila cruda del SELECT de getMiAsistencia (horas y dia_semana en texto).
export interface RegistroMiAsistenciaRow {
  id: string;
  fecha: string;
  entrada1: string | null;
  salida1: string | null;
  entrada2: string | null;
  salida2: string | null;
  horas_trabajadas: string;
  estado: string;
  observacion: string | null;
  dia_semana: string;
}

// Mapeo final con el orden EXACTO de claves del contrato legacy.
export interface RegistroMiAsistencia {
  id: string;
  fecha: string;
  entrada1: string | null;
  salida1: string | null;
  entrada2: string | null;
  salida2: string | null;
  horas: string;
  estado: string;
  dia_semana: string;
  observacion: string | null;
}

export interface ResultadoMiAsistencia {
  registros: RegistroMiAsistencia[];
}

// ─── Justificación (PUT /:id/justificar) ──────────────────────────────────

export interface DatosJustificarAusencia {
  id: string;
  observacion?: string;
  motivo?: string;
  tipo?: string;
}

export interface ResultadoJustificar {
  mensaje: 'Ausencia justificada correctamente';
}

// ─── Eliminación (DELETE /:id) ────────────────────────────────────────────

export interface ResultadoEliminar {
  mensaje: 'Registro eliminado correctamente';
}

// ─── Actualización (PUT /:id) ─────────────────────────────────────────────

export interface DatosActualizarRegistro {
  id: string;
  entrada1?: string;
  salida1?: string;
  entrada2?: string;
  salida2?: string;
  fecha?: string;
  tipo_marcacion?: string;
  estado?: string;
  observacion?: string;
}

export interface ResultadoActualizar {
  mensaje: 'Registro actualizado correctamente';
}

export interface ActualizarRegistroData {
  t_e1: string | null;
  t_s1: string | null;
  t_e2: string | null;
  t_s2: string | null;
  mark_type: string;
  status: string;
  observacion: string | null;
  horas_trabajadas: number;
  minutos_tardanza: number;
  fecha?: string;
}
