import pool from '../config/db';

/**
 * Day-of-week map for schedule_details.day_of_week (display values in Spanish).
 */
const DIA_SEMANA_MAP: Record<number, string> = {
  0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
  4: 'Jueves', 5: 'Viernes', 6: 'Sábado',
};

export interface HorarioInfo {
  tipo: 'laboral' | 'festivo' | 'descanso';
  horario?: Record<string, unknown>;
  detalle?: Record<string, unknown>;
  festivo?: Record<string, unknown>;
}

/**
 * Finds the schedule and its detail for a user on a given date.
 * Returns null when the user has no schedule or there is no detail for that day.
 */
export async function getHorarioDelDia(
  usuarioId: string,
  fecha: string
): Promise<HorarioInfo | null> {
  const { rows: usuarios } = await pool.query(
    'SELECT schedule_id FROM users WHERE id = $1',
    [usuarioId]
  );
  if (!usuarios.length || !usuarios[0].schedule_id) return null;

  const horarioId = usuarios[0].schedule_id;
  const fechaDate = new Date(`${fecha}T12:00:00`);
  const diaSemana = DIA_SEMANA_MAP[fechaDate.getDay()];

  const { rows: festivos } = await pool.query(
    'SELECT id FROM holidays WHERE date = $1 AND active = true',
    [fecha]
  );
  if (festivos.length > 0) return { tipo: 'festivo', festivo: festivos[0] };

  const { rows: detalles } = await pool.query(
    'SELECT * FROM schedule_details WHERE schedule_id = $1 AND day_of_week = $2',
    [horarioId, diaSemana]
  );
  if (!detalles.length) return { tipo: 'descanso' };

  const { rows: horarios } = await pool.query(
    'SELECT tolerance_minutes, tolerance_departure_minutes, name, modality, workday_type FROM schedules WHERE id = $1',
    [horarioId]
  );

  return {
    tipo: 'laboral',
    horario: horarios[0] ?? {},
    detalle: detalles[0],
  };
}

/**
 * Converts "HH:MM" or "HH:MM:SS" to minutes since midnight.
 */
export function timeToMinutes(timeStr: unknown): number | null {
  if (!timeStr) return null;
  const parts = String(timeStr).split(':').map(Number);
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
}

interface ClasificacionMarca {
  turno: 'manana' | 'tarde';
  tipo: 'entrada' | 'salida';
  esperado: string;
  diferencia_min: number;
  dentro_tolerancia: boolean;
}

/**
 * Determines which shift a mark belongs to and whether it is an entry or exit.
 */
function clasificarMarca(
  horaMarca: string,
  detalle: Record<string, unknown>,
  toleranciaMin: number
): ClasificacionMarca | null {
  const marcaMins = timeToMinutes(horaMarca);
  if (marcaMins === null) return null;

  const turnos: { turno: 'manana' | 'tarde'; tipo: 'entrada' | 'salida'; esperado: unknown }[] = [
    { turno: 'manana', tipo: 'entrada', esperado: detalle.morning_entry },
    { turno: 'manana', tipo: 'salida', esperado: detalle.morning_exit },
    { turno: 'tarde', tipo: 'entrada', esperado: detalle.afternoon_entry },
    { turno: 'tarde', tipo: 'salida', esperado: detalle.afternoon_exit },
  ];

  let mejor: ClasificacionMarca | null = null;
  let menorDistancia = Infinity;

  for (const t of turnos) {
    if (!t.esperado) continue;
    const esperadoMins = timeToMinutes(t.esperado);
    if (esperadoMins === null) continue;
    const distancia = Math.abs(marcaMins - esperadoMins);
    if (distancia < menorDistancia) {
      menorDistancia = distancia;
      mejor = {
        ...t,
        esperado: String(t.esperado),
        diferencia_min: marcaMins - esperadoMins,
        dentro_tolerancia: distancia <= toleranciaMin,
      };
    }
  }

  return mejor;
}

/**
 * Finds an approved leave that covers the date and whose slot contains the mark time.
 */
async function obtenerPermisoQueCubreMarca(
  usuarioId: string,
  fecha: string,
  hora: string,
  detalle: Record<string, unknown> | undefined
): Promise<Record<string, unknown> | null> {
  const { rows } = await pool.query(
    `SELECT news_type, mark_type, time_from, time_to FROM news
     WHERE user_id = $1 AND status = 'approved'
       AND date_from <= $2 AND date_to >= $3`,
    [usuarioId, fecha, fecha]
  );
  if (!rows.length) return null;

  const horaMins = timeToMinutes(hora);

  const enTramo = (desdeStr: unknown, hastaStr: unknown): boolean => {
    if (!desdeStr || !hastaStr) return false;
    const desde = timeToMinutes(desdeStr);
    const hasta = timeToMinutes(hastaStr);
    if (desde === null || hasta === null || horaMins === null) return false;
    return horaMins >= desde && horaMins <= hasta;
  };

  return rows.find((r: Record<string, unknown>) => {
    const tipo = r.mark_type;
    if (tipo === 'full_day') return true;
    if (tipo === 'hours') return enTramo(r.time_from, r.time_to);
    if (tipo === 'morning' && detalle) return enTramo(detalle.morning_entry, detalle.morning_exit);
    if (tipo === 'afternoon' && detalle) return enTramo(detalle.afternoon_entry, detalle.afternoon_exit);
    return false;
  }) ?? null;
}

/**
 * Indicates whether an approved leave covers the WHOLE AFTERNOON shift.
 */
export async function obtenerNovedadQueCubreTarde(
  usuarioId: string,
  fecha: string,
  detalle: Record<string, unknown> | undefined
): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT news_type, mark_type, time_from, time_to FROM news
     WHERE user_id = $1 AND status = 'approved'
       AND date_from <= $2 AND date_to >= $3`,
    [usuarioId, fecha, fecha]
  );
  if (!rows.length) return false;

  const entT = timeToMinutes(detalle?.afternoon_entry);
  const salT = timeToMinutes(detalle?.afternoon_exit);

  const cubreTarde = rows.find((r: Record<string, unknown>) => {
    const tipo = r.mark_type;
    if (tipo === 'full_day') return true;
    if (tipo === 'afternoon') return true;
    if (tipo === 'hours') {
      if (entT === null || salT === null) return false;
      const desde = timeToMinutes(r.time_from);
      const hasta = timeToMinutes(r.time_to);
      if (desde === null || hasta === null) return false;
      return desde <= salT && hasta >= entT;
    }
    return false;
  });

  return Boolean(cubreTarde);
}

export const ESTADO_JORNADA = {
  ABIERTA: 'open',
  COMPLETA: 'complete',
} as const;

type AttendanceRow = Record<string, unknown>;

function calcularEstadoJornada(r: AttendanceRow): string {
  if (r.entry_timestamp && r.morning_departure_timestamp &&
      r.afternoon_entry_timestamp && r.departure_timestamp) {
    return ESTADO_JORNADA.COMPLETA;
  }
  return ESTADO_JORNADA.ABIERTA;
}

export function tipoMarcaEsperada(r: AttendanceRow | null): 'entrada' | 'salida' | null {
  if (!r) return 'entrada';
  if (r.entry_timestamp && r.morning_departure_timestamp &&
      r.afternoon_entry_timestamp && r.departure_timestamp) return null;
  if (!r.entry_timestamp) return 'entrada';
  if (r.entry_timestamp && !r.morning_departure_timestamp) return 'salida';
  if (r.morning_departure_timestamp && !r.afternoon_entry_timestamp) return 'entrada';
  return 'salida';
}

export function tramoAbiertoEnSalida(r: AttendanceRow): string | null {
  if (r.entry_timestamp && !r.morning_departure_timestamp) return 'morning_departure_timestamp';
  if (r.afternoon_entry_timestamp && !r.departure_timestamp) return 'departure_timestamp';
  return null;
}

export function campoEntradaDisponible(r: AttendanceRow | null): string {
  if (r && r.entry_timestamp && !r.afternoon_entry_timestamp) return 'afternoon_entry_timestamp';
  return 'entry_timestamp';
}

async function refrescarEstadoJornada(registroId: string): Promise<string | undefined> {
  const { rows } = await pool.query('SELECT * FROM attendances WHERE id = $1', [registroId]);
  if (!rows.length) return;
  const estado = calcularEstadoJornada(rows[0]);
  await pool.query('UPDATE attendances SET mark_state = $1 WHERE id = $2', [estado, registroId]);
  return estado;
}

export async function procesarMarca(
  usuarioId: string,
  fechaHora: string,
  tipo: string
): Promise<Record<string, unknown>> {
  const fecha = fechaHora.substring(0, 10);
  const hora = fechaHora.substring(11, 16);

  const horarioInfo = await getHorarioDelDia(usuarioId, fecha);

  if (!horarioInfo) return { error: 'Usuario sin horario asignado', procesado: false };
  if (horarioInfo.tipo === 'festivo') return { info: 'Fecha festiva — no se procesa marca', procesado: false, festivo: horarioInfo.festivo };
  if (horarioInfo.tipo === 'descanso') return { info: 'Día de descanso — no se procesa marca', procesado: false };

  const { rows: existente } = await pool.query(
    'SELECT * FROM attendances WHERE user_id = $1 AND date = $2',
    [usuarioId, fecha]
  );
  const registro: AttendanceRow | null = existente[0] ?? null;
  const tipoEsperado = tipoMarcaEsperada(registro);

  if (tipoEsperado === null) {
    return { error: 'Jornada ya completa — no se permiten más marcaciones', procesado: false, fecha, estado_jornada: ESTADO_JORNADA.COMPLETA };
  }

  const esEntrada = tipoEsperado === 'entrada';

  const modalidad = (horarioInfo.horario as Record<string, unknown>)?.modality;
  const tipoJornada = (horarioInfo.horario as Record<string, unknown>)?.workday_type;
  const esFlexible = modalidad === 'flexible' || modalidad === 'by_hours' || tipoJornada === 'by_hours';

  const tolerancia = Number((horarioInfo.horario as Record<string, unknown>)?.tolerance_minutes) || 5;
  const clasificacion = clasificarMarca(hora, horarioInfo.detalle ?? {}, tolerancia);
  const fechaHoraCompleta = `${fecha} ${hora}:00`;

  let estadoCalculado = 'on_time';
  let minutosTardanza = 0;
  let registroId: string;

  if (esEntrada) {
    if (!esFlexible && clasificacion && clasificacion.diferencia_min > 0 && !clasificacion.dentro_tolerancia) {
      const permiso = await obtenerPermisoQueCubreMarca(usuarioId, fecha, hora, horarioInfo.detalle);
      if (!permiso) {
        estadoCalculado = 'late';
        minutosTardanza = clasificacion.diferencia_min - tolerancia;
      }
    }

    if (!registro) {
      const { rows: [nuevo] } = await pool.query(
        `INSERT INTO attendances (user_id, date, entry_timestamp, mark_type, status, late_minutes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [usuarioId, fecha, fechaHoraCompleta, tipo, estadoCalculado, minutosTardanza]
      );
      registroId = nuevo.id;
      await refrescarEstadoJornada(registroId);
    } else {
      const campoEntrada = campoEntradaDisponible(registro);
      await pool.query(
        `UPDATE attendances SET ${campoEntrada} = $1, status = $2, late_minutes = GREATEST(late_minutes, $3) WHERE id = $4`,
        [fechaHoraCompleta, estadoCalculado, minutosTardanza, registro.id]
      );
      registroId = registro.id as string;
      await refrescarEstadoJornada(registroId);
    }
  } else {
    if (!registro) {
      const { rows: [nuevo] } = await pool.query(
        `INSERT INTO attendances (user_id, date, morning_departure_timestamp, mark_type, status)
         VALUES ($1, $2, $3, $4, 'on_time') RETURNING id`,
        [usuarioId, fecha, fechaHoraCompleta, tipo]
      );
      registroId = nuevo.id;
      await recalcularHorasTrabajadas(registroId);
      await refrescarEstadoJornada(registroId);
    } else {
      const campoSalida = tramoAbiertoEnSalida(registro) ?? 'departure_timestamp';
      await pool.query(
        `UPDATE attendances SET ${campoSalida} = $1 WHERE id = $2`,
        [fechaHoraCompleta, registro.id]
      );
      registroId = registro.id as string;
      await recalcularHorasTrabajadas(registroId);
      await refrescarEstadoJornada(registroId);
    }
  }

  let incidenciaCreada = false;
  if (!esFlexible && estadoCalculado === 'late' && esEntrada) {
    const { rows: incidenciasExistentes } = await pool.query(
      `SELECT id FROM incidents WHERE user_id = $1 AND date = $2 AND type = 'late'`,
      [usuarioId, fecha]
    );
    if (!incidenciasExistentes.length) {
      const turnoDesc = clasificacion?.turno ?? 'desconocido';
      const esperadoDesc = clasificacion?.esperado ? ` (esperado ${clasificacion.esperado})` : '';
      await pool.query(
        `INSERT INTO incidents (user_id, type, description, date, status, priority)
         VALUES ($1, 'late', $2, $3, 'pending', 'medium')`,
        [usuarioId, `Tardanza de ${minutosTardanza} min — turno ${turnoDesc}${esperadoDesc}`, fecha]
      );
      incidenciaCreada = true;
    }
  }

  const { rows: [finalReg] } = await pool.query('SELECT * FROM attendances WHERE id = $1', [registroId!]);
  const estadoFinal = finalReg ? calcularEstadoJornada(finalReg) : ESTADO_JORNADA.ABIERTA;

  return {
    procesado: true,
    registroId,
    fecha,
    hora,
    tipo_marca: esEntrada ? 'entrada' : 'salida',
    marcacion_estado: estadoFinal,
    estado: estadoCalculado,
    minutos_tardanza: minutosTardanza,
    incidencia_creada: incidenciaCreada,
    horario: (horarioInfo.horario as Record<string, unknown>)?.name,
  };
}

async function recalcularHorasTrabajadas(registroId: string): Promise<void> {
  const { rows } = await pool.query('SELECT * FROM attendances WHERE id = $1', [registroId]);
  if (!rows.length) return;

  const r = rows[0];
  let totalMinutos = 0;

  if (r.entry_timestamp && r.morning_departure_timestamp) {
    const ent = new Date(r.entry_timestamp as string);
    const sal = new Date(r.morning_departure_timestamp as string);
    totalMinutos += (sal.getTime() - ent.getTime()) / 60000;
  }

  if (r.afternoon_entry_timestamp && r.departure_timestamp) {
    const ent = new Date(r.afternoon_entry_timestamp as string);
    const sal = new Date(r.departure_timestamp as string);
    totalMinutos += (sal.getTime() - ent.getTime()) / 60000;
  }

  const horas = totalMinutos > 0 ? (totalMinutos / 60).toFixed(2) : null;
  await pool.query('UPDATE attendances SET worked_hours = $1 WHERE id = $2', [horas, registroId]);
}
