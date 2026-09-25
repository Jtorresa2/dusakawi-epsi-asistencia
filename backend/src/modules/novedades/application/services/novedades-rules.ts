import type { CrearNovedadData } from '@modules/novedades/domain/entities/novedad';

// Dominio canónico en INGLÉS: coincide con el CHECK alert/news_news_type_check de
// la BD (permission, vacation, sick_leave, commission, license, suspension) y con
// el contrato real del frontend (envía esos valores). La entrada en español se
// normaliza a inglés (tolerancia con clientes legacy) pero SIEMPRE se persiste
// en inglés, igual que hace mapModalidad con las modalidades.
export const TIPOS_VALIDOS = ['permission', 'vacation', 'sick_leave', 'commission', 'license', 'suspension'];
export const MODALIDADES_VALIDAS = ['full_day', 'hours', 'morning', 'afternoon'];

const MAPA_TIPOS_ES: Record<string, string> = {
  permiso: 'permission',
  vacaciones: 'vacation',
  incapacidad: 'sick_leave',
  comision: 'commission',
  licencia: 'license',
  suspension: 'suspension',
};

const MAPA_ESPAÑOL_INGLES: Record<string, string> = {
  dia_completo: 'full_day',
  horas: 'hours',
  manana: 'morning',
  tarde: 'afternoon',
};

const MAPA_INGLES_ESPAÑOL: Record<string, string> = {
  full_day: 'dia_completo',
  hours: 'horas',
  morning: 'manana',
  afternoon: 'tarde',
};

// Normaliza tipo_novedad (español legacy o inglés canónico) al valor inglés.
export function normalizarTipo(tipo?: string): string {
  return (tipo ? MAPA_TIPOS_ES[tipo] : undefined) || tipo || 'permission';
}

// Réplica 1:1 del legacy: normaliza modalidad en español a su valor de BD.
export function mapModalidad(modalidad?: string): string {
  return (modalidad ? MAPA_ESPAÑOL_INGLES[modalidad] : undefined) || modalidad || 'full_day';
}

// Réplica 1:1 del legacy: desnormaliza modalidad de BD a su forma de presentación.
export function unmapModalidad(modalidad?: string): string {
  return (modalidad ? MAPA_INGLES_ESPAÑOL[modalidad] : undefined) || modalidad || 'dia_completo';
}

// Réplica 1:1 de las validaciones del legacy, incluyendo la diferencia
// crear/actualizar en el caso de modalidad "hours" (el update no exige horas).
// Cambio intencional post-migración: acepta empleado_id o usuario_id (el frontend
// manda usuario_id) y normaliza tipo_novedad al dominio inglés.
export function validarNovedad(data: CrearNovedadData, modoActualizar: boolean): { empleadoId: string; tipoNovedad: string; modalidadVal: string } {
  const { fecha_desde, fecha_hasta, motivo, tipo_novedad, modalidad, hora_desde, hora_hasta } = data;
  const empleadoId = data.empleado_id || data.usuario_id || '';
  const novedadVal = normalizarTipo(tipo_novedad);
  const modalidadVal = mapModalidad(modalidad);

  if (!empleadoId || !fecha_desde || !fecha_hasta || !motivo) {
    throw new Error('empleado_id, fecha_desde, fecha_hasta y motivo son requeridos');
  }
  if (!TIPOS_VALIDOS.includes(novedadVal)) {
    throw new Error('tipo_novedad inválido');
  }
  if (!MODALIDADES_VALIDAS.includes(modalidadVal)) {
    throw new Error('modalidad inválida');
  }

  if (modalidadVal === 'hours') {
    if (!modoActualizar) {
      if (!hora_desde || !hora_hasta) {
        throw new Error('Para novedades por horas, hora_desde y hora_hasta son requeridos');
      }
      if (hora_desde >= hora_hasta) {
        throw new Error('La hora_hasta debe ser posterior a hora_desde');
      }
      return { empleadoId, tipoNovedad: novedadVal, modalidadVal };
    }
    if (hora_desde && hora_hasta && hora_desde >= hora_hasta) {
      throw new Error('La hora_hasta debe ser posterior a hora_desde');
    }
  }

  return { empleadoId, tipoNovedad: novedadVal, modalidadVal };
}

// Réplica 1:1 del bucle del legacy (incluye el comportamiento de zonas horarias
// de `new Date('YYYY-MM-DD')` + `getDay()` en la máquina local; no cambiar).
export function calcularDiasHabiles(fechaDesde: string, fechaHasta: string): string[] {
  const inicio = new Date(fechaDesde);
  const fin = new Date(fechaHasta);
  const dias: string[] = [];

  for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
    const diaSemana = d.getDay();
    if (diaSemana === 0 || diaSemana === 6) continue;
    dias.push(d.toISOString().split('T')[0]);
  }

  return dias;
}