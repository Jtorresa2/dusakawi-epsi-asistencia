import { procesarMarca } from './marcacionService';
import { Request, Response } from 'express';
import { getErrorMessage } from '../../shared/utils/errors';

export const registrarMarcacion = async (req: Request, res: Response) => {
  try {
    const { usuario_id, fecha_hora, tipo } = req.body;

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
    res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
  }
};
