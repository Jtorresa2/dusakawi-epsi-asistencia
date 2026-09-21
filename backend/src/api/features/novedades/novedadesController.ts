import * as novedadesService from "../services/novedadesService";
import { Request, Response } from "express";
import { getErrorMessage } from "../utils/errors";

export const obtenerTodos = async (req: Request, res: Response) => {
  try {
    const novedades = await novedadesService.obtenerTodos();
    res.json({ novedades });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener las novedades" });
  }
};

export const crear = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    const result = await novedadesService.crear(req.body, usuarioId);
    res.status(201).json({
      mensaje: "Novedad registrada correctamente",
      id: result.id,
      dias_generados: result.dias_generados,
    });
  } catch (error) {
    console.error(error);
    const msg = getErrorMessage(error);
    if (msg.includes("requeridos")) {
      return res.status(400).json({ mensaje: msg });
    }
    res.status(500).json({ mensaje: "Error al registrar la novedad" });
  }
};

export const actualizar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await novedadesService.actualizar(String(id), req.body, req.user?.id);
    res.json({ mensaje: "Novedad actualizada correctamente" });
  } catch (error) {
    console.error(error);
    const msg = getErrorMessage(error);
    if (msg.includes("requeridos")) {
      return res.status(400).json({ mensaje: msg });
    }
    res.status(500).json({ mensaje: "Error al actualizar la novedad" });
  }
};

export const eliminar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await novedadesService.eliminar(String(id));
    res.json({ mensaje: "Novedad eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar la novedad" });
  }
};

export const mios = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) return res.status(400).json({ mensaje: "usuario_id no encontrado" });
    const novedades = await novedadesService.obtenerPorEmpleado(usuarioId);
    res.json({ novedades });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener mis novedades" });
  }
};
