const seguimientoService = require('../services/seguimientoService');

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

    const situacionesValidas = Object.values(seguimientoService.SITUACION);
    if (filtros.situacion && !situacionesValidas.includes(filtros.situacion)) {
      return res.status(400).json({
        mensaje:
          'situacion inválida. Valores: absence, missing_morning, missing_afternoon, unregistered_exit, open_day',
      });
    }

    const resultado = await seguimientoService.clasificar(filtros);
    res.json(resultado);
  } catch (error) {
    console.error('Error en /api/seguimiento:', error);
    res.status(500).json({ mensaje: 'Error al obtener el seguimiento de asistencia' });
  }
};