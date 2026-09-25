import { Prisma } from '@config/database/prisma/generated/client';
import { prisma } from '@config/database/prisma/prisma';
import { createRequire } from 'node:module';
import type { AsistenciaRepository } from '@modules/asistencia/domain/repositories/asistencia-repository';
import type {
  ActualizarRegistroData,
  ActualizarRegistroManualData,
  FilaMarcar,
  FiltrosRegistros,
  InsertarMarcacionData,
  InsertarRegistroManualData,
  RegistroMiAsistenciaRow,
  RegistroRow,
} from '@modules/asistencia/domain/entities/asistencia';
import { statusFromDB } from '@modules/asistencia/application/services/asistencia-rules';

const require = createRequire(import.meta.url);
const { excluirRolesPorUserId } = require('../../../../../../services/rolesFiltro.js');

// Las columnas numéricas que el driver legacy (node-pg) exponía como string
// (numeric, EXTRACT) se castean a ::text para réplica byte a byte. minutes
// tardanza (integer) NO se castea: es number en ambos.

export class PrismaAsistenciaRepository implements AsistenciaRepository {
  async obtenerRegistros(filtros: FiltrosRegistros): Promise<RegistroRow[]> {
    const area = filtros.area;
    const estadoSQL = filtros.estado ? statusFromDB(filtros.estado) : null;
    const tieneRango = Boolean(filtros.fecha_desde && filtros.fecha_hasta);
    const rolesFiltro = excluirRolesPorUserId('a.user_id');

    const sql = Prisma.sql`
      SELECT
        a.id,
        a.user_id AS empleado_id,
        COALESCE(dd.document_number, '') AS cedula,
        TRIM(CONCAT(u.first_name, ' ', COALESCE(u.middle_name, ''), ' ', u.first_surname, ' ', COALESCE(u.second_surname, ''))) AS empleado,
        COALESCE(ar.name, '') AS area,
        COALESCE(fl.name, '') AS piso,
        TO_CHAR(a.date, 'YYYY-MM-DD') AS fecha,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        COALESCE(a.worked_hours, 0)::text AS horas_trabajadas,
        COALESCE(a.extra_hours, 0)::text AS horas_extra,
        COALESCE(a.late_minutes, 0) AS minutos_tardanza,
        COALESCE(a.mark_type, 'Web') AS tipo_marcacion,
        COALESCE(a.status, 'on_time') AS estado,
        a.observation AS observacion,
        (EXTRACT(DOW FROM a.date) + 1)::text AS dia_semana
      FROM asistencia.attendances a
      JOIN asistencia.users u ON a.user_id = u.id
      LEFT JOIN asistencia.document_details dd ON dd.user_id = u.id
      LEFT JOIN asistencia.areas ar ON u.area_id = ar.id
      LEFT JOIN asistencia.floors fl ON ar.floor_id = fl.id
      WHERE 1=1
      ${Prisma.raw(rolesFiltro)}
      ${
        tieneRango
          ? Prisma.sql`AND a.date BETWEEN ${filtros.fecha_desde}::date AND ${filtros.fecha_hasta}::date`
          : Prisma.empty
      }
      ${!tieneRango && filtros.fecha ? Prisma.sql`AND a.date = ${filtros.fecha}::date` : Prisma.empty}
      ${
        area && area !== 'Todas las áreas' && area !== 'Todas'
          ? Prisma.sql`AND ar.name ILIKE ${`%${area}%`}`
          : Prisma.empty
      }
      ${
        filtros.piso
          ? Prisma.sql`AND (fl.name ILIKE ${`%${filtros.piso}%`} OR fl.name = ${`Piso ${filtros.piso}`})`
          : Prisma.empty
      }
      ${estadoSQL ? Prisma.sql`AND LOWER(a.status) = LOWER(${estadoSQL})` : Prisma.empty}
      ORDER BY a.date DESC, a.entry_timestamp DESC
    `;
    return prisma.$queryRaw<RegistroRow[]>(sql);
  }

  async obtenerIdPorUsuarioFecha(empleadoId: string, fecha: string): Promise<string | null> {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM asistencia.attendances WHERE user_id = ${empleadoId} AND date = ${fecha}::date
    `;
    return rows[0]?.id ?? null;
  }

  async insertarRegistroManual(data: InsertarRegistroManualData): Promise<string> {
    // FIX AUTORIZADO: el cast legacy ?::time revienta (42804) porque las
    // columnas son timestamptz. Se convierte fecha + hora a timestamptz con la
    // zona de sesión (Etc/UTC) para que TO_CHAR devuelva exactamente la hora.
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO asistencia.attendances
        (user_id, date, entry_timestamp, morning_departure_timestamp, afternoon_entry_timestamp, departure_timestamp, mark_type, status, observation, worked_hours, late_minutes)
      VALUES (${data.empleado_id}, ${data.fecha}::date, (${data.fecha}::date + ${data.t_e1}::time) AT TIME ZONE current_setting('TimeZone'), (${data.fecha}::date + ${data.t_s1}::time) AT TIME ZONE current_setting('TimeZone'), (${data.fecha}::date + ${data.t_e2}::time) AT TIME ZONE current_setting('TimeZone'), (${data.fecha}::date + ${data.t_s2}::time) AT TIME ZONE current_setting('TimeZone'), ${data.mark_type}, ${data.status}, ${data.observacion}, ${data.horas_trabajadas}, ${data.minutos_tardanza})
      RETURNING id
    `;
    return rows[0]?.id ?? '';
  }

  async actualizarRegistroManual(id: string, data: ActualizarRegistroManualData): Promise<void> {
    // FIX AUTORIZADO (mismo bug 42804): el legacy NO casteaba los tiempos, y un
    // string '07:30:00' suelto tampoco es sintaxis válida de timestamptz. Se usa
    // la fecha de la fila existente (date) + hora → timestamptz con zona de sesión.
    await prisma.$executeRaw`
      UPDATE asistencia.attendances SET
        entry_timestamp = (date + ${data.t_e1}::time) AT TIME ZONE current_setting('TimeZone'),
        morning_departure_timestamp = (date + ${data.t_s1}::time) AT TIME ZONE current_setting('TimeZone'),
        afternoon_entry_timestamp = (date + ${data.t_e2}::time) AT TIME ZONE current_setting('TimeZone'),
        departure_timestamp = (date + ${data.t_s2}::time) AT TIME ZONE current_setting('TimeZone'),
        mark_type = ${data.mark_type},
        status = ${data.status},
        observation = ${data.observacion},
        worked_hours = ${data.horas_trabajadas},
        late_minutes = ${data.minutos_tardanza}
      WHERE id = ${id}
    `;
  }

  async obtenerExistenteParaMarcar(empleadoId: string, localDate: string): Promise<FilaMarcar | null> {
    const rows = await prisma.$queryRaw<FilaMarcar[]>`
      SELECT * FROM asistencia.attendances WHERE user_id = ${empleadoId} AND date = ${localDate}::date ORDER BY created_at DESC LIMIT 1
    `;
    return rows[0] ?? null;
  }

  async insertarMarcacion(data: InsertarMarcacionData): Promise<string> {
    // FIX AUTORIZADO: ?::time → fecha local + hora → timestamptz (zona de sesión).
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO asistencia.attendances
        (user_id, date, ${Prisma.raw(data.tipo_casilla)}, mark_type, status, late_minutes)
      VALUES (${data.empleado_id}, ${data.localDate}::date, (${data.localDate}::date + ${data.hora}::time) AT TIME ZONE current_setting('TimeZone'), 'Web', ${data.estado}, ${data.late_minutes})
      RETURNING id
    `;
    return rows[0]?.id ?? '';
  }

  async actualizarCasillaMarcacion(id: string, tipoCasilla: string, hora: string): Promise<void> {
    // FIX AUTORIZADO: ?::time → (date de la fila + hora) → timestamptz (zona de sesión).
    await prisma.$executeRaw`
      UPDATE asistencia.attendances SET ${Prisma.raw(tipoCasilla)} = (date + ${hora}::time) AT TIME ZONE current_setting('TimeZone') WHERE id = ${id}
    `;
  }

  async obtenerPorId(id: string): Promise<FilaMarcar | null> {
    const rows = await prisma.$queryRaw<FilaMarcar[]>`
      SELECT * FROM asistencia.attendances WHERE id = ${id}
    `;
    return rows[0] ?? null;
  }

  async actualizarMetricas(id: string, horasTrabajadas: number, minutosTardanza: number): Promise<void> {
    await prisma.$executeRaw`
      UPDATE asistencia.attendances SET worked_hours = ${horasTrabajadas}, late_minutes = ${minutosTardanza} WHERE id = ${id}
    `;
  }

  async obtenerMiAsistencia(empleadoId: string, mes: number, anio: number): Promise<RegistroMiAsistenciaRow[]> {
    return prisma.$queryRaw<RegistroMiAsistenciaRow[]>`
      SELECT
        a.id,
        TO_CHAR(a.date, 'YYYY-MM-DD') AS fecha,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        COALESCE(a.worked_hours, 0)::text AS horas_trabajadas,
        COALESCE(a.status, 'on_time') AS estado,
        a.observation AS observacion,
        (EXTRACT(DOW FROM a.date) + 1)::text AS dia_semana
      FROM asistencia.attendances a
      WHERE a.user_id = ${empleadoId}
        AND EXTRACT(YEAR FROM a.date) = ${anio}
        AND EXTRACT(MONTH FROM a.date) = ${mes}
      ORDER BY a.date DESC
    `;
  }

  async justificarAusencia(id: string, textoJustificacion: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE asistencia.attendances SET status = 'justified', observation = ${textoJustificacion} WHERE id = ${id}
    `;
  }

  async eliminar(id: string): Promise<void> {
    await prisma.$executeRaw`DELETE FROM asistencia.attendances WHERE id = ${id}`;
  }

  async actualizarRegistro(id: string, data: ActualizarRegistroData): Promise<void> {
    // FIX AUTORIZADO: ?::time → (date de la fila + hora) → timestamptz (zona de
    // sesión). La fecha nueva (si viene) se aplica ANTES que los tiempos para
    // que la conversión use la fecha final del registro.
    const sets: Prisma.Sql[] = [];
    if (data.fecha) {
      sets.push(Prisma.sql`date = ${data.fecha}::date`);
    }
    sets.push(
      Prisma.sql`entry_timestamp = (date + ${data.t_e1}::time) AT TIME ZONE current_setting('TimeZone')`,
      Prisma.sql`morning_departure_timestamp = (date + ${data.t_s1}::time) AT TIME ZONE current_setting('TimeZone')`,
      Prisma.sql`afternoon_entry_timestamp = (date + ${data.t_e2}::time) AT TIME ZONE current_setting('TimeZone')`,
      Prisma.sql`departure_timestamp = (date + ${data.t_s2}::time) AT TIME ZONE current_setting('TimeZone')`,
      Prisma.sql`mark_type = ${data.mark_type}`,
      Prisma.sql`status = ${data.status}`,
      Prisma.sql`observation = ${data.observacion}`,
      Prisma.sql`worked_hours = ${data.horas_trabajadas}`,
      Prisma.sql`late_minutes = ${data.minutos_tardanza}`,
    );
    await prisma.$executeRaw`
      UPDATE asistencia.attendances SET ${Prisma.join(sets, ', ')} WHERE id = ${id}
    `;
  }
}