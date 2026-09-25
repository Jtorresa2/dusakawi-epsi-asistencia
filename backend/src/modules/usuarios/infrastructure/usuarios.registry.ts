import { asClass, type AwilixContainer } from 'awilix';
import { PrismaUsuarioRepository } from './persistence/repositories/prisma/prisma-usuario-repository';
import { GetUsuariosHandler } from '../application/use-cases/get-usuarios/get-usuarios.handler';
import { CreateUsuarioHandler } from '../application/use-cases/create-usuario/create-usuario.handler';
import { UpdateUsuarioHandler } from '../application/use-cases/update-usuario/update-usuario.handler';
import { DeleteUsuarioHandler } from '../application/use-cases/delete-usuario/delete-usuario.handler';
import { GenerateUsuariosMasivosHandler } from '../application/use-cases/generate-usuarios-masivos/generate-usuarios-masivos.handler';
import { GetRolesHandler } from '../application/use-cases/get-roles/get-roles.handler';
import { GetRolePermissionsHandler } from '../application/use-cases/get-role-permissions/get-role-permissions.handler';
import { UpdateRoleHandler } from '../application/use-cases/update-role/update-role.handler';
import { GetPendingEmailsHandler } from '../application/use-cases/get-pending-emails/get-pending-emails.handler';
import { SendAccessEmailHandler } from '../application/use-cases/send-access-email/send-access-email.handler';

export function registerUsuariosModule(container: AwilixContainer) {
  container.register({
    usuarioRepository: asClass(PrismaUsuarioRepository).singleton(),
    getUsuariosHandler: asClass(GetUsuariosHandler).scoped(),
    createUsuarioHandler: asClass(CreateUsuarioHandler).scoped(),
    updateUsuarioHandler: asClass(UpdateUsuarioHandler).scoped(),
    deleteUsuarioHandler: asClass(DeleteUsuarioHandler).scoped(),
    generateUsuariosMasivosHandler: asClass(GenerateUsuariosMasivosHandler).scoped(),
    getRolesHandler: asClass(GetRolesHandler).scoped(),
    getRolePermissionsHandler: asClass(GetRolePermissionsHandler).scoped(),
    updateRoleHandler: asClass(UpdateRoleHandler).scoped(),
    getPendingEmailsHandler: asClass(GetPendingEmailsHandler).scoped(),
    sendAccessEmailHandler: asClass(SendAccessEmailHandler).scoped(),
  });
}
