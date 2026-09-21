import * as personalService from "./personalService";
import { Request, Response } from "express";
import { DatabaseError } from "pg";
import { PersonalFiltros } from "../../shared/types";
import { getErrorMessage } from "../../shared/utils/errors";
import { esIdValido } from "../../shared/utils/validators";

function getErrorCode(err: unknown): string | null {
  if (err instanceof DatabaseError && err.code) return err.code;
  if (err !== null && typeof err === "object" && "code" in err) {
    return String((err as { code: unknown }).code);
  }
  return null;
}

export const obtenerTodos = async (req: Request, res: Response) => {
  try {
    const filtros: PersonalFiltros = {};
    if (req.query.area) filtros.area = String(req.query.area);
    if (req.query.cargo) filtros.cargo = String(req.query.cargo);
    const empleados = await personalService.obtenerTodos(filtros);
    res.json({ empleados });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener los empleados" });
  }
};

export const obtenerPorId = async (req: Request, res: Response) => {
  try {
    if (!esIdValido(String(req.params.id))) {
      return res.status(400).json({ mensaje: 'Id inválido' });
    }
    const empleado = await personalService.obtenerPorId(String(req.params.id));
    if (!empleado) return res.status(404).json({ mensaje: "Empleado no encontrado" });
    res.json(empleado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener el empleado" });
  }
};

export const crear = async (req: Request, res: Response) => {
  try {
    if (req.user?.rol !== "admin" && req.body.rol_id) {
      const esAdminRol = await personalService.esRolAdministrador(String(req.body.rol_id));
      if (esAdminRol) {
        return res.status(403).json({ mensaje: "Solo el administrador puede crear usuarios administradores" });
      }
    }

    const result = await personalService.crear(req.body);

    res.status(201).json({
      mensaje: `Empleado creado correctamente. Usuario: ${result.username}. El link para crear su contraseña se enviará cuando lo autorice desde Configuración → Correo.`,
      id: result.id,
      username: result.username,
      password_reset_required: 1,
    });
  } catch (error: unknown) {
    console.error(error);
    const code = getErrorCode(error);
    if (code === "VALIDACION") {
      return res.status(400).json({ mensaje: getErrorMessage(error) });
    }
    if (code === "23505") {
      return res.status(400).json({ mensaje: "La cédula o correo ya están registrados" });
    }
    if (code === "23503") {
      return res.status(400).json({ mensaje: "El rol, cargo o área indicados no existen" });
    }
    res.status(500).json({ mensaje: "Error al crear el empleado" });
  }
};

export const actualizar = async (req: Request, res: Response) => {
  try {
    if (!esIdValido(String(req.params.id))) {
      return res.status(400).json({ mensaje: 'Id inválido' });
    }
    if (String(req.params.id) !== String(req.user?.id) && !["admin", "talento_humano"].includes(req.user?.rol)) {
      return res.status(403).json({ mensaje: "No autorizado" });
    }

    if (req.user?.rol !== "admin" && req.body.rol_id !== undefined) {
      delete req.body.rol_id;
    }

    await personalService.actualizar(String(req.params.id), req.body);
    res.json({ mensaje: "Empleado actualizado correctamente" });
  } catch (error: unknown) {
    console.error(error);
    const code = getErrorCode(error);
    if (code === "VALIDACION") {
      return res.status(400).json({ mensaje: getErrorMessage(error) });
    }
    if (code === "23503") {
      return res.status(400).json({ mensaje: "El rol, cargo o área indicados no existen" });
    }
    res.status(500).json({ mensaje: "Error al actualizar el empleado" });
  }
};

export const eliminar = async (req: Request, res: Response) => {
  try {
    if (!esIdValido(String(req.params.id))) {
      return res.status(400).json({ mensaje: 'Id inválido' });
    }
    await personalService.eliminar(String(req.params.id));
    res.json({ mensaje: "Empleado eliminado correctamente" });
  } catch (error: unknown) {
    console.error(error);
    const code = getErrorCode(error);
    if (code === "NOT_FOUND") {
      return res.status(404).json({ mensaje: "Empleado no encontrado" });
    }
    if (code === "23503") {
      return res.status(400).json({ mensaje: "No se puede eliminar el empleado porque tiene registros asociados" });
    }
    res.status(500).json({ mensaje: "Error al eliminar el empleado" });
  }
};
