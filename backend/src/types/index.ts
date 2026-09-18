import { Request } from 'express';

// ─── Auth / JWT ────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'talento_humano' | 'empleado';

export interface JwtPayload {
  id: string;
  username: string;
  nombre: string;
  rol: UserRole;
}

/** Express Request with the decoded JWT attached by authMiddleware */
export interface AuthRequest extends Request {
  user: JwtPayload;
}

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}

// ─── DB row shapes (raw output of pg queries) ──────────────────────────────────

export interface DbUser {
  id: string;
  username: string;
  password_hash: string;
  active: boolean;
  password_reset_required: boolean;
  role: string;
  first_name: string;
  first_surname: string;
  email: string | null;
}

export interface DbPasswordResetToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used: boolean;
}

// ─── Domain entities ───────────────────────────────────────────────────────────

export interface Usuario {
  id: string;
  cedula: string | null;
  nombre: string;
  apellido: string;
  correo: string | null;
  telefono: string | null;
  fecha_nacimiento: string | null;
  cargo_id: string | null;
  area_id: string | null;
  horario_id: string | null;
  piso: number | null;
  fecha_ingreso: string | null;
  activo: boolean;
  username: string;
  password_reset_required: boolean;
  created_at: string;
  area: string | null;
  cargo: string | null;
  rol: string | null;
  rol_id: string | null;
  absences: number;
  late_arrivals: number;
}

export interface Area {
  id: string;
  name: string;
  description: string | null;
  floor_id: string | null;
  active: boolean;
}

export interface Cargo {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: 'activo' | 'inactivo';
  area_id: string | null;
  areas: string | null;
  creado_en: string;
  updated_at: string;
  empleados_count: number;
}

export type EstadoIncidencia =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'correction_requested'
  | 'corrected';

export interface Incidencia {
  id: string;
  user_id: string;
  tipo: string;
  descripcion: string;
  fecha: string;
  estado: EstadoIncidencia;
  evidencia_path: string | null;
  created_at: string;
  updated_at: string;
}

export type TipoNovedad =
  | 'permission'
  | 'vacation'
  | 'sick_leave'
  | 'commission'
  | 'license'
  | 'suspension';

export type ModalidadNovedad = 'full_day' | 'hours' | 'morning' | 'afternoon';

export interface Novedad {
  id: string;
  usuario_id: string;
  fecha_desde: string;
  fecha_hasta: string;
  motivo: string;
  tipo_novedad: TipoNovedad;
  tipo: ModalidadNovedad;
  hora_desde: string | null;
  hora_hasta: string | null;
  estado: string;
  creado_en: string;
}

export type EstadoAsistencia =
  | 'present'
  | 'absent'
  | 'late'
  | 'justified'
  | 'commission'
  | 'holiday';

export interface Asistencia {
  id: string;
  user_id: string;
  date: string;
  status: EstadoAsistencia;
  observation: string | null;
  worked_hours: number;
  late_minutes: number;
}

// ─── Email service params ────────────────────────────────────────────────────

export interface EnviarResetPasswordParams {
  email: string;
  nombre: string;
  username?: string;
  link: string;
  primerIngreso?: boolean;
}

export interface EmailResult {
  enviado: boolean;
  motivo?: string;
}

// ─── Service result shapes ─────────────────────────────────────────────────────

export interface AusentesResult {
  fecha: string;
  procesados: number;
  creados: number;
  omitidosLaboralConMarca: number;
  salidasNoRegistradas: number;
  ausenciasTarde: number;
  errores: { id: string; error: string }[];
}

export interface CrearUsuarioResult {
  id: string;
  username: string;
}

// ─── Personal service filtros ──────────────────────────────────────────────────

export interface PersonalFiltros {
  area?: string | number;
  cargo?: string | number;
  [key: string]: unknown;
}

export interface CrearPersonalData {
  cedula?: string | null;
  nombre: string;
  apellido: string;
  correo?: string | null;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
  cargo_id?: string | null;
  area_id?: string | null;
  horario_id?: string | null;
  fecha_ingreso?: string | null;
  activo?: number | boolean;
  rol_id?: string | null;
  username?: string | null;
  password?: string | null;
}

// ─── SQL & Query Params ────────────────────────────────────────────────────────

export type SqlParam =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

// ─── Seguimiento Situaciones ───────────────────────────────────────────────────

export type SituacionEmpleado =
  | 'absence'
  | 'missing_morning'
  | 'missing_afternoon'
  | 'unregistered_exit'
  | 'open_day';

// ─── Incidencias Detalle (DB rows con JOINs) ───────────────────────────────────

export interface AsistenciaRelacionada {
  fecha_hora_entrada: string | null;
  fecha_hora_salida: string | null;
  minutos_tardanza: number | null;
  tipo_marcacion: string | null;
  estado_marcacion: string | null;
  modalidad: string | null;
  hora_entrada_programada: string | null;
  hora_salida_programada: string | null;
}

export interface IncidenciaDetalle {
  id: string;
  usuario_id: string;
  tipo: string;
  descripcion: string;
  evidencia_url: string | null;
  archivo_firmado: string | null;
  fecha: string;
  estado: EstadoIncidencia;
  prioridad: string;
  motivo_rechazo: string | null;
  observacion: string | null;
  revisado_por: string | null;
  created_at: string | Date;
  updated_at: string | Date | null;
  empleado_nombre: string;
  cedula: string | null;
  apellido: string;
  area: string | null;
  cargo: string | null;
  revisor_nombre?: string | null;
  asistencia?: AsistenciaRelacionada | null;
}

// ─── Horarios (DB rows con JOINs) ──────────────────────────────────────────────

export interface HorarioRow {
  id: string;
  nombre: string;
  modalidad: string;
  tipo_jornada: string;
  descripcion: string | null;
  horas_esperadas: number | null;
  activo: boolean;
  tolerancia_minutos: number;
  tolerancia_salida_minutos: number;
  es_por_defecto: boolean;
  creado_en: string | Date;
  dia_semana: string | null;
  hora_entrada_manana: string | null;
  hora_salida_manana: string | null;
  hora_entrada_tarde: string | null;
  hora_salida_tarde: string | null;
}

export interface HorarioDetalleItem {
  dia_semana: string;
  hora_entrada_manana: string | null;
  hora_salida_manana: string | null;
  hora_entrada_tarde: string | null;
  hora_salida_tarde: string | null;
}

export interface HorarioAgrupado {
  id: string;
  nombre: string;
  modalidad: string;
  tipo_jornada: string;
  descripcion: string | null;
  horas_esperadas: number | null;
  activo: boolean;
  tolerancia_minutos: number;
  tolerancia_salida_minutos: number;
  es_por_defecto: boolean;
  creado_en: string | Date;
  detalles: HorarioDetalleItem[];
}

