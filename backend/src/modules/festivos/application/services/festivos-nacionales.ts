export interface FestivoNacional {
  fecha: string;
  nombre: string;
}

function getEaster(year: number): Date {
  const a = year % 19,
    b = Math.floor(year / 100),
    c = year % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7,
    m = Math.floor((a + 11 * h + 22 * l) / 451),
    month = Math.floor((h + l - 7 * m + 114) / 31),
    day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const r = new Date(date);
  r.setDate(r.getDate() + days);
  return r;
}

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function siguienteLunes(fecha: Date): Date {
  const dia = fecha.getDay();
  if (dia === 1) return fecha;
  return addDays(fecha, dia === 0 ? 1 : 8 - dia);
}

export function calcularFestivosNacionales(year: number): FestivoNacional[] {
  const f: FestivoNacional[] = [];
  const push = (fecha: Date, nombre: string) => f.push({ fecha: fmt(fecha), nombre });

  // Fijos (no se trasladan)
  push(new Date(year, 0, 1), 'Año Nuevo');
  push(new Date(year, 4, 1), 'Día del Trabajo');
  push(new Date(year, 6, 20), 'Día de la Independencia');
  push(new Date(year, 7, 7), 'Batalla de Boyacá');
  push(new Date(year, 11, 8), 'Inmaculada Concepción');
  push(new Date(year, 11, 25), 'Navidad');

  // Ley Emiliani (se trasladan al lunes siguiente)
  const emiliani = [
    { m: 0, d: 6, n: 'Día de los Reyes Magos' },
    { m: 2, d: 19, n: 'Día de San José' },
    { m: 5, d: 29, n: 'San Pedro y San Pablo' },
    { m: 7, d: 15, n: 'Asunción de la Virgen' },
    { m: 9, d: 12, n: 'Día de la Raza' },
    { m: 10, d: 1, n: 'Todos los Santos' },
    { m: 10, d: 11, n: 'Independencia de Cartagena' },
  ];
  for (const e of emiliani) push(siguienteLunes(new Date(year, e.m, e.d)), e.n);

  // Semana Santa (basado en Pascua)
  const easter = getEaster(year);
  push(addDays(easter, -3), 'Jueves Santo');
  push(addDays(easter, -2), 'Viernes Santo');
  push(easter, 'Domingo de Resurrección');

  // Religiosos móviles (siempre lunes por Ley Emiliani)
  push(addDays(easter, 43), 'Ascensión del Señor');
  push(addDays(easter, 64), 'Corpus Christi');
  push(addDays(easter, 71), 'Sagrado Corazón de Jesús');

  return f;
}