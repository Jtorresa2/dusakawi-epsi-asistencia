import { Request, Response, NextFunction } from 'express';
import { fromFile } from 'file-type';
import fs from 'fs';

// Tipos MIME permitidos según el contexto
export const TIPOS_INCIDENCIA = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

export const TIPOS_FIRMA = new Set([
  'application/pdf',
]);

/**
 * Valida que el archivo subido tenga el MIME type real correcto,
 * leyendo los primeros bytes (firma) — no solo el nombre/extensión.
 * Uso: upload.single("evidencia"), validarArchivo(TIPOS_INCIDENCIA), controlador
 */
export function validarArchivo(tiposPermitidos: Set<string>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) {
      next(); // No hay archivo — lo maneja el controlador
      return;
    }

    try {
      const tipo = await fromFile(req.file.path);

      // fileType devuelve undefined si no reconoce la firma
      if (!tipo || !tiposPermitidos.has(tipo.mime)) {
        // Eliminar archivo no válido del disco
        fs.unlink(req.file.path, () => {});
        res.status(400).json({
          mensaje:
            'Archivo no válido: el contenido no coincide con el formato permitido (jpg, png, webp, gif, pdf).',
        });
        return;
      }

      next();
    } catch {
      fs.unlink(req.file.path, () => {});
      res.status(500).json({ mensaje: 'Error al validar el archivo' });
    }
  };
}
