import type {
  ActualizarRegistroData,
  ActualizarRegistroManualData,
  DatosMarcar,
  FilaMarcar,
  FiltrosRegistros,
  InsertarMarcacionData,
  InsertarRegistroManualData,
  RegistroMiAsistenciaRow,
  RegistroRow,
} from '../entities/asistencia';

export interface AsistenciaRepository {
  /** GET /: SELECT con joins + filtros dinámicos + excluirRolesPorUserId. */
  obtenerRegistros(filtros: FiltrosRegistros): Promise<RegistroRow[]>;

  /** GET /manual: SELECT id existente por (user_id, date). */
  obtenerIdPorUsuarioFecha(empleadoId: string, fecha: string): Promise<string | null>;

  /** POST /manual: INSERT ... RETURNING id (fix: fecha+hora → timestamptz). */
  insertarRegistroManual(data: InsertarRegistroManualData): Promise<string>;

  /** POST /manual: UPDATE existente (fix: fecha de la fila + hora → timestamptz). */
  actualizarRegistroManual(id: string, data: ActualizarRegistroManualData): Promise<void>;

  /** POST /marcar: SELECT * existente ORDER BY created_at DESC LIMIT 1. */
  obtenerExistenteParaMarcar(empleadoId: string, localDate: string): Promise<FilaMarcar | null>;

  /** POST /marcar: INSERT con columna dinámica (tipo_casilla). Fix: fecha+hora → timestamptz. */
  insertarMarcacion(data: InsertarMarcacionData): Promise<string>;

  /** POST /marcar: UPDATE SET <tipo_casilla> = (date + hora) → timestamptz. */
  actualizarCasillaMarcacion(id: string, tipoCasilla: string, hora: string): Promise<void>;

  /** POST /marcar: SELECT * por id (flujo interno de métricas). */
  obtenerPorId(id: string): Promise<FilaMarcar | null>;

  /** POST /marcar: UPDATE worked_hours/late_minutes tras calcular métricas. */
  actualizarMetricas(id: string, horasTrabajadas: number, minutosTardanza: number): Promise<void>;

  /** GET /mi-asistencia: SELECT de los 10 campos del contrato. */
  obtenerMiAsistencia(empleadoId: string, mes: number, anio: number): Promise<RegistroMiAsistenciaRow[]>;

  /** PUT /:id/justificar: UPDATE status='justified', observation. */
  justificarAusencia(id: string, textoJustificacion: string): Promise<void>;

  /** DELETE /:id: DELETE por id. */
  eliminar(id: string): Promise<void>;

  /** PUT /:id: UPDATE con fecha de la fila + hora → timestamptz (fix) y fecha opcional. */
  actualizarRegistro(id: string, data: ActualizarRegistroData): Promise<void>;
}
