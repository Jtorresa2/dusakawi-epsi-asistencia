import pool from '../../../config/db';
import fs from 'fs';
import path from 'path';
import { diaSemanaDeFecha } from '../../shared/services/calculoHorarioService';
import { IncidenciaDetalle, AsistenciaRelacionada, SqlParam } from '../../shared/types';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

interface CrearIncidenciaParams {
  usuario_id: string;
  tipo: string;
  descripcion: string;
  evidencia_url?: string | null;
  fecha: string;
  priority?: string;
}

export interface IncidenciaFiltros {
  usuario_id?: string;
  empleado_id?: string;
  estado?: string;
  tipo?: string;
  prioridad?: string;
  area_id?: string;
  cargo_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  busqueda?: string;
}

export async function crear({
  usuario_id,
  tipo,
  descripcion,
  evidencia_url,
  fecha,
  priority = 'low',
}: CrearIncidenciaParams): Promise<number> {
  if (!usuario_id) throw new Error('usuario_id es requerido');
  const {
    rows: [nuevo],
  } = await pool.query(
    `INSERT INTO incidents (user_id, type, description, evidence, date, status, priority)
     VALUES ($1, $2, $3, $4, $5, 'pending', $6) RETURNING id`,
    [usuario_id, tipo, descripcion, evidencia_url, fecha, priority]
  );
  return nuevo?.id ?? 0;
}

export async function obtenerTodas(filtros: IncidenciaFiltros = {}): Promise<IncidenciaDetalle[]> {
  let sql = `
    SELECT i.id, i.user_id AS usuario_id, i.type AS tipo, i.description AS descripcion,
      i.evidence AS evidencia_url, i.signed_file AS archivo_firmado, i.date AS fecha,
      i.status AS estado, i.priority AS prioridad, i.rejection_reason AS motivo_rechazo,
      i.observation AS observacion, i.reviewed_by AS revisado_por,
      i.created_at, i.updated_at,
      u.first_name AS empleado_nombre, dd.document_number AS cedula, u.first_surname AS apellido,
      ar.name AS area,
      c.name AS cargo
    FROM incidents i
    LEFT JOIN users u ON i.user_id = u.id
    LEFT JOIN areas ar ON u.area_id = ar.id
    LEFT JOIN positions c ON u.position_id = c.id
    LEFT JOIN document_details dd ON dd.user_id = u.id
    WHERE 1=1
  `;
  const params: SqlParam[] = [];
  if (filtros.usuario_id) { sql += ' AND i.user_id = $1'; params.push(filtros.usuario_id); }
  else if (filtros.empleado_id) { sql += ' AND i.user_id = $1'; params.push(filtros.empleado_id); }
  if (filtros.estado) { sql += ` AND i.status = $${params.length + 1}`; params.push(filtros.estado); }
  if (filtros.tipo) { sql += ` AND i.type = $${params.length + 1}`; params.push(filtros.tipo); }
  if (filtros.prioridad) { sql += ` AND i.priority = $${params.length + 1}`; params.push(filtros.prioridad); }
  if (filtros.area_id) { sql += ` AND u.area_id = $${params.length + 1}`; params.push(filtros.area_id); }
  if (filtros.cargo_id) { sql += ` AND u.position_id = $${params.length + 1}`; params.push(filtros.cargo_id); }
  if (filtros.fecha_desde) { sql += ` AND i.date >= $${params.length + 1}`; params.push(filtros.fecha_desde); }
  if (filtros.fecha_hasta) { sql += ` AND i.date <= $${params.length + 1}`; params.push(filtros.fecha_hasta); }
  if (filtros.busqueda) {
    sql += ` AND (u.first_name LIKE $${params.length + 1} OR u.first_surname LIKE $${params.length + 2} OR dd.document_number LIKE $${params.length + 3})`;
    const term = `%${filtros.busqueda}%`;
    params.push(term, term, term);
  }
  sql += ' ORDER BY i.created_at DESC';
  const { rows } = await pool.query<IncidenciaDetalle>(sql, params);
  return rows;
}

export async function obtenerPorId(id: string): Promise<IncidenciaDetalle | null> {
  const { rows } = await pool.query<IncidenciaDetalle>(
    `SELECT i.id, i.user_id AS usuario_id, i.type AS tipo, i.description AS descripcion,
      i.evidence AS evidencia_url, i.signed_file AS archivo_firmado, i.date AS fecha,
      i.status AS estado, i.priority AS prioridad, i.rejection_reason AS motivo_rechazo,
      i.observation AS observacion, i.reviewed_by AS revisado_por,
      i.created_at, i.updated_at,
      u.first_name AS empleado_nombre, dd.document_number AS cedula, u.first_surname AS apellido,
      ar.name AS area,
      c.name AS cargo,
      CONCAT(er.first_name, ' ', er.first_surname) AS revisor_nombre
     FROM incidents i
     LEFT JOIN users u ON i.user_id = u.id
     LEFT JOIN areas ar ON u.area_id = ar.id
     LEFT JOIN positions c ON u.position_id = c.id
     LEFT JOIN document_details dd ON dd.user_id = u.id
     LEFT JOIN users er ON i.reviewed_by = er.id
     WHERE i.id = $1`,
    [id]
  );
  const incidencia = rows[0] ?? null;
  if (incidencia) {
    incidencia.asistencia = await obtenerAsistenciaRelacionada(
      incidencia.usuario_id,
      String(incidencia.fecha)
    );
  }
  return incidencia;
}

export async function obtenerAsistenciaRelacionada(
  usuarioId: string,
  fecha: string
): Promise<AsistenciaRelacionada | null> {
  try {
    const diaSemana = diaSemanaDeFecha(fecha);
    const { rows } = await pool.query<AsistenciaRelacionada>(
      `SELECT
        a.entry_timestamp AS fecha_hora_entrada,
        a.departure_timestamp AS fecha_hora_salida,
        a.late_minutes AS minutos_tardanza,
        a.mark_type AS tipo_marcacion,
        a.status AS estado_marcacion,
        h.modality AS modalidad,
        TO_CHAR(hd.morning_entry, 'HH24:MI') AS hora_entrada_programada,
        TO_CHAR(hd.morning_exit, 'HH24:MI') AS hora_salida_programada
       FROM attendances a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN schedules h ON u.schedule_id = h.id
       LEFT JOIN schedule_details hd ON h.id = hd.schedule_id AND hd.day_of_week = $1
       WHERE a.user_id = $2 AND a.date = $3
       GROUP BY a.id, h.modality, hd.morning_entry, hd.morning_exit`,
      [diaSemana, usuarioId, fecha]
    );
    const fila = rows[0] ?? null;
    if (fila && (fila.modalidad === 'flexible' || fila.modalidad === 'by_hours')) {
      fila.minutos_tardanza = 0;
    }
    return fila;
  } catch {
    return null;
  }
}

export async function aprobar(
  id: string,
  prioridad: string | undefined,
  revisado_por: string
): Promise<boolean> {
  const { rowCount } = await pool.query(
    "UPDATE incidents SET status = 'approved', priority = $1, reviewed_by = $2 WHERE id = $3 AND status IN ('pending','under_review')",
    [prioridad ?? 'medium', revisado_por, id]
  );
  return (rowCount ?? 0) > 0;
}

export async function aprobarConFirma(
  id: string,
  archivo_firmado: string,
  prioridad: string | undefined,
  revisado_por: string
): Promise<boolean> {
  const { rowCount } = await pool.query(
    "UPDATE incidents SET status = 'approved', signed_file = $1, priority = $2, reviewed_by = $3 WHERE id = $4 AND status IN ('pending','under_review')",
    [archivo_firmado, prioridad ?? 'medium', revisado_por, id]
  );
  return (rowCount ?? 0) > 0;
}

export async function rechazar(
  id: string,
  motivo: string,
  revisado_por: string
): Promise<boolean> {
  const { rowCount } = await pool.query(
    "UPDATE incidents SET status = 'rejected', rejection_reason = $1, reviewed_by = $2 WHERE id = $3 AND status IN ('pending','under_review')",
    [motivo, revisado_por, id]
  );
  return (rowCount ?? 0) > 0;
}

export async function solicitarCorreccion(
  id: string,
  observacion: string,
  revisado_por: string
): Promise<boolean> {
  const { rowCount } = await pool.query(
    "UPDATE incidents SET observation = $1, reviewed_by = $2 WHERE id = $3 AND status IN ('pending','under_review')",
    [observacion, revisado_por, id]
  );
  return (rowCount ?? 0) > 0;
}

export async function eliminar(id: string): Promise<void> {
  const { rows } = await pool.query(
    'SELECT evidence, signed_file FROM incidents WHERE id = $1',
    [id]
  );
  const inc = rows[0];
  if (inc) {
    for (const url of [inc.evidence, inc.signed_file] as (string | null)[]) {
      if (url) {
        const filePath = path.join(UPLOADS_DIR, url.replace('/uploads/', ''));
        try { fs.unlinkSync(filePath); } catch { /* ignore */ }
      }
    }
  }
  await pool.query('DELETE FROM incidents WHERE id = $1', [id]);
}
