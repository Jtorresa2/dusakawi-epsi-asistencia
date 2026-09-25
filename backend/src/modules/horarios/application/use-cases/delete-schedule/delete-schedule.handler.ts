import { isValidId } from '@modules/horarios/application/services/id-validation';
import type { ScheduleRepository } from '@modules/horarios/domain/repositories/schedule-repository';

export class DeleteScheduleHandler {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async handle(id: string): Promise<'invalid-id' | 'not-found' | 'assigned' | 'deleted'> {
    if (!isValidId(String(id))) return 'invalid-id';
    if (!(await this.scheduleRepository.scheduleExists(id))) return 'not-found';
    if ((await this.scheduleRepository.getAssignmentCount(id)) > 0) return 'assigned';

    await this.scheduleRepository.deleteById(id);
    return 'deleted';
  }
}
