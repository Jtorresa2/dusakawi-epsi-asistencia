import type { DashboardIndicadoresFullEntity } from '@modules/dashboard/domain/entities/dashboard-indicadores';
import type { GetIndicadoresResponseDto } from '../common/dtos/dashboard-indicadores-response.dto';
import type { DashboardResumenAreaEntity } from '@modules/dashboard/domain/entities/dashboard-resumen-area';
import type { GetResumenPorAreaResponseDto } from '../common/dtos/dashboard-resumen-area-response.dto';

export class DashboardMapper {
  static toIndicadoresResponseDto(entity: DashboardIndicadoresFullEntity): GetIndicadoresResponseDto {
    return {
      indicadores: entity.indicadores,
      registros: entity.registros,
      semanal: entity.semanal,
      mensual: entity.mensual,
    };
  }

  static toResumenPorAreaResponseDto(entity: DashboardResumenAreaEntity): GetResumenPorAreaResponseDto {
    return {
      id: entity.id,
      area: entity.area,
      presentes: entity.presentes,
      ausentes: entity.ausentes,
      tardanzas: entity.tardanzas,
      total: entity.total,
      porcentaje_asistencia: entity.porcentaje_asistencia,
    };
  }
}