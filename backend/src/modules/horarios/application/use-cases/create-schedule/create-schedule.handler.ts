import type { ScheduleSqlValue } from '@modules/horarios/domain/entities/schedule';
import type { ScheduleRepository } from '@modules/horarios/domain/repositories/schedule-repository';

export interface CreateScheduleCommand {
  name?: ScheduleSqlValue;
  modality?: ScheduleSqlValue;
  workdayType?: ScheduleSqlValue;
  description?: ScheduleSqlValue;
  expectedHours?: ScheduleSqlValue;
  toleranceMinutes?: ScheduleSqlValue;
  toleranceDepartureMinutes?: ScheduleSqlValue;
  active?: ScheduleSqlValue;
  details?: unknown;
}

export class CreateScheduleHandler {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async handle(command: CreateScheduleCommand) {
    if (!command.name) return { status: 'missing-name' as const };

    const details = Array.isArray(command.details)
      ? command.details.map((detail) => {
          const item = detail as Record<string, ScheduleSqlValue>;
          return {
            dayOfWeek: item.dia_semana ?? null,
            morningEntry: item.hora_entrada_manana ?? null,
            morningExit: item.hora_salida_manana ?? null,
            afternoonEntry: item.hora_entrada_tarde ?? null,
            afternoonExit: item.hora_salida_tarde ?? null,
          };
        })
      : [];

    const id = await this.scheduleRepository.create({
      name: command.name,
      modality: command.modality === undefined ? 'strict' : command.modality,
      workdayType: command.workdayType === undefined ? 'fixed' : command.workdayType,
      description: command.description ?? null,
      expectedHours: command.expectedHours ?? null,
      toleranceMinutes: command.toleranceMinutes === undefined ? 0 : command.toleranceMinutes,
      toleranceDepartureMinutes:
        command.toleranceDepartureMinutes === undefined ? 0 : command.toleranceDepartureMinutes,
      active: command.active === undefined ? true : command.active,
      details,
    });

    return { status: 'created' as const, id };
  }
}
