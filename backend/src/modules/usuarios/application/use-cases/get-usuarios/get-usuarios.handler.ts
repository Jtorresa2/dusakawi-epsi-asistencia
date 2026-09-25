import type { UsuarioRow } from '@modules/usuarios/domain/entities/usuario';
import type { UsuarioRepository } from '@modules/usuarios/domain/repositories/usuario-repository';

export class GetUsuariosHandler {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async handle(): Promise<UsuarioRow[]> {
    return this.usuarioRepository.obtenerUsuarios();
  }
}
