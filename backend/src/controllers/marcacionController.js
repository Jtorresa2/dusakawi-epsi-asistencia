const { procesarMarca } = require('../services/marcacionService');

/**
 * POST /api/marcacion
 * Recibe una marca biométrica y la procesa contra el horario del usuario.
 *
 * Body:
 *   usuario_id  (number, required)
 *   fecha_hora  (string, required) — "YYYY-MM-DD HH:MM:SS"
 *   tipo        (string, required) — "huella" | "facial" | "tarjeta"
 */
exports.registrarMarcacion = async (req, res) => {
  try {
    const { usuario_id, fecha_hora, tipo } = req.body;

    // Validaciones básicas
    if (!usuario_id || !fecha_hora || !tipo) {
      return res.status(400).json({
        mensaje: 'Faltan campos obligatorios',
        requeridos: ['usuario_id', 'fecha_hora', 'tipo'],
      });
    }

    const tiposValidos = ['huella', 'facial', 'tarjeta', 'manual'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        mensaje: `Tipo de marcación inválido. Valores permitidos: ${tiposValidos.join(', ')}`,
      });
    }

    // Validar formato de fecha_hora
    const fechaHoraRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/;
    if (!fechaHoraRegex.test(fecha_hora)) {
      return res.status(400).json({
        mensaje: 'Formato de fecha_hora inválido. Use "YYYY-MM-DD HH:MM" o "YYYY-MM-DD HH:MM:SS"',
      });
    }

    const resultado = await procesarMarca(usuario_id, fecha_hora, tipo);

    if (resultado.error) {
      return res.status(422).json(resultado);
    }

    res.status(201).json({
      mensaje: 'Marca procesada correctamente',
      ...resultado,
    });
  } catch (err) {
    console.error('Error al procesar marcación:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};
