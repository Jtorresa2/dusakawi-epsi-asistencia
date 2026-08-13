import { exportarExcel } from "../../shared/utils/exportarExcel";
import { guardarHistorial } from "./reportes.api";

export const MESES = [
  {v:1,l:"Enero"},{v:2,l:"Febrero"},{v:3,l:"Marzo"},{v:4,l:"Abril"},{v:5,l:"Mayo"},{v:6,l:"Junio"},
  {v:7,l:"Julio"},{v:8,l:"Agosto"},{v:9,l:"Septiembre"},{v:10,l:"Octubre"},{v:11,l:"Noviembre"},{v:12,l:"Diciembre"},
];

export const NOMBRES = { porEmpleado: "Reporte por Empleado", asistencia: "Reporte de Asistencia", incidencias: "Reporte de Incidencias", tardanzas: "Reporte de Tardanzas", ausencias: "Reporte de Ausencias", empleados: "Reporte de Empleados", marcaciones: "Reporte de Marcaciones" };

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
  return `/api/pdf/${tipo}?${p.toString()}`;
};

export const exportarPDF = (tipo, f, onPreview) => {
  if (tipo === "porEmpleado") return; // endpoint aún no implementado
  const url = buildPdfUrl(tipo, f);
  if (onPreview) onPreview(url);
  guardarHistorial({ tipo_reporte: NOMBRES[tipo], formato: "PDF", filtros: f, total_registros: 0 }).catch(() => {});
};

export const handleExcel = (tipo, registros) => {
  if (!registros?.length) return;
  let datos = registros;
  if (tipo === "incidencias") {
    const ESTADO_MAPA = { pendiente: "Pendiente", aprobado: "Aprobado", rechazado: "Rechazado" };
    datos = registros.map(r => ({
      ID: r.id, Empleado: r.empleado, Cédula: r.cedula, Área: r.area,
      Tipo: r.tipo, Descripción: r.descripcion, Fecha: r.fecha,
      Estado: ESTADO_MAPA[r.estado] || r.estado, Motivo: r.motivo_rechazo || "",
    }));
  } else if (tipo === "porEmpleado") {
    // Exporta el detalle diario más el resumen como primeras filas
    const { empleado, periodo, resumen, permisos, incidencias, detalle } = registros;
    if (detalle?.length) {
      datos = [
        { "": `Reporte: ${empleado?.nombre} ${empleado?.apellido || ""}`, "": "", "": "", "": "", "": "", "": "" },
        { "": `Periodo: ${MESES.find(m=>m.v===periodo?.mes)?.l || ""} ${periodo?.anio || ""}`, "": "", "": "", "": "", "": "", "": "" },
        { "": "", "": "", "": "", "": "", "": "", "": "" },
        { "Días hábiles": periodo?.diasHabiles||0, "Festivos": periodo?.festivos||0, "Asistencia %": `${resumen?.porcentaje_asistencia||0}%`, "Puntuales": resumen?.puntuales||0, "Tardanzas": resumen?.tardanzas||0, "Ausentes": resumen?.ausentes||0, "Horas total": resumen?.horas_trabajadas||0, "Horas extra": resumen?.horas_extra||0, "Permisos": permisos?.total||0, "Incidencias": incidencias?.total||0 },
        { "": "", "": "", "": "", "": "", "": "", "": "" },
        ...detalle.map(d => ({
          Fecha: d.fecha ? new Date(d.fecha).toLocaleDateString("es-CO") : "—",
          "Ent. Mañana": d.entrada1||"—",
          "Sal. Mañana": d.salida1||"—",
          "Ent. Tarde": d.entrada2||"—",
          "Sal. Tarde": d.salida2||"—",
          Horas: d.horas_trabajadas ? `${d.horas_trabajadas}h` : "—",
          Estado: d.estado||"—",
          Festivo: d.esFestivo ? "Sí" : "No",
        })),
      ];
    } else {
      datos = [{ "": "No hay detalle diario disponible para este período." }];
    }
  }
  exportarExcel(datos, (NOMBRES[tipo] || tipo).replace(/\s+/g, "_"));
  guardarHistorial({ tipo_reporte: NOMBRES[tipo], formato: "Excel", filtros: {}, total_registros: registros.length }).catch(() => {});
};
