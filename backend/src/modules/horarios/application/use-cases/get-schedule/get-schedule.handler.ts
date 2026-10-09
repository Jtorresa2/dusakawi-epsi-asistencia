import type { ScheduleRepository } from '@modules/horarios/domain/repositories/schedule-repository';

export class GetScheduleHandler {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async handle(id: string) {
    const rows = await this.scheduleRepository.getRowsById(id);
    const row = rows[0];
    if (!row) return null;

    return {
      id: row.id,
      nombre: row.name,
      tolerancia_minutos: row.toleranceMinutes,
      tolerancia_salida_minutos: row.toleranceDepartureMinutes,
      description: row.description,
      descripcion: row.description,
      modality: row.modality,
      modalidad: row.modality,
      workday_type: row.workdayType,
      tipo_jornada: row.workdayType,
      expected_hours: row.expectedHours,
      horas_esperadas: row.expectedHours,
      active: row.active,
      activo: row.active,
      es_por_defecto: Boolean(row.isDefault),
      is_default: Boolean(row.isDefault),
      detalles: rows
        .filter((item) => item.dayOfWeek)
        .map((item) => ({
          id: item.detailId,
          dia_semana: item.dayOfWeek,
          hora_entrada_manana: item.morningEntry,
          hora_salida_manana: item.morningExit,
          hora_entrada_tarde: item.afternoonEntry,
          hora_salida_tarde: item.afternoonExit,
        })),
    };
  }
}
