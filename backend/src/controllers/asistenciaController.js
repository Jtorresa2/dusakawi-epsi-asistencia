const pool = require('../config/db');
const { excluirRolesPorNombre, excluirRolesPorUserId, joinRoles } = require('../services/rolesFiltro');

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

function statusDisplay(status) {
  if (status === 'on_time') return 'puntual';
  if (status === 'late') return 'tardanza';
  if (status === 'absent') return 'ausente';
  if (status === 'justified') return 'justificado';
  return status || 'puntual';
}

function statusFromDB(status) {
  if (status === 'puntual') return 'on_time';
  if (status === 'tardanza') return 'late';
  if (status === 'ausente') return 'absent';
  if (status === 'justificado') return 'justified';
  return status || 'on_time';
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
        TO_CHAR(a.date, 'YYYY-MM-DD') AS fecha,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        COALESCE(a.worked_hours, 0) AS horas_trabajadas,
        COALESCE(a.extra_hours, 0) AS horas_extra,
        COALESCE(a.late_minutes, 0) AS minutos_tardanza,
        COALESCE(a.mark_type, 'Web') AS tipo_marcacion,
        COALESCE(a.status, 'on_time') AS estado,
        a.observation AS observacion,
        EXTRACT(DOW FROM a.date) + 1 AS dia_semana
      FROM attendances a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN document_details dd ON dd.user_id = u.id
      LEFT JOIN areas ar ON u.area_id = ar.id
      LEFT JOIN floors fl ON ar.floor_id = fl.id
      WHERE 1=1${excluirRolesPorUserId('a.user_id')}
    `;

    const params = [];

    if (fecha_desde && fecha_hasta) {
      query += ` AND a.date BETWEEN ?::date AND ?::date`;
      params.push(fecha_desde, fecha_hasta);
    } else if (fecha) {
      query += ` AND a.date = ?::date`;
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
      query += ` AND LOWER(a.status) = LOWER(?)`;
      params.push(statusFromDB(estado));
    }

    query += ` ORDER BY a.date DESC, a.entry_timestamp DESC`;

    const [rows] = await pool.query(query, params);
    const registros = rows.map((r) => ({ ...r, estado: statusDisplay(r.estado) }));
    res.json({ registros });
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
    let estado = 'on_time';
    if (!t_e1 && !t_e2) {
      estado = 'absent';
    } else if (minutos_tardanza > 0) {
      estado = 'late';
    }

    const [existing] = await pool.query(
      `SELECT id FROM attendances WHERE user_id = ? AND date = ?::date`,
      [empleado_id, fecha]
    );

    let id;
    if (existing && existing.length > 0) {
      id = existing[0].id;
      await pool.query(
        `UPDATE attendances SET
          entry_timestamp = ?,
          morning_departure_timestamp = ?,
          afternoon_entry_timestamp = ?,
          departure_timestamp = ?,
          mark_type = ?,
          status = ?,
          observation = ?,
          worked_hours = ?,
          late_minutes = ?
        WHERE id = ?`,
        [t_e1, t_s1, t_e2, t_s2, tipo_marcacion || 'manual', estado, observacion || null, horas_trabajadas, minutos_tardanza, id]
      );
    } else {
      const [insertRes] = await pool.query(
        `INSERT INTO attendances
          (user_id, date, entry_timestamp, morning_departure_timestamp, afternoon_entry_timestamp, departure_timestamp, mark_type, status, observation, worked_hours, late_minutes)
         VALUES (?, ?::date, ?::time, ?::time, ?::time, ?::time, ?, ?, ?, ?, ?)
         RETURNING id`,
        [empleado_id, fecha, t_e1, t_s1, t_e2, t_s2, tipo_marcacion || 'manual', estado, observacion || null, horas_trabajadas, minutos_tardanza]
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
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const [existing] = await pool.query(
      `SELECT * FROM attendances WHERE user_id = ? AND date = ?::date ORDER BY created_at DESC LIMIT 1`,
      [empleado_id, localDate]
    );

    let tipo_casilla = 'entry_timestamp';
    let recordId;

    if (!existing || existing.length === 0) {
      const hour = now.getHours();
      let state = 'on_time';
      let lateness = 0;
      if (hour < 13) {
        tipo_casilla = 'entry_timestamp';
        const diff = (hour * 60 + now.getMinutes()) - 480;
        if (diff > 15) {
          state = 'late';
          lateness = diff;
        }
      } else {
        tipo_casilla = 'afternoon_entry_timestamp';
        const diff = (hour * 60 + now.getMinutes()) - 840;
        if (diff > 15) {
          state = 'late';
          lateness = diff;
        }
      }

      const [insertRes] = await pool.query(
        `INSERT INTO attendances
          (user_id, date, ${tipo_casilla}, mark_type, status, late_minutes)
         VALUES (?, ?::date, ?::time, 'Web', ?, ?)
         RETURNING id`,
        [empleado_id, localDate, currentTimeStr, state, lateness]
      );
      recordId = insertRes?.[0]?.id || insertRes?.insertId;
    } else {
      const rec = existing[0];
      recordId = rec.id;

      if (!rec.entry_timestamp) {
        tipo_casilla = 'entry_timestamp';
      } else if (!rec.morning_departure_timestamp && now.getHours() < 14) {
        tipo_casilla = 'morning_departure_timestamp';
      } else if (!rec.afternoon_entry_timestamp && now.getHours() < 16) {
        tipo_casilla = 'afternoon_entry_timestamp';
      } else if (!rec.departure_timestamp) {
        tipo_casilla = 'departure_timestamp';
      } else {
        return res.status(400).json({ mensaje: 'Todas las marcaciones del día han sido completadas' });
      }

      await pool.query(
        `UPDATE attendances SET ${tipo_casilla} = ?::time WHERE id = ?`,
        [currentTimeStr, recordId]
      );

      const [updatedRec] = await pool.query(`SELECT * FROM attendances WHERE id = ?`, [recordId]);
      if (updatedRec && updatedRec[0]) {
        const uRec = updatedRec[0];
        const metrics = calculateAttendanceMetrics(
          uRec.entry_timestamp,
          uRec.morning_departure_timestamp,
          uRec.afternoon_entry_timestamp,
          uRec.departure_timestamp
        );
        await pool.query(
          `UPDATE attendances SET worked_hours = ?, late_minutes = ? WHERE id = ?`,
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
        TO_CHAR(a.date, 'YYYY-MM-DD') AS fecha,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        COALESCE(a.worked_hours, 0) AS horas_trabajadas,
        COALESCE(a.status, 'on_time') AS estado,
        a.observation AS observacion,
        EXTRACT(DOW FROM a.date) + 1 AS dia_semana
      FROM attendances a
      WHERE a.user_id = ?
        AND EXTRACT(YEAR FROM a.date) = ?
        AND EXTRACT(MONTH FROM a.date) = ?
      ORDER BY a.date DESC
    `, [empleado_id, anio, mes]);

    const registros = rows.map(r => {
      const rawState = statusDisplay(r.estado);
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
      `UPDATE attendances SET status = 'justified', observation = ? WHERE id = ?`,
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
        entry_timestamp = ?::time,
        morning_departure_timestamp = ?::time,
        afternoon_entry_timestamp = ?::time,
        departure_timestamp = ?::time,
        mark_type = ?,
        status = ?,
        observation = ?,
        worked_hours = ?,
        late_minutes = ?
    `;
    const params = [t_e1, t_s1, t_e2, t_s2, tipo_marcacion || 'manual', estado ? statusFromDB(estado) : 'on_time', observacion, horas_trabajadas, minutos_tardanza];

    if (fecha) {
      query += `, date = ?::date`;
      params.push(fecha);
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