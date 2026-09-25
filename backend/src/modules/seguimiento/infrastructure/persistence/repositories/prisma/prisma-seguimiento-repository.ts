import { Prisma } from '@config/database/prisma/generated/client';
import { prisma } from '@config/database/prisma/prisma';
import type { SeguimientoRepository } from '@modules/seguimiento/domain/repositories/seguimiento-repository';
import type {
  FilaUniversoSeguimiento,
  IncidenciaVinculoRow,
  NovedadVinculoRow,
} from '@modules/seguimiento/domain/entities/seguimiento';

// Réplica 1:1 de consultarUniverso del legacy. El `generate_series` genera el
// universo (usuario, fecha) laboral; el resto son LEFT JOINs de horario
// esperado (schedule_details) y marcas reales (attendances), excluyendo
// festivos y horarios flexible/by_hours.
async function consultarUniverso(filtros: {
  fecha_desde: string;
  fecha_hasta: string;
  area?: string;
  piso?: string;
  busqueda?: string;
}): Promise<FilaUniversoSeguimiento[]> {
  const term = filtros.busqueda ? `%${filtros.busqueda}%` : null;
  const pisoNum =
    filtros.piso !== undefined && filtros.piso !== null && filtros.piso !== ''
      ? Number(filtros.piso)
      : null;

  const sql = Prisma.sql`
    SELECT u.id AS usuario_id, dd.document_number AS cedula,
      CONCAT(u.first_name, ' ', u.first_surname) AS empleado,
      ar.name AS area,
      NULLIF(regexp_replace(fl.name, '\\D', '', 'g'), '')::int AS piso,
      d.fecha::text AS fecha,
      TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada_manana,
      TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida_manana,
      TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada_tarde,
      TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida_tarde,
      TO_CHAR(hd.morning_entry, 'HH24:MI') AS exp_ent_manana,
      TO_CHAR(hd.morning_exit, 'HH24:MI') AS exp_sal_manana,
      TO_CHAR(hd.afternoon_entry, 'HH24:MI') AS exp_ent_tarde,
      TO_CHAR(hd.afternoon_exit, 'HH24:MI') AS exp_sal_tarde
    FROM generate_series(${filtros.fecha_desde}::date, ${filtros.fecha_hasta}::date, '1 day') AS d(fecha)
    JOIN asistencia.users u ON u.active = true AND u.schedule_id IS NOT NULL
    LEFT JOIN asistencia.document_details dd ON dd.user_id = u.id
    JOIN asistencia.areas ar ON u.area_id = ar.id
    LEFT JOIN asistencia.floors fl ON ar.floor_id = fl.id
    LEFT JOIN asistencia.schedules h ON u.schedule_id = h.id
    LEFT JOIN asistencia.schedule_details hd ON hd.schedule_id = u.schedule_id
      AND hd.day_of_week = CASE EXTRACT(DOW FROM d.fecha)
          WHEN 0 THEN 'Domingo' WHEN 1 THEN 'Lunes' WHEN 2 THEN 'Martes'
          WHEN 3 THEN 'Miércoles' WHEN 4 THEN 'Jueves' WHEN 5 THEN 'Viernes'
          ELSE 'Sábado' END
    LEFT JOIN asistencia.attendances a ON a.user_id = u.id AND a.date = d.fecha
    LEFT JOIN asistencia.holidays hol ON hol.date = d.fecha AND hol.active = true
    WHERE hd.schedule_id IS NOT NULL
      AND hol.id IS NULL
      AND h.modality NOT IN ('flexible', 'by_hours')
    ${filtros.area ? Prisma.sql`AND ar.name LIKE ${`%${filtros.area}%`}` : Prisma.empty}
    ${pisoNum !== null ? Prisma.sql`AND NULLIF(regexp_replace(fl.name, '\\D', '', 'g'), '')::int = ${pisoNum}` : Prisma.empty}
    ${
      term
        ? Prisma.sql`AND (u.first_name LIKE ${term} OR u.first_surname LIKE ${term} OR dd.document_number LIKE ${term})`
        : Prisma.empty
    }
    ORDER BY d.fecha DESC, u.first_surname, u.first_name
  `;
  return prisma.$queryRaw<FilaUniversoSeguimiento[]>(sql);
}

async function consultarNovedades(
  fechaDesde: string,
  fechaHasta: string
): Promise<NovedadVinculoRow[]> {
  return prisma.$queryRaw<NovedadVinculoRow[]>`
    SELECT n.user_id AS usuario_id,
           n.date_from::text AS fecha_desde, n.date_to::text AS fecha_hasta,
           n.mark_type AS tipo,
           n.time_from AS hora_desde, n.time_to AS hora_hasta
    FROM asistencia.news n
    WHERE n.status = 'approved'
      AND n.date_from <= ${fechaDesde} AND n.date_to >= ${fechaHasta}
  `;
}

async function consultarIncidencias(
  fechaDesde: string,
  fechaHasta: string
): Promise<IncidenciaVinculoRow[]> {
  return prisma.$queryRaw<IncidenciaVinculoRow[]>`
    SELECT i.id, i.user_id AS usuario_id, i.date::text AS fecha, i.status AS estado, i.type AS tipo
    FROM asistencia.incidents i
    WHERE i.date BETWEEN ${fechaDesde} AND ${fechaHasta}
      AND i.type IN ('unregistered_exit', 'afternoon_absence', 'late', 'biometric_failure')
  `;
}

export class PrismaSeguimientoRepository implements SeguimientoRepository {
  consultarUniverso = consultarUniverso;
  consultarNovedades = consultarNovedades;
  consultarIncidencias = consultarIncidencias;
}