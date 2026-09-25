import type { PendienteEmailRow } from '@modules/usuarios/domain/entities/usuario';
import type { UsuarioRepository } from '@modules/usuarios/domain/repositories/usuario-repository';

export class GetPendingEmailsHandler {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async handle(): Promise<PendienteEmailRow[]> {
    return this.usuarioRepository.obtenerPendientesEmail();
  }
}
