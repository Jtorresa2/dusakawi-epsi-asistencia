import * as festivoService from "./festivoService";
import { Request, Response } from "express";
import { DatabaseError } from "pg";
import { getErrorMessage } from "../../shared/utils/errors";
import { esIdValido } from "../../shared/utils/validators";

export const obtenerTodos = async (req: Request, res: Response) => {
  try {
    const activo = req.query.activo !== undefined ? req.query.activo === "true" : null;
    const festivos = await festivoService.obtenerTodos(activo);
    res.json({ festivos });
  } catch (err: unknown) {
    res.status(500).json({ mensaje: "Error del servidor", error: getErrorMessage(err) });
  }
};

export const crear = async (req: Request, res: Response) => {
  try {
    const { fecha, nombre, tipo } = req.body;
    if (!fecha || !nombre) {
      return res.status(400).json({ mensaje: "fecha y nombre son requeridos" });
    }
    const resultado = await festivoService.crear({ fecha, nombre, tipo });
    res.status(201).json({ mensaje: "Festivo creado", festivo: resultado });
  } catch (err: unknown) {
    const msg = getErrorMessage(err);
    const isDup = (err instanceof DatabaseError && err.code === "23505") ||
      (err !== null && typeof err === "object" && "code" in err && (err as { code: unknown }).code === "ER_DUP_ENTRY") ||
      msg.includes("duplicate");
    if (isDup) {
      return res.status(409).json({ mensaje: "Ya existe un festivo en esa fecha" });
    }
    res.status(500).json({ mensaje: "Error del servidor", error: msg });
  }
};

export const actualizar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!esIdValido(String(id))) {
      return res.status(400).json({ mensaje: 'Id inválido' });
    }
    const resultado = await festivoService.actualizar(String(id), req.body);
    res.json({ mensaje: "Festivo actualizado", festivo: resultado });
  } catch (err: unknown) {
    res.status(500).json({ mensaje: "Error del servidor", error: getErrorMessage(err) });
  }
};

export const eliminar = async (req: Request, res: Response) => {
  try {
    if (!esIdValido(String(req.params.id))) {
      return res.status(400).json({ mensaje: 'Id inválido' });
    }
    await festivoService.eliminar(String(req.params.id));
    res.json({ mensaje: "Festivo eliminado" });
  } catch (err: unknown) {
    res.status(500).json({ mensaje: "Error del servidor", error: getErrorMessage(err) });
  }
};

export const verificar = async (req: Request, res: Response) => {
  try {
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ mensaje: "fecha es requerida" });
    const festivo = await festivoService.verificarFestivo(fecha as string);
    res.json({ esFestivo: !!festivo, festivo });
  } catch (err: unknown) {
    res.status(500).json({ mensaje: "Error del servidor", error: getErrorMessage(err) });
  }
};

export const generar = async (req: Request, res: Response) => {
  try {
    const { year } = req.body;
    if (!year) return res.status(400).json({ mensaje: "Año es requerido" });
    const resultado = await festivoService.generarNacionales(Number(year));
    res.json({
      mensaje: `Festivos generados: ${resultado.insertados} nuevo(s), ${resultado.existentes} ya existente(s)`,
      ...resultado,
    });
  } catch (err: unknown) {
    res.status(500).json({ mensaje: "Error del servidor", error: getErrorMessage(err) });
  }
};
