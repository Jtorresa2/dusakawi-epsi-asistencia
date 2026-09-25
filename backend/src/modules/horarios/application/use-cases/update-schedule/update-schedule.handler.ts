import type { ScheduleSqlValue } from '@modules/horarios/domain/entities/schedule';
import type { ScheduleRepository } from '@modules/horarios/domain/repositories/schedule-repository';

export interface UpdateScheduleCommand {
  name?: ScheduleSqlValue;
  toleranceMinutes?: ScheduleSqlValue;
  details?: unknown;
  description?: ScheduleSqlValue;
  modality?: ScheduleSqlValue;
  workdayType?: ScheduleSqlValue;
}

export class UpdateScheduleHandler {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async handle(id: string, command: UpdateScheduleCommand): Promise<'updated'> {
    await this.scheduleRepository.update(id, {
      name: command.name ?? null,
      toleranceMinutes: command.toleranceMinutes ?? 0,
      description: command.description ?? null,
      modality: command.modality ?? null,
      workdayType: command.workdayType ?? null,
      details: command.details,
    });
    return 'updated';
  }
}
