const db = require("../config/db");

const TIPOS_VALIDOS = ["permiso", "vacaciones", "incapacidad", "comision", "licencia", "suspension"];
const MODALIDADES_VALIDAS = ["full_day", "hours", "morning", "afternoon"];

function mapModalidad(modalidad) {
  const map = { dia_completo: "full_day", horas: "hours", manana: "morning", tarde: "afternoon" };
  return map[modalidad] || modalidad || "full_day";
}

function unmapModalidad(modalidad) {
  const map = { full_day: "dia_completo", hours: "horas", morning: "manana", afternoon: "tarde" };
  return map[modalidad] || modalidad || "dia_completo";
}

exports.obtenerTodos = async () => {
  const [rows] = await db.query(`
    SELECT
      n.id,
      n.user_id AS empleado_id,
      n.date_from AS fecha_desde,
      n.date_to AS fecha_hasta,
      n.reason AS motivo,
      n.news_type AS tipo_novedad,
      n.mark_type AS modalidad,
      n.time_from AS hora_desde,
      n.time_to AS hora_hasta,
      n.status AS estado,
      n.rejection_reason AS motivo_rechazo,
      n.created_at AS creado_en,
      TRIM(CONCAT(u.first_name, ' ', COALESCE(u.middle_name, ''))) AS empleado_nombre,
      TRIM(CONCAT(u.first_surname, ' ', COALESCE(u.second_surname, ''))) AS empleado_apellido,
      reg.username AS registrado_por_nombre
    FROM news n
    LEFT JOIN users u ON u.id = n.user_id
    LEFT JOIN users reg ON reg.id = n.registered_by
    ORDER BY n.created_at DESC
  `);
  return rows;
};

exports.crear = async (data, usuarioId) => {
  const { empleado_id, fecha_desde, fecha_hasta, motivo, tipo_novedad, modalidad, hora_desde, hora_hasta } = data;
  const novedadVal = tipo_novedad || "permiso";
  const modalidadVal = mapModalidad(modalidad);

  if (!empleado_id || !fecha_desde || !fecha_hasta || !motivo) {
    throw new Error("empleado_id, fecha_desde, fecha_hasta y motivo son requeridos");
  }
  if (!TIPOS_VALIDOS.includes(novedadVal)) {
    throw new Error("tipo_novedad inválido");
  }
  if (!MODALIDADES_VALIDAS.includes(modalidadVal)) {
    throw new Error("modalidad inválida");
  }

  if (modalidadVal === "hours") {
    if (!hora_desde || !hora_hasta) {
      throw new Error("Para novedades por horas, hora_desde y hora_hasta son requeridos");
    }
    if (hora_desde >= hora_hasta) {
      throw new Error("La hora_hasta debe ser posterior a hora_desde");
    }
  }

  const [rows, result] = await db.query(
    `INSERT INTO news (user_id, date_from, date_to, reason, news_type, mark_type, time_from, time_to, registered_by)
     VALUES (?, ?, ?, ?, ?, ?, ?::time, ?::time, ?) RETURNING id`,
    [empleado_id, fecha_desde, fecha_hasta, motivo, novedadVal, modalidadVal, hora_desde || null, hora_hasta || null, usuarioId || null]
  );

  const novedadId = rows[0]?.id || result.insertId;
  let diasGenerados = 0;

  if (novedadVal === "comision" || modalidadVal === "full_day") {
    const estado = novedadVal === "comision" ? "comision" : "justified";
    const observacion = novedadVal === "comision" ? `Comisión: ${motivo}` : `Novedad: ${motivo}`;

    const inicio = new Date(fecha_desde);
    const fin = new Date(fecha_hasta);
    const dias = [];

    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      const diaSemana = d.getDay();
      if (diaSemana === 0 || diaSemana === 6) continue;
      dias.push(d.toISOString().split("T")[0]);
    }

    for (const fecha of dias) {
      const [existentes] = await db.query(
        `SELECT id FROM attendances WHERE user_id = ? AND date = ?::date`,
        [empleado_id, fecha]
      );
      if (existentes.length === 0) {
        await db.query(
          `INSERT INTO attendances (user_id, date, status, observation, worked_hours, late_minutes)
           VALUES (?, ?::date, ?, ?, 0, 0)`,
          [empleado_id, fecha, estado, observacion]
        );
      }
    }

    diasGenerados = dias.length;
  } else {
    diasGenerados = 0;
  }

  return { id: novedadId, dias_generados: diasGenerados };
};

exports.actualizar = async (id, data, usuarioId) => {
  const { empleado_id, fecha_desde, fecha_hasta, motivo, tipo_novedad, modalidad, hora_desde, hora_hasta } = data;
  const novedad = tipo_novedad || "permiso";
  const modalidadVal = mapModalidad(modalidad);

  if (!empleado_id || !fecha_desde || !fecha_hasta || !motivo) {
    throw new Error("empleado_id, fecha_desde, fecha_hasta y motivo son requeridos");
  }
  if (!TIPOS_VALIDOS.includes(novedad)) {
    throw new Error("tipo_novedad inválido");
  }
  if (!MODALIDADES_VALIDAS.includes(modalidadVal)) {
    throw new Error("modalidad inválida");
  }
  if (modalidadVal === "hours" && hora_desde && hora_hasta && hora_desde >= hora_hasta) {
    throw new Error("La hora_hasta debe ser posterior a hora_desde");
  }

  await db.query(
    `UPDATE news SET user_id = ?, date_from = ?, date_to = ?, reason = ?, news_type = ?, mark_type = ?, time_from = ?::time, time_to = ?::time, registered_by = ? WHERE id = ?`,
    [empleado_id, fecha_desde, fecha_hasta, motivo, novedad, modalidadVal, hora_desde || null, hora_hasta || null, usuarioId || null, id]
  );
  return { id };
};

exports.obtenerPorEmpleado = async (empleadoId) => {
  const [rows] = await db.query(`
    SELECT
      n.id,
      n.user_id AS empleado_id,
      n.date_from AS fecha_desde,
      n.date_to AS fecha_hasta,
      n.reason AS motivo,
      n.news_type AS tipo_novedad,
      n.mark_type AS modalidad,
      n.time_from AS hora_desde,
      n.time_to AS hora_hasta,
      n.status AS estado,
      n.rejection_reason AS motivo_rechazo,
      n.created_at AS creado_en,
      TRIM(CONCAT(u.first_name, ' ', COALESCE(u.middle_name, ''))) AS empleado_nombre,
      TRIM(CONCAT(u.first_surname, ' ', COALESCE(u.second_surname, ''))) AS empleado_apellido
    FROM news n
    LEFT JOIN users u ON u.id = n.user_id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
  `, [empleadoId]);
  return rows;
};

exports.eliminar = async (id) => {
  await db.query(`DELETE FROM news WHERE id = ?`, [id]);
  return { id };
};