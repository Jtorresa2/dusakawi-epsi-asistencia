import pool from '../config/db';
import { getHorarioDelDia, obtenerNovedadQueCubreTarde } from './marcacionService';
import { AusentesResult } from '../types';

interface AttendanceRow {
  entry_timestamp: Date | null;
  morning_departure_timestamp: Date | null;
  afternoon_entry_timestamp: Date | null;
  departure_timestamp: Date | null;
}

/**
 * CENTRAL DISCRIMINATOR — tells an OPEN SHIFT apart from a NOT-STARTED SHIFT.
 *
 * Is the shift OPEN? The shift ENTRY exists without its exit.
 *  - entry_timestamp exists and morning_departure_timestamp is NULL → open (morning)
 *  - afternoon_entry_timestamp exists and departure_timestamp is NULL → open (afternoon)
 */
export function tramoAbierto(r: AttendanceRow | null): boolean {
  if (!r) return false;
  if (r.entry_timestamp && !r.morning_departure_timestamp) return true;
  if (r.afternoon_entry_timestamp && !r.departure_timestamp) return true;
  return false;
}

/**
 * Was the AFTERNOON shift never started? Morning closed (morning entry + exit)
 * but afternoon_entry_timestamp is NULL → AFTERNOON ABSENCE, not unregistered exit.
 */
export function tramoTardeNuncaIniciado(r: AttendanceRow | null): boolean {
  if (!r) return false;
  return Boolean(
    r.entry_timestamp &&
    r.morning_departure_timestamp &&
    !r.afternoon_entry_timestamp
  );
}

/**
 * Creates an "unregistered exit" incident for a user/date.
 * IDEMPOTENT: returns false if one already exists.
 */
export async function crearIncidenciaSalidaNoRegistrada(
  usuarioId: string,
  fecha: string
): Promise<boolean> {
  const { rows: existente } = await pool.query(
    `SELECT id FROM incidents WHERE user_id = $1 AND date = $2 AND type = 'unregistered_exit'`,
    [usuarioId, fecha]
  );
  if (existente.length > 0) return false;

  await pool.query(
    `INSERT INTO incidents (user_id, type, description, date, status, priority)
     VALUES ($1, 'unregistered_exit', $2, $3, 'pending', 'medium')`,
    [
      usuarioId,
      'Jornada incompleta: se registró una entrada pero no se registró la salida al cierre del día.',
      fecha,
    ]
  );
  return true;
}

/**
 * Creates an "afternoon absence" incident for a user/date.
 * IDEMPOTENT: returns false if one already exists.
 */
export async function crearIncidenciaAusenciaTarde(
  usuarioId: string,
  fecha: string
): Promise<boolean> {
  const { rows: existente } = await pool.query(
    `SELECT id FROM incidents WHERE user_id = $1 AND date = $2 AND type = 'afternoon_absence'`,
    [usuarioId, fecha]
  );
  if (existente.length > 0) return false;

  await pool.query(
    `INSERT INTO incidents (user_id, type, description, date, status, priority)
     VALUES ($1, 'afternoon_absence', $2, $3, 'pending', 'medium')`,
    [
      usuarioId,
      'Ausencia de la tarde: el tramo de la tarde no se inició y no hay novedad que la justifique.',
      fecha,
    ]
  );
  return true;
}

export async function marcarAusentes(fecha: string): Promise<AusentesResult> {
  const { rows: usuarios } = await pool.query(
    'SELECT id FROM users WHERE active = TRUE AND schedule_id IS NOT NULL',
    []
  );

  let creados = 0;
  let omitidosLaboralConMarca = 0;
  let salidasNoRegistradas = 0;
  let ausenciasTarde = 0;
  const errores: { id: string; error: string }[] = [];

  for (const usuario of usuarios) {
    try {
      const horarioInfo = await getHorarioDelDia(usuario.id, fecha);

      if (
        !horarioInfo ||
        horarioInfo.tipo === 'festivo' ||
        horarioInfo.tipo === 'descanso'
      ) {
        continue;
      }

      if (horarioInfo.tipo === 'laboral') {
        const { rows: asis } = await pool.query(
          'SELECT * FROM attendances WHERE user_id = $1 AND date = $2',
          [usuario.id, fecha]
        );
        const registro: AttendanceRow | null = asis[0] ?? null;

        if (!registro) {
          const { rowCount } = await pool.query(
            `INSERT INTO attendances (user_id, date, status, mark_type, observation)
            VALUES ($1, $2, 'absent', 'system', 'Generado automaticamente por cierre de jornada sin marcaciones')
            ON CONFLICT (user_id, date) DO NOTHING`,
            [usuario.id, fecha]
          );
          if ((rowCount ?? 0) > 0) creados++;
          continue;
        }

        omitidosLaboralConMarca++;

        if (tramoAbierto(registro)) {
          const creada = await crearIncidenciaSalidaNoRegistrada(usuario.id, fecha);
          if (creada) salidasNoRegistradas++;
        } else if (tramoTardeNuncaIniciado(registro)) {
          const justificada = await obtenerNovedadQueCubreTarde(
            usuario.id,
            fecha,
            horarioInfo.detalle
          );
          if (!justificada) {
            const creada = await crearIncidenciaAusenciaTarde(usuario.id, fecha);
            if (creada) ausenciasTarde++;
          }
        }
      }
    } catch (err) {
      errores.push({
        id: usuario.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    fecha,
    procesados: usuarios.length,
    creados,
    omitidosLaboralConMarca,
    salidasNoRegistradas,
    ausenciasTarde,
    errores,
  };
}
