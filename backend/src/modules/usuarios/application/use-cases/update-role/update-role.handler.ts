import { RoleNotFoundError } from '@modules/usuarios/domain/entities/usuario';
import type { UsuarioRepository } from '@modules/usuarios/domain/repositories/usuario-repository';

export interface UpdateRoleCommand {
  id: string;
  descripcion?: unknown;
  permisos?: unknown;
}

export type UpdateRoleResult =
  | { status: 'invalid-id' }
  | { status: 'not-found' }
  | { status: 'updated' };

export class UpdateRoleHandler {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async handle(command: UpdateRoleCommand): Promise<UpdateRoleResult> {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuid.test(command.id) && !/^\d+$/.test(command.id)) {
      return { status: 'invalid-id' };
    }

    const permissions = Array.isArray(command.permisos) ? command.permisos : [];
    try {
      await this.usuarioRepository.actualizarRol(
        command.id,
        command.descripcion,
        permissions,
      );
      return { status: 'updated' };
    } catch (error) {
      if (error instanceof RoleNotFoundError) {
        return { status: 'not-found' };
      }
      throw error;
    }
  }
}
