import type { Request, Response } from 'express';
import type { GetUsuariosHandler } from '@modules/usuarios/application/use-cases/get-usuarios/get-usuarios.handler';
import type { CreateUsuarioHandler } from '@modules/usuarios/application/use-cases/create-usuario/create-usuario.handler';
import type { UpdateUsuarioHandler } from '@modules/usuarios/application/use-cases/update-usuario/update-usuario.handler';
import type { DeleteUsuarioHandler } from '@modules/usuarios/application/use-cases/delete-usuario/delete-usuario.handler';
import type { GenerateUsuariosMasivosHandler } from '@modules/usuarios/application/use-cases/generate-usuarios-masivos/generate-usuarios-masivos.handler';
import type { GetRolesHandler } from '@modules/usuarios/application/use-cases/get-roles/get-roles.handler';
import type { GetRolePermissionsHandler } from '@modules/usuarios/application/use-cases/get-role-permissions/get-role-permissions.handler';
import type { UpdateRoleHandler } from '@modules/usuarios/application/use-cases/update-role/update-role.handler';
import type { GetPendingEmailsHandler } from '@modules/usuarios/application/use-cases/get-pending-emails/get-pending-emails.handler';
import type { SendAccessEmailHandler } from '@modules/usuarios/application/use-cases/send-access-email/send-access-email.handler';

const esViolacion = (error: unknown, sqlState: '23505'): boolean => {
  const value = error as {
    code?: string;
    cause?: { code?: string };
    meta?: { driverAdapterError?: unknown };
  };
  if (value.code === sqlState || value.cause?.code === sqlState) return true;
  if (sqlState === '23505' && value.code === 'P2002') return true;
  if (value.code === 'P2010') {
    if (String(value.meta?.driverAdapterError ?? '').includes('UniqueConstraintViolation')) {
      return true;
    }
  }
  return false;
};

const getUsuarios = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetUsuariosHandler>('getUsuariosHandler');
    const usuarios = await handler.handle();
    res.json({ usuarios });
  } catch (err) {
    console.error('getUsuarios error:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

const crearUsuario = async (req: Request, res: Response) => {
  try {
    const { empleado_id, rol_id, username, password } = req.body;
    const handler = req.container.resolve<CreateUsuarioHandler>('createUsuarioHandler');
    const result = await handler.handle({ empleado_id, rol_id, username, password });
    if (result.status === 'not-found') {
      return res.status(400).json({ mensaje: 'Empleado no encontrado' });
    }
    if (result.status === 'unauthorized-role') {
      return res.status(400).json({ mensaje: 'Rol no autorizado para asignación de usuario' });
    }
    res.json({
      mensaje: 'Usuario creado correctamente',
      password: result.password,
      password_reset_required: 0,
    });
  } catch (err) {
    console.error('crearUsuario error:', err);
    if (esViolacion(err, '23505')) {
      return res.status(400).json({ mensaje: 'El nombre de usuario ya existe' });
    }
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

const actualizarUsuario = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const { rol_id, username, password } = req.body;
    const handler = req.container.resolve<UpdateUsuarioHandler>('updateUsuarioHandler');
    const result = await handler.handle({ id, rol_id, username, password });
    if (result.status === 'unauthorized-role') {
      return res.status(400).json({ mensaje: 'Rol no autorizado para asignación de usuario' });
    }
    res.json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (err) {
    console.error('actualizarUsuario error:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

const eliminarUsuario = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const handler = req.container.resolve<DeleteUsuarioHandler>('deleteUsuarioHandler');
    await handler.handle({ id });
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (err) {
    console.error('eliminarUsuario error:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

const generarMasivos = async (req: Request, res: Response) => {
  const handler = req.container.resolve<GenerateUsuariosMasivosHandler>(
    'generateUsuariosMasivosHandler',
  );
  const result = await handler.handle();
  res.json(result);
};

const getRoles = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetRolesHandler>('getRolesHandler');
    const roles = await handler.handle();
    res.json({ roles });
  } catch (err) {
    console.error('getRoles error:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

const getPermisosRol = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const handler = req.container.resolve<GetRolePermissionsHandler>('getRolePermissionsHandler');
    const result = await handler.handle({ id });
    if (result.status === 'invalid-id') {
      return res.status(400).json({ mensaje: 'Id inválido' });
    }
    if (result.status === 'not-found') {
      return res.status(404).json({ mensaje: 'Rol no encontrado' });
    }
    res.json({ permissions: result.permissions });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

const updateRol = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const { descripcion, permisos } = req.body;
    const handler = req.container.resolve<UpdateRoleHandler>('updateRoleHandler');
    const result = await handler.handle({ id, descripcion, permisos });
    if (result.status === 'invalid-id') {
      return res.status(400).json({ mensaje: 'Id inválido' });
    }
    if (result.status === 'not-found') {
      return res.status(404).json({ mensaje: 'Rol no encontrado' });
    }
    res.json({ mensaje: 'Rol actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

const getPendientesEmail = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetPendingEmailsHandler>('getPendingEmailsHandler');
    const pendientes = await handler.handle();
    res.json({ pendientes });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

const enviarEmailAcceso = async (req: Request, res: Response) => {
  try {
    const { userIds, todos } = req.body;
    const handler = req.container.resolve<SendAccessEmailHandler>('sendAccessEmailHandler');
    const result = await handler.handle({ userIds, todos });
    if (result.status === 'missing-targets') {
      return res.status(400).json({ mensaje: 'Indique usuarios o use todos' });
    }
    res.json({
      enviados: result.enviados,
      fallidos: result.fallidos,
      sin_correo: result.sin_correo,
      resultados: result.resultados,
    });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

export default {
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  generarMasivos,
  getRoles,
  getPermisosRol,
  updateRol,
  getPendientesEmail,
  enviarEmailAcceso,
};
