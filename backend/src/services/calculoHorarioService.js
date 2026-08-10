const ACENTOS = { á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u", ñ: "n" };
const DIAS_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

exports.normalizarDia = (dia) => {
  if (dia == null) return "";
  return String(dia)
    .toLowerCase()
    .replace(/[áéíóúüñ]/g, (c) => ACENTOS[c])
    .replace(/[^a-z]/g, "")
    .replace(/^./, (c) => c.toUpperCase());
};

exports.detalleParaDia = (detalles, diaSemana) => {
  if (!Array.isArray(detalles) || detalles.length === 0) return null;
  const objetivo = exports.normalizarDia(diaSemana);
  return detalles.find((d) => exports.normalizarDia(d.dia_semana) === objetivo) || null;
};

exports.minDesde = (h) => {
  if (!h) return 0;
  const partes = String(h).split(":");
  if (partes.length < 2) return 0;
  const hora = parseInt(partes[0], 10);
  const min = parseInt(partes[1], 10);
  if (Number.isNaN(hora) || Number.isNaN(min)) return 0;
  return hora * 60 + min;
};

exports.calcularTardanza = ({ detalle, entrada1, salida1, entrada2, salida2, tolerancia_minutos, tolerancia_salida_minutos }) => {
  if (!detalle) return { minutos_tardanza: 0, salida_temprana_minutos: 0 };
  const tol = Number(tolerancia_minutos) || 0;
  const tolSalida = Number(tolerancia_salida_minutos) || 0;

  let minutosTardanza = 0;

  const e1 = exports.minDesde(entrada1);
  const e1Prog = exports.minDesde(detalle.hora_entrada_manana);
  if (e1 > 0 && e1Prog > 0 && e1 > e1Prog + tol) {
    minutosTardanza += e1 - (e1Prog + tol);
  }

  const e2 = exports.minDesde(entrada2);
  const e2Prog = exports.minDesde(detalle.hora_entrada_tarde);
  if (e2 > 0 && e2Prog > 0 && e2 > e2Prog + tol) {
    minutosTardanza += e2 - (e2Prog + tol);
  }

  let salidaTemprana = 0;
  const s1 = exports.minDesde(salida1);
  const s1Prog = exports.minDesde(detalle.hora_salida_manana);
  if (s1 > 0 && s1Prog > 0 && s1 < s1Prog - tolSalida) {
    salidaTemprana = (s1Prog - tolSalida) - s1;
  }

  return { minutos_tardanza: minutosTardanza, salida_temprana_minutos: salidaTemprana };
};

exports.evaluarHorario = ({ horario, detalle, marcaciones = {} }) => {
  if (!horario) {
    return { flexible: false, por_horas: false, minutos_tardanza: 0, salida_temprana_minutos: 0 };
  }
  const modalidad = horario.modalidad;
  if (modalidad === "flexible") {
    return { flexible: true, por_horas: false, minutos_tardanza: 0, salida_temprana_minutos: 0 };
  }
  if (modalidad === "por_horas" || horario?.tipo_jornada === "por_horas") {
    return { flexible: false, por_horas: true, minutos_tardanza: 0, salida_temprana_minutos: 0 };
  }
  const resultado = exports.calcularTardanza({
    detalle,
    entrada1: marcaciones.entrada1,
    salida1: marcaciones.salida1,
    entrada2: marcaciones.entrada2,
    salida2: marcaciones.salida2,
    tolerancia_minutos: horario?.tolerancia_minutos,
    tolerancia_salida_minutos: horario?.tolerancia_salida_minutos,
  });
  return { ...resultado, flexible: false, por_horas: false };
};

exports.diaSemanaDeFecha = (fecha) => {
  if (!fecha) return null;
  const d = fecha instanceof Date ? fecha : new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return DIAS_ES[d.getDay()];
};
