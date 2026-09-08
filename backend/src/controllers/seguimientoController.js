const seguimientoService = require("../services/seguimientoService");

/**
 * GET /api/seguimiento — lista unificada de situaciones de asistencia + KPIs.
 *
 * Query params: fecha_desde (default ayer), fecha_hasta (default hoy), area,
 * piso, situacion (uno de los 5 slugs), busqueda, page, pageSize (≤500).
 * Solo lectura: no muta ninguna tabla.
 */
exports.obtener = async (req, res) => {
  try {
    const hoy = seguimientoService.hoyISO();
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const ayerISO = seguimientoService.fmtDate(ayer);

    const filtros = {
      fecha_desde: req.query.fecha_desde || ayerISO,
      fecha_hasta: req.query.fecha_hasta || hoy,
      area: req.query.area || undefined,
      piso: req.query.piso || undefined,
      busqueda: req.query.busqueda || undefined,
      situacion: req.query.situacion || undefined,
      page: req.query.page || 1,
      pageSize: req.query.pageSize || undefined,
    };

    if (
      filtros.situacion &&
      !Object.values(seguimientoService.SITUACION).includes(filtros.situacion)
    ) {
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
