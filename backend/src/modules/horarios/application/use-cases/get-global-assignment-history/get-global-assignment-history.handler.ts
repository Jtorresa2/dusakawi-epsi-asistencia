import type { ScheduleRepository } from '@modules/horarios/domain/repositories/schedule-repository';

export class GetGlobalAssignmentHistoryHandler {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async handle() {
    const rows = await this.scheduleRepository.getGlobalAssignmentHistory();
    return rows.map((row) => ({
      empleado: row.employee,
      horario_nuevo: row.newSchedule,
      horario_anterior: row.previousSchedule,
      fecha: row.date,
      usuario: row.user,
      motivo: row.reason,
    }));
  }
}
