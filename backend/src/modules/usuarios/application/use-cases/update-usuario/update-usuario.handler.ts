import bcrypt from 'bcryptjs';
import type { UsuarioRepository } from '@modules/usuarios/domain/repositories/usuario-repository';

export interface UpdateUsuarioCommand {
  id: string;
  rol_id?: string;
  username?: string | null;
  password?: string;
}

export type UpdateUsuarioResult = { status: 'updated' } | { status: 'unauthorized-role' };

export class UpdateUsuarioHandler {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async handle(command: UpdateUsuarioCommand): Promise<UpdateUsuarioResult> {
    const { id, rol_id, username, password } = command;

    // Policy fix (deviation from legacy): the legacy PUT assigned any role
    // without validation, which could bypass the two-access-role policy
    // (Administrador / Talento Humano) that the POST path already enforces.
    if (rol_id) {
      const role = await this.usuarioRepository.obtenerRolPorId(rol_id);
      if (!role || !['Administrador', 'Talento Humano'].includes(role.name)) {
        return { status: 'unauthorized-role' };
      }
    }

    if (password && password.trim() !== '') {
      const passwordHash = await bcrypt.hash(password, 10);
      if (username) {
        await this.usuarioRepository.actualizarCredenciales(id, username, passwordHash);
      } else {
        await this.usuarioRepository.actualizarPasswordHash(id, passwordHash);
      }
    } else if (username) {
      await this.usuarioRepository.actualizarUsername(id, username);
    }

    if (rol_id) {
      await this.usuarioRepository.reemplazarRolUsuario(id, rol_id);
    }

    return { status: 'updated' };
  }
}
