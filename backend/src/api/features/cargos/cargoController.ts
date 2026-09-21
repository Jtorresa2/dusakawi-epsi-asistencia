import * as positionService from "./cargoService";
import { Request, Response } from "express";
import { DatabaseError } from "pg";
import { esIdValido } from "../../shared/utils/validators";

export const obtenerTodos = async (req: Request, res: Response) => {
  try {
    const positions = await positionService.obtenerTodos();
    res.json(positions);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al obtener los cargos",
    });
  }
};

export const obtenerPorId = async (req: Request, res: Response) => {
  try {
    if (!esIdValido(String(req.params.id))) {
      return res.status(400).json({ mensaje: 'Id inválido' });
    }
    const position = await positionService.obtenerPorId(String(req.params.id));

    if (!position) {
      return res.status(404).json({
        mensaje: "Cargo no encontrado",
      });
    }

    res.json(position);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al obtener el cargo",
    });
  }
};

export const crear = async (req: Request, res: Response) => {
  try {
    const id = await positionService.crear(req.body);

    res.status(201).json({
      mensaje: "Cargo creado correctamente",
      id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al crear el cargo",
    });
  }
};

export const actualizar = async (req: Request, res: Response) => {
  try {
    if (!esIdValido(String(req.params.id))) {
      return res.status(400).json({ mensaje: 'Id inválido' });
    }
    await positionService.actualizar(String(req.params.id), req.body);

    res.json({
      mensaje: "Cargo actualizado correctamente",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al actualizar el cargo",
    });
  }
};

export const eliminar = async (req: Request, res: Response) => {
  try {
    if (!esIdValido(String(req.params.id))) {
      return res.status(400).json({ mensaje: 'Id inválido' });
    }
    await positionService.eliminar(String(req.params.id));

    res.json({
      mensaje: "Cargo eliminado correctamente",
    });
  } catch (error: unknown) {
    console.error(error);

    if (error instanceof DatabaseError && error.code === "23503") {
      return res.status(400).json({
        mensaje: "No se puede eliminar el cargo porque está asignado a uno o más empleados.",
      });
    }

    res.status(500).json({
      mensaje: "Error al eliminar el cargo",
    });
  }
};
