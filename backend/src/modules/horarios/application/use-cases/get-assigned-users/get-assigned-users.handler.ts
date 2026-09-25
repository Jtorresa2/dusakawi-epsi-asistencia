import { isValidId } from '@modules/horarios/application/services/id-validation';
import type { ScheduleRepository } from '@modules/horarios/domain/repositories/schedule-repository';

export class GetAssignedUsersHandler {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async handle(id: string) {
    if (!isValidId(String(id))) return { status: 'invalid-id' as const };
    if (!(await this.scheduleRepository.scheduleExists(id))) {
      return { status: 'schedule-not-found' as const };
    }

    const rows = await this.scheduleRepository.getAssignedUsers(id);
    return {
      status: 'found' as const,
      users: rows.map((row) => ({
        id: row.id,
        nombres: row.firstName,
        apellidos: row.lastName,
        correo: row.email,
      })),
    };
  }
}
