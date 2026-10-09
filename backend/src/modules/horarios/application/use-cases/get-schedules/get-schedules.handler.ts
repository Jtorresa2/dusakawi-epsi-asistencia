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
        tolerancia_salida_minutos: number;
        description: string | null;
        descripcion: string | null;
        modality: string;
        modalidad: string;
        workday_type: string;
        tipo_jornada: string;
        expected_hours: string | null;
        horas_esperadas: string | null;
        active: boolean;
        activo: boolean;
        es_por_defecto: boolean;
        is_default: boolean;
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
