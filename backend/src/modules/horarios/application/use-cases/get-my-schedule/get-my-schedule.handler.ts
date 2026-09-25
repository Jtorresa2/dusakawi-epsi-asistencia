import type { ScheduleRepository } from '@modules/horarios/domain/repositories/schedule-repository';

export class GetMyScheduleHandler {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async handle(userId?: string) {
    if (!userId) return { status: 'user-not-found' as const };

    const user = await this.scheduleRepository.getScheduleUser(userId);
    if (!user) return { status: 'user-not-found' as const };
    if (!user.scheduleId) return { status: 'unassigned' as const };

    const rows = await this.scheduleRepository.getMyScheduleRows(user.scheduleId);
    const row = rows[0];
    if (!row) return { status: 'schedule-not-found' as const };

    return {
      status: 'assigned' as const,
      schedule: {
        id: row.id,
        nombre: row.name,
        modalidad: row.modality,
        tipo_jornada: row.workdayType,
        descripcion: row.description,
        horas_esperadas: row.expectedHours,
        activo: row.active,
        tolerancia_minutos: row.toleranceMinutes,
        tolerancia_salida_minutos: row.toleranceDepartureMinutes,
        es_por_defecto: row.isDefault,
        creado_en: row.createdAt,
        detalles: rows
          .filter((item) => item.dayOfWeek)
          .map((item) => ({
            dia_semana: item.dayOfWeek,
            hora_entrada_manana: item.morningEntry,
            hora_salida_manana: item.morningExit,
            hora_entrada_tarde: item.afternoonEntry,
            hora_salida_tarde: item.afternoonExit,
          })),
      },
    };
  }
}
