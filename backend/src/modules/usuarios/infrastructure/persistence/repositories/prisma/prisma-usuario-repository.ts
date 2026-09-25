import { prisma } from '@config/database/prisma/prisma';
import type { UsuarioRepository } from '@modules/usuarios/domain/repositories/usuario-repository';
import {
  RoleNotFoundError,
  type EmpleadoUsuarioRow,
  type NumeroDocumentoRow,
  type ObjetivoAccesoRow,
  type PendienteEmailRow,
  type PermisoRolRow,
  type RolNombreRow,
  type RolRow,
  type UsuarioAccesoRow,
  type UsuarioRow,
} from '@modules/usuarios/domain/entities/usuario';

export class PrismaUsuarioRepository implements UsuarioRepository {
  async obtenerUsuarios(): Promise<UsuarioRow[]> {
    return prisma.$queryRaw<UsuarioRow[]>`
      SELECT
        u.id,
        u.id AS empleado_id,
        u.username,
        1 AS activo,
        0 AS password_reset_required,
        u.created_at AS creado_en,
        u.created_at AS ultimo_acceso,
        r.name AS rol,
        r.id AS rol_id,
        TRIM(CONCAT(u.first_name, ' ', u.first_surname)) AS empleado,
        COALESCE(dd.document_number, '') AS cedula,
        u.email AS correo,
        COALESCE(a.name, '') AS area,
        COALESCE(fl.name, '') AS piso
      FROM asistencia.users u
      LEFT JOIN asistencia.user_roles ur ON ur.user_id = u.id
      LEFT JOIN asistencia.roles r ON ur.role_id = r.id
      LEFT JOIN asistencia.document_details dd ON dd.user_id = u.id
      LEFT JOIN asistencia.areas a ON u.area_id = a.id
      LEFT JOIN asistencia.floors fl ON a.floor_id = fl.id
      ORDER BY u.created_at DESC
    `;
  }

  async obtenerEmpleado(id: string | null): Promise<EmpleadoUsuarioRow | null> {
    const rows = await prisma.$queryRaw<EmpleadoUsuarioRow[]>`
      SELECT u.id, u.email, u.first_name, u.first_surname, dd.document_number AS cedula
      FROM asistencia.users u
      LEFT JOIN asistencia.document_details dd ON dd.user_id = u.id
      WHERE u.id = ${id}
    `;
    return rows[0] ?? null;
  }

  async actualizarCredenciales(
    id: string,
    username: string | null,
    passwordHash: string,
  ): Promise<void> {
    await prisma.$executeRaw`
      UPDATE asistencia.users SET username = ${username}, password_hash = ${passwordHash} WHERE id = ${id}
    `;
  }

  async obtenerRolPorId(id: string): Promise<RolNombreRow | null> {
    const rows = await prisma.$queryRaw<RolNombreRow[]>`
      SELECT name FROM asistencia.roles WHERE id = ${id}
    `;
    return rows[0] ?? null;
  }

  async eliminarRolesUsuario(userId: string): Promise<void> {
    await prisma.$executeRaw`
      DELETE FROM asistencia.user_roles WHERE user_id = ${userId}
    `;
  }

  async reemplazarRolUsuario(userId: string, roleId: string): Promise<void> {
    await prisma.$executeRaw`
      DELETE FROM asistencia.user_roles WHERE user_id = ${userId}
    `;
    await prisma.$executeRaw`
      INSERT INTO asistencia.user_roles (user_id, role_id) VALUES (${userId}, ${roleId})
    `;
  }

  async actualizarPasswordHash(id: string, passwordHash: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE asistencia.users SET password_hash = ${passwordHash} WHERE id = ${id}
    `;
  }

  async actualizarUsername(id: string, username: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE asistencia.users SET username = ${username} WHERE id = ${id}
    `;
  }

  async obtenerRoles(): Promise<RolRow[]> {
    return prisma.$queryRaw<RolRow[]>`
      SELECT id, name AS nombre, description AS descripcion
      FROM asistencia.roles
      WHERE name IN ('Administrador', 'Talento Humano')
      ORDER BY name
    `;
  }

  async obtenerPermisosRol(id: string): Promise<PermisoRolRow[]> {
    return prisma.$queryRaw<PermisoRolRow[]>`
      SELECT acc.name
      FROM asistencia.actions acc
      JOIN asistencia.role_actions ra ON ra.action_id = acc.id
      WHERE ra.role_id = ${id}
    `;
  }

  async actualizarRol(id: string, description: unknown, permissions: unknown[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const roles = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM asistencia.roles WHERE id = ${id}
      `;
      if (!roles.length) {
        throw new RoleNotFoundError();
      }

      if (description !== undefined) {
        await tx.$executeRaw`
          UPDATE asistencia.roles SET description = ${description} WHERE id = ${id}
        `;
      }

      await tx.$executeRaw`
        DELETE FROM asistencia.role_actions WHERE role_id = ${id}
      `;

      if (permissions.length) {
        await tx.$executeRaw`
          INSERT INTO asistencia.role_actions (role_id, action_id)
          SELECT ${id}, acc.id
          FROM asistencia.actions acc
          WHERE acc.name = ANY(${permissions}::text[])
        `;
      }
    });
  }

  async obtenerPendientesEmail(): Promise<PendienteEmailRow[]> {
    return prisma.$queryRaw<PendienteEmailRow[]>`
      SELECT u.id,
             CONCAT(u.first_name, ' ', u.first_surname) AS nombre,
             u.username,
             u.email,
             u.password_reset_required,
             r.name AS rol,
             t.ultimo_envio,
             t.expira,
             t.aceptado_en,
             CASE
               WHEN u.password_reset_required = FALSE THEN 'aceptado'
               WHEN t.ultimo_envio IS NULL THEN 'sin_enviar'
               WHEN t.expira IS NULL OR t.expira > now() THEN 'enviado'
               ELSE 'expirado'
             END AS estado
      FROM asistencia.users u
      JOIN asistencia.user_roles ur ON ur.user_id = u.id
      JOIN asistencia.roles r ON r.id = ur.role_id AND r.name IN ('Administrador', 'Talento Humano')
      LEFT JOIN LATERAL (
        SELECT pt.created_at AS ultimo_envio,
               pt.expires_at AS expira,
               CASE WHEN pt.used THEN pt.used_at ELSE NULL END AS aceptado_en
        FROM asistencia.password_reset_tokens pt
        WHERE pt.user_id = u.id
        ORDER BY pt.created_at DESC
        LIMIT 1
      ) t ON TRUE
      WHERE u.active = TRUE
        AND u.email IS NOT NULL AND u.email <> ''
        AND (u.password_reset_required = TRUE OR t.ultimo_envio IS NOT NULL)
      ORDER BY u.password_reset_required DESC, u.first_name, u.first_surname
    `;
  }

  async obtenerObjetivosAcceso(): Promise<ObjetivoAccesoRow[]> {
    return prisma.$queryRaw<ObjetivoAccesoRow[]>`
      SELECT u.id
      FROM asistencia.users u
      JOIN asistencia.user_roles ur ON ur.user_id = u.id
      JOIN asistencia.roles r ON r.id = ur.role_id AND r.name IN ('Administrador', 'Talento Humano')
      WHERE u.active = TRUE
        AND u.email IS NOT NULL AND u.email <> ''
        AND u.password_reset_required = TRUE
    `;
  }

  async obtenerUsuarioAcceso(id: string): Promise<UsuarioAccesoRow | null> {
    const rows = await prisma.$queryRaw<UsuarioAccesoRow[]>`
      SELECT u.id, u.first_name, u.first_surname, u.username, u.password_hash, u.email
      FROM asistencia.users u
      JOIN asistencia.user_roles ur ON ur.user_id = u.id
      JOIN asistencia.roles r ON r.id = ur.role_id AND r.name IN ('Administrador', 'Talento Humano')
      WHERE u.id = ${id}
    `;
    return rows[0] ?? null;
  }

  async obtenerNumeroDocumento(id: string): Promise<NumeroDocumentoRow | null> {
    const rows = await prisma.$queryRaw<NumeroDocumentoRow[]>`
      SELECT document_number FROM asistencia.document_details WHERE user_id = ${id}
    `;
    return rows[0] ?? null;
  }

  async existeUsername(username: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM asistencia.users WHERE username = ${username}
    `;
    return rows.length > 0;
  }

  async actualizarCredencialesAcceso(
    id: string,
    username: string,
    passwordHash: string,
  ): Promise<void> {
    await prisma.$executeRaw`
      UPDATE asistencia.users
      SET username = ${username}, password_hash = ${passwordHash}, password_reset_required = TRUE
      WHERE id = ${id}
    `;
  }

  async invalidarPasswordResetTokens(id: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE asistencia.password_reset_tokens SET used = true
      WHERE user_id = ${id} AND used = false
    `;
  }

  async crearPasswordResetToken(id: string, tokenHash: string): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO asistencia.password_reset_tokens (user_id, token_hash, expires_at)
      VALUES (${id}, ${tokenHash}, now() + interval '7 days')
    `;
  }
}
