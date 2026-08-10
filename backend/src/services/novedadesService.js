const db = require("../config/db");

exports.obtenerTodos = async () => {
  const [rows] = await db.query(`
    SELECT
      p.*,
      uu.nombre AS empleado_nombre,
      uu.apellido AS empleado_apellido,
      u.username AS registrado_por_nombre
    FROM novedades p
    LEFT JOIN usuarios uu ON uu.id = p.usuario_id
    LEFT JOIN usuarios u ON u.id = p.registrado_por
    ORDER BY p.creado_en DESC
  `);
  return rows;
};

exports.crear = async (data, usuarioId) => {
  const { usuario_id, empleado_id, fecha_desde, fecha_hasta, motivo, tipo_novedad, modalidad, hora_desde, hora_hasta } = data;
  const targetId = usuario_id || empleado_id; // backward compat with old clients
  const novedadVal = tipo_novedad || "permiso";
  const modalidadVal = modalidad || "dia_completo";

  if (!targetId || !fecha_desde || !fecha_hasta || !motivo) {
    throw new Error("usuario_id, fecha_desde, fecha_hasta y motivo son requeridos");
  }
  if (!["permiso", "vacaciones", "incapacidad", "comision", "licencia", "suspension"].includes(novedadVal)) {
    throw new Error("tipo_novedad inválido");
  }
  if (!["dia_completo", "horas", "manana", "tarde"].includes(modalidadVal)) {
    throw new Error("modalidad inválida");
  }

  if (modalidadVal === "horas") {
    if (!hora_desde || !hora_hasta) {
      throw new Error("Para novedades por horas, hora_desde y hora_hasta son requeridos");
    }
    if (hora_desde >= hora_hasta) {
      throw new Error("La hora_hasta debe ser posterior a hora_desde");
    }
  }

  const [rows, result] = await db.query(
    `INSERT INTO novedades (usuario_id, fecha_desde, fecha_hasta, motivo, tipo_novedad, tipo, hora_desde, hora_hasta, registrado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    [targetId, fecha_desde, fecha_hasta, motivo, novedadVal, modalidadVal, hora_desde || null, hora_hasta || null, usuarioId || null]
  );

  const novedadId = rows[0]?.id || result.insertId;
  let diasGenerados = 0;

  if (novedadVal === "comision" || modalidadVal === "dia_completo") {
    const estado = novedadVal === "comision" ? "comision" : "justificado";
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
        `SELECT id FROM asistencia WHERE usuario_id = ? AND fecha = ?`,
        [targetId, fecha]
      );
      if (existentes.length === 0) {
        await db.query(
          `INSERT INTO asistencia (usuario_id, fecha, estado, observacion, horas_trabajadas, minutos_tardanza)
           VALUES (?, ?, ?, ?, 0, 0)`,
          [targetId, fecha, estado, observacion]
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
  const { usuario_id, empleado_id, fecha_desde, fecha_hasta, motivo, tipo_novedad, modalidad, hora_desde, hora_hasta } = data;
  const targetId = usuario_id || empleado_id; // backward compat
  const novedad = tipo_novedad || "permiso";
  const modalidadVal = modalidad || "dia_completo";

  if (!targetId || !fecha_desde || !fecha_hasta || !motivo) {
    throw new Error("usuario_id, fecha_desde, fecha_hasta y motivo son requeridos");
  }
  if (!["permiso", "vacaciones", "incapacidad", "comision", "licencia", "suspension"].includes(novedad)) {
    throw new Error("tipo_novedad inválido");
  }
  if (!["dia_completo", "horas", "manana", "tarde"].includes(modalidadVal)) {
    throw new Error("modalidad inválida");
  }
  if (modalidadVal === "horas" && hora_desde && hora_hasta && hora_desde >= hora_hasta) {
    throw new Error("La hora_hasta debe ser posterior a hora_desde");
  }

  await db.query(
    `UPDATE novedades SET usuario_id = ?, fecha_desde = ?, fecha_hasta = ?, motivo = ?, tipo_novedad = ?, tipo = ?, hora_desde = ?, hora_hasta = ? WHERE id = ?`,
    [targetId, fecha_desde, fecha_hasta, motivo, novedad, modalidadVal, hora_desde || null, hora_hasta || null, id]
  );
  return { id };
};

exports.obtenerPorEmpleado = async (usuarioId) => {
  const [rows] = await db.query(`
    SELECT
      p.*,
      u.nombre AS empleado_nombre,
      u.apellido AS empleado_apellido
    FROM novedades p
    LEFT JOIN usuarios u ON u.id = p.usuario_id
    WHERE p.usuario_id = ?
    ORDER BY p.creado_en DESC
  `, [usuarioId]);
  return rows;
};

exports.eliminar = async (id) => {
  await db.query(`DELETE FROM novedades WHERE id = ?`, [id]);
  return { id };
};


