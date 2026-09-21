import pool from '../../../config/db';
import { Cargo } from '../../shared/types';

export async function obtenerTodos(): Promise<Cargo[]> {
  const { rows } = await pool.query(`
    SELECT p.id, p.name AS nombre, p.description AS descripcion,
           CASE WHEN p.active THEN 'activo' ELSE 'inactivo' END AS estado,
           p.area_id, ar.name AS areas, p.created_at AS creado_en, p.updated_at,
           COUNT(u.id)::int AS empleados_count
    FROM positions p
    LEFT JOIN areas ar ON p.area_id = ar.id
    LEFT JOIN users u ON u.position_id = p.id
    GROUP BY p.id, p.name, p.description, p.active, p.area_id, ar.name, p.created_at, p.updated_at
    ORDER BY p.name ASC
  `);
  return rows;
}

export async function obtenerPorId(id: string): Promise<Cargo | null> {
  const { rows } = await pool.query(
    `
    SELECT p.id, p.name AS nombre, p.description AS descripcion,
           CASE WHEN p.active THEN 'activo' ELSE 'inactivo' END AS estado,
           p.area_id, ar.name AS areas, p.created_at AS creado_en, p.updated_at
    FROM positions p
    LEFT JOIN areas ar ON p.area_id = ar.id
    WHERE p.id = $1
    `,
    [id]
  );
  return rows[0] ?? null;
}

export async function crear(cargo: {
  nombre: string;
  descripcion?: string | null;
  estado?: string;
  area_id?: string | null;
}): Promise<string> {
  const { nombre, descripcion, estado, area_id } = cargo;
  const active = estado === undefined ? true : estado !== 'inactivo';
  const {
    rows: [nuevo],
  } = await pool.query(
    `
    INSERT INTO positions (name, description, active, area_id)
    VALUES ($1, $2, $3, $4) RETURNING id
    `,
    [nombre, descripcion, active, area_id ?? null]
  );
  return nuevo?.id ?? '';
}

export async function actualizar(
  id: string,
  cargo: {
    nombre?: string;
    descripcion?: string | null;
    estado?: string;
    area_id?: string | null;
  }
): Promise<void> {
  const { nombre, descripcion, estado, area_id } = cargo;
  const sets: string[] = [];
  const params: unknown[] = [];
  if (nombre !== undefined) { sets.push(`name = $${params.length + 1}`); params.push(nombre); }
  if (descripcion !== undefined) { sets.push(`description = $${params.length + 1}`); params.push(descripcion); }
  if (estado !== undefined) { sets.push(`active = $${params.length + 1}`); params.push(estado !== 'inactivo'); }
  if (area_id !== undefined) { sets.push(`area_id = $${params.length + 1}`); params.push(area_id ?? null); }
  if (sets.length === 0) return;
  params.push(id);
  await pool.query(`UPDATE positions SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
}

export async function eliminar(id: string): Promise<void> {
  await pool.query(`DELETE FROM positions WHERE id = $1`, [id]);
}
