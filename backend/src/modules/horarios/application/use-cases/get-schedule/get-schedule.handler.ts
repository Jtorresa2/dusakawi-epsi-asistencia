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
      description: row.description,
      modality: row.modality,
      workday_type: row.workdayType,
      expected_hours: row.expectedHours,
      active: row.active,
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
