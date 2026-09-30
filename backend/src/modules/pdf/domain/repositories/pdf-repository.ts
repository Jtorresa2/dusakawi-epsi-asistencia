import type {
  IncidenciaPlantillaData,
  AsistenciaRow,
  IncidenciaRow,
  DashboardIndicadores,
  DashboardAsistenciaHoy,
  TardanzaRow,
  AusenciaRow,
  EmpleadoRow,
  MarcacionRow,
  PorAreasRow,
  PorEmpleadoData,
  SeguimientoFiltros,
  SeguimientoResult,
} from '@modules/pdf/domain/entities/pdf';

export interface PdfRepository {
  getIncidenciaPlantilla(id: string): Promise<IncidenciaPlantillaData | null>;
  getAsistencia(filters: {
    fecha?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    area?: string;
    piso?: string;
    estado?: string;
    empleado_id?: string;
    area_id?: string;
  }): Promise<AsistenciaRow[]>;
  getIncidencias(filters: {
    estado?: string;
    tipo?: string;
  }): Promise<IncidenciaRow[]>;
  getDashboardIndicadores(): Promise<DashboardIndicadores>;
  getDashboardAsistenciaHoy(): Promise<DashboardAsistenciaHoy[]>;
  getTardanzas(filters: {
    fecha_desde?: string;
    fecha_hasta?: string;
    area_id?: string;
    empleado_id?: string;
  }): Promise<TardanzaRow[]>;
  getAusencias(filters: {
    fecha_desde?: string;
    fecha_hasta?: string;
    area_id?: string;
    empleado_id?: string;
  }): Promise<AusenciaRow[]>;
  getEmpleados(filters: {
    area_id?: string;
    cargo_id?: string;
  }): Promise<EmpleadoRow[]>;
  getMarcaciones(filters: {
    fecha_desde?: string;
    fecha_hasta?: string;
    empleado_id?: string;
    area_id?: string;
  }): Promise<MarcacionRow[]>;
  getPorAreas(filters: {
    area_id?: string;
    empleado_id?: string;
    usuario_id?: string;
    mes?: string;
    anio?: string;
    estado?: string;
  }): Promise<PorAreasRow[]>;
  getPorEmpleado(filters: {
    empleado_id?: string;
    usuario_id?: string;
    mes?: string;
    anio?: string;
  }): Promise<PorEmpleadoData | null>;
  getSeguimiento(filtros: SeguimientoFiltros): Promise<SeguimientoResult>;
}