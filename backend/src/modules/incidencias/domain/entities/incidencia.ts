// Entidades del dominio de incidencias. Réplica 1:1 del contrato legacy
// (columnas duplicadas como `estado`/`status` y `evidencia`/`evidencia_url`
// incluidas de forma deliberada: el frontend y el legacy las consumen).

export interface IncidenciaRow {
  id: string;
  user_id: string;
  empleado_id: string;
  empleado: string;
  empleado_nombre: string;
  apellido?: string;
  cedula: string;
  cargo: string;
  area: string;
  tipo: string;
  descripcion: string;
  estado: string;
  status: string;
  prioridad: string;
  priority: string;
  evidencia: string | null;
  evidencia_url: string | null;
  observacion: string | null;
  motivo_rechazo: string | null;
  archivo_firmado: string | null;
  reviewed_by: string | null;
  responsable: string | null;
  revisor_nombre: string | null;
  fecha: string;
  created_at: Date;
  asistencia?: Record<string, unknown> | null;
}

export interface CrearIncidenciaData {
  empleado_id: string;
  tipo: string;
  descripcion: string;
  evidencia_url: string | null;
  fecha?: string;
  prioridad?: string;
}

export interface FiltrosIncidencia {
  empleado_id?: string;
  estado?: string;
  tipo?: string;
  prioridad?: string;
  area_id?: string;
  cargo_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  busqueda?: string;
}

export interface StatsIncidencia {
  pendientes: string | number;
  aprobadas: string | number;
  rechazadas: string | number;
}

export interface ActividadIncidenciaRow {
  id: string;
  estado: string;
  tipo: string;
  created_at: Date;
  updated_at: Date | null;
  fecha: string;
  empleado_nombre: string;
  empleado_apellido: string;
}