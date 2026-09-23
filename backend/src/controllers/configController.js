const pool = require("../config/db");
const { getAllTableNames, getTableData } = require("../services/backupService");

async function leerConfig() {
  const [rows] = await pool.query("SELECT key AS clave, value AS valor, type AS tipo FROM config ORDER BY key");
  const config = {};
  for (const row of rows) {
    if (row.tipo === "number") config[row.clave] = Number(row.valor);
    else if (row.tipo === "boolean") config[row.clave] = row.valor === "true";
    else config[row.clave] = row.valor;
  }
  return config;
}

// GET /api/config — devuelve la config como objeto { clave: valor }
exports.obtenerConfig = async (req, res) => {
  try {
    const config = await leerConfig();
    res.json(config);
  } catch (error) {
    console.error("Error al obtener config:", error);
    res.status(500).json({ mensaje: "Error al cargar configuración" });
  }
};

// PUT /api/config — actualiza una o varias claves
exports.actualizarConfig = async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    if (entries.length === 0) {
      return res.status(400).json({ mensaje: "No hay datos para guardar" });
    }

    for (const [clave, valor] of entries) {
      const tipo = typeof valor === "number" ? "number" : typeof valor === "boolean" ? "boolean" : "text";
      await pool.query(
        `INSERT INTO config (key, value, type) VALUES (?, ?, ?)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, type = EXCLUDED.type`,
        [clave, String(valor), tipo]
      );
    }

    const config = await leerConfig();
    res.json({ mensaje: "Configuración guardada", config });
  } catch (error) {
    console.error("Error al guardar config:", error);
    res.status(500).json({ mensaje: "Error al guardar configuración" });
  }
};

// POST /api/config/respaldar — genera backup JSON de todas las tablas
exports.respaldarBD = async (req, res) => {
  try {
    const tablas = await getAllTableNames();
    const backup = {};

    for (const tabla of tablas) {
      backup[tabla] = await getTableData(tabla);
    }

    // Actualizar fecha de último respaldo
    const ahora = new Date().toISOString();
    await pool.query(
      `INSERT INTO config (key, value, type) VALUES ('fecha_ultimo_respaldo', ?, 'text')
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [ahora]
    );

    res.json({ ...backup, _respaldo: { fecha: ahora } });
  } catch (error) {
    console.error("Error al generar respaldo:", error);
    res.status(500).json({ mensaje: "Error al generar respaldo" });
  }
};