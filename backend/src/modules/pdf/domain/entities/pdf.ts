export interface PdfMeta {
  codigo: string;
  version: string;
  emision: string;
  vigencia: string;
}

export interface AsistenciaRow {
  id: string;
  cedula: string;
  colaborador: string;
  area: string;
  piso: string;
  fecha: string;
  entrada1: string | null;
  salida1: string | null;
  entrada2: string | null;
  salida2: string | null;
  horas_trabajadas: string | number;
  horas_extra: string | number;
  minutos_tardanza: number;
  tipo_marcacion: string;
  estado: string;
  observacion: string | null;
  empleado: string;
}

export interface DashboardIndicadores {
  presentes_hoy: number;
  ausentes_hoy: number;
  tardanzas_hoy: number;
  puntualidad: number;
  horas_extras_hoy: number;
}

export interface DashboardAsistenciaHoy {
  empleado: string;
  entrada: string | null;
  salida: string | null;
  estado: string;
}

export interface TardanzaRow {
  cedula: string;
  colaborador: string;
  area: string;
  fecha: string;
  entrada: string | null;
  minutos_tardanza: number;
  observacion: string | null;
}

export interface AusenciaRow {
  cedula: string;
  colaborador: string;
  area: string;
  fecha: string;
  estado: string;
  observacion: string | null;
}

export interface EmpleadoRow {
  cedula: string;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  area: string;
  cargo: string;
  activo: number;
}

export interface MarcacionRow {
  cedula: string;
  colaborador: string;
  area: string;
  fecha: string;
  entrada: string | null;
  salida: string | null;
  tipo_marcacion: string;
  estado: string;
}

export interface PorAreasRow {
  id: string;
  empleado: string;
  cedula: string;
  area: string;
  dias_laborados: number;
  puntuales: number;
  tardanzas: number;
  ausencias: number;
  horas_trabajadas: number;
}

export interface PorEmpleadoData {
  empleado: {
    id: string;
    cedula: string;
    nombre: string;
    apellido: string;
    area: string;
    cargo: string;
    fecha_ingreso: string;
  };
  resumen: {
    total_registros: number;
    puntuales: number;
    tardanzas: number;
    ausentes: number;
    justificados: number;
    horas_trabajadas: number;
    total_minutos_tardanza: number;
  };
  permisos: {
    total: number;
    dias_permiso: number;
  };
  detalle: Array<{
    fecha: string | Date;
    estado: string;
    entrada1: string | null;
    salida1: string | null;
    entrada2: string | null;
    salida2: string | null;
    horas_trabajadas: number | null;
    minutos_tardanza: number | null;
    observacion: string | null;
    esFestivo: boolean;
    festivo: string | null;
  }>;
  festivos: Array<{ fecha: string; nombre: string }>;
  diasHabiles: number;
  totalFestivos: number;
  diasEsperados: number;
}

export interface SeguimientoFiltros {
  fecha_desde: string;
  fecha_hasta: string;
  area?: string;
  piso?: number | string;
  busqueda?: string;
  situacion?: string;
  page: number;
  pageSize: number;
}

export interface SeguimientoRow {
  usuario_id: string;
  cedula: string;
  empleado: string;
  area: string;
  piso: number | null;
  fecha: string;
  situacion: string;
  tramo: string;
  entrada_manana: string | null;
  salida_manana: string | null;
  entrada_tarde: string | null;
  salida_tarde: string | null;
  esperado_entrada_manana: string | null;
  esperado_salida_manana: string | null;
  esperado_entrada_tarde: string | null;
  esperado_salida_tarde: string | null;
}

export interface SeguimientoResult {
  rows: SeguimientoRow[];
  total: number;
  page: number;
  pageSize: number;
  kpis: {
    total: number;
    absence: number;
    missing_morning: number;
    missing_afternoon: number;
    unregistered_exit: number;
    open_day: number;
  };
}

export type SituacionType =
  | 'absence'
  | 'missing_morning'
  | 'missing_afternoon'
  | 'unregistered_exit'
  | 'open_day';