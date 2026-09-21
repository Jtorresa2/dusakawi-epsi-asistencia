import * as incidenciaService from "../services/incidenciaService";
import { IncidenciaFiltros } from "../services/incidenciaService";
import pool from "../config/db";
import { Request, Response } from "express";

export const crear = async (req: Request, res: Response) => {
  try {
    const { tipo, descripcion, fecha, priority } = req.body;
    const usuario_id = String(req.user.id);
    const evidencia_url = req.file ? `/uploads/incidencias/${req.file.filename}` : null;
    const id = await incidenciaService.crear({ usuario_id, tipo, descripcion, evidencia_url, fecha, priority });
    res.status(201).json({ mensaje: "Incidencia reportada correctamente", id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al reportar la incidencia" });
  }
};

export const obtenerTodas = async (req: Request, res: Response) => {
  try {
    const filtros: IncidenciaFiltros = {};
    if (req.user.rol === "empleado") filtros.usuario_id = req.user.id;
    if (req.query.estado) filtros.estado = String(req.query.estado);
    if (req.query.tipo) filtros.tipo = String(req.query.tipo);
    if (req.query.prioridad) filtros.prioridad = String(req.query.prioridad);
    if (req.query.area_id) filtros.area_id = String(req.query.area_id);
    if (req.query.cargo_id) filtros.cargo_id = String(req.query.cargo_id);
    if (req.query.fecha_desde) filtros.fecha_desde = String(req.query.fecha_desde);
    if (req.query.fecha_hasta) filtros.fecha_hasta = String(req.query.fecha_hasta);
    if (req.query.busqueda) filtros.busqueda = String(req.query.busqueda);
    const incidencias = await incidenciaService.obtenerTodas(filtros);
    res.json(incidencias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener incidencias" });
  }
};

export const obtenerPorId = async (req: Request, res: Response) => {
  try {
    const incidencia = await incidenciaService.obtenerPorId(String(req.params.id));
    if (!incidencia) return res.status(404).json({ mensaje: "Incidencia no encontrada" });
    if (req.user.rol === "empleado" && incidencia.usuario_id !== req.user.id) {
      return res.status(403).json({ mensaje: "No tienes permiso" });
    }
    res.json(incidencia);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener la incidencia" });
  }
};

export const aprobar = async (req: Request, res: Response) => {
  try {
    const { prioridad } = req.body;
    const ok = await incidenciaService.aprobar(String(req.params.id), prioridad, req.user.id);
    if (!ok) return res.status(400).json({ mensaje: "No se pudo aprobar. Puede que ya no esté pendiente." });
    res.json({ mensaje: "Incidencia aprobada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al aprobar la incidencia" });
  }
};

export const rechazar = async (req: Request, res: Response) => {
  try {
    const { motivo } = req.body;
    if (!motivo) return res.status(400).json({ mensaje: "Debes indicar el motivo del rechazo" });
    const ok = await incidenciaService.rechazar(String(req.params.id), motivo, req.user.id);
    if (!ok) return res.status(400).json({ mensaje: "No se pudo rechazar. Puede que ya no esté pendiente." });
    res.json({ mensaje: "Incidencia rechazada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al rechazar la incidencia" });
  }
};

export const aprobarConFirma = async (req: Request, res: Response) => {
  try {
    const archivo_firmado = req.file ? `/uploads/incidencias/firmas/${req.file.filename}` : null;
    if (!archivo_firmado) return res.status(400).json({ mensaje: "Debes adjuntar el PDF firmado" });
    const { prioridad } = req.body;
    const ok = await incidenciaService.aprobarConFirma(String(req.params.id), archivo_firmado, prioridad, req.user.id);
    if (!ok) return res.status(400).json({ mensaje: "No se pudo aprobar. Puede que ya no esté pendiente." });
    res.json({ mensaje: "Incidencia aprobada con firma" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al aprobar con firma" });
  }
};

export const solicitarCorreccion = async (req: Request, res: Response) => {
  try {
    const { observacion } = req.body;
    if (!observacion) return res.status(400).json({ mensaje: "Debes indicar una observación" });
    const ok = await incidenciaService.solicitarCorreccion(String(req.params.id), observacion, req.user.id);
    if (!ok) return res.status(400).json({ mensaje: "No se pudo solicitar corrección. Puede que ya no esté pendiente." });
    res.json({ mensaje: "Corrección solicitada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al solicitar corrección" });
  }
};

export const eliminar = async (req: Request, res: Response) => {
  try {
    await incidenciaService.eliminar(String(req.params.id));
    res.json({ mensaje: "Incidencia eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar la incidencia" });
  }
};

export const obtenerStats = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        SUM((status = 'pending')::int) AS pendientes,
        SUM((status = 'approved')::int) AS aprobadas,
        SUM((status = 'rejected')::int) AS rechazadas
      FROM incidents
    `);
    res.json(rows[0] || { pendientes: 0, aprobadas: 0, rechazadas: 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener estadísticas" });
  }
};

export const obtenerActividad = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT i.id, i.status AS estado, i.type AS tipo, i.created_at, i.updated_at, i.date AS fecha,
        u.first_name AS empleado_nombre, u.first_surname AS empleado_apellido
      FROM incidents i
      JOIN users u ON i.user_id = u.id
      ORDER BY i.updated_at DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener actividad" });
  }
};
