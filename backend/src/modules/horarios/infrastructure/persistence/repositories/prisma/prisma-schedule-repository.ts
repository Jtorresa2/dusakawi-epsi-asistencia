import { Prisma } from '@config/database/prisma/generated/client';
import { prisma } from '@config/database/prisma/prisma';
import type {
  AssignedUserRow,
  AssignmentHistoryRow,
  GlobalAssignmentHistoryRow,
  ScheduleAssignmentData,
  ScheduleAssignmentFilters,
  ScheduleData,
  ScheduleRow,
  ScheduleSqlValue,
  ScheduleUpdateData,
  ScheduleUserRow,
} from '@modules/horarios/domain/entities/schedule';
import type { ScheduleRepository } from '@modules/horarios/domain/repositories/schedule-repository';

export class PrismaScheduleRepository implements ScheduleRepository {
  async getAllRows(): Promise<ScheduleRow[]> {
    return prisma.$queryRaw<ScheduleRow[]>`
      SELECT
        h.id,
        h.name AS "name",
        h.tolerance_minutes AS "toleranceMinutes",
        h.tolerance_departure_minutes AS "toleranceDepartureMinutes",
        h.description AS "description",
        h.modality AS "modality",
        h.workday_type AS "workdayType",
        h.expected_hours::text AS "expectedHours",
        h.active AS "active",
        h.is_default AS "isDefault",
        h.created_at AS "createdAt",
        hd.id AS "detailId",
        hd.day_of_week AS "dayOfWeek",
        hd.morning_entry::text AS "morningEntry",
        hd.morning_exit::text AS "morningExit",
        hd.afternoon_entry::text AS "afternoonEntry",
        hd.afternoon_exit::text AS "afternoonExit"
      FROM asistencia.schedules h
      LEFT JOIN asistencia.schedule_details hd ON h.id = hd.schedule_id
      ORDER BY h.name,
        CASE hd.day_of_week
          WHEN 'Lunes' THEN 1
          WHEN 'Martes' THEN 2
          WHEN 'Miércoles' THEN 3
          WHEN 'Jueves' THEN 4
          WHEN 'Viernes' THEN 5
          WHEN 'Sábado' THEN 6
          WHEN 'Domingo' THEN 7
        END
    `;
  }

  async getRowsById(id: string): Promise<ScheduleRow[]> {
    return prisma.$queryRaw<ScheduleRow[]>`
      SELECT
        h.id,
        h.name AS "name",
        h.tolerance_minutes AS "toleranceMinutes",
        h.tolerance_departure_minutes AS "toleranceDepartureMinutes",
        h.description AS "description",
        h.modality AS "modality",
        h.workday_type AS "workdayType",
        h.expected_hours::text AS "expectedHours",
        h.active AS "active",
        h.is_default AS "isDefault",
        h.created_at AS "createdAt",
        hd.id AS "detailId",
        hd.day_of_week AS "dayOfWeek",
        hd.morning_entry::text AS "morningEntry",
        hd.morning_exit::text AS "morningExit",
        hd.afternoon_entry::text AS "afternoonEntry",
        hd.afternoon_exit::text AS "afternoonExit"
      FROM asistencia.schedules h
      LEFT JOIN asistencia.schedule_details hd ON h.id = hd.schedule_id
      WHERE h.id = ${id}
      ORDER BY CASE hd.day_of_week
        WHEN 'Lunes' THEN 1
        WHEN 'Martes' THEN 2
        WHEN 'Miércoles' THEN 3
        WHEN 'Jueves' THEN 4
        WHEN 'Viernes' THEN 5
        WHEN 'Sábado' THEN 6
        WHEN 'Domingo' THEN 7
      END
    `;
  }

  async create(data: ScheduleData): Promise<string> {
    const rows = await prisma.$transaction(async (tx) => {
      const created = await tx.$queryRaw<{ id: string }[]>`
        INSERT INTO asistencia.schedules
          (name, modality, workday_type, description, expected_hours,
           tolerance_minutes, tolerance_departure_minutes, active)
        VALUES
          (${data.name}, ${data.modality}, ${data.workdayType}, ${data.description},
           ${data.expectedHours}, ${data.toleranceMinutes}, ${data.toleranceDepartureMinutes},
           ${data.active})
        RETURNING id
      `;

      for (const detail of data.details) {
        await tx.$executeRaw`
          INSERT INTO asistencia.schedule_details
            (schedule_id, day_of_week, morning_entry, morning_exit, afternoon_entry, afternoon_exit)
          VALUES
            (${created[0].id}, ${detail.dayOfWeek}, ${detail.morningEntry}, ${detail.morningExit},
             ${detail.afternoonEntry}, ${detail.afternoonExit})
        `;
      }

      return created;
    });

    return rows[0]?.id ?? '';
  }

  async update(id: string, data: ScheduleUpdateData): Promise<void> {
    await prisma.$executeRaw`
      UPDATE asistencia.schedules
      SET
        name = ${data.name},
        tolerance_minutes = ${data.toleranceMinutes},
        description = COALESCE(${data.description}, description),
        modality = COALESCE(${data.modality}, modality),
        workday_type = COALESCE(${data.workdayType}, workday_type)
      WHERE id = ${id}
    `;

    if (data.details) {
      const details = data.details as Iterable<Record<string, ScheduleSqlValue>>;
      for (const detail of details) {
        await prisma.$executeRaw`
          UPDATE asistencia.schedule_details
          SET
            morning_entry = ${detail.hora_entrada_manana || null}::time,
            morning_exit = ${detail.hora_salida_manana || null}::time,
            afternoon_entry = ${detail.hora_entrada_tarde || null}::time,
            afternoon_exit = ${detail.hora_salida_tarde || null}::time
          WHERE schedule_id = ${id} AND day_of_week = ${detail.dia_semana}
        `;
      }
    }
  }

  async scheduleExists(id: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM asistencia.schedules WHERE id = ${id}
    `;
    return rows.length > 0;
  }

  async userExists(id: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM asistencia.users WHERE id = ${id}
    `;
    return rows.length > 0;
  }

  async getAssignmentCount(scheduleId: string): Promise<number> {
    const rows = await prisma.$queryRaw<{ total: string }[]>`
      SELECT COUNT(*)::text AS total
      FROM asistencia.schedule_assignments
      WHERE schedule_id = ${scheduleId}
    `;
    return Number(rows[0]?.total ?? 0);
  }

  async deleteById(id: string): Promise<void> {
    await prisma.$executeRaw`DELETE FROM asistencia.schedules WHERE id = ${id}`;
  }

  async assignUser(data: ScheduleAssignmentData): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE asistencia.schedule_assignments
        SET valid_until = ${data.validFrom}::date - 1
        WHERE user_id = ${data.userId} AND valid_until IS NULL
      `;
      await tx.$executeRaw`
        INSERT INTO asistencia.schedule_assignments
          (user_id, schedule_id, valid_from, valid_until, reason, assigned_by)
        VALUES
          (${data.userId}, ${data.scheduleId}, ${data.validFrom}::date, ${data.validUntil}::date,
           ${data.reason}, ${data.assignedBy})
      `;
    });
  }

  async getActiveUserIdsByIds(ids: string[]): Promise<string[]> {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM asistencia.users
      WHERE id = ANY(${ids}::uuid[]) AND active = TRUE
    `;
    return rows.map((row) => row.id);
  }

  async getActiveUserIdsByFilters(filters: ScheduleAssignmentFilters): Promise<string[]> {
    const areaFilter =
      filters.areaId != null ? Prisma.sql`AND u.area_id = ${filters.areaId}` : Prisma.empty;
    const positionFilter =
      filters.positionId != null
        ? Prisma.sql`AND u.position_id = ${filters.positionId}`
        : Prisma.empty;

    const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT u.id
      FROM asistencia.users u
      WHERE u.active = TRUE
      ${areaFilter}
      ${positionFilter}
    `);
    return rows.map((row) => row.id);
  }

  async assignUsers(userIds: string[], data: ScheduleAssignmentData): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const userId of userIds) {
        await tx.$executeRaw`
          UPDATE asistencia.schedule_assignments
          SET valid_until = ${data.validFrom}::date - 1
          WHERE user_id = ${userId} AND valid_until IS NULL
        `;
        await tx.$executeRaw`
          INSERT INTO asistencia.schedule_assignments
            (user_id, schedule_id, valid_from, valid_until, reason, assigned_by)
          VALUES
            (${userId}, ${data.scheduleId}, ${data.validFrom}::date, ${data.validUntil}::date,
             ${data.reason}, ${data.assignedBy})
        `;
      }
    });
  }

  async unassignUser(userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE asistencia.schedule_assignments
        SET valid_until = CURRENT_DATE
        WHERE user_id = ${userId} AND valid_until IS NULL
      `;
    });
  }

  async setDefault(scheduleId: string, isDefault: boolean): Promise<void> {
    await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.$executeRaw`
          UPDATE asistencia.schedules SET is_default = FALSE WHERE is_default = TRUE
        `;
        await tx.$executeRaw`
          UPDATE asistencia.schedules SET is_default = TRUE WHERE id = ${scheduleId}
        `;
      } else {
        await tx.$executeRaw`
          UPDATE asistencia.schedules SET is_default = FALSE WHERE id = ${scheduleId}
        `;
      }
    });
  }

  async getAssignedUsers(scheduleId: string): Promise<AssignedUserRow[]> {
    return prisma.$queryRaw<AssignedUserRow[]>`
      SELECT
        u.id,
        u.first_name AS "firstName",
        u.first_surname AS "lastName",
        u.email AS "email"
      FROM asistencia.users u
      JOIN asistencia.schedule_assignments a ON a.user_id = u.id
      WHERE a.schedule_id = ${scheduleId}
        AND a.valid_from <= CURRENT_DATE
        AND (a.valid_until IS NULL OR a.valid_until > CURRENT_DATE)
      ORDER BY u.first_name
    `;
  }

  async getScheduleUser(userId: string): Promise<ScheduleUserRow | null> {
    const rows = await prisma.$queryRaw<ScheduleUserRow[]>`
      SELECT
        u.id,
        u.schedule_id AS "scheduleId",
        u.first_name AS "firstName",
        u.first_surname AS "lastName"
      FROM asistencia.users u
      WHERE u.id = ${userId}
    `;
    return rows[0] ?? null;
  }

  async getMyScheduleRows(scheduleId: string): Promise<ScheduleRow[]> {
    return prisma.$queryRaw<ScheduleRow[]>`
      SELECT
        h.id,
        h.name AS "name",
        h.modality AS "modality",
        h.workday_type AS "workdayType",
        h.description AS "description",
        h.expected_hours::text AS "expectedHours",
        h.active AS "active",
        h.tolerance_minutes AS "toleranceMinutes",
        h.tolerance_departure_minutes AS "toleranceDepartureMinutes",
        h.is_default AS "isDefault",
        h.created_at AS "createdAt",
        hd.id AS "detailId",
        hd.day_of_week AS "dayOfWeek",
        hd.morning_entry::text AS "morningEntry",
        hd.morning_exit::text AS "morningExit",
        hd.afternoon_entry::text AS "afternoonEntry",
        hd.afternoon_exit::text AS "afternoonExit"
      FROM asistencia.schedules h
      LEFT JOIN asistencia.schedule_details hd ON h.id = hd.schedule_id
      WHERE h.id = ${scheduleId}
      ORDER BY CASE hd.day_of_week
        WHEN 'Lunes' THEN 1
        WHEN 'Martes' THEN 2
        WHEN 'Miércoles' THEN 3
        WHEN 'Jueves' THEN 4
        WHEN 'Viernes' THEN 5
        WHEN 'Sábado' THEN 6
        WHEN 'Domingo' THEN 7
      END
    `;
  }

  async getUserAssignmentHistory(userId: string): Promise<AssignmentHistoryRow[]> {
    return prisma.$queryRaw<AssignmentHistoryRow[]>`
      SELECT
        a.id,
        a.user_id AS "userId",
        a.schedule_id AS "scheduleId",
        a.valid_from AS "validFrom",
        a.valid_until AS "validUntil",
        a.reason AS "reason",
        a.assigned_by AS "assignedBy",
        a.created_at AS "createdAt",
        h.name AS "scheduleName"
      FROM asistencia.schedule_assignments a
      JOIN asistencia.schedules h ON h.id = a.schedule_id
      WHERE a.user_id = ${userId}
      ORDER BY a.valid_from DESC
    `;
  }

  async getGlobalAssignmentHistory(): Promise<GlobalAssignmentHistoryRow[]> {
    return prisma.$queryRaw<GlobalAssignmentHistoryRow[]>`
      WITH previous_assignments AS (
        SELECT
          a.*,
          LAG(a.schedule_id) OVER (
            PARTITION BY a.user_id ORDER BY a.valid_from, a.id
          ) AS previous_schedule_id
        FROM asistencia.schedule_assignments a
      )
      SELECT
        CONCAT(employee.first_name, ' ', employee.first_surname) AS "employee",
        current_schedule.name AS "newSchedule",
        previous_schedule.name AS "previousSchedule",
        current_assignment.valid_from AS "date",
        CONCAT(administrator.first_name, ' ', administrator.first_surname) AS "user",
        current_assignment.reason AS "reason"
      FROM previous_assignments current_assignment
      JOIN asistencia.users employee ON employee.id = current_assignment.user_id
      JOIN asistencia.schedules current_schedule ON current_schedule.id = current_assignment.schedule_id
      LEFT JOIN asistencia.schedules previous_schedule
        ON previous_schedule.id = current_assignment.previous_schedule_id
      LEFT JOIN asistencia.users administrator ON administrator.id = current_assignment.assigned_by
      ORDER BY current_assignment.valid_from DESC, current_assignment.id DESC
    `;
  }
}
