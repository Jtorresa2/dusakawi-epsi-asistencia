import pool from "../config/db";
import { Request, Response } from "express";
import { DatabaseError } from "pg";

export const obtenerTodos = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT a.id, a.name AS nombre, a.description AS descripcion, a.floor_id, NULLIF(regexp_replace(f.name, '\\D', '', 'g'), '')::int AS piso
      FROM areas a
      LEFT JOIN floors f ON a.floor_id = f.id
      ORDER BY a.name ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener las áreas" });
  }
};

export const obtenerPorId = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT a.id, a.name AS nombre, a.description AS descripcion, a.floor_id, NULLIF(regexp_replace(f.name, '\\D', '', 'g'), '')::int AS piso
      FROM areas a
      LEFT JOIN floors f ON a.floor_id = f.id
      WHERE a.id = $1
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ mensaje: "Área no encontrada" });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener el área" });
  }
};

export const crear = async (req: Request, res: Response) => {
  try {
    const { nombre, piso, descripcion } = req.body;
    const { rows: [nuevo] } = await pool.query(
      `INSERT INTO areas (floor_id, name, description)
       SELECT f.id, $1, $2 FROM floors f WHERE f.name = 'Piso ' || $3::text
       LIMIT 1
       RETURNING id`,
      [nombre, descripcion || "", piso || 1]
    );
    res.status(201).json({ mensaje: "Área creada correctamente", id: nuevo?.id ?? 0 });
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof DatabaseError && error.code === "23505") return res.status(400).json({ mensaje: "El nombre del área ya existe" });
    res.status(500).json({ mensaje: "Error al crear el área" });
  }
};

export const actualizar = async (req: Request, res: Response) => {
  try {
    const { nombre, piso, descripcion } = req.body;
    await pool.query(
      `UPDATE areas
       SET name = $1,
           floor_id = COALESCE((SELECT f.id FROM floors f WHERE f.name = 'Piso ' || $2::text LIMIT 1), floor_id),
           description = $3
       WHERE id = $4`,
      [nombre, piso, descripcion, req.params.id]
    );
    res.json({ mensaje: "Área actualizada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al actualizar el área" });
  }
};

export const eliminar = async (req: Request, res: Response) => {
  try {
    await pool.query("DELETE FROM areas WHERE id = $1", [req.params.id]);
    res.json({ mensaje: "Área eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar el área" });
  }
};

export const obtenerEmpleadosPorArea = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, dd.document_number AS cedula, u.first_name AS nombre, u.first_surname AS apellido, u.email AS correo, u.email AS email, u.phone AS telefono,
              u.date_of_birth AS fecha_nacimiento, u.position_id AS cargo_id, u.area_id, u.schedule_id AS horario_id,
              NULLIF(regexp_replace(f.name, '\\D', '', 'g'), '')::int AS piso, u.hire_date AS fecha_ingreso, u.active AS activo, u.username, u.created_at,
              c.name AS cargo, r.name AS rol
       FROM users u
       LEFT JOIN positions c ON u.position_id = c.id
       LEFT JOIN areas a ON u.area_id = a.id
       LEFT JOIN floors f ON a.floor_id = f.id
       LEFT JOIN document_details dd ON dd.user_id = u.id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.area_id = $1 ORDER BY u.first_name ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener empleados del área" });
  }
};
