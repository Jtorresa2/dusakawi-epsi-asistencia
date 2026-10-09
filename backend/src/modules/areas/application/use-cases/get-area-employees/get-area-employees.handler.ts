import { prisma } from '@config/database/prisma/prisma';

interface AreaEmployeesResult {
  status: number;
  body: unknown;
}

// node-pg parses DATE columns as local midnight; the Prisma pg adapter parses
// them as UTC midnight. Re-anchor using the UTC wall-clock components so the
// serialized ISO string matches the legacy response byte-for-byte.
const dateAsLocalMidnight = (value: Date): Date =>
  new Date(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());

function toTitleCase(str: unknown): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/(^|\s)\S/g, (l) => l.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

export class GetAreaEmployeesHandler {
  async handle(areaId: string): Promise<AreaEmployeesResult> {
    try {
      const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
        SELECT u.id, dd.document_number AS cedula, u.first_name AS nombre, u.first_surname AS apellido,
               u.middle_name, u.second_surname,
               TRIM(CONCAT(u.first_name, ' ', COALESCE(u.middle_name, ''), ' ', u.first_surname, ' ', COALESCE(u.second_surname, ''))) AS empleado,
               u.email AS correo, u.email, u.phone AS telefono,
               u.date_of_birth AS fecha_nacimiento, u.position_id AS cargo_id, u.area_id,
               u.schedule_id AS horario_id,
               NULLIF(regexp_replace(f.name, '\\D', '', 'g'), '')::int AS piso,
               u.hire_date AS fecha_ingreso, u.active AS activo, u.username, u.created_at,
               c.name AS cargo, r.name AS rol
        FROM asistencia.users u
        LEFT JOIN asistencia.positions c ON u.position_id = c.id
        LEFT JOIN asistencia.areas a ON u.area_id = a.id
        LEFT JOIN asistencia.floors f ON a.floor_id = f.id
        LEFT JOIN asistencia.document_details dd ON dd.user_id = u.id
        LEFT JOIN asistencia.user_roles ur ON ur.user_id = u.id
        LEFT JOIN asistencia.roles r ON r.id = ur.role_id
        WHERE u.area_id = ${areaId} ORDER BY u.first_name ASC
      `;

      for (const row of rows) {
        row.empleado =
          toTitleCase(row.empleado) ||
          `${toTitleCase(row.nombre)} ${toTitleCase(row.apellido)}`.trim();
        if (row.cargo) row.cargo = toTitleCase(row.cargo);

        if (row.fecha_nacimiento instanceof Date) {
          row.fecha_nacimiento = dateAsLocalMidnight(row.fecha_nacimiento);
        }
        if (row.fecha_ingreso instanceof Date) {
          row.fecha_ingreso = dateAsLocalMidnight(row.fecha_ingreso);
        }
      }

      return { status: 200, body: rows };
    } catch (error) {
      console.error(error);
      return {
        status: 500,
        body: { mensaje: 'Error al obtener empleados del \u00e1rea' },
      };
    }
  }
}
