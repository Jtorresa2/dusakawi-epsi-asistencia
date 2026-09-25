import { Prisma } from '@config/database/prisma/generated/client';
import { prisma } from '@config/database/prisma/prisma';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { calcularCreatedAt, normalizarPrioridad, normalizarTipo } from '@modules/incidencias/application/services/incidencias-rules';
import type {
  ActividadIncidenciaRow,
  CrearIncidenciaData,
  FiltrosIncidencia,
  IncidenciaRow,
  StatsIncidencia,
} from '@modules/incidencias/domain/entities/incidencia';
import type { IncidenciaRepository } from '@modules/incidencias/domain/repositories/incidencia-repository';

// Mismo directorio que el legacy: backend/uploads (la ruta relativa cambia por
// la profundidad del módulo; el resultado es idéntico).
const UPLOADS_DIR = path.resolve(fileURLToPath(new URL('../../../../../../../uploads', import.meta.url)));

// Réplica byte a byte del SELECT del legacy (incluye las claves duplicadas
// `i.status`, `i.priority` y `i.evidence`; el frontend las consume).
const SELECCION_INCIDENCIA = `
  SELECT
    i.id,
    i.user_id,
    i.user_id AS empleado_id,
    TRIM(CONCAT(u.first_name, ' ', COALESCE(u.middle_name, ''), ' ', u.first_surname, ' ', COALESCE(u.second_surname, ''))) AS empleado,
    TRIM(CONCAT(u.first_name, ' ', u.first_surname)) AS empleado_nombre,
    COALESCE(dd.document_number, '') AS cedula,
    COALESCE(pos.name, '') AS cargo,
    COALESCE(ar.name, '') AS area,
    i.type AS tipo,
    i.description AS descripcion,
    i.status AS estado,
    i.status,
    i.priority AS prioridad,
    i.priority,
    i.evidence AS evidencia,
    i.evidence AS evidencia_url,
    i.observation AS observacion,
    i.rejection_reason AS motivo_rechazo,
    i.signed_file AS archivo_firmado,
    i.reviewed_by,
    TRIM(CONCAT(ur.first_name, ' ', ur.first_surname)) AS responsable,
    TRIM(CONCAT(ur.first_name, ' ', ur.first_surname)) AS revisor_nombre,
    TO_CHAR(i.created_at, 'YYYY-MM-DD') AS fecha,
    i.created_at
  FROM asistencia.incidents i
  JOIN asistencia.users u ON i.user_id = u.id
  LEFT JOIN asistencia.document_details dd ON dd.user_id = u.id
  LEFT JOIN asistencia.positions pos ON u.position_id = pos.id
  LEFT JOIN asistencia.areas ar ON u.area_id = ar.id
  LEFT JOIN asistencia.users ur ON i.reviewed_by = ur.id
`;

export class PrismaIncidenciaRepository implements IncidenciaRepository {
  async obtenerTodas(filtros: FiltrosIncidencia = {}): Promise<IncidenciaRow[]> {
    let term = '';
    if (filtros.busqueda) term = `%${filtros.busqueda}%`;

    const sql = Prisma.sql`
      ${Prisma.raw(SELECCION_INCIDENCIA)}
      WHERE 1=1
      ${filtros.empleado_id ? Prisma.sql`AND i.user_id = ${filtros.empleado_id}` : Prisma.empty}
      ${filtros.estado ? Prisma.sql`AND LOWER(i.status) = LOWER(${filtros.estado})` : Prisma.empty}
      ${filtros.tipo ? Prisma.sql`AND LOWER(i.type) = LOWER(${filtros.tipo})` : Prisma.empty}
      ${filtros.prioridad ? Prisma.sql`AND LOWER(i.priority) = LOWER(${filtros.prioridad})` : Prisma.empty}
      ${filtros.area_id ? Prisma.sql`AND u.area_id = ${filtros.area_id}` : Prisma.empty}
      ${filtros.cargo_id ? Prisma.sql`AND u.position_id = ${filtros.cargo_id}` : Prisma.empty}
      ${filtros.fecha_desde ? Prisma.sql`AND DATE(i.created_at) >= ${filtros.fecha_desde}::date` : Prisma.empty}
      ${filtros.fecha_hasta ? Prisma.sql`AND DATE(i.created_at) <= ${filtros.fecha_hasta}::date` : Prisma.empty}
      ${
        filtros.busqueda
          ? Prisma.sql`AND (u.first_name ILIKE ${term} OR u.first_surname ILIKE ${term} OR dd.document_number ILIKE ${term})`
          : Prisma.empty
      }
      ORDER BY i.created_at DESC
    `;
    return prisma.$queryRaw<IncidenciaRow[]>(sql);
  }

  async obtenerPorId(id: string): Promise<IncidenciaRow | null> {
    const rows = await prisma.$queryRaw<IncidenciaRow[]>`
      ${Prisma.raw(SELECCION_INCIDENCIA)}
      WHERE i.id = ${id}
    `;
    return rows[0] ?? null;
  }

  // Réplica del INSERT legacy con FIX autorizado 2026-09-24 (Bug 1: la columna
  // `date` es NOT NULL sin default y el legacy no la escribía, rompiendo todo
  // create con error 23502; Bug 2: el legacy insertaba status/priority en
  // español pero la BD real y el frontend usan inglés). Ahora escribe `date`
  // con fallback CURRENT_DATE y usa estado/prioridad canónicos en inglés.
  async crear(data: CrearIncidenciaData): Promise<string> {
    const createdAt = calcularCreatedAt(data.fecha);
    const prioridad = normalizarPrioridad(data.prioridad);
    const tipo = normalizarTipo(data.tipo);
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO asistencia.incidents (user_id, type, description, evidence, priority, status, date, created_at)
      VALUES (
        ${data.empleado_id ?? null}, ${tipo ?? null}, ${data.descripcion ?? null},
        ${data.evidencia_url ?? null},
        ${prioridad},
        'pending',
        COALESCE(${data.fecha}::date, CURRENT_DATE),
        COALESCE(${createdAt}::timestamptz, NOW())
      )
      RETURNING id
    `;
    return rows[0]?.id ?? '';
  }

  async aprobar(id: string, revisadoPor: string, observacion: string): Promise<boolean> {
    const count = await prisma.$executeRaw`
      UPDATE asistencia.incidents SET
        status = 'approved',
        observation = COALESCE(${observacion}, observation),
        reviewed_by = ${revisadoPor},
        updated_at = NOW()
      WHERE id = ${id} AND LOWER(status) IN ('pending','under_review')
    `;
    return count > 0;
  }

  async aprobarConFirma(id: string, archivoFirmado: string, revisadoPor: string): Promise<boolean> {
    const count = await prisma.$executeRaw`
      UPDATE asistencia.incidents SET
        status = 'approved',
        signed_file = ${archivoFirmado},
        reviewed_by = ${revisadoPor},
        updated_at = NOW()
      WHERE id = ${id} AND LOWER(status) IN ('pending','under_review')
    `;
    return count > 0;
  }

  async rechazar(id: string, motivo: string, revisadoPor: string): Promise<boolean> {
    const count = await prisma.$executeRaw`
      UPDATE asistencia.incidents SET
        status = 'rejected',
        rejection_reason = ${motivo},
        reviewed_by = ${revisadoPor},
        updated_at = NOW()
      WHERE id = ${id} AND LOWER(status) IN ('pending','under_review')
    `;
    return count > 0;
  }

  async solicitarCorreccion(id: string, observacion: string, revisadoPor: string): Promise<boolean> {
    const count = await prisma.$executeRaw`
      UPDATE asistencia.incidents SET
        status = 'under_review',
        observation = ${observacion},
        reviewed_by = ${revisadoPor},
        updated_at = NOW()
      WHERE id = ${id} AND LOWER(status) IN ('pending','under_review')
    `;
    return count > 0;
  }

  async eliminar(id: string): Promise<void> {
    const rows = await prisma.$queryRaw<{ evidence: string | null; signed_file: string | null }[]>`
      SELECT evidence, signed_file FROM asistencia.incidents WHERE id = ${id}
    `;
    const inc = rows[0];
    if (inc) {
      for (const url of [inc.evidence, inc.signed_file]) {
        if (url) {
          const filePath = path.join(UPLOADS_DIR, url.replace('/uploads/', ''));
          try {
            fs.unlinkSync(filePath);
          } catch {
            // Réplica del legacy: ignora archivos que no existan.
          }
        }
      }
    }
    await prisma.$executeRaw`DELETE FROM asistencia.incidents WHERE id = ${id}`;
  }

  async obtenerStats(): Promise<StatsIncidencia> {
    const rows = await prisma.$queryRaw<StatsIncidencia[]>`
      SELECT
        COALESCE(SUM((LOWER(status) = 'pending')::int), 0) AS pendientes,
        COALESCE(SUM((LOWER(status) = 'approved')::int), 0) AS aprobadas,
        COALESCE(SUM((LOWER(status) = 'rejected')::int), 0) AS rechazadas
      FROM asistencia.incidents
    `;
    const row = rows[0] || { pendientes: 0, aprobadas: 0, rechazadas: 0 };
    // El driver legacy (pg) serializaba los bigint como string; Prisma devuelve
    // BigInt. Convertimos para réplica byte a byte del contrato.
    return {
      pendientes: String(row.pendientes),
      aprobadas: String(row.aprobadas),
      rechazadas: String(row.rechazadas),
    };
  }

  async obtenerActividad(): Promise<ActividadIncidenciaRow[]> {
    return prisma.$queryRaw<ActividadIncidenciaRow[]>`
      SELECT
        i.id,
        i.status AS estado,
        i.type AS tipo,
        i.created_at,
        COALESCE(i.updated_at, i.created_at) AS updated_at,
        TO_CHAR(i.created_at, 'YYYY-MM-DD') AS fecha,
        u.first_name AS empleado_nombre,
        u.first_surname AS empleado_apellido
      FROM asistencia.incidents i
      JOIN asistencia.users u ON i.user_id = u.id
      ORDER BY COALESCE(i.updated_at, i.created_at) DESC
      LIMIT 10
    `;
  }

  // Réplica del query legacy de asistencia relacionada. La tabla y columnas
  // que usa no existen en esta BD, así que falla y devuelve null (el legacy
  // tenía el mismo try/catch mudo).
  async obtenerAsistenciaRelacionada(userId: string, fecha: string): Promise<Record<string, unknown> | null> {
    try {
      const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
        SELECT
          a.first_entry_time AS fecha_hora_entrada,
          a.last_departure_time AS fecha_hora_salida,
          a.minutos_tardanza,
          a.tipo_marcacion,
          a.estado AS estado_marcacion,
          TO_CHAR(MIN(hd.hora_entrada_manana), 'HH24:MI') AS hora_entrada_programada,
          TO_CHAR(MIN(hd.hora_salida_manana), 'HH24:MI') AS hora_salida_programada
        FROM asistencia.attendances a
        LEFT JOIN asistencia.horario_detalle hd ON hd.horario_id = 1
        WHERE a.user_id = ${userId} AND DATE(a.created_at) = ${fecha}::date
        GROUP BY a.id, a.first_entry_time, a.last_departure_time, a.minutos_tardanza, a.tipo_marcacion, a.estado
      `;
      return rows[0] || null;
    } catch {
      return null;
    }
  }
}