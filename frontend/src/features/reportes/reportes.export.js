import * as XLSX from "xlsx-js-style";
import { exportarExcel, exportarWorkbook } from "../../shared/utils/exportarExcel";
import { guardarHistorial } from "./reportes.api";

export const MESES = [
  {v:1,l:"Enero"},{v:2,l:"Febrero"},{v:3,l:"Marzo"},{v:4,l:"Abril"},{v:5,l:"Mayo"},{v:6,l:"Junio"},
  {v:7,l:"Julio"},{v:8,l:"Agosto"},{v:9,l:"Septiembre"},{v:10,l:"Octubre"},{v:11,l:"Noviembre"},{v:12,l:"Diciembre"},
];

export const NOMBRES = { porEmpleado: "Reporte por Empleado", asistencia: "Reporte de Asistencia", incidencias: "Reporte de Incidencias", tardanzas: "Reporte de Tardanzas", ausencias: "Reporte de Ausencias", porAreas: "Reporte por Áreas", marcaciones: "Reporte de Marcaciones" };

export const buildPdfUrl = (tipo, f) => {
  const p = new URLSearchParams();
  const token = localStorage.getItem("token");
  if (token) p.append("token", token);
  if (f.fecha_desde) p.append("fecha_desde", f.fecha_desde);
  if (f.fecha_hasta) p.append("fecha_hasta", f.fecha_hasta);
  if (f.usuario_id || f.empleado_id) p.append("usuario_id", f.usuario_id || f.empleado_id);
  if (f.area_id) p.append("area_id", f.area_id);
  if (f.cargo_id) p.append("cargo_id", f.cargo_id);
  if (f.estado) p.append("estado", f.estado);
  if (f.estado_incidencia) p.append("estado", f.estado_incidencia);
  if (f.tipo_incidencia) p.append("tipo", f.tipo_incidencia);
  if (f.estado_empleado) p.append("activo", f.estado_empleado);
  if (f.mes) p.append("mes", f.mes);
  if (f.anio) p.append("anio", f.anio);
  const slug = tipo === "porEmpleado" ? "por-empleado" : tipo === "porAreas" ? "por-areas" : tipo;
  return `/api/pdf/${slug}?${p.toString()}`;
};

export const exportarPDF = (tipo, f, onPreview) => {
  const url = buildPdfUrl(tipo, f);
  if (onPreview) onPreview(url);
  guardarHistorial({ tipo_reporte: NOMBRES[tipo], formato: "PDF", filtros: f, total_registros: 0 }).catch(() => {});
};

const ACOLOR = {
  verde: "1B5E20",
  verdeClaro: "E8F5E9",
  grisBorde: "BDBDBD",
  textoMedio: "4B5563",
  zebra: "F9FAFB",
  rojo: "D94B4B",
  verdeExito: "2E7D32",
};

const BORDES = {
  top: { style: "thin", color: { rgb: ACOLOR.grisBorde } },
  bottom: { style: "thin", color: { rgb: ACOLOR.grisBorde } },
  left: { style: "thin", color: { rgb: ACOLOR.grisBorde } },
  right: { style: "thin", color: { rgb: ACOLOR.grisBorde } },
};

const RANGO_DOS_COLUMNAS = 8;

const ANCHOS = [
  { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
  { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 12 },
];

const ESTADO_EXCEL = { on_time: "Puntual", late: "Tardanza", absent: "Ausente", justified: "Justificado" };
const COLOR_ESTADO_EXCEL = { on_time: ACOLOR.verdeExito, late: ACOLOR.rojo, absent: ACOLOR.rojo };

function estilizarCelda(worksheet, r, c, estilo) {
  const celda = worksheet[XLSX.utils.encode_cell({ r, c })];
  if (!celda) return;
  celda.s = { ...(celda.s || {}), ...estilo };
}

function construirHojaPorEmpleado(registros) {
  const { empleado, periodo, resumen, permisos, incidencias, detalle } = registros || {};

  const nombreEmpleado = `${empleado?.nombre || ""} ${empleado?.apellido || ""}`.trim() || "Sin nombre";
  const etiquetaMes = MESES.find((m) => m.v === periodo?.mes)?.l || "";
  const titulo = `Reporte por Empleado — ${nombreEmpleado}`;
  const periodoTxt = `Período: ${etiquetaMes} ${periodo?.anio || ""}`.trim();

  const F = RANGO_DOS_COLUMNAS;

  const aoa = [
    [titulo, ...Array(F - 1).fill(null)],
    [periodoTxt, ...Array(F - 1).fill(null)],
    [],
    ["Días hábiles", "Festivos", "Asistencia %", "Puntuales", "Tardanzas", "Ausentes", "Horas total", "Permisos", "Incidencias"],
    [
      periodo?.diasHabiles || 0,
      periodo?.festivos || 0,
      `${resumen?.porcentaje_asistencia || 0}%`,
      resumen?.puntuales || 0,
      resumen?.tardanzas || 0,
      resumen?.ausentes || 0,
      resumen?.horas_trabajadas || 0,
      permisos?.total || 0,
      incidencias?.total || 0,
    ],
    [],
    ["Fecha", "Ent. Mañana", "Sal. Mañana", "Ent. Tarde", "Sal. Tarde", "Horas", "Estado", "Festivo"],
  ];

  const filaCabecera = aoa.length - 1;

  const detalles = detalle?.length
    ? detalle.map((d) => [
        d.fecha ? new Date(d.fecha).toLocaleDateString("es-CO") : "—",
        d.entrada1 || "—",
        d.salida1 || "—",
        d.entrada2 || "—",
        d.salida2 || "—",
        d.horas_trabajadas ? `${d.horas_trabajadas}h` : "—",
        ESTADO_EXCEL[d.estado] || d.estado || "—",
        d.esFestivo ? "Sí" : "No",
      ])
    : null;

  const merges = [
    XLSX.utils.decode_range(`A1:${XLSX.utils.encode_col(F - 1)}1`),
    XLSX.utils.decode_range(`A2:${XLSX.utils.encode_col(F - 1)}2`),
  ];

  if (detalles) {
    aoa.push(...detalles);
  } else {
    aoa.push(["No hay detalle diario disponible para este período.", ...Array(F - 1).fill(null)]);
    merges.push(XLSX.utils.decode_range(`A6:${XLSX.utils.encode_col(F - 1)}6`));
  }

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  worksheet["!merges"] = merges;
  worksheet["!cols"] = ANCHOS;
  worksheet["!rows"] = [{ hpt: 24 }, { hpt: 16 }, null, null, null, null, { hpt: 18 }];

  estilizarCelda(worksheet, 0, 0, {
    font: { size: 14, bold: true, color: { rgb: ACOLOR.verde } },
    alignment: { horizontal: "center", vertical: "center" },
  });
  estilizarCelda(worksheet, 1, 0, {
    font: { italic: true, color: { rgb: ACOLOR.textoMedio } },
    alignment: { horizontal: "center", vertical: "center" },
  });

  for (let c = 0; c < 9; c++) {
    estilizarCelda(worksheet, 3, c, { fill: { patternType: "solid", fgColor: { rgb: ACOLOR.verdeClaro } } });
    estilizarCelda(worksheet, 4, c, { fill: { patternType: "solid", fgColor: { rgb: ACOLOR.verdeClaro } } });
    estilizarCelda(worksheet, 4, c, { font: { bold: true } });
  }

  for (let c = 0; c < F; c++) {
    estilizarCelda(worksheet, filaCabecera, c, {
      fill: { patternType: "solid", fgColor: { rgb: ACOLOR.verde } },
      font: { bold: true, color: { rgb: "FFFFFF" } },
      alignment: { vertical: "center" },
      border: BORDES,
    });
  }

  if (detalles) {
    detalles.forEach((fila, i) => {
      const r = filaCabecera + 1 + i;
      for (let c = 0; c < fila.length; c++) {
        estilizarCelda(worksheet, r, c, { border: BORDES });
        if (i % 2 === 0) {
          estilizarCelda(worksheet, r, c, { fill: { patternType: "solid", fgColor: { rgb: ACOLOR.zebra } } });
        }
      }
      const colorEstado = COLOR_ESTADO_EXCEL[detalle[i].estado];
      if (colorEstado) {
        estilizarCelda(worksheet, r, 6, { font: { color: { rgb: colorEstado } } });
      }
    });
  } else {
    estilizarCelda(worksheet, 6, 0, {
      font: { italic: true, color: { rgb: ACOLOR.textoMedio } },
      alignment: { horizontal: "center" },
    });
  }

  return worksheet;
}

const ESTADO_ASIS_MAPA = { on_time: "Puntual", late: "Tardanza", absent: "Ausente", justified: "Justificado" };
const ESTADO_INC_MAPA = { pendiente: "Pendiente", aprobado: "Aprobado", rechazado: "Rechazado" };

// Mapeo de cada reporte a columnas legibles. Nunca se exponen IDs internos (UUIDs):
// en su lugar va un correlativo "#" desde 1.
const MAPA_EXCEL = {
  asistencia: (r) => ({
    "#": null, Empleado: r.empleado, Cédula: r.cedula, Área: r.area, Piso: r.piso ?? "",
    Fecha: r.fecha ? new Date(r.fecha).toLocaleDateString("es-CO") : "—",
    "Ent. Mañana": r.entrada1 || "—", "Sal. Mañana": r.salida1 || "—",
    "Ent. Tarde": r.entrada2 || "—", "Sal. Tarde": r.salida2 || "—",
    Horas: r.horas_trabajadas ? `${r.horas_trabajadas}h` : "—",
    Tardanza: r.minutos_tardanza ? `${r.minutos_tardanza} min` : "—",
    Marcación: r.tipo_marcacion || "—", Estado: ESTADO_ASIS_MAPA[r.estado] || r.estado || "—",
    Observación: r.observacion || "",
  }),
  incidencias: (r) => ({
    "#": null, Empleado: r.empleado, Cédula: r.cedula, Área: r.area,
    Tipo: r.tipo, Descripción: r.descripcion, Fecha: r.fecha,
    Estado: ESTADO_INC_MAPA[r.estado] || r.estado, Motivo: r.motivo_rechazo || "",
  }),
  tardanzas: (r) => ({
    "#": null, Empleado: r.empleado, Cédula: r.cedula, Área: r.area, Piso: r.piso ?? "",
    Fecha: r.fecha ? new Date(r.fecha).toLocaleDateString("es-CO") : "—",
    "Ent. Mañana": r.entrada1 || "—", "Ent. Tarde": r.entrada2 || "—",
    Tardanza: r.minutos_tardanza ? `${r.minutos_tardanza} min` : "—",
    Marcación: r.tipo_marcacion || "—", Observación: r.observacion || "",
  }),
  ausencias: (r) => ({
    "#": null, Empleado: r.empleado, Cédula: r.cedula, Área: r.area,
    Fecha: r.fecha ? new Date(r.fecha).toLocaleDateString("es-CO") : "—",
    Estado: ESTADO_ASIS_MAPA[r.estado] || r.estado || "—",
    Observación: r.observacion || "",
  }),
  porAreas: (r) => ({
    "#": null, Empleado: r.empleado, Cédula: r.cedula || "", Área: r.area || "",
    "Días laborados": r.dias_laborados || 0, Puntuales: r.puntuales || 0,
    Tardanzas: r.tardanzas || 0, Ausencias: r.ausencias || 0,
    "Horas trabajadas": r.horas_trabajadas ? `${r.horas_trabajadas}h` : "0h",
  }),
  marcaciones: (r) => ({
    "#": null, Empleado: r.empleado, Cédula: r.cedula, Área: r.area,
    Fecha: r.fecha ? new Date(r.fecha).toLocaleDateString("es-CO") : "—",
    "Ent. Mañana": r.entrada1 || "—", "Sal. Mañana": r.salida1 || "—",
    "Ent. Tarde": r.entrada2 || "—", "Sal. Tarde": r.salida2 || "—",
    Horas: r.horas_trabajadas ? `${r.horas_trabajadas}h` : "—",
    Marcación: r.tipo_marcacion || "—", Estado: ESTADO_ASIS_MAPA[r.estado] || r.estado || "—",
  }),
};

export const handleExcel = (tipo, registros) => {
  if (tipo === "porEmpleado") {
    // Los registros de este reporte son un objeto ({ empleado, periodo, resumen, ... }), no un array
    if (!registros?.empleado) return;
  } else if (!registros?.length) {
    return;
  }
  let datos = registros;
  if (tipo !== "porEmpleado" && MAPA_EXCEL[tipo]) {
    datos = registros.map((r, i) => ({ "#": i + 1, ...MAPA_EXCEL[tipo](r) }));
  }
  const nombreArchivo = (NOMBRES[tipo] || tipo).replace(/\s+/g, "_");
  if (tipo === "porEmpleado") {
    exportarWorkbook(construirHojaPorEmpleado(registros), nombreArchivo);
  } else {
    exportarExcel(datos, nombreArchivo);
  }
  const totalRegistros = tipo === "porEmpleado" ? (registros?.detalle?.length || 0) : registros.length;
  guardarHistorial({ tipo_reporte: NOMBRES[tipo], formato: "Excel", filtros: {}, total_registros: totalRegistros }).catch(() => {});
};