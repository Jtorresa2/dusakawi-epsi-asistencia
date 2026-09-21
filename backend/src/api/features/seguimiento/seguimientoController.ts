import * as seguimientoService from "./seguimientoService";
import { Request, Response } from "express";

export const obtener = async (req: Request, res: Response) => {
  try {
    const hoy = seguimientoService.hoyISO();
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const ayerISO = seguimientoService.fmtDate(ayer);

    const filtros = {
      fecha_desde: (req.query.fecha_desde as string) || ayerISO,
      fecha_hasta: (req.query.fecha_hasta as string) || hoy,
      area: (req.query.area as string) || undefined,
      piso: (req.query.piso as string) || undefined,
      busqueda: (req.query.busqueda as string) || undefined,
      situacion: (req.query.situacion as string) || undefined,
      page: req.query.page || 1,
      pageSize: req.query.pageSize || undefined,
    };

    const situacionesValidas: readonly string[] = Object.values(seguimientoService.SITUACION);
    if (filtros.situacion && !situacionesValidas.includes(filtros.situacion)) {
      return res.status(400).json({
        mensaje:
          "situacion inválida. Valores: ausencia, falta_manana, falta_tarde, salida_no_registrada, jornada_abierta",
      });
    }

    const resultado = await seguimientoService.clasificar(filtros);
    res.json(resultado);
  } catch (error) {
    console.error("Error en /api/seguimiento:", error);
    res.status(500).json({ mensaje: "Error al obtener el seguimiento de asistencia" });
  }
};
