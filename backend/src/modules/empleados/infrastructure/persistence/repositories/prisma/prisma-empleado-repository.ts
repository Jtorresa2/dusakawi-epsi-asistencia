import { Prisma } from '@config/database/prisma/generated/client';
import { prisma } from '@config/database/prisma/prisma';
import type { ActualizarEmpleadoData, CrearEmpleadoData, EmpleadoFiltros, EmpleadoRow } from '@modules/empleados/domain/entities/empleado';
import type { EmpleadoRepository } from '@modules/empleados/domain/repositories/empleado-repository';

interface EmpleadoDBRow {
  consecutivo_empleado: string | number;
  consecutivo_contrato: string | number;
  tipo_documento: string;
  numero_identificacion: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  email: string | null;
  celular: string | null;
  fecha_nacimiento: string | Date | null;
  cargo_id: string | null;
  cargo: string | null;
  user_id: string | null;
  foto_url: string | null;
  user_active: boolean | null;
  area_id: string | null;
  area_nombre: string | null;
  piso_nombre: string | null;
  schedule_id: string | null;
  horario_nombre: string | null;
  ultimo_acceso?: Date | string | null;
  rol?: string | null;
  fingerprint?: string | null;
}

const SELECCION_EMPLEADO = `
  SELECT
    COALESCE(e.consecutivo_empleado, 0) AS consecutivo_empleado,
    COALESCE(e.consecutivo_contrato, 0) AS consecutivo_contrato,
    COALESCE(e.tipo_documento, 'CC') AS tipo_documento,
    COALESCE(dd.document_number, e.numero_identificacion, '') AS numero_identificacion,
    COALESCE(NULLIF(btrim(u.first_name), ''), e.primer_nombre) AS primer_nombre,
    COALESCE(NULLIF(btrim(u.middle_name), ''), e.segundo_nombre) AS segundo_nombre,
    COALESCE(NULLIF(btrim(u.first_surname), ''), e.primer_apellido) AS primer_apellido,
    COALESCE(NULLIF(btrim(u.second_surname), ''), e.segundo_apellido) AS segundo_apellido,
    -- El ERP (administrativo) es solo lectura: nunca se escribe en el.
    -- Los datos editados por el usuario se guardan en asistencia.users / document_details
    COALESCE(NULLIF(btrim(u.email), ''), e.email) AS email,
    COALESCE(NULLIF(btrim(u.phone), ''), e.celular) AS celular,
    COALESCE(u.date_of_birth, e.fecha_nacimiento) AS fecha_nacimiento,
    pos.id AS cargo_id,
    COALESCE(pos.name, e.cargo) AS cargo,
    u.id AS user_id,
    COALESCE(u.photo, '') AS foto_url,
    u.active AS user_active,
    ar.id AS area_id,
    COALESCE(ar.name, '') AS area_nombre,
    fl.name AS piso_nombre,
    s.id AS schedule_id,
    COALESCE(s.name, '') AS horario_nombre,
    u.last_access AS ultimo_acceso,
    r.name AS rol,
    u.fingerprint
  FROM asistencia.users u
  LEFT JOIN asistencia.user_roles ur ON ur.user_id = u.id
  LEFT JOIN asistencia.roles r ON ur.role_id = r.id
  LEFT JOIN asistencia.document_details dd ON dd.user_id = u.id
  LEFT JOIN asistencia.listar_empleados() e ON e.numero_identificacion = dd.document_number
  LEFT JOIN asistencia.positions pos ON pos.id = u.position_id
  LEFT JOIN asistencia.areas ar ON ar.id = u.area_id
  LEFT JOIN asistencia.floors fl ON fl.id = ar.floor_id
  LEFT JOIN asistencia.schedules s ON s.id = u.schedule_id
`;

const USER_COLS = 'first_name, middle_name, first_surname, second_surname, email, phone, date_of_birth, position_id, area_id, is_account';
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

function toTitleCase(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/(^|\s)\S/g, (l) => l.toUpperCase());
}

function toEmpleadoRow(r: EmpleadoDBRow): EmpleadoRow {
  const primerNombre = toTitleCase(r.primer_nombre);
  const segundoNombre = toTitleCase(r.segundo_nombre);
  const primerApellido = toTitleCase(r.primer_apellido);
  const segundoApellido = toTitleCase(r.segundo_apellido);

  const nombreRaw = [primerNombre, segundoNombre].filter(Boolean).join(' ').trim();
  const apellidoRaw = [primerApellido, segundoApellido].filter(Boolean).join(' ').trim();
  const empleado = `${nombreRaw} ${apellidoRaw}`.trim();
  const fechaNac = r.fecha_nacimiento
    ? (r.fecha_nacimiento instanceof Date
        ? r.fecha_nacimiento.toISOString().split('T')[0]
        : String(r.fecha_nacimiento).split('T')[0])
    : null;

  return {
    id: r.user_id || String(r.consecutivo_empleado),
    cedula: r.numero_identificacion || '',
    primer_nombre: primerNombre,
    segundo_nombre: segundoNombre,
    primer_apellido: primerApellido,
    segundo_apellido: segundoApellido,
    nombre: nombreRaw,
    apellido: apellidoRaw,
    empleado,
    correo: r.email || '',
    email: r.email,
    telefono: r.celular || '',
    phone: r.celular,
    fecha_nacimiento: fechaNac,
    cargo_id: r.cargo_id || null,
    cargo: toTitleCase(r.cargo) || '—',
    area_id: r.area_id,
    area: r.area_nombre || '—',
    piso: r.piso_nombre || '—',
    foto_url: r.foto_url || '',
    activo: r.user_active === false ? 0 : 1,
    estado: r.user_active === false ? 'inactivo' : 'activo',
    schedule_id: r.schedule_id,
    horario_id: r.schedule_id,
    horario: r.horario_nombre || '—',
    ultimo_acceso: r.ultimo_acceso
      ? (r.ultimo_acceso instanceof Date
          ? r.ultimo_acceso.toISOString()
          : String(r.ultimo_acceso))
      : null,
    rol: r.rol || null,
    fingerprint: r.fingerprint || null,
  };
}

export class PrismaEmpleadoRepository implements EmpleadoRepository {
  async obtenerTodos(filtros: EmpleadoFiltros): Promise<EmpleadoRow[]> {
    const sql = Prisma.sql`
      ${Prisma.raw(SELECCION_EMPLEADO)}
      WHERE u.is_account = FALSE
        AND (u.username IS NULL OR LOWER(u.username) NOT IN ('admin', 'administrador', 'talento'))
      ${filtros.area ? Prisma.sql`AND (ar.name ILIKE ${`%${filtros.area}%`} OR ar.id::text = ${filtros.area})` : Prisma.empty}
      ${filtros.cargo ? Prisma.sql`AND (pos.name ILIKE ${`%${filtros.cargo}%`} OR e.cargo ILIKE ${`%${filtros.cargo}%`})` : Prisma.empty}
      ORDER BY COALESCE(NULLIF(btrim(u.first_name), ''), e.primer_nombre) ASC
    `;
    const rows = await prisma.$queryRaw<EmpleadoDBRow[]>(sql);
    return rows.map(toEmpleadoRow);
  }

  async obtenerPorId(id: string): Promise<EmpleadoRow | null> {
    const rows = await prisma.$queryRaw<EmpleadoDBRow[]>`
      ${Prisma.raw(SELECCION_EMPLEADO)}
      WHERE (u.id::text = ${id} OR dd.document_number = ${id} OR e.consecutivo_empleado::text = ${id} OR e.numero_identificacion = ${id})
      LIMIT 1
    `;
    return rows[0] ? toEmpleadoRow(rows[0]) : null;
  }

  async crear(data: CrearEmpleadoData): Promise<string> {
    const {
      cedula,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      nombre,
      apellido,
      correo,
      telefono,
      fecha_nacimiento,
      cargo_id,
      area_id,
    } = data;

    const rows = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO asistencia.users (${Prisma.raw(USER_COLS)})
      VALUES (
        ${primer_nombre || nombre},
        ${segundo_nombre || null},
        ${primer_apellido || apellido || ''},
        ${segundo_apellido || null},
        ${correo || null},
        ${telefono || null},
        COALESCE(${fecha_nacimiento ?? null}::date, '1990-01-01'::date),
        ${cargo_id || null},
        ${area_id || null},
        false
      )
      RETURNING id
    `;
    const userId = rows[0]?.id;
    if (!userId) return userId;

    if (cedula) {
      const documentTypeId = await resolverIdPorNombre('document_types', DOCUMENT_TYPE_CEDULA);
      await prisma.$executeRaw`
        INSERT INTO asistencia.document_details (document_type_id, user_id, document_number, issue_date, place_of_issue)
        VALUES (${documentTypeId}, ${userId}, ${cedula}, NULL, NULL)
        ON CONFLICT (user_id) DO UPDATE SET document_number = EXCLUDED.document_number
      `;
    }

    return userId;
  }

  async actualizar(id: string, data: ActualizarEmpleadoData): Promise<void> {
    let targetUserId = id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (!isUuid) {
      const existingUser = await prisma.$queryRaw<{ id: string }[]>`
        SELECT u.id FROM asistencia.users u
        JOIN asistencia.document_details dd ON dd.user_id = u.id
        WHERE dd.document_number = ${id} OR u.id::text = ${id}
        LIMIT 1
      `;
      if (existingUser[0]) {
        targetUserId = existingUser[0].id;
      } else {
        const emp = await this.obtenerPorId(id);
        if (emp) {
          targetUserId = await this.crear({
            cedula: emp.cedula,
            nombre: emp.nombre,
            apellido: emp.apellido,
            correo: emp.correo || undefined,
            telefono: emp.telefono || undefined,
            fecha_nacimiento: emp.fecha_nacimiento || undefined,
            cargo_id: data.cargo_id,
            area_id: data.area_id,
          });
        }
      }
    }

    const sets: Prisma.Sql[] = [];

    if (data.primer_nombre !== undefined) sets.push(Prisma.sql`first_name = ${data.primer_nombre}`);
    else if (data.nombre !== undefined) sets.push(Prisma.sql`first_name = ${data.nombre}`);

    if (data.segundo_nombre !== undefined) sets.push(Prisma.sql`middle_name = ${data.segundo_nombre}`);

    if (data.primer_apellido !== undefined) sets.push(Prisma.sql`first_surname = ${data.primer_apellido}`);
    else if (data.apellido !== undefined) sets.push(Prisma.sql`first_surname = ${data.apellido}`);

    if (data.segundo_apellido !== undefined) sets.push(Prisma.sql`second_surname = ${data.segundo_apellido}`);
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
        UPDATE asistencia.users SET ${Prisma.join(sets, ', ')} WHERE id = ${targetUserId}
      `;
    }

    if (data.schedule_id !== undefined) {
      if (data.schedule_id) {
        const existing = await prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM asistencia.schedule_assignments
          WHERE user_id = ${targetUserId} AND schedule_id = ${data.schedule_id} AND valid_until IS NULL
          LIMIT 1
        `;
        if (existing.length > 0) {
          await prisma.$executeRaw`
            UPDATE asistencia.schedule_assignments
            SET valid_until = NULL, valid_from = CURRENT_DATE, reason = 'Asignación desde Personal'
            WHERE id = ${existing[0].id}
          `;
        } else {
          await prisma.$executeRaw`
            INSERT INTO asistencia.schedule_assignments (user_id, schedule_id, valid_from, reason)
            VALUES (${targetUserId}, ${data.schedule_id}, CURRENT_DATE, 'Asignación desde Personal')
          `;
        }
      } else {
        await prisma.$executeRaw`
          UPDATE asistencia.schedule_assignments SET valid_until = CURRENT_DATE
          WHERE user_id = ${targetUserId} AND schedule_id IS NOT NULL AND valid_until IS NULL
        `;
      }
    }

    if (data.cedula) {
      const documentTypeId = await resolverIdPorNombre('document_types', DOCUMENT_TYPE_CEDULA);
      await prisma.$executeRaw`
        INSERT INTO asistencia.document_details (document_type_id, user_id, document_number, issue_date, place_of_issue)
        VALUES (${documentTypeId}, ${targetUserId}, ${data.cedula}, NULL, NULL)
        ON CONFLICT (user_id) DO UPDATE SET document_number = EXCLUDED.document_number
      `;
    }
  }

  async eliminar(id: string): Promise<void> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      await prisma.$executeRaw`DELETE FROM asistencia.users WHERE id = ${id}`;
    } else {
      await prisma.$executeRaw`
        DELETE FROM asistencia.users u
        USING asistencia.document_details dd
        WHERE dd.user_id = u.id AND dd.document_number = ${id}
      `;
    }
  }
}