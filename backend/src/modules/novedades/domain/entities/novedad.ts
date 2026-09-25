export interface NovedadRow {
  id: string;
  empleado_id: string;
  fecha_desde: string;
  fecha_hasta: string;
  motivo: string;
  tipo_novedad: string;
  modalidad: string;
  // Clave duplicada para el frontend (lee row.tipo); misma técnica que festivos.
  tipo?: string;
  hora_desde: string | null;
  hora_hasta: string | null;
  estado: string;
  motivo_rechazo: string | null;
  creado_en: Date;
  empleado_nombre: string;
  empleado_apellido: string;
  registrado_por_nombre?: string | null;
}

export interface CrearNovedadData {
  // El frontend manda usuario_id; se acepta como alias de empleado_id.
  empleado_id?: string;
  usuario_id?: string;
  fecha_desde: string;
  fecha_hasta: string;
  motivo: string;
  tipo_novedad?: string;
  modalidad?: string;
  hora_desde?: string | null;
  hora_hasta?: string | null;
}

export type ActualizarNovedadData = CrearNovedadData;

export interface ResultadoCrearNovedad {
  id: string;
  dias_generados: number;
}