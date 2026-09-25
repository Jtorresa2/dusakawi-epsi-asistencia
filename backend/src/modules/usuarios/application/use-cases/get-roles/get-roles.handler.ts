import type { RolRow } from '@modules/usuarios/domain/entities/usuario';
import type { UsuarioRepository } from '@modules/usuarios/domain/repositories/usuario-repository';

export class GetRolesHandler {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async handle(): Promise<RolRow[]> {
    return this.usuarioRepository.obtenerRoles();
  }
}
