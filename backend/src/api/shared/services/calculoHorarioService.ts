const ACENTOS: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u', ñ: 'n' };
const DIAS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function normalizarDia(dia: unknown): string {
  if (dia == null) return '';
  return String(dia)
    .toLowerCase()
    .replace(/[áéíóúüñ]/g, (c) => ACENTOS[c] ?? c)
    .replace(/[^a-z]/g, '')
    .replace(/^./, (c) => c.toUpperCase());
}

export function detalleParaDia<T extends { dia_semana?: unknown }>(
  detalles: T[],
  diaSemana: unknown
): T | null {
  if (!Array.isArray(detalles) || detalles.length === 0) return null;
  const objetivo = normalizarDia(diaSemana);
  return detalles.find((d) => normalizarDia(d.dia_semana) === objetivo) ?? null;
}

export function minDesde(h: unknown): number {
  if (!h) return 0;
  const partes = String(h).split(':');
  if (partes.length < 2) return 0;
  const hora = parseInt(partes[0], 10);
  const min = parseInt(partes[1], 10);
  if (Number.isNaN(hora) || Number.isNaN(min)) return 0;
  return hora * 60 + min;
}

interface CalcTardanzaParams {
  detalle: Record<string, unknown> | null;
  entrada1?: unknown;
  salida1?: unknown;
  entrada2?: unknown;
  salida2?: unknown;
  tolerancia_minutos?: unknown;
  tolerancia_salida_minutos?: unknown;
}

export function calcularTardanza({
  detalle,
  entrada1,
  salida1,
  entrada2,
  salida2,
  tolerancia_minutos,
  tolerancia_salida_minutos,
}: CalcTardanzaParams): { minutos_tardanza: number; salida_temprana_minutos: number } {
  if (!detalle) return { minutos_tardanza: 0, salida_temprana_minutos: 0 };
  const tol = Number(tolerancia_minutos) || 0;
  const tolSalida = Number(tolerancia_salida_minutos) || 0;

  let minutosTardanza = 0;

  const e1 = minDesde(entrada1);
  const e1Prog = minDesde(detalle.hora_entrada_manana);
  if (e1 > 0 && e1Prog > 0 && e1 > e1Prog + tol) {
    minutosTardanza += e1 - (e1Prog + tol);
  }

  const e2 = minDesde(entrada2);
  const e2Prog = minDesde(detalle.hora_entrada_tarde);
  if (e2 > 0 && e2Prog > 0 && e2 > e2Prog + tol) {
    minutosTardanza += e2 - (e2Prog + tol);
  }

  let salidaTemprana = 0;
  const s1 = minDesde(salida1);
  const s1Prog = minDesde(detalle.hora_salida_manana);
  if (s1 > 0 && s1Prog > 0 && s1 < s1Prog - tolSalida) {
    salidaTemprana = s1Prog - tolSalida - s1;
  }

  return { minutos_tardanza: minutosTardanza, salida_temprana_minutos: salidaTemprana };
}

interface EvaluarHorarioParams {
  horario: Record<string, unknown> | null;
  detalle: Record<string, unknown> | null;
  marcaciones?: {
    entrada1?: unknown;
    salida1?: unknown;
    entrada2?: unknown;
    salida2?: unknown;
  };
}

export function evaluarHorario({ horario, detalle, marcaciones = {} }: EvaluarHorarioParams): {
  flexible: boolean;
  por_horas: boolean;
  minutos_tardanza: number;
  salida_temprana_minutos: number;
} {
  if (!horario) {
    return { flexible: false, por_horas: false, minutos_tardanza: 0, salida_temprana_minutos: 0 };
  }
  const modalidad = horario.modalidad;
  if (modalidad === 'flexible') {
    return { flexible: true, por_horas: false, minutos_tardanza: 0, salida_temprana_minutos: 0 };
  }
  if (modalidad === 'by_hours' || horario?.tipo_jornada === 'by_hours') {
    return { flexible: false, por_horas: true, minutos_tardanza: 0, salida_temprana_minutos: 0 };
  }
  const resultado = calcularTardanza({
    detalle,
    entrada1: marcaciones.entrada1,
    salida1: marcaciones.salida1,
    entrada2: marcaciones.entrada2,
    salida2: marcaciones.salida2,
    tolerancia_minutos: horario?.tolerancia_minutos,
    tolerancia_salida_minutos: horario?.tolerancia_salida_minutos,
  });
  return { ...resultado, flexible: false, por_horas: false };
}

export function diaSemanaDeFecha(fecha: unknown): string | null {
  if (!fecha) return null;
  const d = fecha instanceof Date ? fecha : new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return DIAS_ES[d.getDay()] ?? null;
}
