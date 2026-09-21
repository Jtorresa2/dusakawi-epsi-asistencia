import pool from "../config/db";
import { getAllTableNames, getTableData } from "../services/backupService";
import { Request, Response } from "express";

type ConfigValue = string | number | boolean;

interface ConfigRow {
  key: string;
  value: string;
  type: string;
}

async function leerConfig(): Promise<Record<string, ConfigValue>> {
  const { rows } = await pool.query<ConfigRow>("SELECT key, value, type FROM config ORDER BY id");
  const config: Record<string, ConfigValue> = {};
  for (const row of rows) {
    if (row.type === "number") config[row.key] = Number(row.value);
    else if (row.type === "boolean") config[row.key] = row.value === "true";
    else config[row.key] = row.value;
  }
  return config;
}

export const obtenerConfig = async (req: Request, res: Response) => {
  try {
    const config = await leerConfig();
    res.json(config);
  } catch (error) {
    console.error("Error al obtener config:", error);
    res.status(500).json({ mensaje: "Error al cargar configuración" });
  }
};

export const actualizarConfig = async (req: Request, res: Response) => {
  try {
    const entries = Object.entries(req.body);
    if (entries.length === 0) {
      return res.status(400).json({ mensaje: "No hay datos para guardar" });
    }

    for (const [clave, valor] of entries) {
      const tipo = typeof valor === "number" ? "number" : typeof valor === "boolean" ? "boolean" : "text";
      await pool.query(
        `INSERT INTO config (key, value, type) VALUES ($1, $2, $3)
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

export const respaldarBD = async (req: Request, res: Response) => {
  try {
    const tablas = await getAllTableNames();
    const backup: Record<string, Record<string, unknown>[]> = {};

    for (const tabla of tablas) {
      backup[tabla] = await getTableData(tabla);
    }

    const ahora = new Date().toISOString();
    await pool.query(
      `INSERT INTO config (key, value, type) VALUES ('fecha_ultimo_respaldo', $1, 'text')
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [ahora]
    );

    res.json({ ...backup, _respaldo: { fecha: ahora } });
  } catch (error) {
    console.error("Error al generar respaldo:", error);
    res.status(500).json({ mensaje: "Error al generar respaldo" });
  }
};
