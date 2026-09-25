import bcrypt from 'bcryptjs';
import type { UsuarioRepository } from '@modules/usuarios/domain/repositories/usuario-repository';

export interface CreateUsuarioCommand {
  empleado_id?: string;
  rol_id?: string;
  username?: string | null;
  password?: string;
}

export type CreateUsuarioResult =
  | { status: 'not-found' }
  | { status: 'unauthorized-role' }
  | { status: 'created'; password: string };

export class CreateUsuarioHandler {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async handle(command: CreateUsuarioCommand): Promise<CreateUsuarioResult> {
    const employeeId = command.empleado_id ?? null;
    const employee = await this.usuarioRepository.obtenerEmpleado(employeeId);
    if (!employeeId || !employee) {
      return { status: 'not-found' };
    }

    // Policy fix (deviation from legacy): validate the role BEFORE mutating
    // credentials. The legacy wrote username/password first and failed later,
    // leaving partial writes behind on a 400 response.
    if (command.rol_id) {
      const role = await this.usuarioRepository.obtenerRolPorId(command.rol_id);
      if (!role || !['Administrador', 'Talento Humano'].includes(role.name)) {
        return { status: 'unauthorized-role' };
      }
    }

    const password = command.password || employee.cedula || '123456';
    const passwordHash = await bcrypt.hash(password, 10);
    await this.usuarioRepository.actualizarCredenciales(
      employeeId,
      command.username ?? null,
      passwordHash,
    );

    if (command.rol_id) {
      await this.usuarioRepository.reemplazarRolUsuario(employeeId, command.rol_id);
    }

    return { status: 'created', password };
  }
}
