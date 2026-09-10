const { fileTypeFromFile } = require("file-type");
const fs = require("fs");

// Tipos MIME permitidos según el contexto
const TIPOS_INCIDENCIA = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const TIPOS_FIRMA = new Set([
  "application/pdf",
]);

/**
 * Valida que el archivo subido tenga el MIME type real correcto,
 * leyendo los primeros bytes (firma) — no solo el nombre/extensión.
 * Uso: upload.single("evidencia"), validarArchivo(TIPOS_INCIDENCIA), controlador
 */
function validarArchivo(tiposPermitidos) {
  return async (req, res, next) => {
    if (!req.file) {
      return next(); // No hay archivo — lo maneja el controlador
    }

    try {
      const tipo = await fileTypeFromFile(req.file.path);

      // fileType devuelve undefined si no reconoce la firma
      if (!tipo || !tiposPermitidos.has(tipo.mime)) {
        // Eliminar archivo no válido del disco
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({
          mensaje: "Archivo no válido: el contenido no coincide con el formato permitido (jpg, png, webp, gif, pdf).",
        });
      }

      next();
    } catch (error) {
      fs.unlink(req.file.path, () => {});
      return res.status(500).json({ mensaje: "Error al validar el archivo" });
    }
  };
}

module.exports = { TIPOS_INCIDENCIA, TIPOS_FIRMA, validarArchivo };