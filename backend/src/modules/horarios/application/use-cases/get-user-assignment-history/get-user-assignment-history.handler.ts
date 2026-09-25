import { isValidId } from '@modules/horarios/application/services/id-validation';
import type { ScheduleRepository } from '@modules/horarios/domain/repositories/schedule-repository';

export class GetUserAssignmentHistoryHandler {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async handle(userId: string) {
    if (!isValidId(String(userId))) return { status: 'invalid-id' as const };

    const rows = await this.scheduleRepository.getUserAssignmentHistory(userId);
    return {
      status: 'found' as const,
      history: rows.map((row) => ({
        id: row.id,
        usuario_id: row.userId,
        horario_id: row.scheduleId,
        vigencia_desde: row.validFrom,
        vigencia_hasta: row.validUntil,
        motivo: row.reason,
        asignado_por: row.assignedBy,
        creado_en: row.createdAt,
        horario_nombre: row.scheduleName,
      })),
    };
  }
}
