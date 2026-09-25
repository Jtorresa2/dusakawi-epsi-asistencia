export interface DashboardIndicadoresEntity {
  puntualidad: number;
  presentes_hoy: number;
  ausentes_hoy: number;
  tardanzas_hoy: number;
  horas_extras_hoy: number;
  permisos_hoy: number;
}

export interface DashboardRegistroEntity {
  id: string;
  nombre: string;
  apellido: string;
  fecha: string;
  estado: string;
  fecha_hora_entrada: string | null;
  fecha_hora_salida_manana: string | null;
  fecha_hora_entrada_tarde: string | null;
  fecha_hora_salida: string | null;
  horas_trabajadas: number | null;
  minutos_tardanza: number | null;
}

export interface DashboardSemanalEntity {
  dia: string;
  presentes: number;
  ausentes: number;
}

export interface DashboardMensualEntity {
  mes: string;
  puntualidad: number;
  ausentismo: number;
}

export interface DashboardIndicadoresFullEntity {
  indicadores: DashboardIndicadoresEntity;
  registros: DashboardRegistroEntity[];
  semanal: DashboardSemanalEntity[];
  mensual: DashboardMensualEntity[];
}