const pool = require('../config/db');

function timeToMinutes(t) {
  if (!t) return null;
  const parts = t.split(':');
  if (parts.length < 2) return null;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function calculateAttendanceMetrics(e1, s1, e2, s2, tolerancia = 15) {
  let minutesWorked = 0;
  const mE1 = timeToMinutes(e1);
  const mS1 = timeToMinutes(s1);
  const mE2 = timeToMinutes(e2);
  const mS2 = timeToMinutes(s2);

  if (mE1 !== null && mS1 !== null && mS1 > mE1) {
    minutesWorked += (mS1 - mE1);
  }
  if (mE2 !== null && mS2 !== null && mS2 > mE2) {
    minutesWorked += (mS2 - mE2);
  }

  let lateness = 0;
  // Morning entry: 08:00 (480 min) + tolerancia
  if (mE1 !== null && mE1 > (480 + tolerancia)) {
    lateness += (mE1 - 480);
  }
  // Afternoon entry: 14:00 (840 min) + tolerancia
  if (mE2 !== null && mE2 > (840 + tolerancia)) {
    lateness += (mE2 - 840);
  }

  const horas_trabajadas = +(minutesWorked / 60).toFixed(2);
  return { horas_trabajadas, minutos_tardanza: lateness };
}

exports.getRegistros = async (req, res) => {
  try {
    const { fecha, fecha_desde, fecha_hasta, area, piso, estado } = req.query;

    let query = `
      SELECT
        a.id,
        a.user_id AS empleado_id,
        COALESCE(dd.document_number, '') AS cedula,
        TRIM(CONCAT(u.first_name, ' ', COALESCE(u.middle_name, ''), ' ', u.first_surname, ' ', COALESCE(u.second_surname, ''))) AS empleado,
        COALESCE(ar.name, '') AS area,
        COALESCE(fl.name, '') AS piso,
        TO_CHAR(a.created_at, 'YYYY-MM-DD') AS fecha,
        TO_CHAR(a.first_entry_time, 'HH24:MI') AS entrada1,
        TO_CHAR(a.first_departure_time, 'HH24:MI') AS salida1,
        TO_CHAR(a.last_entry_time, 'HH24:MI') AS entrada2,
        TO_CHAR(a.last_departure_time, 'HH24:MI') AS salida2,
        COALESCE(a.horas_trabajadas, 0) AS horas_trabajadas,
        COALESCE(a.horas_extra, 0) AS horas_extra,
        COALESCE(a.minutos_tardanza, 0) AS minutos_tardanza,
        COALESCE(a.tipo_marcacion, 'Web') AS tipo_marcacion,
        COALESCE(a.estado, 'puntual') AS estado,
        a.observacion,
        EXTRACT(DOW FROM a.created_at) + 1 AS dia_semana
      FROM attendances a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN document_details dd ON dd.user_id = u.id
      LEFT JOIN areas ar ON u.area_id = ar.id
      LEFT JOIN floors fl ON ar.floor_id = fl.id
      WHERE 1=1
    `;

    const params = [];

    if (fecha_desde && fecha_hasta) {
      query += ` AND DATE(a.created_at) BETWEEN ? AND ?`;
      params.push(fecha_desde, fecha_hasta);
    } else if (fecha) {
      query += ` AND DATE(a.created_at) = ?`;
      params.push(fecha);
    }

    if (area && area !== 'Todas las áreas' && area !== 'Todas') {
      query += ` AND ar.name ILIKE ?`;
      params.push(`%${area}%`);
    }

    if (piso) {
      query += ` AND (fl.name ILIKE ? OR fl.name = ?)`;
      params.push(`%${piso}%`, `Piso ${piso}`);
    }

    if (estado) {
      query += ` AND LOWER(a.estado) = LOWER(?)`;
      params.push(estado);
    }

    query += ` ORDER BY a.created_at DESC, a.first_entry_time DESC`;

    const [rows] = await pool.query(query, params);
    res.json({ registros: rows });
  } catch (err) {
    console.error('Error en getRegistros:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.registrarManual = async (req, res) => {
  try {
    const { empleado_id, fecha, entrada1, salida1, entrada2, salida2, tipo_marcacion, observacion } = req.body;

    if (!empleado_id || !fecha) {
      return res.status(400).json({ mensaje: 'Empleado y fecha son obligatorios' });
    }

    const t_e1 = entrada1 ? (entrada1.length === 5 ? `${entrada1}:00` : entrada1) : null;
    const t_s1 = salida1 ? (salida1.length === 5 ? `${salida1}:00` : salida1) : null;
    const t_e2 = entrada2 ? (entrada2.length === 5 ? `${entrada2}:00` : entrada2) : null;
    const t_s2 = salida2 ? (salida2.length === 5 ? `${salida2}:00` : salida2) : null;

    const { horas_trabajadas, minutos_tardanza } = calculateAttendanceMetrics(t_e1, t_s1, t_e2, t_s2);
    let estado = 'puntual';
    if (!t_e1 && !t_e2) {
      estado = 'ausente';
    } else if (minutos_tardanza > 0) {
      estado = 'tardanza';
    }

    const [existing] = await pool.query(
      `SELECT id FROM attendances WHERE user_id = ? AND DATE(created_at) = ?::date`,
      [empleado_id, fecha]
    );

    let id;
    if (existing && existing.length > 0) {
      id = existing[0].id;
      await pool.query(
        `UPDATE attendances SET
          first_entry_time = ?,
          first_departure_time = ?,
          last_entry_time = ?,
          last_departure_time = ?,
          tipo_marcacion = ?,
          estado = ?,
          observacion = ?,
          horas_trabajadas = ?,
          minutos_tardanza = ?
        WHERE id = ?`,
        [t_e1, t_s1, t_e2, t_s2, tipo_marcacion || 'manual', estado, observacion || null, horas_trabajadas, minutos_tardanza, id]
      );
    } else {
      const createdAt = `${fecha} 08:00:00+00`;
      const [insertRes] = await pool.query(
        `INSERT INTO attendances
          (user_id, created_at, first_entry_time, first_departure_time, last_entry_time, last_departure_time, tipo_marcacion, estado, observacion, horas_trabajadas, minutos_tardanza)
         VALUES (?, ?::timestamptz, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING id`,
        [empleado_id, createdAt, t_e1, t_s1, t_e2, t_s2, tipo_marcacion || 'manual', estado, observacion || null, horas_trabajadas, minutos_tardanza]
      );
      id = insertRes?.[0]?.id || insertRes?.insertId;
    }

    res.status(201).json({ mensaje: 'Asistencia registrada correctamente', id });
  } catch (err) {
    console.error('Error en registrarManual:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.marcar = async (req, res) => {
  try {
    const empleado_id = req.body.empleado_id || req.user?.empleado_id || req.user?.id;
    if (!empleado_id) {
      return res.status(400).json({ mensaje: 'Empleado no identificado' });
    }

    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const [existing] = await pool.query(
      `SELECT * FROM attendances WHERE user_id = ? AND DATE(created_at) = CURRENT_DATE ORDER BY created_at DESC LIMIT 1`,
      [empleado_id]
    );

    let tipo_casilla = 'first_entry_time';
    let recordId;

    if (!existing || existing.length === 0) {
      const hour = now.getHours();
      let state = 'puntual';
      let lateness = 0;
      if (hour < 13) {
        tipo_casilla = 'first_entry_time';
        const diff = (hour * 60 + now.getMinutes()) - 480;
        if (diff > 15) {
          state = 'tardanza';
          lateness = diff;
        }
      } else {
        tipo_casilla = 'last_entry_time';
        const diff = (hour * 60 + now.getMinutes()) - 840;
        if (diff > 15) {
          state = 'tardanza';
          lateness = diff;
        }
      }

      const [insertRes] = await pool.query(
        `INSERT INTO attendances
          (user_id, created_at, ${tipo_casilla}, tipo_marcacion, estado, minutos_tardanza)
         VALUES (?, NOW(), ?, 'Web', ?, ?)
         RETURNING id`,
        [empleado_id, currentTimeStr, state, lateness]
      );
      recordId = insertRes?.[0]?.id || insertRes?.insertId;
    } else {
      const rec = existing[0];
      recordId = rec.id;

      if (!rec.first_entry_time) {
        tipo_casilla = 'first_entry_time';
      } else if (!rec.first_departure_time && now.getHours() < 14) {
        tipo_casilla = 'first_departure_time';
      } else if (!rec.last_entry_time && now.getHours() < 16) {
        tipo_casilla = 'last_entry_time';
      } else if (!rec.last_departure_time) {
        tipo_casilla = 'last_departure_time';
      } else {
        return res.status(400).json({ mensaje: 'Todas las marcaciones del día han sido completadas' });
      }

      await pool.query(
        `UPDATE attendances SET ${tipo_casilla} = ? WHERE id = ?`,
        [currentTimeStr, recordId]
      );

      const [updatedRec] = await pool.query(`SELECT * FROM attendances WHERE id = ?`, [recordId]);
      if (updatedRec && updatedRec[0]) {
        const uRec = updatedRec[0];
        const metrics = calculateAttendanceMetrics(
          uRec.first_entry_time,
          uRec.first_departure_time,
          uRec.last_entry_time,
          uRec.last_departure_time
        );
        await pool.query(
          `UPDATE attendances SET horas_trabajadas = ?, minutos_tardanza = ? WHERE id = ?`,
          [metrics.horas_trabajadas, metrics.minutos_tardanza, recordId]
        );
      }
    }

    res.json({
      mensaje: 'Marcación registrada con éxito',
      id: recordId,
      casilla: tipo_casilla,
      hora: currentTimeStr.substring(0, 5)
    });
  } catch (err) {
    console.error('Error en marcar:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.getMiAsistencia = async (req, res) => {
  try {
    const mes = parseInt(req.query.mes || (new Date().getMonth() + 1), 10);
    const anio = parseInt(req.query.anio || new Date().getFullYear(), 10);
    const empleado_id = req.user.empleado_id || req.user.id;

    if (!empleado_id) {
      return res.status(400).json({ mensaje: 'Empleado no identificado' });
    }

    const [rows] = await pool.query(`
      SELECT
        a.id,
        TO_CHAR(a.created_at, 'YYYY-MM-DD') AS fecha,
        TO_CHAR(a.first_entry_time, 'HH24:MI') AS entrada1,
        TO_CHAR(a.first_departure_time, 'HH24:MI') AS salida1,
        TO_CHAR(a.last_entry_time, 'HH24:MI') AS entrada2,
        TO_CHAR(a.last_departure_time, 'HH24:MI') AS salida2,
        COALESCE(a.horas_trabajadas, 0) AS horas_trabajadas,
        COALESCE(a.estado, 'puntual') AS estado,
        a.observacion,
        EXTRACT(DOW FROM a.created_at) + 1 AS dia_semana
      FROM attendances a
      WHERE a.user_id = ?
        AND EXTRACT(YEAR FROM a.created_at) = ?
        AND EXTRACT(MONTH FROM a.created_at) = ?
      ORDER BY a.created_at DESC
    `, [empleado_id, anio, mes]);

    const registros = rows.map(r => {
      const rawState = (r.estado || 'puntual').toLowerCase();
      const capitalized = rawState.charAt(0).toUpperCase() + rawState.slice(1);
      return {
        id: r.id,
        fecha: r.fecha,
        entrada1: r.entrada1,
        salida1: r.salida1,
        entrada2: r.entrada2,
        salida2: r.salida2,
        horas: r.horas_trabajadas,
        estado: capitalized,
        dia_semana: r.dia_semana,
        observacion: r.observacion
      };
    });

    res.json({ registros });
  } catch (err) {
    console.error('Error en getMiAsistencia:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.justificarAusencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { observacion, motivo, tipo } = req.body;
    const textoJustificacion = observacion || (motivo ? `${tipo ? `[${tipo}] ` : ''}${motivo}` : 'Justificado por supervisor');

    await pool.query(
      `UPDATE attendances SET estado = 'justificado', observacion = ? WHERE id = ?`,
      [textoJustificacion, id]
    );

    res.json({ mensaje: 'Ausencia justificada correctamente' });
  } catch (err) {
    console.error('Error en justificarAusencia:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.eliminarRegistro = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM attendances WHERE id = ?', [id]);
    res.json({ mensaje: 'Registro eliminado correctamente' });
  } catch (err) {
    console.error('Error en eliminarRegistro:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.actualizarRegistro = async (req, res) => {
  try {
    const { id } = req.params;
    const { entrada1, salida1, entrada2, salida2, fecha, tipo_marcacion, estado, observacion } = req.body;

    const t_e1 = entrada1 ? (entrada1.length === 5 ? `${entrada1}:00` : entrada1) : null;
    const t_s1 = salida1 ? (salida1.length === 5 ? `${salida1}:00` : salida1) : null;
    const t_e2 = entrada2 ? (entrada2.length === 5 ? `${entrada2}:00` : entrada2) : null;
    const t_s2 = salida2 ? (salida2.length === 5 ? `${salida2}:00` : salida2) : null;

    const { horas_trabajadas, minutos_tardanza } = calculateAttendanceMetrics(t_e1, t_s1, t_e2, t_s2);

    let query = `
      UPDATE attendances SET
        first_entry_time = ?,
        first_departure_time = ?,
        last_entry_time = ?,
        last_departure_time = ?,
        tipo_marcacion = ?,
        estado = ?,
        observacion = ?,
        horas_trabajadas = ?,
        minutos_tardanza = ?
    `;
    const params = [t_e1, t_s1, t_e2, t_s2, tipo_marcacion || 'manual', estado || 'puntual', observacion, horas_trabajadas, minutos_tardanza];

    if (fecha) {
      query += `, created_at = ?::timestamptz`;
      params.push(`${fecha} 08:00:00+00`);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    await pool.query(query, params);

    res.json({ mensaje: 'Registro actualizado correctamente' });
  } catch (err) {
    console.error('Error en actualizarRegistro:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};
