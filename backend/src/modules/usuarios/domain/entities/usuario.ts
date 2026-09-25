export interface UsuarioRow {
  id: string;
  empleado_id: string;
  username: string | null;
  activo: number;
  password_reset_required: number;
  creado_en: Date;
  ultimo_acceso: Date;
  rol: string | null;
  rol_id: string | null;
  empleado: string;
  cedula: string;
  correo: string | null;
  area: string;
  piso: string;
}

export interface EmpleadoUsuarioRow {
  id: string;
  email: string | null;
  first_name: string;
  first_surname: string;
  cedula: string | null;
}

export interface RolRow {
  id: string;
  nombre: string;
  descripcion: string | null;
}

export interface RolNombreRow {
  name: string;
}

export interface PermisoRolRow {
  name: string;
}

export interface PendienteEmailRow {
  id: string;
  nombre: string;
  username: string | null;
  email: string;
  password_reset_required: boolean;
  rol: string;
  ultimo_envio: Date | null;
  expira: Date | null;
  aceptado_en: Date | null;
  estado: string;
}

export interface ObjetivoAccesoRow {
  id: string;
}

export interface UsuarioAccesoRow {
  id: string;
  first_name: string;
  first_surname: string;
  username: string | null;
  password_hash: string | null;
  email: string | null;
}

export interface NumeroDocumentoRow {
  document_number: string | null;
}

export interface ResultadoCredencialesMasivas {
  mensaje: string;
  creados: number;
  emails_enviados: number;
  emails_fallados: number;
  resultados: never[];
}

export interface ResultadoEnvioAcceso {
  enviados: number;
  fallidos: number;
  sin_correo: number;
  resultados: ResultadoEnvioAccesoItem[];
}

export interface ResultadoEnvioAccesoItem {
  id: string;
  nombre: string;
  username: string | null;
  email: string;
  enviado: boolean;
  motivo?: string;
}

export interface EmailServiceResult {
  enviado: boolean;
  motivo?: string;
}

export class RoleNotFoundError extends Error {
  constructor() {
    super('Role not found');
    this.name = 'RoleNotFoundError';
  }
}
