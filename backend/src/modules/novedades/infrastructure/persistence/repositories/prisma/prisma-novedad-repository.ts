import { Prisma } from '@config/database/prisma/generated/client';
import { prisma } from '@config/database/prisma/prisma';
import { calcularDiasHabiles, validarNovedad } from '@modules/novedades/application/services/novedades-rules';
import type {
  ActualizarNovedadData,
  CrearNovedadData,
  NovedadRow,
  ResultadoCrearNovedad,
} from '@modules/novedades/domain/entities/novedad';
import type { NovedadRepository } from '@modules/novedades/domain/repositories/novedad-repository';

// Columnas idénticas al legacy. `time_from::text`/`time_to::text` garantizan el
// mismo formato string "HH:MM:SS" que devolvía el driver pg. `tipo` es clave
// duplicada de `modalidad` para el frontend (misma técnica que festivos).
const SELECCION_NOVEDAD = `
  SELECT
    n.id,
    n.user_id AS empleado_id,
    n.date_from AS fecha_desde,
    n.date_to AS fecha_hasta,
    n.reason AS motivo,
    n.news_type AS tipo_novedad,
    n.mark_type AS modalidad,
    n.mark_type AS tipo,
    n.time_from::text AS hora_desde,
    n.time_to::text AS hora_hasta,
    n.status AS estado,
    n.rejection_reason AS motivo_rechazo,
    n.created_at AS creado_en,
    TRIM(CONCAT(u.first_name, ' ', COALESCE(u.middle_name, ''))) AS empleado_nombre,
    TRIM(CONCAT(u.first_surname, ' ', COALESCE(u.second_surname, ''))) AS empleado_apellido
  FROM asistencia.news n
  LEFT JOIN asistencia.users u ON u.id = n.user_id
`;

export class PrismaNovedadRepository implements NovedadRepository {
  async obtenerTodos(): Promise<NovedadRow[]> {
    return prisma.$queryRaw<NovedadRow[]>`
      ${Prisma.raw(SELECCION_NOVEDAD)}
      LEFT JOIN asistencia.users reg ON reg.id = n.registered_by
      ORDER BY n.created_at DESC
    `;
  }

  async obtenerPorEmpleado(empleadoId: string): Promise<NovedadRow[]> {
    return prisma.$queryRaw<NovedadRow[]>`
      ${Prisma.raw(SELECCION_NOVEDAD)}
      WHERE n.user_id = ${empleadoId}
      ORDER BY n.created_at DESC
    `;
  }

  async crear(data: CrearNovedadData, usuarioId: string | null): Promise<ResultadoCrearNovedad> {
    const { empleadoId, tipoNovedad, modalidadVal } = validarNovedad(data, false);

    const rows = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO asistencia.news
        (user_id, date_from, date_to, reason, news_type, mark_type, time_from, time_to, registered_by)
      VALUES
        (${empleadoId}, ${data.fecha_desde}::date, ${data.fecha_hasta}::date, ${data.motivo},
         ${tipoNovedad}, ${modalidadVal},
         ${data.hora_desde || null}::time, ${data.hora_hasta || null}::time,
         ${usuarioId || null})
      RETURNING id
    `;

    const novedadId = rows[0]?.id ?? '';
    let diasGenerados = 0;

    // Réplica del legacy: comisión o día completo generan asistencias automáticas
    // (solo días hábiles y solo si no existe ya la asistencia para esa fecha).
    if (tipoNovedad === 'commission' || modalidadVal === 'full_day') {
      const estado = tipoNovedad === 'commission' ? 'comision' : 'justified';
      const observacion = tipoNovedad === 'commission' ? `Comisión: ${data.motivo}` : `Novedad: ${data.motivo}`;

      const dias = calcularDiasHabiles(data.fecha_desde, data.fecha_hasta);

      for (const fecha of dias) {
        const existentes = await prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM asistencia.attendances
          WHERE user_id = ${empleadoId} AND date = ${fecha}::date
        `;
        if (existentes.length === 0) {
          await prisma.$executeRaw`
            INSERT INTO asistencia.attendances (user_id, date, status, observation, worked_hours, late_minutes)
            VALUES (${empleadoId}, ${fecha}::date, ${estado}, ${observacion}, 0, 0)
          `;
        }
      }

      diasGenerados = dias.length;
    }

    return { id: novedadId, dias_generados: diasGenerados };
  }

  async actualizar(id: string, data: ActualizarNovedadData, usuarioId: string | null): Promise<void> {
    const { empleadoId, tipoNovedad, modalidadVal } = validarNovedad(data, true);

    await prisma.$executeRaw`
      UPDATE asistencia.news SET
        user_id = ${empleadoId},
        date_from = ${data.fecha_desde}::date,
        date_to = ${data.fecha_hasta}::date,
        reason = ${data.motivo},
        news_type = ${tipoNovedad},
        mark_type = ${modalidadVal},
        time_from = ${data.hora_desde || null}::time,
        time_to = ${data.hora_hasta || null}::time,
        registered_by = ${usuarioId || null}
      WHERE id = ${id}
    `;
  }

  async eliminar(id: string): Promise<void> {
    await prisma.$executeRaw`DELETE FROM asistencia.news WHERE id = ${id}`;
  }
}