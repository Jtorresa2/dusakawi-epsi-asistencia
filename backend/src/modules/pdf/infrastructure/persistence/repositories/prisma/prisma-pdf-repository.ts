import { Prisma } from '@config/database/prisma/generated/client';
import { prisma } from '@config/database/prisma/prisma';
import { createRequire } from 'node:module';
import type {
  AsistenciaRow,
  DashboardIndicadores,
  DashboardAsistenciaHoy,
  TardanzaRow,
  AusenciaRow,
  EmpleadoRow,
  MarcacionRow,
  PorAreasRow,
  PorEmpleadoData,
  SeguimientoFiltros,
  SeguimientoResult,
} from '@modules/pdf/domain/entities/pdf';
import type { PdfRepository } from '@modules/pdf/domain/repositories/pdf-repository';

const require = createRequire(import.meta.url);
const { excluirRolesPorNombre, excluirRolesPorUserId, joinRoles } = require(
  '../../../../../../services/rolesFiltro.js',
);

const qualifyRoleSql = (sql: string) =>
  sql
    .replace(/\buser_roles\b/g, 'asistencia.user_roles')
    .replace(/\broles\b/g, 'asistencia.roles');

const roleFilterByUserId = (column: string): Prisma.Sql =>
  Prisma.raw(qualifyRoleSql(excluirRolesPorUserId(column)));

const roleFilterByName = (alias: string): Prisma.Sql =>
  Prisma.raw(qualifyRoleSql(excluirRolesPorNombre(alias)));

const roleJoin = (expression: string): Prisma.Sql =>
  Prisma.raw(qualifyRoleSql(joinRoles(expression)));

function minDesde(h: string | null | undefined): number {
  if (!h) return 0;
  const [hora, min] = h.split(':').map(Number);
  return hora * 60 + min;
}

function calcTardanza(e1: string | null | undefined, e2: string | null | undefined): number {
  let t = 0;
  if (e1) { const m = minDesde(e1); if (m > 425) t += m - 425; }
  if (e2) { const m = minDesde(e2); if (m > 845) t += m - 845; }
  return t;
}

function determinarEstado(e1: string | null | undefined, e2: string | null | undefined, justificado: boolean): string {
  if (justificado) return 'justificado';
  if (!e1 && !e2) return 'ausente';
  return calcTardanza(e1, e2) > 0 ? 'tardanza' : 'puntual';
}

export class PrismaPdfRepository implements PdfRepository {
  async getAsistencia(filters: {
    fecha?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    area?: string;
    piso?: string;
    estado?: string;
    empleado_id?: string;
    area_id?: string;
  }): Promise<AsistenciaRow[]> {
    const conditions: Prisma.Sql[] = [];
    if (filters.fecha) {
      conditions.push(Prisma.sql`AND a.date = ${filters.fecha}::date`);
    } else if (filters.fecha_desde && filters.fecha_hasta) {
      conditions.push(Prisma.sql`AND a.date >= ${filters.fecha_desde}::date AND a.date <= ${filters.fecha_hasta}::date`);
    } else if (filters.fecha_desde) {
      conditions.push(Prisma.sql`AND a.date >= ${filters.fecha_desde}::date`);
    } else if (filters.fecha_hasta) {
      conditions.push(Prisma.sql`AND a.date <= ${filters.fecha_hasta}::date`);
    }
    if (filters.area_id) {
      conditions.push(Prisma.sql`AND e.area_id = ${filters.area_id}`);
    } else if (filters.area) {
      conditions.push(Prisma.sql`AND ar.name LIKE ${`%${filters.area}%`}`);
    }
    if (filters.piso) {
      conditions.push(Prisma.sql`AND fl.name ILIKE ${`%${filters.piso}%`}`);
    }
    if (filters.estado) {
      conditions.push(Prisma.sql`AND a.status = ${filters.estado}`);
    }
    if (filters.empleado_id) {
      conditions.push(Prisma.sql`AND a.user_id = ${filters.empleado_id}`);
    }

    const rows = await prisma.$queryRaw<AsistenciaRow[]>(Prisma.sql`
      SELECT a.id, COALESCE(dd.document_number, '') AS cedula,
        CONCAT(e.first_name, ' ', e.first_surname) AS colaborador,
        ar.name AS area, fl.name AS piso, DATE(a.date) AS fecha,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        a.worked_hours AS horas_trabajadas, a.extra_hours AS horas_extra,
        a.late_minutes AS minutos_tardanza, a.mark_type AS tipo_marcacion,
        a.status AS estado, a.observation AS observacion
      FROM asistencia.attendances a
      JOIN asistencia.users e ON a.user_id = e.id
      LEFT JOIN asistencia.document_details dd ON dd.user_id = e.id
      LEFT JOIN asistencia.areas ar ON e.area_id = ar.id
      LEFT JOIN asistencia.floors fl ON ar.floor_id = fl.id
      WHERE 1=1${roleFilterByUserId('a.user_id')}
      ${conditions.length > 0 ? Prisma.join(conditions, ' ') : Prisma.empty}
      ORDER BY ar.name, e.first_name
    `);
    return rows.map((r) => ({
      ...r,
      empleado: r.colaborador,
      minutos_tardanza: r.minutos_tardanza ?? calcTardanza(r.entrada1, r.entrada2),
      estado: r.estado || determinarEstado(r.entrada1, r.entrada2, false),
    }));
  }

  async getDashboardIndicadores(): Promise<DashboardIndicadores> {
    const indicadores = await prisma.$queryRaw<DashboardIndicadores[]>`
      SELECT
        COUNT(DISTINCT CASE WHEN a.status IN ('on_time','late') THEN a.user_id END)::int AS presentes_hoy,
        COUNT(DISTINCT CASE WHEN a.status = 'absent' THEN a.user_id END)::int AS ausentes_hoy,
        COUNT(DISTINCT CASE WHEN a.status = 'late' THEN a.user_id END)::int AS tardanzas_hoy,
        CASE WHEN COUNT(*) > 0 THEN ROUND(SUM(CASE WHEN a.status = 'on_time' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) ELSE 100 END AS puntualidad
      FROM asistencia.attendances a
      WHERE a.date = CURRENT_DATE${roleFilterByUserId('a.user_id')}
    `;
    const extras = await prisma.$queryRaw<{ horas_extras_hoy: number }[]>`
      SELECT COALESCE(SUM(a.extra_hours), 0)::float AS horas_extras_hoy
      FROM asistencia.attendances a
      WHERE a.date = CURRENT_DATE${roleFilterByUserId('a.user_id')}
    `;
    return {
      ...(indicadores[0] || { presentes_hoy: 0, ausentes_hoy: 0, tardanzas_hoy: 0, puntualidad: 100 }),
      ...(extras[0] || { horas_extras_hoy: 0 }),
    };
  }

  async getDashboardAsistenciaHoy(): Promise<DashboardAsistenciaHoy[]> {
    try {
      const rows = await prisma.$queryRaw<DashboardAsistenciaHoy[]>`
        SELECT CONCAT(e.first_name, ' ', e.first_surname) AS empleado,
          TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada,
          TO_CHAR(COALESCE(a.departure_timestamp, a.morning_departure_timestamp), 'HH24:MI') AS salida,
          a.status AS estado
        FROM asistencia.attendances a
        JOIN asistencia.users e ON a.user_id = e.id
        WHERE a.date = CURRENT_DATE${roleFilterByUserId('a.user_id')}
        ORDER BY a.entry_timestamp LIMIT 10
      `;
      return rows;
    } catch {
      return [];
    }
  }

  async getTardanzas(filters: {
    fecha_desde?: string;
    fecha_hasta?: string;
    area_id?: string;
    empleado_id?: string;
  }): Promise<TardanzaRow[]> {
    const conditions: Prisma.Sql[] = [];
    if (filters.fecha_desde) conditions.push(Prisma.sql`AND a.date >= ${filters.fecha_desde}::date`);
    if (filters.fecha_hasta) conditions.push(Prisma.sql`AND a.date <= ${filters.fecha_hasta}::date`);
    if (filters.area_id) conditions.push(Prisma.sql`AND e.area_id = ${filters.area_id}`);
    if (filters.empleado_id) conditions.push(Prisma.sql`AND a.user_id = ${filters.empleado_id}`);
    return prisma.$queryRaw<TardanzaRow[]>(Prisma.sql`
      SELECT COALESCE(dd.document_number, '') AS cedula, CONCAT(e.first_name,' ',e.first_surname) AS colaborador, ar.name AS area,
        DATE(a.date) AS fecha, TO_CHAR(a.entry_timestamp,'HH24:MI') AS entrada, a.late_minutes AS minutos_tardanza, a.observation AS observacion
      FROM asistencia.attendances a
      JOIN asistencia.users e ON a.user_id=e.id
      LEFT JOIN asistencia.document_details dd ON dd.user_id = e.id
      JOIN asistencia.areas ar ON e.area_id=ar.id
      WHERE a.status='late'${roleFilterByUserId('a.user_id')}
      ${conditions.length > 0 ? Prisma.join(conditions, ' ') : Prisma.empty}
      ORDER BY a.date DESC LIMIT 50
    `);
  }

  async getAusencias(filters: {
    fecha_desde?: string;
    fecha_hasta?: string;
    area_id?: string;
    empleado_id?: string;
  }): Promise<AusenciaRow[]> {
    const conditions: Prisma.Sql[] = [];
    if (filters.fecha_desde) conditions.push(Prisma.sql`AND a.date >= ${filters.fecha_desde}::date`);
    if (filters.fecha_hasta) conditions.push(Prisma.sql`AND a.date <= ${filters.fecha_hasta}::date`);
    if (filters.area_id) conditions.push(Prisma.sql`AND e.area_id = ${filters.area_id}`);
    if (filters.empleado_id) conditions.push(Prisma.sql`AND a.user_id = ${filters.empleado_id}`);
    return prisma.$queryRaw<AusenciaRow[]>(Prisma.sql`
      SELECT COALESCE(dd.document_number, '') AS cedula, CONCAT(e.first_name,' ',e.first_surname) AS colaborador, ar.name AS area,
        DATE(a.date) AS fecha, a.status AS estado, a.observation AS observacion
      FROM asistencia.attendances a
      JOIN asistencia.users e ON a.user_id=e.id
      LEFT JOIN asistencia.document_details dd ON dd.user_id = e.id
      JOIN asistencia.areas ar ON e.area_id=ar.id
      WHERE a.status IN('absent','justified')
        AND NOT EXISTS (
          SELECT 1 FROM asistencia.news n
          WHERE n.user_id = a.user_id AND a.date BETWEEN n.date_from AND n.date_to
        )${roleFilterByUserId('a.user_id')}
      ${conditions.length > 0 ? Prisma.join(conditions, ' ') : Prisma.empty}
      ORDER BY a.date DESC LIMIT 50
    `);
  }

  async getEmpleados(filters: {
    area_id?: string;
    cargo_id?: string;
  }): Promise<EmpleadoRow[]> {
    const conditions: Prisma.Sql[] = [];
    if (filters.area_id) conditions.push(Prisma.sql`AND e.area_id = ${filters.area_id}`);
    if (filters.cargo_id) conditions.push(Prisma.sql`AND e.position_id = ${filters.cargo_id}`);
    return prisma.$queryRaw<EmpleadoRow[]>(Prisma.sql`
      SELECT COALESCE(dd.document_number, '') AS cedula, e.first_name AS nombre, e.first_surname AS apellido,
        COALESCE(e.phone, '') AS telefono, e.email AS correo, ar.name AS area, ca.name AS cargo, 1 AS activo
      FROM asistencia.users e
      LEFT JOIN asistencia.document_details dd ON dd.user_id = e.id
      LEFT JOIN asistencia.areas ar ON e.area_id=ar.id
      LEFT JOIN asistencia.positions ca ON e.position_id=ca.id
      WHERE 1=1${roleFilterByUserId('e.id')}
      ${conditions.length > 0 ? Prisma.join(conditions, ' ') : Prisma.empty}
      ORDER BY e.first_surname
    `);
  }

  async getMarcaciones(filters: {
    fecha_desde?: string;
    fecha_hasta?: string;
    empleado_id?: string;
    area_id?: string;
  }): Promise<MarcacionRow[]> {
    const conditions: Prisma.Sql[] = [];
    if (filters.fecha_desde) conditions.push(Prisma.sql`AND a.date >= ${filters.fecha_desde}::date`);
    if (filters.fecha_hasta) conditions.push(Prisma.sql`AND a.date <= ${filters.fecha_hasta}::date`);
    if (filters.empleado_id) conditions.push(Prisma.sql`AND a.user_id = ${filters.empleado_id}`);
    if (filters.area_id) conditions.push(Prisma.sql`AND e.area_id = ${filters.area_id}`);
    return prisma.$queryRaw<MarcacionRow[]>(Prisma.sql`
      SELECT COALESCE(dd.document_number, '') AS cedula, CONCAT(e.first_name,' ',e.first_surname) AS colaborador, ar.name AS area,
        DATE(a.date) AS fecha,
        TO_CHAR(a.entry_timestamp,'HH24:MI') AS entrada,
        TO_CHAR(COALESCE(a.departure_timestamp, a.morning_departure_timestamp),'HH24:MI') AS salida,
        a.mark_type AS tipo_marcacion, a.status AS estado
      FROM asistencia.attendances a
      JOIN asistencia.users e ON a.user_id=e.id
      LEFT JOIN asistencia.document_details dd ON dd.user_id = e.id
      JOIN asistencia.areas ar ON e.area_id=ar.id
      WHERE 1=1${roleFilterByUserId('a.user_id')}
      ${conditions.length > 0 ? Prisma.join(conditions, ' ') : Prisma.empty}
      ORDER BY a.date DESC LIMIT 50
    `);
  }

  async getPorAreas(filters: {
    area_id?: string;
    empleado_id?: string;
    usuario_id?: string;
    mes?: string;
    anio?: string;
    estado?: string;
  }): Promise<PorAreasRow[]> {
    const targetId = filters.usuario_id || filters.empleado_id;
    // mes/anio van en el ON del LEFT JOIN para que los empleados sin marcas sigan apareciendo (ceros)
    const joinConds: Prisma.Sql[] = [];
    if (filters.mes) joinConds.push(Prisma.sql`EXTRACT(MONTH FROM a.date) = ${filters.mes}`);
    if (filters.anio) joinConds.push(Prisma.sql`EXTRACT(YEAR FROM a.date) = ${filters.anio}`);
    const whereConds: Prisma.Sql[] = [];
    if (filters.area_id) whereConds.push(Prisma.sql`AND u.area_id = ${filters.area_id}`);
    if (targetId) whereConds.push(Prisma.sql`AND u.id = ${targetId}`);
    const ESTADO_HAVING: Record<string, string> = {
      on_time: "COUNT(*) FILTER (WHERE a.status = 'late') = 0 AND COUNT(*) FILTER (WHERE a.status = 'on_time') > 0",
      late: "COUNT(*) FILTER (WHERE a.status = 'late') > 0",
      absent: "COUNT(*) FILTER (WHERE a.status = 'absent') > 0",
      justified: "COUNT(*) FILTER (WHERE a.status = 'justified') > 0",
    };
    const having =
      filters.estado && ESTADO_HAVING[String(filters.estado)]
        ? Prisma.sql`HAVING ${Prisma.raw(ESTADO_HAVING[String(filters.estado)])}`
        : Prisma.empty;

    return prisma.$queryRaw<PorAreasRow[]>(Prisma.sql`
      SELECT u.id, CONCAT(u.first_name, ' ', u.first_surname) AS empleado, dd.document_number AS cedula, ar.name AS area,
          (COUNT(DISTINCT a.date) FILTER (WHERE a.status IN ('on_time','late')))::int AS dias_laborados,
          (COUNT(*) FILTER (WHERE a.status = 'on_time'))::int AS puntuales,
          (COUNT(*) FILTER (WHERE a.status = 'late'))::int AS tardanzas,
          (COUNT(*) FILTER (WHERE a.status = 'absent'))::int AS ausencias,
          COALESCE(SUM(a.worked_hours), 0)::float AS horas_trabajadas
        FROM asistencia.users u
        LEFT JOIN asistencia.areas ar ON u.area_id=ar.id
        LEFT JOIN asistencia.document_details dd ON dd.user_id=u.id
        LEFT JOIN asistencia.attendances a ON a.user_id=u.id${roleJoin('u.id')}${joinConds.length > 0 ? Prisma.sql` AND ${Prisma.join(joinConds, ' AND ')}` : Prisma.empty}
        WHERE u.active = true${roleFilterByName('r')}
        ${whereConds.length > 0 ? Prisma.join(whereConds, ' ') : Prisma.empty}
        GROUP BY u.id, u.first_name, u.first_surname, dd.document_number, ar.name
        ${having}
        ORDER BY u.first_surname, u.first_name
    `);
  }

  async getPorEmpleado(filters: {
    empleado_id?: string;
    usuario_id?: string;
    mes?: string;
    anio?: string;
  }): Promise<PorEmpleadoData | null> {
    const targetId = filters.usuario_id || filters.empleado_id;
    if (!targetId) return null;

    const mesConsulta = filters.mes ? parseInt(filters.mes, 10) : new Date().getMonth() + 1;
    const anioConsulta = filters.anio ? parseInt(filters.anio, 10) : new Date().getFullYear();

    const empleadoRows = await prisma.$queryRaw<{ id: string; cedula: string; nombre: string; apellido: string; area: string; cargo: string; fecha_ingreso: string }[]>`
      SELECT u.id, dd.document_number AS cedula, u.first_name AS nombre, u.first_surname AS apellido,
        ar.name AS area, ca.name AS cargo,
        TO_CHAR(u.hire_date, 'YYYY-MM-DD') AS fecha_ingreso
      FROM asistencia.users u LEFT JOIN asistencia.areas ar ON u.area_id = ar.id LEFT JOIN asistencia.positions ca ON u.position_id = ca.id
      LEFT JOIN asistencia.document_details dd ON dd.user_id = u.id
      WHERE u.id = ${targetId}${roleFilterByUserId('u.id')}
    `;
    const empleado = empleadoRows[0];
    if (!empleado) return null;

    const diasDelMes = new Date(anioConsulta, mesConsulta, 0).getDate();
    let diasHabiles = 0;
    for (let d = 1; d <= diasDelMes; d++) {
      const dia = new Date(anioConsulta, mesConsulta - 1, d);
      if (dia.getDay() !== 0 && dia.getDay() !== 6) diasHabiles++;
    }

    const festivosRows = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COUNT(*)::int AS total FROM asistencia.holidays
      WHERE active = TRUE AND EXTRACT(MONTH FROM date) = ${mesConsulta} AND EXTRACT(YEAR FROM date) = ${anioConsulta}
        AND EXTRACT(DOW FROM date) != 0 AND EXTRACT(DOW FROM date) != 6
    `;
    const totalFestivos = Number(festivosRows[0]?.total || 0);
    const diasEsperados = diasHabiles - totalFestivos;

    const asisRows = await prisma.$queryRaw<{
      total_registros: number; puntuales: number; tardanzas: number; ausentes: number;
      justificados: number; horas_trabajadas: number; total_minutos_tardanza: number;
    }[]>`
      SELECT
        COUNT(*)::int AS total_registros,
        SUM((status = 'on_time')::int)::int AS puntuales,
        SUM((status = 'late')::int)::int AS tardanzas,
        SUM((status = 'absent')::int)::int AS ausentes,
        SUM((status = 'justified')::int)::int AS justificados,
        COALESCE(SUM(worked_hours), 0)::float AS horas_trabajadas,
        COALESCE(SUM(late_minutes), 0)::int AS total_minutos_tardanza
      FROM asistencia.attendances
      WHERE user_id = ${targetId} AND EXTRACT(MONTH FROM date) = ${mesConsulta} AND EXTRACT(YEAR FROM date) = ${anioConsulta}${roleFilterByUserId('user_id')}
    `;
    const resumen = asisRows[0] || { total_registros: 0, puntuales: 0, tardanzas: 0, ausentes: 0, justificados: 0, horas_trabajadas: 0, total_minutos_tardanza: 0 };

    const permisos = await prisma.$queryRaw<{ total: number; dias_permiso: number }[]>`
      SELECT COUNT(*)::int AS total,
        COALESCE(SUM(CASE WHEN mark_type IN ('full_day', 'commission') THEN
          (date_to - date_from + 1) - (
            SELECT COUNT(*) FROM generate_series(date_from::date, date_to::date, '1 day') AS d
            WHERE EXTRACT(DOW FROM d) IN (0, 6)
          )
        ELSE 1 END), 0)::int AS dias_permiso
      FROM asistencia.news
      WHERE user_id = ${targetId} AND EXTRACT(MONTH FROM date_from) = ${mesConsulta} AND EXTRACT(YEAR FROM date_from) = ${anioConsulta}${roleFilterByUserId('user_id')}
    `;

    const detalle = await prisma.$queryRaw<{
      fecha: string | Date; estado: string; entrada1: string | null; salida1: string | null;
      entrada2: string | null; salida2: string | null; horas_trabajadas: number | null;
      minutos_tardanza: number | null; observacion: string | null;
    }[]>`
      SELECT a.date AS fecha, a.status AS estado,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        a.worked_hours AS horas_trabajadas, a.late_minutes AS minutos_tardanza, a.observation AS observacion
      FROM asistencia.attendances a
      WHERE a.user_id = ${targetId} AND EXTRACT(MONTH FROM a.date) = ${mesConsulta} AND EXTRACT(YEAR FROM a.date) = ${anioConsulta}${roleFilterByUserId('a.user_id')}
      ORDER BY a.date DESC
    `;

    const festivosDetalle = await prisma.$queryRaw<{ fecha: string; nombre: string }[]>`
      SELECT date AS fecha, name AS nombre FROM asistencia.holidays WHERE active = TRUE
        AND EXTRACT(MONTH FROM date) = ${mesConsulta} AND EXTRACT(YEAR FROM date) = ${anioConsulta}
    `;
    const festivosMapDetalle = Object.fromEntries(festivosDetalle.map((f) => {
      const d = new Date(f.fecha);
      return [`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`, f.nombre];
    }));
    const detalleConFestivos = detalle.map((d) => {
      const fechaStr = d.fecha instanceof Date
        ? `${d.fecha.getFullYear()}-${String(d.fecha.getMonth()+1).padStart(2,'0')}-${String(d.fecha.getDate()).padStart(2,'0')}`
        : d.fecha.substring(0, 10);
      return { ...d, esFestivo: !!festivosMapDetalle[fechaStr], festivo: festivosMapDetalle[fechaStr] || null };
    });

    return {
      empleado,
      resumen,
      permisos: { total: Number(permisos[0]?.total || 0), dias_permiso: Number(permisos[0]?.dias_permiso || 0) },
      detalle: detalleConFestivos,
      festivos: festivosDetalle,
      diasHabiles,
      totalFestivos,
      diasEsperados,
    };
  }

  async getSeguimiento(filtros: SeguimientoFiltros): Promise<SeguimientoResult> {
    const { hoyISO, fmtDate, PAGE_SIZE_MAX, SITUACION, clasificar } = require(
      '../../../../../../services/seguimientoService.js',
    );

    const hoy = hoyISO();
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const ayerISO = fmtDate(ayer);

    const filtrosCompletos = {
      fecha_desde: filtros.fecha_desde || ayerISO,
      fecha_hasta: filtros.fecha_hasta || hoy,
      area: filtros.area || undefined,
      piso: filtros.piso || undefined,
      busqueda: filtros.busqueda || undefined,
      situacion: filtros.situacion || undefined,
      page: 1,
      pageSize: PAGE_SIZE_MAX,
    };

    if (
      filtrosCompletos.situacion &&
      !Object.values(SITUACION).includes(filtrosCompletos.situacion)
    ) {
      throw new Error(
        'situacion inválida. Valores: absence, missing_morning, missing_afternoon, unregistered_exit, open_day',
      );
    }

    const result = await clasificar(filtrosCompletos);
    return result as SeguimientoResult;
  }
}