import { Router, type RequestHandler } from "express";
import pool from "../../../config/db";
import { generarMembrete, generarPlantillaIncidencia } from "./pdfTemplate";
import * as calculoHorario from "../../shared/services/calculoHorarioService";
import auth from "../../shared/middlewares/authMiddleware";
import rol from "../../shared/middlewares/rol";
import * as seguimientoService from "../seguimiento/seguimientoService";
import { esIdValido } from "../../shared/utils/validators";

const router: Router = Router();

// Plantilla individual de incidencia
router.get("/incidencias/:id/plantilla", async (req, res) => {
  if (!esIdValido(String(req.params.id))) {
    return res.status(400).json({ mensaje: 'Id inválido' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT i.id, i.user_id AS usuario_id, i.type AS tipo, i.description AS descripcion,
        i.evidence AS evidencia_url, i.signed_file AS archivo_firmado, i.date AS fecha,
        i.status AS estado, i.priority AS prioridad, i.rejection_reason AS motivo_rechazo,
        i.observation AS observacion, i.reviewed_by AS revisado_por, i.created_at, i.updated_at,
        CONCAT(u.first_name, ' ', u.first_surname) AS empleado_nombre, dd.document_number AS cedula, ar.name AS area
       FROM incidents i
       LEFT JOIN users u ON i.user_id = u.id
       LEFT JOIN areas ar ON u.area_id = ar.id
       LEFT JOIN document_details dd ON dd.user_id = u.id
       WHERE i.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ mensaje: "Incidencia no encontrada" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=plantilla_incidencia_${req.params.id}.pdf`);
    const meta = { codigo: "GA-F-001", version: "01", emision: "01/01/2024", vigencia: "01/01/2026" };
    generarMembrete(res, meta, (doc) => {
      generarPlantillaIncidencia(doc, rows[0]);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al generar la plantilla PDF" });
  }
});

function determinarEstado(e1: unknown, e2: unknown, justificado: boolean, minutosTardanza: number, modalidad: string) {
  if (justificado) return "justified";
  if (modalidad === "flexible" || modalidad === "by_hours") return "on_time";
  if (!e1 && !e2) return "absent";
  return (minutosTardanza || 0) > 0 ? "late" : "on_time";
}

// Params sin tipar a propósito: pueden venir de req.query (string | string[] | ParsedQs).
async function fetchAsistencia(fecha: any, fecha_desde: any, fecha_hasta: any, area: any, piso: any, estado: any, empleado_id: any, area_id: any) {
  let query = `
    SELECT a.id, dd.document_number AS cedula, u.schedule_id AS horario_id, h.modality AS modalidad,
      CONCAT(u.first_name, ' ', u.first_surname) AS colaborador,
      ar.name AS area, NULLIF(regexp_replace(fl.name, '\\D', '', 'g'), '')::int AS piso, a.date AS fecha,
      TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
      TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
      TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
      TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
      a.worked_hours AS horas_trabajadas,
      a.late_minutes AS minutos_tardanza, a.mark_type AS tipo_marcacion,
      a.status AS estado, a.observation AS observacion
    FROM attendances a
    JOIN users u ON a.user_id = u.id
    JOIN areas ar ON u.area_id = ar.id
    LEFT JOIN floors fl ON ar.floor_id = fl.id
    LEFT JOIN document_details dd ON dd.user_id = u.id
    LEFT JOIN schedules h ON u.schedule_id = h.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (fecha) { query += " AND a.date = $1"; params.push(fecha); }
  else if (fecha_desde && fecha_hasta) { query += ` AND a.date >= $${params.length + 1} AND a.date <= $${params.length + 2}`; params.push(fecha_desde, fecha_hasta); }
  else if (fecha_desde) { query += ` AND a.date >= $${params.length + 1}`; params.push(fecha_desde); }
  else if (fecha_hasta) { query += ` AND a.date <= $${params.length + 1}`; params.push(fecha_hasta); }
  if (area_id) { query += ` AND u.area_id = $${params.length + 1}`; params.push(area_id); }
  else if (area) { query += ` AND ar.name LIKE $${params.length + 1}`; params.push(`%${area}%`); }
  if (piso) { query += ` AND NULLIF(regexp_replace(fl.name, '\\D', '', 'g'), '')::int = $${params.length + 1}`; params.push(piso); }
  if (estado) { query += ` AND a.status = $${params.length + 1}`; params.push(estado); }
  if (empleado_id) { query += ` AND a.user_id = $${params.length + 1}`; params.push(empleado_id); }
  query += " ORDER BY ar.name, u.first_name";
  const { rows } = await pool.query(query, params);

  const pendientes = rows.filter((r: any) => r.minutos_tardanza == null);
  if (pendientes.length > 0) {
    const horarioIds = [...new Set(pendientes.map((r: any) => r.horario_id).filter(Boolean))];
    if (horarioIds.length > 0) {
      const { rows: horarios } = await pool.query(
        `SELECT h.id AS horario_id, h.modality AS modalidad, h.workday_type AS tipo_jornada,
                h.tolerance_minutes AS tolerancia_minutos, h.tolerance_departure_minutes AS tolerancia_salida_minutos,
                hd.day_of_week AS dia_semana, hd.morning_entry AS hora_entrada_manana, hd.morning_exit AS hora_salida_manana,
                hd.afternoon_entry AS hora_entrada_tarde, hd.afternoon_exit AS hora_salida_tarde
         FROM schedules h
         LEFT JOIN schedule_details hd ON h.id = hd.schedule_id
         WHERE h.id = ANY($1::uuid[])`,
        [horarioIds]
      );
      const porHorario = new Map();
      horarios.forEach((h: any) => {
        if (!porHorario.has(h.horario_id)) {
          porHorario.set(h.horario_id, {
            id: h.horario_id,
            modalidad: h.modalidad,
            tipo_jornada: h.tipo_jornada,
            tolerancia_minutos: h.tolerancia_minutos,
            tolerancia_salida_minutos: h.tolerancia_salida_minutos,
            detalles: [],
          });
        }
        if (h.dia_semana) {
          porHorario.get(h.horario_id).detalles.push({
            dia_semana: h.dia_semana,
            hora_entrada_manana: h.hora_entrada_manana,
            hora_salida_manana: h.hora_salida_manana,
            hora_entrada_tarde: h.hora_entrada_tarde,
            hora_salida_tarde: h.hora_salida_tarde,
          });
        }
      });
      pendientes.forEach((r: any) => {
        const horario = porHorario.get(r.horario_id) || null;
        const detalle = horario
          ? calculoHorario.detalleParaDia(horario.detalles, calculoHorario.diaSemanaDeFecha(r.fecha))
          : null;
        const resultado = calculoHorario.evaluarHorario({
          horario,
          detalle,
          marcaciones: { entrada1: r.entrada1, salida1: r.salida1, entrada2: r.entrada2, salida2: r.salida2 },
        });
        r.minutos_tardanza = resultado.minutos_tardanza;
      });
    } else {
      pendientes.forEach((r: any) => { r.minutos_tardanza = 0; });
    }
  }

  return rows.map(({ horario_id, modalidad, ...r }: any) => ({
    ...r,
    empleado: r.colaborador,
    minutos_tardanza: r.minutos_tardanza ?? 0,
    estado:
      r.estado === "justified" || r.estado === "absent"
        ? r.estado
        : determinarEstado(r.entrada1, r.entrada2, false, r.minutos_tardanza ?? 0, modalidad),
  }));
}

const PDF_BODY_X = 65;
// En el .js original PDF_BODY_Y no estaba definido (ReferenceError latente si una
// tabla salta de página). Igual que CONTENT_TOP de pdfTemplate (110 + 20).
const PDF_BODY_Y = 130;

function drawTable(doc: any, rows: any[], startY: number) {
  let y = startY;
  const pageW = 595.28;
  const contentW = pageW - PDF_BODY_X * 2 - 10;
  const maxY = 720;
  const hasTardanza = rows.some((r: any) => (r.minutos_tardanza || 0) > 0);
  const colCount = hasTardanza ? 6 : 5;
  const colW = contentW / colCount;
  const rowH = 18;
  const headerH = 20;
  const headers = hasTardanza
    ? ["Empleado", "Área", "Mañana", "Tarde", "Tardanza", "Estado"]
    : ["Empleado", "Área", "Mañana", "Tarde", "Estado"];

  function drawHeader() {
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFFFFF");
    doc.roundedRect(PDF_BODY_X, y, contentW, headerH, 3).fill("#1B5E20");
    let hx = PDF_BODY_X + 3;
    headers.forEach((h) => { doc.fillColor("#FFFFFF").text(h, hx + 3, y + 6, { width: colW - 3 }); hx += colW; });
    y += headerH;
  }

  drawHeader();
  doc.fillColor("#111827").font("Helvetica").fontSize(6.5);

  rows.forEach((r: any, idx: number) => {
    if (y + rowH > maxY) {
      doc.addPage();
      y = doc.y;
      drawHeader();
      doc.fillColor("#111827").font("Helvetica").fontSize(6.5);
    }
    if (idx % 2 === 0) doc.rect(PDF_BODY_X, y, contentW, rowH).fill("#F9FAFB");
    let hx = PDF_BODY_X + 3;
    const tardanza = r.minutos_tardanza > 0 ? `${r.minutos_tardanza} min` : null;
    const cells = hasTardanza
      ? [
          r.empleado || "",
          r.area || "",
          r.entrada1 && r.salida1 ? `${r.entrada1}→${r.salida1}` : "—",
          r.entrada2 && r.salida2 ? `${r.entrada2}→${r.salida2}` : "—",
          tardanza || "—",
          r.estado || "—",
        ]
      : [
          r.empleado || "",
          r.area || "",
          r.entrada1 && r.salida1 ? `${r.entrada1}→${r.salida1}` : "—",
          r.entrada2 && r.salida2 ? `${r.entrada2}→${r.salida2}` : "—",
          r.estado || "—",
        ];
    cells.forEach((val) => { doc.fillColor("#111827").text(val, hx + 3, y + 5, { width: colW - 3 }); hx += colW; });
    y += rowH;
  });
}

// GET /api/pdf/test
router.get("/test", (req, res) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=membrete_dusakawi.pdf");
  const meta = { codigo: "GA-F-001", version: "01", emision: "01/01/2024", vigencia: "01/01/2026" };
  generarMembrete(res, meta, (doc) => {
    doc.font("Helvetica").fontSize(11).fillColor("#4B5563");
    doc.text("Plantilla institucional lista para contenido dinámico.", { align: "justify", lineGap: 6 });
  });
});

// GET /api/pdf/asistencia?fecha=&area=&piso=&estado=&fecha_desde=&fecha_hasta=&empleado_id=
router.get("/asistencia", async (req, res) => {
  try {
    const { fecha, fecha_desde, fecha_hasta, area, piso, estado, empleado_id, usuario_id, area_id } = req.query;
    const targetId = usuario_id || empleado_id; // backward compat
    const rows = await fetchAsistencia(fecha, fecha_desde, fecha_hasta, area, piso, estado, targetId, area_id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=asistencia_dusakawi.pdf");
    const meta = { codigo: "GA-F-001", version: "01", emision: "01/01/2024", vigencia: "01/01/2026" };
    generarMembrete(res, meta, (doc) => {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#1B5E20");
      doc.text("REPORTE DE ASISTENCIA", { align: "center" });
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(8).fillColor("#6B7280");
      doc.text(`Fecha: ${fecha || `${fecha_desde || ""} - ${fecha_hasta || ""}`}`, { align: "center" });
      if (area) doc.text(`Área: ${area}`, { align: "center" });
      doc.moveDown(1);
      if (rows.length === 0) {
        doc.fontSize(10).fillColor("#6B7280");
        doc.text("No hay registros para los filtros seleccionados.", { align: "center" });
      } else {
        doc.font("Helvetica").fontSize(7).fillColor("#6B7280");
        doc.text(`Total: ${rows.length} registros`, PDF_BODY_X, doc.y, { align: "right", width: 465 });
        doc.moveDown(0.3);
        drawTable(doc, rows, doc.y);
      }
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al generar PDF", error: err.message });
  }
});

// GET /api/pdf/incidencias?estado=&tipo=
router.get("/incidencias", async (req, res) => {
  try {
    const { estado, tipo } = req.query;
    let query = `
      SELECT i.id,
        CONCAT(u.first_name, ' ', u.first_surname) AS empleado,
        dd.document_number AS cedula, ar.name AS area,
        i.type AS tipo, i.description AS descripcion, i.evidence AS evidencia_url,
        TO_CHAR(i.created_at, 'DD/MM/YYYY') AS fecha,
        i.status AS estado, i.rejection_reason AS motivo_rechazo
      FROM incidents i
      JOIN users u ON i.user_id = u.id
      JOIN areas ar ON u.area_id = ar.id
      LEFT JOIN document_details dd ON dd.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (estado) { query += " AND i.status = $1"; params.push(estado); }
    if (tipo) { query += ` AND i.type = $${params.length + 1}`; params.push(tipo); }
    query += " ORDER BY i.created_at DESC";
    const { rows } = await pool.query(query, params);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=incidencias_dusakawi.pdf");
    const meta = { codigo: "GA-F-001", version: "01", emision: "01/01/2024", vigencia: "01/01/2026" };
    generarMembrete(res, meta, (doc) => {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#1B5E20");
      doc.text("REPORTE DE INCIDENCIAS", { align: "center" });
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(8).fillColor("#6B7280");
      if (estado) doc.text(`Estado: ${estado}`, { align: "center" });
      if (tipo) doc.text(`Tipo: ${tipo}`, { align: "center" });
      doc.moveDown(1);
      if (rows.length === 0) {
        doc.fontSize(10).fillColor("#6B7280");
        doc.text("No hay registros para los filtros seleccionados.", { align: "center" });
      } else {
        doc.font("Helvetica").fontSize(7).fillColor("#6B7280");
        doc.text(`Total: ${rows.length} registros`, PDF_BODY_X, doc.y, { align: "right", width: 465 });
        doc.moveDown(0.3);
        const pageW = 595.28, contentW = pageW - PDF_BODY_X * 2 - 10;
        const colW = [Math.round(contentW * 0.20), Math.round(contentW * 0.13), Math.round(contentW * 0.14), Math.round(contentW * 0.30), Math.round(contentW * 0.11), Math.round(contentW * 0.12)];
        const headerH = 20; let rowH = 18;
        let y = doc.y;
        const headers = ["Empleado", "Área", "Tipo", "Descripción", "Fecha", "Estado"];
        doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFFFFF");
        doc.roundedRect(PDF_BODY_X, y, contentW, headerH, 3).fill("#1B5E20");
        let hx = PDF_BODY_X + 3;
        headers.forEach((h, i) => { doc.fillColor("#FFFFFF").text(h, hx + 3, y + 6, { width: colW[i] - 3 }); hx += colW[i]; });
        y += headerH;
        doc.fillColor("#111827").font("Helvetica").fontSize(6.5);
        rows.forEach((r: any, idx: number) => {
          const descLines = doc.heightOfString(r.descripcion || "", { width: colW[3] - 6 });
          const lineCount = Math.max(1, Math.ceil(descLines / (6.5 * 1.2)));
          const rh = Math.max(rowH, lineCount * 10 + 6);
          if (y + rh > 700) { doc.addPage(); y = PDF_BODY_Y; }
          if (idx % 2 === 0) doc.rect(PDF_BODY_X, y, contentW, rh).fill("#F9FAFB");
          hx = PDF_BODY_X + 3;
          const cells = [
            r.empleado || "", r.area || "", r.tipo || "",
            r.descripcion || "", r.fecha || "", r.estado || "",
          ];
          cells.forEach((val, i) => { doc.fillColor("#111827").text(val, hx + 3, y + 3, { width: colW[i] - 6 }); hx += colW[i]; });
          y += rh;
        });
      }
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al generar PDF", error: err.message });
  }
});

// GET /api/pdf/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const { rows: indicadores } = await pool.query(`
      SELECT
        (SELECT ROUND(SUM((status = 'on_time')::int) / NULLIF(COUNT(*), 0) * 100, 1) FROM attendances WHERE date = CURRENT_DATE) AS puntualidad,
        (SELECT COUNT(DISTINCT user_id) FROM attendances WHERE date = CURRENT_DATE AND status IN ('on_time','late')) AS presentes_hoy,
        (SELECT COUNT(DISTINCT user_id) FROM attendances WHERE date = CURRENT_DATE AND status = 'absent') AS ausentes_hoy,
        (SELECT COUNT(DISTINCT user_id) FROM attendances WHERE date = CURRENT_DATE AND status = 'late') AS tardanzas_hoy,
        (SELECT COUNT(*) FROM incidents WHERE status = 'approved' AND date = CURRENT_DATE) AS permisos_hoy
    `);
    let asistenciaHoy: any[] = [];
    try {
      const { rows: rowsAsistenciaHoy } = await pool.query(`
        SELECT CONCAT(u.first_name, ' ', u.first_surname) AS empleado,
          TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada,
          TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida,
          a.status AS estado
        FROM attendances a
        JOIN users u ON a.user_id = u.id
        WHERE a.date = CURRENT_DATE
        ORDER BY a.entry_timestamp LIMIT 10
      `);
      asistenciaHoy = rowsAsistenciaHoy;
    } catch { asistenciaHoy = []; }
    const ind = indicadores[0] || {};

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=dashboard_dusakawi.pdf");
    const meta = { codigo: "GA-F-001", version: "01", emision: "01/01/2024", vigencia: "01/01/2026" };
    generarMembrete(res, meta, (doc) => {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#1B5E20");
      doc.text("RESUMEN GENERAL - DASHBOARD", { align: "center" });
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(8).fillColor("#6B7280");
      doc.text(`Generado: ${new Date().toLocaleDateString("es-VE")}`, { align: "center" });
      doc.moveDown(1.5);
      const kpis = [
        { label: "Puntualidad", value: `${ind.puntualidad ?? "—"}%` },
        { label: "Presentes hoy", value: String(ind.presentes_hoy ?? "—") },
        { label: "Ausentes hoy", value: String(ind.ausentes_hoy ?? "—") },
        { label: "Tardanzas", value: String(ind.tardanzas_hoy ?? "—") },
        { label: "Permisos", value: String(ind.permisos_hoy ?? "—") },
      ];
      const pageW = 595.28, contentW = pageW - PDF_BODY_X * 2 - 10;
      const kpiW = (contentW - 10) / 3;
      kpis.forEach((k, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const x = PDF_BODY_X + col * (kpiW + 5), y = doc.y + row * 45;
        doc.roundedRect(x, y, kpiW, 38, 6).fill("#F9FAFB");
        doc.fillColor("#6B7280").font("Helvetica").fontSize(7).text(k.label, x + 10, y + 6);
        doc.fillColor("#111827").font("Helvetica-Bold").fontSize(14).text(k.value, x + 10, y + 18);
      });
      doc.y += 95;
      if (asistenciaHoy.length > 0) {
        doc.moveDown(1);
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#1B5E20");
        doc.text("MOVIMIENTOS DE HOY", { align: "left" });
        doc.moveDown(0.5);
        const colW = contentW / 4, rowH = 16, headerH = 18;
        let y = doc.y;
        const headers = ["Empleado", "Entrada", "Salida", "Estado"];
        doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFFFFF");
        doc.roundedRect(PDF_BODY_X, y, contentW, headerH, 3).fill("#1B5E20");
        let hx = PDF_BODY_X + 3;
        headers.forEach((h) => { doc.fillColor("#FFFFFF").text(h, hx + 3, y + 5, { width: colW - 3 }); hx += colW; });
        y += headerH;
        doc.fillColor("#111827").font("Helvetica").fontSize(6.5);
        asistenciaHoy.forEach((r: any, idx: number) => {
          if (y > 680) return;
          if (idx % 2 === 0) doc.rect(PDF_BODY_X, y, contentW, rowH).fill("#F9FAFB");
          hx = PDF_BODY_X + 3;
          const cells = [
            r.empleado || "", r.entrada || "—", r.salida || "—", r.estado || "—",
          ];
          cells.forEach((val) => { doc.fillColor("#111827").text(String(val).substring(0, 25), hx + 3, y + 4, { width: colW - 3 }); hx += colW; });
          y += rowH;
        });
      }
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al generar PDF", error: err.message });
  }
});

// GET /api/pdf/tardanzas
router.get("/tardanzas", async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, area_id, empleado_id, usuario_id } = req.query;
    const targetId = usuario_id || empleado_id; // backward compat
    let q = `SELECT dd.document_number AS cedula, CONCAT(u.first_name,' ',u.first_surname) AS colaborador, ar.name AS area,
      a.date AS fecha, TO_CHAR(a.entry_timestamp,'HH24:MI') AS entrada, a.late_minutes AS minutos_tardanza, a.observation AS observacion
      FROM attendances a JOIN users u ON a.user_id=u.id JOIN areas ar ON u.area_id=ar.id
      LEFT JOIN document_details dd ON dd.user_id=u.id WHERE a.status='late'`;
    const p: any[] = [];
    if (fecha_desde) { q += ` AND a.date>=$${p.length + 1}`; p.push(fecha_desde); }
    if (fecha_hasta) { q += ` AND a.date<=$${p.length + 1}`; p.push(fecha_hasta); }
    if (area_id) { q += ` AND u.area_id=$${p.length + 1}`; p.push(area_id); }
    if (targetId) { q += ` AND a.user_id=$${p.length + 1}`; p.push(targetId); }
    q += " ORDER BY a.date DESC LIMIT 50";
    const { rows } = await pool.query(q, p);
    res.setHeader("Content-Type","application/pdf");
    res.setHeader("Content-Disposition","inline; filename=tardanzas.pdf");
    const meta = { codigo: "GA-F-001", version: "01", emision: "01/01/2024", vigencia: "01/01/2026" };
    generarMembrete(res, meta, (doc) => {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#1B5E20").text("REPORTE DE TARDANZAS",{align:"center"});
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(8).fillColor("#6B7280").text(`Período: ${fecha_desde||"—"} a ${fecha_hasta||"—"}`,{align:"center"});
      doc.moveDown(1);
      if (!rows.length) return doc.fontSize(10).fillColor("#6B7280").text("Sin registros.",{align:"center"});
      doc.font("Helvetica").fontSize(7).fillColor("#6B7280").text(`Total: ${rows.length}`,PDF_BODY_X,doc.y,{align:"right",width:465}).moveDown(0.3);
      const pw=595.28, contentW=pw-PDF_BODY_X*2-10, cw=contentW/6, rh=18, hh=20; let y=doc.y;
      doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFF");
      doc.roundedRect(PDF_BODY_X,y,contentW,hh,3).fill("#92400E");
      ["Empleado","Área","Fecha","Entrada","Tardanza","Obs."].forEach((h,i)=>{doc.fillColor("#FFF").text(h,PDF_BODY_X+3+i*cw+3,y+6,{width:cw-3});});
      y+=hh; doc.fillColor("#111827").font("Helvetica").fontSize(6.5);
      rows.slice(0,30).forEach((r: any,i: number)=>{
        if(y>680)return; if(i%2===0)doc.rect(PDF_BODY_X,y,contentW,rh).fill("#F9FAFB");
        let hx=PDF_BODY_X+3; const c=[r.colaborador||"",r.area||"",r.fecha?new Date(r.fecha).toLocaleDateString("es-CO"):"—",r.entrada||"—",r.minutos_tardanza?`${r.minutos_tardanza} min`:"—",(r.observacion||"").substring(0,30)];
        c.forEach(v=>{doc.fillColor("#111827").text(v,hx+3,y+5,{width:cw-3}); hx+=cw;}); y+=rh;
      });
      if(rows.length>30)doc.fillColor("#6B7280").fontSize(7).text(`... y ${rows.length-30} más`,PDF_BODY_X,y+5);
    });
  } catch(e: any) { console.error(e); res.status(500).json({mensaje:"Error PDF",error:e.message}); }
});

// GET /api/pdf/ausencias
router.get("/ausencias", async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, area_id, empleado_id, usuario_id } = req.query;
    const targetId = usuario_id || empleado_id; // backward compat
    let q = `SELECT dd.document_number AS cedula, CONCAT(u.first_name,' ',u.first_surname) AS colaborador, ar.name AS area,
      a.date AS fecha, a.status AS estado, a.observation AS observacion FROM attendances a JOIN users u ON a.user_id=u.id
      JOIN areas ar ON u.area_id=ar.id
      LEFT JOIN document_details dd ON dd.user_id=u.id
      WHERE a.status IN('absent','justified')
        AND NOT EXISTS (
          SELECT 1 FROM news p
          WHERE p.user_id = a.user_id AND a.date BETWEEN p.date_from AND p.date_to
        )`;
    const p: any[] = [];
    if (fecha_desde) { q += ` AND a.date>=$${p.length + 1}`; p.push(fecha_desde); }
    if (fecha_hasta) { q += ` AND a.date<=$${p.length + 1}`; p.push(fecha_hasta); }
    if (area_id) { q += ` AND u.area_id=$${p.length + 1}`; p.push(area_id); }
    if (targetId) { q += ` AND a.user_id=$${p.length + 1}`; p.push(targetId); }
    q += " ORDER BY a.date DESC LIMIT 50";
    const { rows } = await pool.query(q, p);
    res.setHeader("Content-Type","application/pdf");
    res.setHeader("Content-Disposition","inline; filename=ausencias.pdf");
    const meta = { codigo: "GA-F-001", version: "01", emision: "01/01/2024", vigencia: "01/01/2026" };
    generarMembrete(res, meta, (doc) => {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#1B5E20").text("REPORTE DE AUSENCIAS",{align:"center"});
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(8).fillColor("#6B7280").text(`Período: ${fecha_desde||"—"} a ${fecha_hasta||"—"}`,{align:"center"});
      doc.moveDown(1);
      if (!rows.length) return doc.fontSize(10).fillColor("#6B7280").text("Sin registros.",{align:"center"});
      doc.font("Helvetica").fontSize(7).fillColor("#6B7280").text(`Total: ${rows.length}`,PDF_BODY_X,doc.y,{align:"right",width:465}).moveDown(0.3);
      const pw=595.28, contentW=pw-PDF_BODY_X*2-10, cw=contentW/5, rh=18, hh=20; let y=doc.y;
      doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFF");
      doc.roundedRect(PDF_BODY_X,y,contentW,hh,3).fill("#DC2626");
      ["Empleado","Área","Fecha","Estado","Observación"].forEach((h,i)=>{doc.fillColor("#FFF").text(h,PDF_BODY_X+3+i*cw+3,y+6,{width:cw-3});});
      y+=hh; doc.fillColor("#111827").font("Helvetica").fontSize(6.5);
      rows.slice(0,30).forEach((r: any,i: number)=>{
        if(y>680)return; if(i%2===0)doc.rect(PDF_BODY_X,y,contentW,rh).fill("#F9FAFB");
        let hx=PDF_BODY_X+3; const c=[r.colaborador||"",r.area||"",r.fecha?new Date(r.fecha).toLocaleDateString("es-CO"):"—",r.estado||"",(r.observacion||"").substring(0,40)];
        c.forEach(v=>{doc.fillColor("#111827").text(v,hx+3,y+5,{width:cw-3}); hx+=cw;}); y+=rh;
      });
      if(rows.length>30)doc.fillColor("#6B7280").fontSize(7).text(`... y ${rows.length-30} más`,PDF_BODY_X,y+5);
    });
  } catch(e: any) { console.error(e); res.status(500).json({mensaje:"Error PDF",error:e.message}); }
});

// GET /api/pdf/empleados
router.get("/empleados", async (req, res) => {
  try {
    const { area_id, cargo_id } = req.query;
    let q = `SELECT dd.document_number AS cedula, u.first_name AS nombre, u.first_surname AS apellido, u.phone AS telefono, u.email AS correo, ar.name AS area, ca.name AS cargo, u.active AS activo
      FROM users u LEFT JOIN areas ar ON u.area_id=ar.id LEFT JOIN positions ca ON u.position_id=ca.id
      LEFT JOIN document_details dd ON dd.user_id=u.id WHERE 1=1`;
    const p: any[] = [];
    if (area_id) { q += ` AND u.area_id=$${p.length + 1}`; p.push(area_id); }
    if (cargo_id) { q += ` AND u.position_id=$${p.length + 1}`; p.push(cargo_id); }
    q += " ORDER BY u.first_surname";
    const { rows } = await pool.query(q, p);
    res.setHeader("Content-Type","application/pdf");
    res.setHeader("Content-Disposition","inline; filename=empleados.pdf");
    const meta = { codigo: "GA-F-001", version: "01", emision: "01/01/2024", vigencia: "01/01/2026" };
    generarMembrete(res, meta, (doc) => {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#1B5E20").text("REPORTE DE EMPLEADOS",{align:"center"});
      doc.moveDown(1);
      if (!rows.length) return doc.fontSize(10).fillColor("#6B7280").text("Sin registros.",{align:"center"});
      doc.font("Helvetica").fontSize(7).fillColor("#6B7280").text(`Total: ${rows.length}`,PDF_BODY_X,doc.y,{align:"right",width:465}).moveDown(0.3);
      const pw=595.28, contentW=pw-PDF_BODY_X*2-10;
      const cw=[Math.round(contentW*0.20),Math.round(contentW*0.11),Math.round(contentW*0.13),Math.round(contentW*0.15),Math.round(contentW*0.14),Math.round(contentW*0.17),Math.round(contentW*0.10)];
      let rh=18, hh=20; let y=doc.y;
      doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFF");
      doc.roundedRect(PDF_BODY_X,y,contentW,hh,3).fill("#1B5E20");
      const headers=["Nombre","Cédula","Teléfono","Área","Cargo","Contacto","Estado"];
      let hx=PDF_BODY_X+3;
      headers.forEach((h,i)=>{doc.fillColor("#FFF").text(h,hx+3,y+6,{width:cw[i]-3}); hx+=cw[i];});
      y+=hh; doc.fillColor("#111827").font("Helvetica").fontSize(6.5);
      rows.forEach((r: any,i: number)=>{
        if(y+rh>700){doc.addPage(); y=PDF_BODY_Y;}
        if(i%2===0)doc.rect(PDF_BODY_X,y,contentW,rh).fill("#F9FAFB");
        hx=PDF_BODY_X+3;
        const c=[`${r.nombre||""} ${r.apellido||""}`,r.cedula||"",r.telefono||"—",r.area||"—",r.cargo||"—",r.correo||"",r.activo?"Activo":"Inactivo"];
        c.forEach((v,i)=>{doc.fillColor("#111827").text(v,hx+3,y+5,{width:cw[i]-3}); hx+=cw[i];});
        y+=rh;
      });
    });
  } catch(e: any) { console.error(e); res.status(500).json({mensaje:"Error PDF",error:e.message}); }
});

// GET /api/pdf/marcaciones
router.get("/marcaciones", async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, empleado_id, usuario_id, area_id } = req.query;
    const targetId = usuario_id || empleado_id; // backward compat
    let q = `SELECT dd.document_number AS cedula, CONCAT(u.first_name,' ',u.first_surname) AS colaborador, ar.name AS area,
      a.date AS fecha,       TO_CHAR(a.entry_timestamp,'HH24:MI') AS entrada,
      TO_CHAR(a.departure_timestamp,'HH24:MI') AS salida, a.mark_type AS tipo_marcacion, a.status AS estado
      FROM attendances a JOIN users u ON a.user_id=u.id JOIN areas ar ON u.area_id=ar.id
      LEFT JOIN document_details dd ON dd.user_id=u.id WHERE 1=1`;
    const p: any[] = [];
    if (fecha_desde) { q += ` AND a.date>=$${p.length + 1}`; p.push(fecha_desde); }
    if (fecha_hasta) { q += ` AND a.date<=$${p.length + 1}`; p.push(fecha_hasta); }
    if (targetId) { q += ` AND a.user_id=$${p.length + 1}`; p.push(targetId); }
    if (area_id) { q += ` AND u.area_id=$${p.length + 1}`; p.push(area_id); }
    q += " ORDER BY a.date DESC LIMIT 50";
    const { rows } = await pool.query(q, p);
    res.setHeader("Content-Type","application/pdf");
    res.setHeader("Content-Disposition","inline; filename=marcaciones.pdf");
    const meta = { codigo: "GA-F-001", version: "01", emision: "01/01/2024", vigencia: "01/01/2026" };
    generarMembrete(res, meta, (doc) => {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#1B5E20").text("REPORTE DE MARCACIONES",{align:"center"});
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(8).fillColor("#6B7280").text(`Período: ${fecha_desde||"—"} a ${fecha_hasta||"—"}`,{align:"center"});
      doc.moveDown(1);
      if (!rows.length) return doc.fontSize(10).fillColor("#6B7280").text("Sin registros.",{align:"center"});
      doc.font("Helvetica").fontSize(7).fillColor("#6B7280").text(`Total: ${rows.length}`,PDF_BODY_X,doc.y,{align:"right",width:465}).moveDown(0.3);
      const pw=595.28, contentW=pw-PDF_BODY_X*2-10, cw=contentW/6, rh=18, hh=20; let y=doc.y;
      doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFF");
      doc.roundedRect(PDF_BODY_X,y,contentW,hh,3).fill("#1565C0");
      ["Empleado","Área","Fecha","Entrada","Salida","Tipo"].forEach((h,i)=>{doc.fillColor("#FFF").text(h,PDF_BODY_X+3+i*cw+3,y+6,{width:cw-3});});
      y+=hh; doc.fillColor("#111827").font("Helvetica").fontSize(6.5);
      rows.slice(0,30).forEach((r: any,i: number)=>{
        if(y>680)return; if(i%2===0)doc.rect(PDF_BODY_X,y,contentW,rh).fill("#F9FAFB");
        let hx=PDF_BODY_X+3; const c=[r.colaborador||"",r.area||"",r.fecha?new Date(r.fecha).toLocaleDateString("es-CO"):"—",r.entrada||"—",r.salida||"—",r.tipo_marcacion||"—"];
        c.forEach(v=>{doc.fillColor("#111827").text(v,hx+3,y+5,{width:cw-3}); hx+=cw;}); y+=rh;
      });
      if(rows.length>30)doc.fillColor("#6B7280").fontSize(7).text(`... y ${rows.length-30} más`,PDF_BODY_X,y+5);
    });
  } catch(e: any) { console.error(e); res.status(500).json({mensaje:"Error PDF",error:e.message}); }
});

// ETIQUETA_SITUACION: slug de situación → etiqueta legible para el PDF.
const ETIQUETA_SITUACION: Record<string, string> = {
  absence: "Ausencia de día completo",
  missing_morning: "Falta de marcación — Mañana",
  missing_afternoon: "Falta de marcación — Tarde",
  unregistered_exit: "Salida no registrada",
  open_day: "Jornada abierta",
};

// GET /api/pdf/seguimiento — reporte PDF del seguimiento de asistencia (REQ-13).
// PROTEGIDO: auth + rol("admin","talento_humano"). NO existe endpoint de
// exportación sin protección. Reutiliza seguimientoService.clasificar (cap 500,
// sin paginar para el PDF) + generarMembrete. Los PDFs heredados sin auth NO se
// corrigen en este cambio (fuera de alcance).
router.get("/seguimiento", auth, rol("admin", "talento_humano") as RequestHandler, async (req, res) => {
  try {
    const hoy = seguimientoService.hoyISO();
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const ayerISO = seguimientoService.fmtDate(ayer);

    const filtros = {
      fecha_desde: req.query.fecha_desde || ayerISO,
      fecha_hasta: req.query.fecha_hasta || hoy,
      area: req.query.area || undefined,
      piso: req.query.piso || undefined,
      busqueda: req.query.busqueda || undefined,
      situacion: req.query.situacion || undefined,
      page: 1,
      pageSize: seguimientoService.PAGE_SIZE_MAX, // cap 500 (REQ-15)
    };

    if (
      filtros.situacion &&
      !Object.values(seguimientoService.SITUACION).includes(filtros.situacion as any)
    ) {
      return res.status(400).json({
        mensaje:
          "situacion inválida. Valores: absence, missing_morning, missing_afternoon, unregistered_exit, open_day",
      });
    }

    const { rows } = await seguimientoService.clasificar(filtros);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=seguimiento_asistencia.pdf");
    const meta = { codigo: "GA-F-001", version: "01", emision: "01/01/2024", vigencia: "01/01/2026" };
    generarMembrete(res, meta, (doc) => {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#1B5E20");
      doc.text("REPORTE DE SEGUIMIENTO DE ASISTENCIA", { align: "center" });
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(8).fillColor("#6B7280");
      doc.text(`Período: ${filtros.fecha_desde} a ${filtros.fecha_hasta}`, { align: "center" });
      if (filtros.area) doc.text(`Área: ${filtros.area}`, { align: "center" });
      doc.moveDown(1);
      if (rows.length === 0) {
        doc.fontSize(10).fillColor("#6B7280");
        doc.text("No hay registros para los filtros seleccionados.", { align: "center" });
        return;
      }
      doc.font("Helvetica").fontSize(7).fillColor("#6B7280");
      doc.text(`Total: ${rows.length} registros`, PDF_BODY_X, doc.y, { align: "right", width: 465 });
      doc.moveDown(0.3);
      drawTableSeguimiento(doc, rows, doc.y);
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al generar PDF", error: err.message });
  }
});

function drawTableSeguimiento(doc: any, rows: any[], startY: number) {
  const pageW = 595.28;
  const contentW = pageW - PDF_BODY_X * 2 - 10;
  const colW = contentW / 5;
  const headerH = 20;
  const rowH = 18;
  const maxY = 700;
  let y = startY;
  const headers = ["Empleado", "Área", "Fecha", "Situación", "Tramo"];

  function drawHeader() {
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFFFFF");
    doc.roundedRect(PDF_BODY_X, y, contentW, headerH, 3).fill("#1B5E20");
    let hx = PDF_BODY_X + 3;
    headers.forEach((h) => {
      doc.fillColor("#FFFFFF").text(h, hx + 3, y + 6, { width: colW - 3 });
      hx += colW;
    });
    y += headerH;
  }

  drawHeader();
  doc.fillColor("#111827").font("Helvetica").fontSize(6.5);

  rows.forEach((r: any, idx: number) => {
    if (y + rowH > maxY) {
      doc.addPage();
      y = doc.y; // generarMembrete ya reposicionó el cursor (margins 0)
      drawHeader();
      doc.fillColor("#111827").font("Helvetica").fontSize(6.5);
    }
    if (idx % 2 === 0) doc.rect(PDF_BODY_X, y, contentW, rowH).fill("#F9FAFB");
    let hx = PDF_BODY_X + 3;
    const cells = [
      r.empleado || "",
      r.area || "",
      r.fecha || "",
      ETIQUETA_SITUACION[r.situacion] || r.situacion || "",
      r.tramo || "",
    ];
    cells.forEach((val) => {
      doc.fillColor("#111827").text(val, hx + 3, y + 5, { width: colW - 3 });
      hx += colW;
    });
    y += rowH;
  });
}

export default router;