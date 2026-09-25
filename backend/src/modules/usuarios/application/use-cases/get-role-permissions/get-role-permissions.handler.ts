import type { UsuarioRepository } from '@modules/usuarios/domain/repositories/usuario-repository';

export type GetRolePermissionsResult =
  | { status: 'invalid-id' }
  | { status: 'not-found' }
  | { status: 'ok'; permissions: string[] };

export class GetRolePermissionsHandler {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async handle(command: { id: string }): Promise<GetRolePermissionsResult> {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuid.test(command.id) && !/^\d+$/.test(command.id)) {
      return { status: 'invalid-id' };
    }

    const role = await this.usuarioRepository.obtenerRolPorId(command.id);
    if (!role) {
      return { status: 'not-found' };
    }

    const permissions = await this.usuarioRepository.obtenerPermisosRol(command.id);
    return { status: 'ok', permissions: permissions.map((permission) => permission.name) };
  }
}
