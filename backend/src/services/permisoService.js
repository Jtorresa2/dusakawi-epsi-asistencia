const db = require("../config/db");

exports.obtenerTodos = async () => {
  const [rows] = await db.query(`
    SELECT
      p.*,
      e.nombre AS empleado_nombre,
      e.apellido AS empleado_apellido,
      u.username AS registrado_por_nombre
    FROM permisos p
    LEFT JOIN empleado e ON e.id = p.empleado_id
    LEFT JOIN usuarios u ON u.id = p.registrado_por
    ORDER BY p.creado_en DESC
  `);
  return rows;
};

exports.crear = async (data, usuarioId) => {
  const { empleado_id, fecha_desde, fecha_hasta, motivo, tipo } = data;
  const tipoPermiso = tipo || "completo";

  if (!empleado_id || !fecha_desde || !fecha_hasta || !motivo) {
    throw new Error("empleado_id, fecha_desde, fecha_hasta y motivo son requeridos");
  }
  if (!["completo", "mañana", "tarde"].includes(tipoPermiso)) {
    throw new Error("tipo debe ser: completo, mañana o tarde");
  }

  // 1. Guardar el permiso
  const [rows, result] = await db.query(
    `INSERT INTO permisos (empleado_id, fecha_desde, fecha_hasta, motivo, tipo, registrado_por)
     VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
    [empleado_id, fecha_desde, fecha_hasta, motivo, tipoPermiso, usuarioId || null]
  );

  const permisoId = rows[0]?.id || result.insertId;
  let diasGenerados = 0;

  if (tipoPermiso === "completo") {
    // 2. Solo completo auto-marca asistencia justificada
    const inicio = new Date(fecha_desde);
    const fin = new Date(fecha_hasta);
    const dias = [];

    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      const diaSemana = d.getDay();
      if (diaSemana === 0 || diaSemana === 6) continue;
      const fechaStr = d.toISOString().split("T")[0];
      dias.push(fechaStr);
    }

    for (const fecha of dias) {
      const [existentes] = await db.query(
        `SELECT id FROM asistencia WHERE empleado_id = ? AND fecha = ?`,
        [empleado_id, fecha]
      );

      if (existentes.length === 0) {
        await db.query(
          `INSERT INTO asistencia (empleado_id, fecha, estado, observacion, horas_trabajadas, minutos_tardanza)
           VALUES (?, ?, 'justificado', ?, 0, 0)`,
          [empleado_id, fecha, `Permiso: ${motivo}`]
        );
      }
    }

    diasGenerados = dias.length;
  } else {
    // mañana / tarde → solo registro del permiso, no se auto-marca asistencia
    // el empleado puede marcar la otra mitad normalmente
    diasGenerados = 0;
  }

  return { id: permisoId, dias_generados: diasGenerados };
};
