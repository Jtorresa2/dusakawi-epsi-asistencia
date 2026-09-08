const pool = require('../config/db');

/**
 * Mapa de días en español para horario_detalle.dia_semana
 */
const DIA_SEMANA_MAP = {
  0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
  4: 'Jueves', 5: 'Viernes', 6: 'Sábado',
};

/**
 * Busca el horario y detalle para un usuario en una fecha específica.
 * Retorna null si no tiene horario asignado o no hay detalle para ese día.
 */
async function getHorarioDelDia(usuarioId, fecha) {
  const { rows: usuarios } = await pool.query(
    'SELECT horario_id FROM usuarios WHERE id = $1',
    [usuarioId]
  );
  if (!usuarios.length || !usuarios[0].horario_id) return null;

  const horarioId = usuarios[0].horario_id;
  const fechaDate = new Date(fecha + 'T12:00:00');
  const diaSemana = DIA_SEMANA_MAP[fechaDate.getDay()];

  // Verificar si es festivo
  const { rows: festivos } = await pool.query(
    'SELECT id FROM festivos WHERE fecha = $1 AND activo = true',
    [fecha]
  );
  if (festivos.length > 0) return { tipo: 'festivo', festivo: festivos[0] };

  // Buscar detalle del horario para ese día
  const { rows: detalles } = await pool.query(
    'SELECT * FROM horario_detalle WHERE horario_id = $1 AND dia_semana = $2',
    [horarioId, diaSemana]
  );
  if (!detalles.length) return { tipo: 'descanso' }; // No trabaja ese día

  // Obtener tolerancia del horario
  const { rows: horarios } = await pool.query(
    'SELECT tolerancia_minutos, nombre, modalidad FROM horarios WHERE id = $1',
    [horarioId]
  );

  return {
    tipo: 'laboral',
    horario: horarios[0] || {},
    detalle: detalles[0],
  };
}

/**
 * Convierte "HH:MM" o "HH:MM:SS" a minutos desde medianoche.
 */
function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

/**
 * Determina a qué turno pertenece una marca (mañana o tarde) y si es entrada o salida.
 * Retorna { turno: 'manana'|'tarde', tipo: 'entrada'|'salida', esperado, diferencia_min, dentro_tolerancia }
 */
function clasificarMarca(horaMarca, detalle, toleranciaMin) {
  const marcaMins = timeToMinutes(horaMarca);

  const turnos = [
    { turno: 'manana', tipo: 'entrada', esperado: detalle.hora_entrada_manana },
    { turno: 'manana', tipo: 'salida',   esperado: detalle.hora_salida_manana },
    { turno: 'tarde',  tipo: 'entrada', esperado: detalle.hora_entrada_tarde },
    { turno: 'tarde',  tipo: 'salida',   esperado: detalle.hora_salida_tarde },
  ];

  let mejor = null;
  let menorDistancia = Infinity;

  for (const t of turnos) {
    if (!t.esperado) continue;
    const esperadoMins = timeToMinutes(t.esperado);
    const distancia = Math.abs(marcaMins - esperadoMins);

    if (distancia < menorDistancia) {
      menorDistancia = distancia;
      mejor = {
        ...t,
        esperado: t.esperado,
        diferencia_min: marcaMins - esperadoMins, // positivo = llegó tarde, negativo = llegó temprano
        dentro_tolerancia: Math.abs(marcaMins - esperadoMins) <= toleranciaMin,
      };
    }
  }

  return mejor;
}

/**
 * Busca un permiso aprobado que cubra la fecha y cuyo tramo contenga la hora
 * de la marca. Retorna el registro del permiso o null si no aplica.
 *
 * Regla de negocio: un permiso aprobado exime de tardanza únicamente cuando la
 * marca cae DENTRO del tramo que cubre. Una marca fuera del tramo (p.ej. la
 * entrada de la mañana con un permiso de la tarde) sigue generando tardanza.
 *
 * Tramo según modalidad:
 *  - 'horas'   -> hora_desde–hora_hasta de la novedad.
 *  - 'manana'  -> tramo del turno mañana del horario (hora_entrada_manana →
 *                 hora_salida_manana).
 *  - 'tarde'   -> tramo del turno tarde del horario (hora_entrada_tarde →
 *                 hora_salida_tarde).
 *  - 'dia_completo' -> cubre todo el día (no requiere comparar hora).
 */
async function obtenerPermisoQueCubreMarca(usuarioId, fecha, hora, detalle) {
  const { rows } = await pool.query(
    `SELECT tipo_novedad, tipo, hora_desde, hora_hasta FROM novedades
     WHERE usuario_id = $1 AND estado = 'aprobado'
       AND fecha_desde <= $2 AND fecha_hasta >= $3`,
    [usuarioId, fecha, fecha]
  );
  if (!rows.length) return null;

  const horaMins = timeToMinutes(hora);

  // Función auxiliar: ¿la marca cae dentro del tramo [desde, hasta] en minutos?
  const enTramo = (desdeStr, hastaStr) => {
    if (!desdeStr || !hastaStr) return false;
    const desde = timeToMinutes(desdeStr);
    const hasta = timeToMinutes(hastaStr);
    if (desde === null || hasta === null) return false;
    if (horaMins === null) return false;
    return horaMins >= desde && horaMins <= hasta;
  };

  const permiso = rows.find((r) => {
    const tipo = r.tipo; // modalidad: dia_completo | horas | manana | tarde
    if (tipo === 'dia_completo') return true;
    if (tipo === 'horas') return enTramo(r.hora_desde, r.hora_hasta);
    if (tipo === 'manana' && detalle) return enTramo(detalle.hora_entrada_manana, detalle.hora_salida_manana);
    if (tipo === 'tarde' && detalle) return enTramo(detalle.hora_entrada_tarde, detalle.hora_salida_tarde);
    return false;
  });

  return permiso || null;
}

/**
 * Indica si existe una novedad/permiso APROBADO que cubra el TRAMO DE LA TARDE
 * completo (no solo una marca puntual). Lo usa el cron para decidir si una
 * jornada con la mañana cerrada y el tramo de tarde nunca iniciado queda como
 * ausencia de tarde o queda justificada.
 *
 * Tramo según modalidad (tipo):
 *  - 'dia_completo' -> cubre todo el día, incluida la tarde.
 *  - 'tarde'        -> cubre el tramo de la tarde.
 *  - 'horas'        -> cubre la tarde solo si la ventana horaria de la novedad
 *                      solapa el tramo de la tarde del horario.
 *  - 'manana'       -> no cubre la tarde.
 *
 * @param {number} usuarioId
 * @param {string} fecha 'YYYY-MM-DD'
 * @param {object} detalle Detalle del horario del día (turnos mañana/tarde).
 * @returns {Promise<boolean>}
 */
async function obtenerNovedadQueCubreTarde(usuarioId, fecha, detalle) {
  const { rows } = await pool.query(
    `SELECT tipo_novedad, tipo, hora_desde, hora_hasta FROM novedades
     WHERE usuario_id = $1 AND estado = 'aprobado'
       AND fecha_desde <= $2 AND fecha_hasta >= $3`,
    [usuarioId, fecha, fecha]
  );
  if (!rows.length) return false;

  const entT = timeToMinutes(detalle && detalle.hora_entrada_tarde);
  const salT = timeToMinutes(detalle && detalle.hora_salida_tarde);

  const cubreTarde = rows.find((r) => {
    const tipo = r.tipo; // modalidad: dia_completo | horas | manana | tarde
    if (tipo === 'dia_completo') return true;
    if (tipo === 'tarde') return true;
    if (tipo === 'horas') {
      if (entT === null || salT === null) return false;
      const desde = timeToMinutes(r.hora_desde);
      const hasta = timeToMinutes(r.hora_hasta);
      if (desde === null || hasta === null) return false;
      // Solapa el tramo de la tarde si [desde, hasta] toca [entT, salT].
      return desde <= salT && hasta >= entT;
    }
    return false;
  });

  return Boolean(cubreTarde);
}

/**
 * Estados de jornada usados en asistencia.marcacion_estado.
 *
 * La decisión de si una marca es ENTRADA (1) o SALIDA (2) se deriva de los
 * TIMESTAMPS actuales de la jornada (ver tipoMarcaEsperada), NUNCA de la hora
 * programada más cercana. La hora solo se usa para tardanza, validaciones,
 * contexto de turno y cálculo de horas.
 *
 * Valores (ÚNICAMENTE dos):
 *  - 'abierta'  : la jornada tiene marcas pero le falta al menos un timestamp
 *                 (tramo abierto o tramo no iniciado). Las ausencias de tramo,
 *                 salidas no registradas, tardanzas, permisos etc. NO viven en
 *                 este campo: van a incidencias/novedades.
 *  - 'completa' : los 4 timestamps llenos → NO se permiten más marcas
 */
const ESTADO_JORNADA = {
  ABIERTA: 'abierta',
  COMPLETA: 'completa',
};

/**
 * Deriva el estado de la jornada a partir de los timestamps.
 *
 * Valores posibles (ÚNICAMENTE dos):
 *  - los 4 timestamps completos → 'completa'
 *  - cualquier otra combinación → 'abierta' (incluye jornadas con un tramo
 *    no iniciado: esas ausencias NO se representan en este campo)
 *
 * @param {object} r Registro de asistencia (filas con los 4 timestamps).
 * @returns {string} uno de ESTADO_JORNADA.
 */
function calcularEstadoJornada(r) {
  const ent = r.fecha_hora_entrada;
  const salM = r.fecha_hora_salida_manana;
  const entT = r.fecha_hora_entrada_tarde;
  const salT = r.fecha_hora_salida;

  if (ent && salM && entT && salT) return ESTADO_JORNADA.COMPLETA;
  return ESTADO_JORNADA.ABIERTA;
}

/**
 * Decide si la PRÓXIMA marca debe ser ENTRADA (1) o SALIDA (2) según la
 * secuencia esperada 1 → 2 → 1 → 2, derivada EXCLUSIVAMENTE de los timestamps
 * actuales de la jornada (nunca de la hora programada más cercana):
 *
 *   sin timestamps                 → 'entrada' (1) — abre la jornada
 *   entrada sin salida mañana      → 'salida'  (2) — cierra el tramo de mañana
 *   mañana cerrada sin entrada tarde → 'entrada' (1) — abre el tramo de tarde
 *   entrada tarde sin salida       → 'salida'  (2) — cierra el tramo de tarde
 *   4 timestamps completos         → null (jornada completa, no hay próxima)
 *
 * @param {object|null} r Registro de asistencia o null si no existe.
 * @returns {'entrada'|'salida'|null}
 */
function tipoMarcaEsperada(r) {
  if (!r) return 'entrada';
  if (r.fecha_hora_entrada && r.fecha_hora_salida_manana &&
      r.fecha_hora_entrada_tarde && r.fecha_hora_salida) {
    return null;
  }
  if (!r.fecha_hora_entrada) return 'entrada';
  if (r.fecha_hora_entrada && !r.fecha_hora_salida_manana) return 'salida';
  if (r.fecha_hora_salida_manana && !r.fecha_hora_entrada_tarde) return 'entrada';
  return 'salida';
}

/**
 * Para una SALIDA: identifica qué tramo está abierto usando los timestamps.
 *
 *  - fecha_hora_entrada existe y fecha_hora_salida_manana es NULL → cerrar mañana.
 *  - fecha_hora_entrada_tarde existe y fecha_hora_salida es NULL     → cerrar tarde.
 *
 * @returns {string} 'fecha_hora_salida_manana' | 'fecha_hora_salida' | null
 */
function tramoAbiertoEnSalida(r) {
  if (r.fecha_hora_entrada && !r.fecha_hora_salida_manana) {
    return 'fecha_hora_salida_manana';
  }
  if (r.fecha_hora_entrada_tarde && !r.fecha_hora_salida) {
    return 'fecha_hora_salida';
  }
  return null;
}

/**
 * Para una ENTRADA: determina qué campo de entrada usar según el estado y los
 * timestamps (sin usar la cercanía a la hora programada para decidir el tipo).
 *
 *  - sin registro / sin entrada mañana   → fecha_hora_entrada
 *  - ya hay entrada mañana               → fecha_hora_entrada_tarde
 *
 * @returns {string} 'fecha_hora_entrada' | 'fecha_hora_entrada_tarde'
 */
function campoEntradaDisponible(r) {
  if (r && r.fecha_hora_entrada && !r.fecha_hora_entrada_tarde) {
    return 'fecha_hora_entrada_tarde';
  }
  return 'fecha_hora_entrada';
}

/**
 * Persiste el marcacion_estado derivado de los timestamps del registro.
 */
async function refrescarEstadoJornada(registroId) {
  const { rows } = await pool.query('SELECT * FROM asistencia WHERE id = $1', [registroId]);
  if (!rows.length) return;
  const estado = calcularEstadoJornada(rows[0]);
  await pool.query(
    'UPDATE asistencia SET marcacion_estado = $1 WHERE id = $2',
    [estado, registroId]
  );
  return estado;
}

/**
 * Procesa una marca biométrica con lógica de secuencia 1 → 2 → 1 → 2.
 *
 * La decisión de si la marca es ENTRADA (1) o SALIDA (2) depende de la
 * secuencia esperada de timestamps (tipoMarcaEsperada), NUNCA de la hora más
 * cercana del horario.
 *
 *   sin timestamps               → entrada (1)
 *   entrada sin salida mañana    → salida  (2) — cierra el tramo de mañana
 *   mañana cerrada               → entrada (1) — abre el tramo de tarde
 *   entrada tarde sin salida     → salida  (2) — cierra el tramo de tarde
 *   completa                     → error controlado, no se toca nada
 *
 * La hora se usa únicamente para tardanza, validaciones, contexto y cálculo
 * de horas (via clasificarMarca), nunca para decidir entrada/salida.
 *
 * Retorna un objeto con el resultado del procesamiento.
 */
async function procesarMarca(usuarioId, fechaHora, tipo) {
  // Extraer fecha y hora del string
  const fecha = fechaHora.substring(0, 10); // "YYYY-MM-DD"
  const hora = fechaHora.substring(11, 16);  // "HH:MM"

  // 1. Buscar horario del día
  const horarioInfo = await getHorarioDelDia(usuarioId, fecha);

  if (!horarioInfo) {
    return { error: 'Usuario sin horario asignado', procesado: false };
  }

  if (horarioInfo.tipo === 'festivo') {
    return { info: 'Fecha festiva — no se procesa marca', procesado: false, festivo: horarioInfo.festivo };
  }

  if (horarioInfo.tipo === 'descanso') {
    return { info: 'Día de descanso — no se procesa marca', procesado: false };
  }

  // 2. Estado actual de la jornada (a partir de los timestamps)
  const { rows: existente } = await pool.query(
    'SELECT * FROM asistencia WHERE usuario_id = $1 AND fecha = $2',
    [usuarioId, fecha]
  );
  const registro = existente[0] || null;

  // 2b. Decidir el tipo de la próxima marca (1 = entrada, 2 = salida) según la
  //     secuencia esperada de timestamps. null = jornada completa.
  const tipoEsperado = tipoMarcaEsperada(registro);

  // 2c. Jornada completa → rechazar la 5.ª marca sin tocar nada.
  if (tipoEsperado === null) {
    return {
      error: 'Jornada ya completa — no se permiten más marcaciones',
      procesado: false,
      fecha,
      estado_jornada: ESTADO_JORNADA.COMPLETA,
    };
  }

  // 3. ENTRADA (1) o SALIDA (2) según la secuencia de timestamps.
  const esEntrada = tipoEsperado === 'entrada';
  const esSalida = tipoEsperado === 'salida';

  // Modalidad flexible / por horas → nunca genera tardanza; siempre puntual.
  const modalidad = horarioInfo.horario.modalidad;
  const esFlexible = modalidad === 'flexible' || modalidad === 'por_horas';

  const tolerancia = horarioInfo.horario.tolerancia_minutos || 5;
  // clasificarMarca solo se usa para tardanza / contexto, NO para decidir entrada/salida.
  const clasificacion = clasificarMarca(hora, horarioInfo.detalle, tolerancia);
  const fechaHoraCompleta = `${fecha} ${hora}:00`;

  let estadoCalculado = 'puntual';
  let minutosTardanza = 0;
  let registroId;

  if (esEntrada) {
    // Tardanza (solo modalidad estricta + entrada).
    if (!esFlexible && clasificacion && clasificacion.diferencia_min > 0 && !clasificacion.dentro_tolerancia) {
      // Un permiso aprobado que cubra esta marca la exime de tardanza.
      const permiso = await obtenerPermisoQueCubreMarca(usuarioId, fecha, hora, horarioInfo.detalle);
      if (!permiso) {
        estadoCalculado = 'tardanza';
        minutosTardanza = clasificacion.diferencia_min;
      }
    }

    // Determinar el campo de entrada según el estado y los timestamps.
    if (!registro) {
      // Nuevo registro: siempre abre la jornada con la entrada mañana.
      const { rows: [nuevo] } = await pool.query(
        `INSERT INTO asistencia (usuario_id, fecha, fecha_hora_entrada, tipo_marcacion, estado, minutos_tardanza)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [usuarioId, fecha, fechaHoraCompleta, tipo, estadoCalculado, minutosTardanza]
      );
      registroId = nuevo.id;
      await refrescarEstadoJornada(registroId);
    } else {
      const campoEntrada = campoEntradaDisponible(registro);
      await pool.query(
        `UPDATE asistencia SET ${campoEntrada} = $1, estado = $2, minutos_tardanza = GREATEST(minutos_tardanza, $3) WHERE id = $4`,
        [fechaHoraCompleta, estadoCalculado, minutosTardanza, registro.id]
      );
      registroId = registro.id;
      await refrescarEstadoJornada(registroId);
    }
  } else {
    // esSalida → cierra el tramo abierto identificado por los timestamps.
    if (!registro) {
      // No debería ocurrir (una salida requiere una entrada previa), pero por
      // seguridad creamos un registro básico con la salida mañana.
      const { rows: [nuevo] } = await pool.query(
        `INSERT INTO asistencia (usuario_id, fecha, fecha_hora_salida_manana, tipo_marcacion, estado)
         VALUES ($1, $2, $3, $4, 'puntual') RETURNING id`,
        [usuarioId, fecha, fechaHoraCompleta, tipo]
      );
      registroId = nuevo.id;
      await recalcularHorasTrabajadas(registroId);
      await refrescarEstadoJornada(registroId);
    } else {
      const campoSalida = tramoAbiertoEnSalida(registro) || 'fecha_hora_salida';
      await pool.query(
        `UPDATE asistencia SET ${campoSalida} = $1 WHERE id = $2`,
        [fechaHoraCompleta, registro.id]
      );
      registroId = registro.id;
      await recalcularHorasTrabajadas(registroId);
      await refrescarEstadoJornada(registroId);
    }
  }

  // 4. Incidencia de tardanza (solo modalidad estricta, solo en entradas).
  let incidenciaCreada = false;
  if (!esFlexible && estadoCalculado === 'tardanza' && esEntrada) {
    const { rows: incidenciasExistentes } = await pool.query(
      `SELECT id FROM incidencias WHERE usuario_id = $1 AND fecha = $2 AND tipo = 'tardanza'`,
      [usuarioId, fecha]
    );
    if (!incidenciasExistentes.length) {
      const turnoDesc = clasificacion && clasificacion.turno ? clasificacion.turno : 'desconocido';
      const esperadoDesc = clasificacion && clasificacion.esperado ? ` (esperado ${clasificacion.esperado})` : '';
      await pool.query(
        `INSERT INTO incidencias (usuario_id, tipo, descripcion, fecha, estado, prioridad)
         VALUES ($1, 'tardanza', $2, $3, 'pendiente', 'media')`,
        [usuarioId, `Tardanza de ${minutosTardanza} min — turno ${turnoDesc}${esperadoDesc}`, fecha]
      );
      incidenciaCreada = true;
    }
  }

  // Releer el registro final para devolver el estado de jornada correcto.
  const { rows: [finalReg] } = await pool.query(
    'SELECT * FROM asistencia WHERE id = $1', [registroId]
  );
  const estadoFinal = finalReg ? calcularEstadoJornada(finalReg) : ESTADO_JORNADA.ABIERTA;

  return {
    procesado: true,
    registroId,
    fecha,
    hora,
    tipo_marca: esEntrada ? 'entrada' : 'salida',
    marcacion_estado: estadoFinal,
    estado: estadoCalculado,
    minutos_tardanza: minutosTardanza,
    incidencia_creada: incidenciaCreada,
    horario: horarioInfo.horario.nombre,
  };
}

/**
 * Recalcula las horas_trabajadas sumando los dos turnos.
 */
async function recalcularHorasTrabajadas(registroId) {
  const { rows } = await pool.query('SELECT * FROM asistencia WHERE id = $1', [registroId]);
  if (!rows.length) return;

  const r = rows[0];
  let totalMinutos = 0;

  // Turno mañana
  if (r.fecha_hora_entrada && r.fecha_hora_salida_manana) {
    const ent = new Date(r.fecha_hora_entrada);
    const sal = new Date(r.fecha_hora_salida_manana);
    totalMinutos += (sal - ent) / 60000;
  }

  // Turno tarde
  if (r.fecha_hora_entrada_tarde && r.fecha_hora_salida) {
    const ent = new Date(r.fecha_hora_entrada_tarde);
    const sal = new Date(r.fecha_hora_salida);
    totalMinutos += (sal - ent) / 60000;
  }

  const horas = totalMinutos > 0 ? (totalMinutos / 60).toFixed(2) : null;
  await pool.query('UPDATE asistencia SET horas_trabajadas = $1 WHERE id = $2', [horas, registroId]);
}

module.exports = {
  procesarMarca,
  getHorarioDelDia,
  timeToMinutes,
  calcularEstadoJornada,
  tipoMarcaEsperada,
  tramoAbiertoEnSalida,
  campoEntradaDisponible,
  obtenerNovedadQueCubreTarde,
  ESTADO_JORNADA,
};
