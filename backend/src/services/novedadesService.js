const db = require("../config/db");

exports.obtenerTodos = async () => {
  const [rows] = await db.query(`
    SELECT
      p.*,
      TRIM(CONCAT(u.first_name, ' ', COALESCE(u.middle_name, ''))) AS empleado_nombre,
      TRIM(CONCAT(u.first_surname, ' ', COALESCE(u.second_surname, ''))) AS empleado_apellido,
      reg.username AS registrado_por_nombre
    FROM permisos p
    LEFT JOIN users u ON u.id = p.empleado_id
    LEFT JOIN users reg ON reg.id = p.registrado_por
    ORDER BY p.creado_en DESC
  `);
  return rows;
};

exports.crear = async (data, usuarioId) => {
  const { empleado_id, fecha_desde, fecha_hasta, motivo, tipo_novedad, modalidad, hora_desde, hora_hasta } = data;
  const novedadVal = tipo_novedad || "permiso";
  const modalidadVal = modalidad || "dia_completo";

  if (!empleado_id || !fecha_desde || !fecha_hasta || !motivo) {
    throw new Error("empleado_id, fecha_desde, fecha_hasta y motivo son requeridos");
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
    `INSERT INTO permisos (empleado_id, fecha_desde, fecha_hasta, motivo, tipo_novedad, tipo, hora_desde, hora_hasta, registrado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    [empleado_id, fecha_desde, fecha_hasta, motivo, novedadVal, modalidadVal, hora_desde || null, hora_hasta || null, usuarioId || null]
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
        `SELECT id FROM attendances WHERE user_id = ? AND DATE(created_at) = ?::date`,
        [empleado_id, fecha]
      );
      if (existentes.length === 0) {
        await db.query(
          `INSERT INTO attendances (user_id, created_at, estado, observacion, horas_trabajadas, minutos_tardanza)
           VALUES (?, ?::timestamptz, ?, ?, 0, 0)`,
          [empleado_id, `${fecha} 08:00:00+00`, estado, observacion]
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
  const modalidadVal = modalidad || "dia_completo";

  if (!empleado_id || !fecha_desde || !fecha_hasta || !motivo) {
    throw new Error("empleado_id, fecha_desde, fecha_hasta y motivo son requeridos");
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
    `UPDATE permisos SET empleado_id = ?, fecha_desde = ?, fecha_hasta = ?, motivo = ?, tipo_novedad = ?, tipo = ?, hora_desde = ?, hora_hasta = ? WHERE id = ?`,
    [empleado_id, fecha_desde, fecha_hasta, motivo, novedad, modalidadVal, hora_desde || null, hora_hasta || null, id]
  );
  return { id };
};

exports.obtenerPorEmpleado = async (empleadoId) => {
  const [rows] = await db.query(`
    SELECT
      p.*,
      TRIM(CONCAT(u.first_name, ' ', COALESCE(u.middle_name, ''))) AS empleado_nombre,
      TRIM(CONCAT(u.first_surname, ' ', COALESCE(u.second_surname, ''))) AS empleado_apellido
    FROM permisos p
    LEFT JOIN users u ON u.id = p.empleado_id
    WHERE p.empleado_id = ?
    ORDER BY p.creado_en DESC
  `, [empleadoId]);
  return rows;
};

exports.eliminar = async (id) => {
  await db.query(`DELETE FROM permisos WHERE id = ?`, [id]);
  return { id };
};


