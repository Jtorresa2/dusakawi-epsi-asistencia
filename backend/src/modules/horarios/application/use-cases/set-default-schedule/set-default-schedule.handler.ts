import { isValidId } from '@modules/horarios/application/services/id-validation';
import type { ScheduleRepository } from '@modules/horarios/domain/repositories/schedule-repository';

export class SetDefaultScheduleHandler {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async handle(id: string, isDefault: boolean): Promise<'invalid-id' | 'not-found' | 'updated'> {
    if (!isValidId(String(id))) return 'invalid-id';
    if (!(await this.scheduleRepository.scheduleExists(id))) return 'not-found';

    await this.scheduleRepository.setDefault(id, isDefault);
    return 'updated';
  }
}
