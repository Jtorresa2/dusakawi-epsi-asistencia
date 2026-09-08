const pool = require('../config/db');

const { getHorarioDelDia, obtenerNovedadQueCubreTarde } = require('./marcacionService');

/**
 * DISCRIMINADOR CENTRAL — diferencia un TRAMO ABIERTO de un TRAMO NO INICIADO.
 *
 * La regla NO es "¿falta alguna salida?" (en una mañana completa sin tarde,
 * la salida de la tarde también falta y NO debe dispararse salida_no_registrada).
 * La regla correcta es: la ENTRADA del tramo decide.
 *
 *  - Tramo ABIERTO: la entrada del tramo existe y su salida es NULL.
 *  - Tramo NO INICIADO: la entrada del tramo nunca existió (p.ej. mañana
 *    cerrada y fecha_hora_entrada_tarde NULL → ausencia de la tarde).
 */

/**
 * ¿El tramo está ABIERTO? La ENTRADA del tramo existe sin su salida.
 *
 *  - fecha_hora_entrada existe y fecha_hora_salida_manana es NULL → abierto (mañana)
 *  - fecha_hora_entrada_tarde existe y fecha_hora_salida es NULL  → abierto (tarde)
 *
 * @param {object} r Registro de asistencia (filas con los 4 timestamps).
 * @returns {boolean}
 */
function tramoAbierto(r) {
  if (!r) return false;
  if (r.fecha_hora_entrada && !r.fecha_hora_salida_manana) return true;
  if (r.fecha_hora_entrada_tarde && !r.fecha_hora_salida) return true;
  return false;
}

/**
 * ¿El tramo de la TARDE nunca se inició? Mañana cerrada (entrada + salida
 * mañana) pero fecha_hora_entrada_tarde es NULL → el empleado no abrió la
 * tarde: es AUSENCIA DE LA TARDE, no una salida no registrada.
 *
 * @param {object} r Registro de asistencia (filas con los 4 timestamps).
 * @returns {boolean}
 */
function tramoTardeNuncaIniciado(r) {
  if (!r) return false;
  return Boolean(
    r.fecha_hora_entrada &&
    r.fecha_hora_salida_manana &&
    !r.fecha_hora_entrada_tarde
  );
}

/**
 * Crea una incidencia de "salida no registrada" para un usuario/fecha.
 * Es IDEMPOTENTE: si ya existe una con el mismo (usuario_id, fecha, tipo),
 * no crea duplicado y retorna false.
 *
 * Se registra en `incidencias` (no en `novedades`) porque es un evento
 * puntual detectado automáticamente por el sistema, igual que 'tardanza';
 * `novedades` es para permisos solicitados/aprobados.
 *
 * @returns {Promise<boolean>} true si se creó, false si ya existía.
 */
async function crearIncidenciaSalidaNoRegistrada(usuarioId, fecha) {
  const { rows: existente } = await pool.query(
    `SELECT id FROM incidencias
     WHERE usuario_id = $1 AND fecha = $2 AND tipo = 'salida_no_registrada'`,
    [usuarioId, fecha]
  );
  if (existente.length > 0) return false;

  await pool.query(
    `INSERT INTO incidencias (usuario_id, tipo, descripcion, fecha, estado, prioridad)
     VALUES ($1, 'salida_no_registrada', $2, $3, 'pendiente', 'media')`,
    [
      usuarioId,
      'Jornada incompleta: se registró una entrada pero no se registró la salida al cierre del día.',
      fecha,
    ]
  );
  return true;
}

/**
 * Crea una incidencia de "ausencia de la tarde" para un usuario/fecha.
 * Es IDEMPOTENTE: si ya existe una con el mismo (usuario_id, fecha, tipo),
 * no crea duplicado y retorna false.
 *
 * Se genera cuando la mañana quedó cerrada (entrada + salida mañana) pero el
 * tramo de la tarde NUNCA se inició y no existe novedad/permiso aprobado que
 * la justifique. Vive en `incidencias` (evento puntual detectado por el sistema).
 *
 * @returns {Promise<boolean>} true si se creó, false si ya existía.
 */
async function crearIncidenciaAusenciaTarde(usuarioId, fecha) {
  const { rows: existente } = await pool.query(
    `SELECT id FROM incidencias
     WHERE usuario_id = $1 AND fecha = $2 AND tipo = 'ausencia_tarde'`,
    [usuarioId, fecha]
  );
  if (existente.length > 0) return false;

  await pool.query(
    `INSERT INTO incidencias (usuario_id, tipo, descripcion, fecha, estado, prioridad)
     VALUES ($1, 'ausencia_tarde', $2, $3, 'pendiente', 'media')`,
    [
      usuarioId,
      'Ausencia de la tarde: el tramo de la tarde no se inició y no hay novedad que la justifique.',
      fecha,
    ]
  );
  return true;
}

async function marcarAusentes(fecha) {
  const { rows: usuarios } = await pool.query(
    "SELECT id FROM usuarios WHERE activo = TRUE AND horario_id IS NOT NULL",
    []
  );

  let creados = 0;
  let omitidosLaboralConMarca = 0;
  let salidasNoRegistradas = 0;
  let ausenciasTarde = 0;
  let errores = [];

  for (const usuario of usuarios) {
    try {
      const horarioInfo = await getHorarioDelDia(usuario.id, fecha);

      // No trabaja este día
      if (
        !horarioInfo ||
        horarioInfo.tipo === 'festivo' ||
        horarioInfo.tipo === 'descanso'
      ) {
        continue;
      }

      // Día laboral
      if (horarioInfo.tipo === 'laboral') {
        const { rows: asis } = await pool.query(
          "SELECT * FROM asistencia WHERE usuario_id = $1 AND fecha = $2",
          [usuario.id, fecha]
        );
        const registro = asis[0] || null;

        // REGLA DE AUSENTE (intacta):
        // Sin NINGÚN registro → ausente.
        if (!registro) {
          const { rowCount } = await pool.query(
            `INSERT INTO asistencia (
              usuario_id,
              fecha,
              estado,
              tipo_marcacion,
              observacion
            )
            VALUES (
              $1,
              $2,
              'ausente',
              'sistema',
              'Generado automaticamente por cierre de jornada sin marcaciones'
            )
            ON CONFLICT (usuario_id, fecha) DO NOTHING`,
            [usuario.id, fecha]
          );
          if (rowCount > 0) creados++;
          continue;
        }

        // Con cualquier registro → NO es ausente.
        omitidosLaboralConMarca++;

        // Solo tocamos incidencias de ESTA fecha. El registro NO se modifica:
        // marcacion_estado ya lo derivó la marca (abierta/completa) y NO
        // representa ausencias.

        // (1) TRAMO ABIERTO (entrada sin su salida, mañana o tarde)
        //     → incidencia salida_no_registrada. NO marca ausente.
        if (tramoAbierto(registro)) {
          // Idempotente: no duplica la incidencia si ya existe.
          const creada = await crearIncidenciaSalidaNoRegistrada(usuario.id, fecha);
          if (creada) salidasNoRegistradas++;
        }
        // (2) TRAMO DE TARDE NUNCA INICIADO (mañana cerrada + sin entrada tarde)
        //     → NO es salida_no_registrada. Si existe novedad/permiso aprobado
        //     que cubra la tarde, no se genera nada; si no, ausencia de la tarde.
        else if (tramoTardeNuncaIniciado(registro)) {
          const justificada = await obtenerNovedadQueCubreTarde(
            usuario.id,
            fecha,
            horarioInfo.detalle
          );
          if (!justificada) {
            const creada = await crearIncidenciaAusenciaTarde(usuario.id, fecha);
            if (creada) ausenciasTarde++;
          }
        }
      }
    } catch (err) {
      errores.push({
        id: usuario.id,
        error: err.message
      });
    }
  }

  return {
    fecha,
    procesados: usuarios.length,
    creados,
    omitidosLaboralConMarca,
    salidasNoRegistradas,
    ausenciasTarde,
    errores
  };
}

module.exports = {
  marcarAusentes,
  tramoAbierto,
  tramoTardeNuncaIniciado,
  crearIncidenciaSalidaNoRegistrada,
  crearIncidenciaAusenciaTarde,
};