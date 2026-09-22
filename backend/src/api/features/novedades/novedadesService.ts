import pool from '../../../config/db';
import { TipoNovedad, ModalidadNovedad } from '../../shared/types';

const TIPOS_NOVEDAD: TipoNovedad[] = [
  'permission', 'vacation', 'sick_leave', 'commission', 'license', 'suspension',
];
const MODALIDADES: ModalidadNovedad[] = ['full_day', 'hours', 'morning', 'afternoon'];

export async function obtenerTodos(): Promise<Record<string, unknown>[]> {
  const { rows } = await pool.query(`
    SELECT
      p.id, p.user_id AS usuario_id, p.date_from AS fecha_desde, p.date_to AS fecha_hasta,
      p.reason AS motivo, p.news_type AS tipo_novedad, p.mark_type AS tipo,
      p.time_from AS hora_desde, p.time_to AS hora_hasta, p.status AS estado,
      p.request_file AS archivo_solicitud, p.signed_file AS archivo_firmado,
      p.requested_by_user_id AS solicitado_usuario_id, p.rejection_reason AS motivo_rechazo,
      p.registered_by AS registrado_por, p.created_at AS creado_en,
      uu.first_name AS empleado_nombre,
      uu.first_surname AS empleado_apellido,
      u.username AS registrado_por_nombre
    FROM news p
    LEFT JOIN users uu ON uu.id = p.user_id
    LEFT JOIN users u ON u.id = p.registered_by
    ORDER BY p.created_at DESC
  `);
  return rows;
}

export async function crear(
  data: {
    usuario_id?: string;
    empleado_id?: string;
    fecha_desde: string;
    fecha_hasta: string;
    motivo: string;
    tipo_novedad?: string;
    modalidad?: string;
    hora_desde?: string | null;
    hora_hasta?: string | null;
  },
  usuarioId: string | null
): Promise<{ id: string; dias_generados: number }> {
  const { usuario_id, empleado_id, fecha_desde, fecha_hasta, motivo, tipo_novedad, modalidad, hora_desde, hora_hasta } = data;
  const targetId = usuario_id ?? empleado_id;
  const novedadVal = (tipo_novedad ?? 'permission') as TipoNovedad;
  const modalidadVal = (modalidad ?? 'full_day') as ModalidadNovedad;

  if (!targetId || !fecha_desde || !fecha_hasta || !motivo) {
    throw new Error('usuario_id, fecha_desde, fecha_hasta y motivo son requeridos');
  }
  if (!TIPOS_NOVEDAD.includes(novedadVal)) throw new Error('tipo_novedad inválido');
  if (!MODALIDADES.includes(modalidadVal)) throw new Error('modalidad inválida');

  if (modalidadVal === 'hours') {
    if (!hora_desde || !hora_hasta) {
      throw new Error('Para novedades por horas, hora_desde y hora_hasta son requeridos');
    }
    if (hora_desde >= hora_hasta) throw new Error('La hora_hasta debe ser posterior a hora_desde');
  }

  const {
    rows: [nuevo],
  } = await pool.query(
    `INSERT INTO news (user_id, date_from, date_to, reason, news_type, mark_type, time_from, time_to, registered_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [targetId, fecha_desde, fecha_hasta, motivo, novedadVal, modalidadVal, hora_desde ?? null, hora_hasta ?? null, usuarioId ?? null]
  );

  const novedadId: string = nuevo?.id ?? '';
  let diasGenerados = 0;

  if (novedadVal === 'commission' || modalidadVal === 'full_day') {
    const estado = novedadVal === 'commission' ? 'commission' : 'justified';
    const observacion = novedadVal === 'commission' ? `Comisión: ${motivo}` : `Novedad: ${motivo}`;

    const inicio = new Date(fecha_desde);
    const fin = new Date(fecha_hasta);
    const dias: string[] = [];

    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      const diaSemana = d.getDay();
      if (diaSemana === 0 || diaSemana === 6) continue;
      dias.push(d.toISOString().split('T')[0]);
    }

    for (const fecha of dias) {
      const { rows: existentes } = await pool.query(
        `SELECT id FROM attendances WHERE user_id = $1 AND date = $2`,
        [targetId, fecha]
      );
      if (existentes.length === 0) {
        await pool.query(
          `INSERT INTO attendances (user_id, date, status, observation, worked_hours, late_minutes)
           VALUES ($1, $2, $3, $4, 0, 0)`,
          [targetId, fecha, estado, observacion]
        );
      }
    }

    diasGenerados = dias.length;
  }

  return { id: novedadId, dias_generados: diasGenerados };
}

export async function actualizar(
  id: string,
  data: {
    usuario_id?: string;
    empleado_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    motivo?: string;
    tipo_novedad?: string;
    modalidad?: string;
    hora_desde?: string | null;
    hora_hasta?: string | null;
  },
  _usuarioId: string | null
): Promise<{ id: string }> {
  const { usuario_id, empleado_id, fecha_desde, fecha_hasta, motivo, tipo_novedad, modalidad, hora_desde, hora_hasta } = data;
  const targetId = usuario_id ?? empleado_id;
  const novedad = tipo_novedad ?? 'permission';
  const modalidadVal = modalidad ?? 'full_day';

  if (!targetId || !fecha_desde || !fecha_hasta || !motivo) {
    throw new Error('usuario_id, fecha_desde, fecha_hasta y motivo son requeridos');
  }
  if (!TIPOS_NOVEDAD.includes(novedad as TipoNovedad)) throw new Error('tipo_novedad inválido');
  if (!MODALIDADES.includes(modalidadVal as ModalidadNovedad)) throw new Error('modalidad inválida');
  if (modalidadVal === 'hours' && hora_desde && hora_hasta && hora_desde >= hora_hasta) {
    throw new Error('La hora_hasta debe ser posterior a hora_desde');
  }

  await pool.query(
    `UPDATE news SET user_id = $1, date_from = $2, date_to = $3, reason = $4, news_type = $5, mark_type = $6, time_from = $7, time_to = $8 WHERE id = $9`,
    [targetId, fecha_desde, fecha_hasta, motivo, novedad, modalidadVal, hora_desde ?? null, hora_hasta ?? null, id]
  );
  return { id };
}

export async function obtenerPorEmpleado(usuarioId: string): Promise<Record<string, unknown>[]> {
  const { rows } = await pool.query(
    `
    SELECT
      p.id, p.user_id AS usuario_id, p.date_from AS fecha_desde, p.date_to AS fecha_hasta,
      p.reason AS motivo, p.news_type AS tipo_novedad, p.mark_type AS tipo,
      p.time_from AS hora_desde, p.time_to AS hora_hasta, p.status AS estado,
      p.request_file AS archivo_solicitud, p.signed_file AS archivo_firmado,
      p.requested_by_user_id AS solicitado_usuario_id, p.rejection_reason AS motivo_rechazo,
      p.registered_by AS registrado_por, p.created_at AS creado_en,
      u.first_name AS empleado_nombre,
      u.first_surname AS empleado_apellido
    FROM news p
    LEFT JOIN users u ON u.id = p.user_id
    WHERE p.user_id = $1
    ORDER BY p.created_at DESC
    `,
    [usuarioId]
  );
  return rows;
}

export async function eliminar(id: string): Promise<{ id: string }> {
  await pool.query(`DELETE FROM news WHERE id = $1`, [id]);
  return { id };
}
