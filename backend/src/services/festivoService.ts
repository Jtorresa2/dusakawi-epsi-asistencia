import pool from '../config/db';

type TipoFestivo = 'national' | 'regional' | 'institutional';

interface Festivo {
  id: string;  nombre: string;
  tipo: TipoFestivo;
  fecha: string;
  activo: boolean;
  creado_en: string;
}

interface GenerarNacionalesResult {
  insertados: number;
  existentes: number;
  total: number;
  year: number;
}

export async function obtenerTodos(activo: boolean | null = null): Promise<Festivo[]> {
  let sql =
    "SELECT id, name AS nombre, type AS tipo, date AS fecha, active AS activo, created_at AS creado_en FROM holidays WHERE 1=1";
  const params: unknown[] = [];
  if (activo !== null) { sql += ' AND active = $1'; params.push(activo); }
  sql += ' ORDER BY date DESC';
  const { rows } = await pool.query(sql, params);
  return rows;
}

export async function obtenerPorId(id: string): Promise<Festivo | null> {
  const { rows } = await pool.query(
    'SELECT id, name AS nombre, type AS tipo, date AS fecha, active AS activo, created_at AS creado_en FROM holidays WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

export async function crear({
  fecha,
  nombre,
  tipo,
}: {
  fecha: string;
  nombre: string;
  tipo?: string;
}): Promise<{ id: string; fecha: string; nombre: string; tipo: TipoFestivo }> {
  const tipoValido = (tipo ?? 'national') as TipoFestivo;
  if (!['national', 'regional', 'institutional'].includes(tipoValido)) {
    throw new Error('tipo debe ser: national, regional o institutional');
  }
  const {
    rows: [result],
  } = await pool.query(
    `INSERT INTO holidays (date, name, type) VALUES ($1, $2, $3) RETURNING id`,
    [fecha, nombre, tipoValido]
  );
  return { id: result?.id ?? '', fecha, nombre, tipo: tipoValido };
}

export async function actualizar(
  id: string,
  data: { fecha?: string; nombre?: string; tipo?: string; activo?: boolean }
): Promise<{ id: string }> {
  const { fecha, nombre, tipo, activo } = data;
  const campos: string[] = [];
  const params: unknown[] = [];
  if (fecha !== undefined) { campos.push('date = $1'); params.push(fecha); }
  if (nombre !== undefined) { campos.push(`name = $${params.length + 1}`); params.push(nombre); }
  if (tipo !== undefined) { campos.push(`type = $${params.length + 1}`); params.push(tipo); }
  if (activo !== undefined) { campos.push(`active = $${params.length + 1}`); params.push(activo); }
  if (campos.length === 0) return { id };
  params.push(id);
  await pool.query(`UPDATE holidays SET ${campos.join(', ')} WHERE id = $${params.length}`, params);
  return { id };
}

export async function eliminar(id: string): Promise<{ id: string }> {
  await pool.query('DELETE FROM holidays WHERE id = $1', [id]);
  return { id };
}

export async function verificarFestivo(
  fecha: string
): Promise<{ id: string; nombre: string; tipo: TipoFestivo } | null> {
  const { rows } = await pool.query(
    'SELECT id, name AS nombre, type AS tipo FROM holidays WHERE date = $1 AND active = TRUE',
    [fecha]
  );
  return rows[0] ?? null;
}

// ── Generación automática de festivos nacionales colombianos ──────────

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

function calcularFestivosNacionales(year: number): { fecha: string; nombre: string }[] {
  const f: { fecha: string; nombre: string }[] = [];
  const push = (fecha: Date, nombre: string) => f.push({ fecha: fmt(fecha), nombre });

  push(new Date(year, 0, 1), 'Año Nuevo');
  push(new Date(year, 4, 1), 'Día del Trabajo');
  push(new Date(year, 6, 20), 'Día de la Independencia');
  push(new Date(year, 7, 7), 'Batalla de Boyacá');
  push(new Date(year, 11, 8), 'Inmaculada Concepción');
  push(new Date(year, 11, 25), 'Navidad');

  const emiliani = [
    { m: 0, d: 6, n: 'Día de los Reyes Magos' },
    { m: 2, d: 19, n: 'Día de San José' },
    { m: 5, d: 29, n: 'San Pedro y San Pablo' },
    { m: 6, d: 9, n: 'Virgen de Chiquinquirá' },
    { m: 7, d: 15, n: 'Asunción de la Virgen' },
    { m: 9, d: 12, n: 'Día de la Raza' },
    { m: 10, d: 1, n: 'Todos los Santos' },
    { m: 10, d: 11, n: 'Independencia de Cartagena' },
  ];
  for (const e of emiliani) push(siguienteLunes(new Date(year, e.m, e.d)), e.n);

  const easter = getEaster(year);
  push(addDays(easter, -3), 'Jueves Santo');
  push(addDays(easter, -2), 'Viernes Santo');
  push(addDays(easter, 43), 'Ascensión del Señor');
  push(addDays(easter, 64), 'Corpus Christi');
  push(addDays(easter, 71), 'Sagrado Corazón de Jesús');

  return f;
}

export async function generarNacionales(year: number): Promise<GenerarNacionalesResult> {
  if (!year || year < 2000 || year > 2100) throw new Error('Año inválido');

  const lista = calcularFestivosNacionales(year);
  let insertados = 0;
  let existentes = 0;

  for (const festivo of lista) {
    const { rows } = await pool.query(
      "SELECT id FROM holidays WHERE date = $1 AND type = 'national'",
      [festivo.fecha]
    );
    if (rows.length === 0) {
      await pool.query(
        "INSERT INTO holidays (date, name, type) VALUES ($1, $2, 'national') RETURNING id",
        [festivo.fecha, festivo.nombre]
      );
      insertados++;
    } else {
      existentes++;
    }
  }

  return { insertados, existentes, total: lista.length, year };
}
