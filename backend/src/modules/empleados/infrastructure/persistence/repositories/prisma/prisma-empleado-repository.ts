import { Prisma } from '@config/database/prisma/generated/client';
import { prisma } from '@config/database/prisma/prisma';
import { createRequire } from 'node:module';
import type { ActualizarEmpleadoData, CrearEmpleadoData, EmpleadoFiltros, EmpleadoRow } from '@modules/empleados/domain/entities/empleado';
import type { EmpleadoRepository } from '@modules/empleados/domain/repositories/empleado-repository';

const require = createRequire(import.meta.url);
const { excluirRolesPorUserId } = require('../../../../../../services/rolesFiltro.js');

const SELECCION_EMPLEADO = `
  SELECT
    u.id,
    COALESCE(dd.document_number, '') AS cedula,
    u.first_name AS nombre,
    u.first_surname AS apellido,
    TRIM(CONCAT(u.first_name, ' ', COALESCE(u.middle_name, ''), ' ', u.first_surname, ' ', COALESCE(u.second_surname, ''))) AS empleado,
    u.email AS correo,
    u.email,
    COALESCE(u.phone, '') AS telefono,
    u.phone,
    TO_CHAR(u.date_of_birth, 'YYYY-MM-DD') AS fecha_nacimiento,
    u.position_id AS cargo_id,
    COALESCE(pos.name, '') AS cargo,
    u.area_id,
    COALESCE(ar.name, '') AS area,
    COALESCE(fl.name, '') AS piso,
    COALESCE(u.photo, '') AS foto_url,
    u.active::int AS activo,
    CASE WHEN u.active THEN 'activo' ELSE 'inactivo' END AS estado,
    u.schedule_id,
    COALESCE(s.name, '') AS horario
  FROM asistencia.users u
  LEFT JOIN asistencia.document_details dd ON dd.user_id = u.id
  LEFT JOIN asistencia.positions pos ON u.position_id = pos.id
  LEFT JOIN asistencia.areas ar ON u.area_id = ar.id
  LEFT JOIN asistencia.floors fl ON ar.floor_id = fl.id
  LEFT JOIN asistencia.schedules s ON u.schedule_id = s.id
`;

const USER_COLS = 'first_name, first_surname, email, phone, date_of_birth, position_id, area_id';

// Fix de bug heredado: el legacy hardcodeaba document_type_id y role_id que
// ya no existen en esta BD (la migración de datos trajo otros ids), por lo que
// el alta de empleados daba 500 también en el legacy. Resolvemos por nombre
// para ser robustos ante cambios de datos, manteniendo el mismo mensaje del
// INSERT. Los ids originales del legacy eran: role 86b7792a-…, doc ea30fb17-….
const DOCUMENT_TYPE_CEDULA = 'Cédula de Ciudadanía';

const resolverIdPorNombre = async (tabla: 'roles' | 'document_types', nombre: string): Promise<string> => {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM asistencia.${Prisma.raw(tabla)} WHERE name = ${nombre} LIMIT 1
  `;
  if (!rows[0]) {
    throw new Error(`No existe el registro "${nombre}" en asistencia.${tabla}`);
  }
  return rows[0].id;
};

export class PrismaEmpleadoRepository implements EmpleadoRepository {
  async obtenerTodos(filtros: EmpleadoFiltros): Promise<EmpleadoRow[]> {
    const filtroRoles = excluirRolesPorUserId('u.id');
    const sql = Prisma.sql`
      ${Prisma.raw(SELECCION_EMPLEADO)}
      WHERE 1=1
      ${Prisma.raw(filtroRoles)}
      ${filtros.area ? Prisma.sql`AND (ar.name ILIKE ${`%${filtros.area}%`} OR ar.id::text = ${filtros.area})` : Prisma.empty}
      ${filtros.cargo ? Prisma.sql`AND (pos.name ILIKE ${`%${filtros.cargo}%`} OR pos.id::text = ${filtros.cargo})` : Prisma.empty}
      ORDER BY u.first_name ASC
    `;
    return prisma.$queryRaw<EmpleadoRow[]>(sql);
  }

  async obtenerPorId(id: string): Promise<EmpleadoRow | null> {
    const filtroRoles = excluirRolesPorUserId('u.id');
    const rows = await prisma.$queryRaw<EmpleadoRow[]>`
      ${Prisma.raw(SELECCION_EMPLEADO)}
      WHERE u.id = ${id}
      ${Prisma.raw(filtroRoles)}
    `;
    return rows[0] ?? null;
  }

  async crear(data: CrearEmpleadoData): Promise<string> {
    const { cedula, nombre, apellido, correo, telefono, fecha_nacimiento, cargo_id, area_id } = data;

    const rows = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO asistencia.users (${Prisma.raw(USER_COLS)})
      VALUES (
        ${nombre},
        ${apellido || ''},
        ${correo},
        ${telefono || null},
        COALESCE(${fecha_nacimiento ?? null}::date, '1990-01-01'::date),
        ${cargo_id},
        ${area_id}
      )
      RETURNING id
    `;
    const userId = rows[0]?.id;
    if (!userId) return userId;

    if (cedula) {
      const documentTypeId = await resolverIdPorNombre('document_types', DOCUMENT_TYPE_CEDULA);
      await prisma.$executeRaw`
        INSERT INTO asistencia.document_details (document_type_id, user_id, document_number, issue_date, place_of_issue)
        VALUES (${documentTypeId}, ${userId}, ${cedula}, '2010-01-01', 'Valledupar')
        ON CONFLICT (user_id) DO UPDATE SET document_number = EXCLUDED.document_number
      `;
    }

    return userId;
  }

  async actualizar(id: string, data: ActualizarEmpleadoData): Promise<void> {
    const sets: Prisma.Sql[] = [];

    if (data.nombre !== undefined) sets.push(Prisma.sql`first_name = ${data.nombre}`);
    if (data.apellido !== undefined) sets.push(Prisma.sql`first_surname = ${data.apellido}`);
    if (data.correo !== undefined || data.email !== undefined) sets.push(Prisma.sql`email = ${data.correo || data.email}`);
    if (data.telefono !== undefined || data.phone !== undefined) sets.push(Prisma.sql`phone = ${data.telefono || data.phone}`);
    if (data.fecha_nacimiento !== undefined) sets.push(Prisma.sql`date_of_birth = ${data.fecha_nacimiento}::date`);
    if (data.cargo_id !== undefined) sets.push(Prisma.sql`position_id = ${data.cargo_id}`);
    if (data.area_id !== undefined) sets.push(Prisma.sql`area_id = ${data.area_id}`);
    if (data.schedule_id !== undefined) sets.push(Prisma.sql`schedule_id = ${data.schedule_id}`);
    if (data.activo !== undefined) sets.push(Prisma.sql`active = ${data.activo === true ? true : data.activo === 1 ? true : false}`);
    if (data.foto_url !== undefined) sets.push(Prisma.sql`photo = ${data.foto_url}`);

    if (sets.length > 0) {
      await prisma.$executeRaw`
        UPDATE asistencia.users SET ${Prisma.join(sets, ', ')} WHERE id = ${id}
      `;
    }

    // Sync schedule_assignments when schedule_id changes
    if (data.schedule_id !== undefined) {
      if (data.schedule_id) {
        // Check if assignment already exists
        const existing = await prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM asistencia.schedule_assignments
          WHERE user_id = ${id} AND schedule_id = ${data.schedule_id} AND valid_until IS NULL
          LIMIT 1
        `;
        if (existing.length > 0) {
          // Update existing: reactivate if was inactive
          await prisma.$executeRaw`
            UPDATE asistencia.schedule_assignments
            SET valid_until = NULL, valid_from = CURRENT_DATE, reason = 'Asignación desde Personal'
            WHERE id = ${existing[0].id}
          `;
        } else {
          // Insert new assignment
          await prisma.$executeRaw`
            INSERT INTO asistencia.schedule_assignments (user_id, schedule_id, valid_from, reason)
            VALUES (${id}, ${data.schedule_id}, CURRENT_DATE, 'Asignación desde Personal')
          `;
        }
      } else {
        await prisma.$executeRaw`
          UPDATE asistencia.schedule_assignments SET valid_until = CURRENT_DATE
          WHERE user_id = ${id} AND schedule_id IS NOT NULL AND valid_until IS NULL
        `;
      }
    }

    if (data.cedula) {
      const documentTypeId = await resolverIdPorNombre('document_types', DOCUMENT_TYPE_CEDULA);
      await prisma.$executeRaw`
        INSERT INTO asistencia.document_details (document_type_id, user_id, document_number, issue_date, place_of_issue)
        VALUES (${documentTypeId}, ${id}, ${data.cedula}, '2010-01-01', 'Valledupar')
        ON CONFLICT (user_id) DO UPDATE SET document_number = EXCLUDED.document_number
      `;
    }
  }

  async eliminar(id: string): Promise<void> {
    await prisma.$executeRaw`DELETE FROM asistencia.users WHERE id = ${id}`;
  }
}