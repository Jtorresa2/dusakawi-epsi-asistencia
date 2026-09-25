import type { UsuarioRepository } from '@modules/usuarios/domain/repositories/usuario-repository';

export class DeleteUsuarioHandler {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async handle(command: { id: string }): Promise<void> {
    await this.usuarioRepository.eliminarRolesUsuario(command.id);
  }
}
