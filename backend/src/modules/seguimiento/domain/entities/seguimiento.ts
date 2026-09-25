// Entidades del dominio de seguimiento de asistencia. Réplica 1:1 del
// contrato legacy de /api/seguimiento (fila única por (usuario, fecha)
// clasificada en MUCHAS-A-UNA de 5 situaciones + KPIs + paginación).

export const SITUACION = Object.freeze({
  AUSENCIA: 'absence',
  FALTA_MANANA: 'missing_morning',
  FALTA_TARDE: 'missing_afternoon',
  SALIDA_NO_REGISTRADA: 'unregistered_exit',
  JORNADA_ABIERTA: 'open_day',
});

export const PAGE_SIZE_MAX = 500;
export const PAGE_SIZE_DEFAULT = 100;

export const INCIDENCIA_POR_SITUACION: Record<string, string> = {
  [SITUACION.FALTA_TARDE]: 'afternoon_absence',
  [SITUACION.SALIDA_NO_REGISTRADA]: 'unregistered_exit',
};

export interface FiltrosSeguimiento {
  fecha_desde?: string;
  fecha_hasta?: string;
  area?: string;
  piso?: string;
  busqueda?: string;
  situacion?: string;
  page?: string | number;
  pageSize?: string | number;
}

// Fila cruda de consultarUniverso (SQL del legacy: universo de (usuario,
// fecha) laboral + marcas reales + horario esperado por tramo).
export interface FilaUniversoSeguimiento {
  usuario_id: string;
  cedula: string | null;
  empleado: string;
  area: string;
  piso: number | null;
  fecha: string;
  entrada_manana: string | null;
  salida_manana: string | null;
  entrada_tarde: string | null;
  salida_tarde: string | null;
  exp_ent_manana: string | null;
  exp_sal_manana: string | null;
  exp_ent_tarde: string | null;
  exp_sal_tarde: string | null;
  /** Campo interno de clasificación (no viene del SQL). */
  _fechaISO?: string;
}

// Novedad aprobada vinculable (news con status='approved').
export interface NovedadVinculoRow {
  usuario_id: string;
  fecha_desde: string | Date;
  fecha_hasta: string | Date;
  tipo: string;
  hora_desde: string | null;
  hora_hasta: string | null;
}

// Incidencia vinculable (solo los tipos que importan al seguimiento).
export interface IncidenciaVinculoRow {
  id: string;
  usuario_id: string;
  fecha: string | Date;
  estado: string;
  tipo: string;
}

// Registro clasificado final (contrato exacto del frontend).
export interface RegistroSeguimiento {
  usuario_id: string;
  cedula: string | null;
  empleado: string;
  area: string;
  piso: number | null;
  fecha: string;
  situacion: string;
  tramo: 'full' | 'morning' | 'afternoon';
  entrada_manana: string | null;
  salida_manana: string | null;
  entrada_tarde: string | null;
  salida_tarde: string | null;
  esperado_entrada_manana: string | null;
  esperado_salida_manana: string | null;
  esperado_entrada_tarde: string | null;
  esperado_salida_tarde: string | null;
  tiene_incidencia: boolean;
  incidencia_estado: string | null;
  incidencia_id: string | null;
}

export interface KpisSeguimiento {
  total: number;
  absence: number;
  missing_morning: number;
  missing_afternoon: number;
  unregistered_exit: number;
  open_day: number;
}

export interface ResultadoSeguimiento {
  rows: RegistroSeguimiento[];
  total: number;
  page: number;
  pageSize: number;
  kpis: KpisSeguimiento;
}