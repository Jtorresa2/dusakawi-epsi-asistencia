import type {
  EmpleadoUsuarioRow,
  NumeroDocumentoRow,
  ObjetivoAccesoRow,
  PendienteEmailRow,
  PermisoRolRow,
  RolNombreRow,
  RolRow,
  UsuarioAccesoRow,
  UsuarioRow,
} from '@modules/usuarios/domain/entities/usuario';

export interface UsuarioRepository {
  obtenerUsuarios(): Promise<UsuarioRow[]>;
  obtenerEmpleado(id: string | null): Promise<EmpleadoUsuarioRow | null>;
  actualizarCredenciales(id: string, username: string | null, passwordHash: string): Promise<void>;
  obtenerRolPorId(id: string): Promise<RolNombreRow | null>;
  eliminarRolesUsuario(userId: string): Promise<void>;
  reemplazarRolUsuario(userId: string, roleId: string): Promise<void>;
  actualizarPasswordHash(id: string, passwordHash: string): Promise<void>;
  actualizarUsername(id: string, username: string): Promise<void>;
  obtenerRoles(): Promise<RolRow[]>;
  obtenerPermisosRol(id: string): Promise<PermisoRolRow[]>;
  actualizarRol(id: string, description: unknown, permissions: unknown[]): Promise<void>;
  obtenerPendientesEmail(): Promise<PendienteEmailRow[]>;
  obtenerObjetivosAcceso(): Promise<ObjetivoAccesoRow[]>;
  obtenerUsuarioAcceso(id: string): Promise<UsuarioAccesoRow | null>;
  obtenerNumeroDocumento(id: string): Promise<NumeroDocumentoRow | null>;
  existeUsername(username: string): Promise<boolean>;
  actualizarCredencialesAcceso(id: string, username: string, passwordHash: string): Promise<void>;
  invalidarPasswordResetTokens(id: string): Promise<void>;
  crearPasswordResetToken(id: string, tokenHash: string): Promise<void>;
}
