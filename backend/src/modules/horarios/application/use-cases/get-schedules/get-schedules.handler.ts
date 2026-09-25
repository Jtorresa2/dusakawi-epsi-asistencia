import type { ScheduleRepository } from '@modules/horarios/domain/repositories/schedule-repository';

export class GetSchedulesHandler {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async handle() {
    const rows = await this.scheduleRepository.getAllRows();
    const grouped: Record<
      string,
      {
        id: string;
        nombre: string;
        tolerancia_minutos: number;
        description: string | null;
        modality: string;
        workday_type: string;
        expected_hours: string | null;
        active: boolean;
        creado_en: Date;
        detalles: Array<{
          id: string;
          dia_semana: string;
          hora_entrada_manana: string | null;
          hora_salida_manana: string | null;
          hora_entrada_tarde: string | null;
          hora_salida_tarde: string | null;
        }>;
      }
    > = {};

    for (const row of rows) {
      if (!grouped[row.id]) {
        grouped[row.id] = {
          id: row.id,
          nombre: row.name,
          tolerancia_minutos: row.toleranceMinutes,
          description: row.description,
          modality: row.modality,
          workday_type: row.workdayType,
          expected_hours: row.expectedHours,
          active: row.active,
          creado_en: row.createdAt,
          detalles: [],
        };
      }

      if (row.dayOfWeek && row.detailId) {
        grouped[row.id].detalles.push({
          id: row.detailId,
          dia_semana: row.dayOfWeek,
          hora_entrada_manana: row.morningEntry,
          hora_salida_manana: row.morningExit,
          hora_entrada_tarde: row.afternoonEntry,
          hora_salida_tarde: row.afternoonExit,
        });
      }
    }

    return Object.values(grouped);
  }
}
