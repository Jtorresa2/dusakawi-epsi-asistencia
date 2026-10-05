import { isValidUuid } from '@modules/horarios/application/services/id-validation';
import type { ScheduleRepository } from '@modules/horarios/domain/repositories/schedule-repository';

export class UnassignScheduleHandler {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async handle(userId?: string) {
    if (!userId) return { status: 'missing-user' as const };
    // schedule_assignments.user_id es uuid: ver isValidUuid.
    if (!isValidUuid(String(userId))) return { status: 'invalid-user-id' as const };
    if (!(await this.scheduleRepository.userExists(userId))) {
      return { status: 'user-not-found' as const };
    }

    await this.scheduleRepository.unassignUser(userId);
    return { status: 'unassigned' as const };
  }
}
