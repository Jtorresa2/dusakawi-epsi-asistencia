const { Router } = require("express");
const router = Router();
const pool = require("../config/db");
const auth = require("../middlewares/authMiddleware");
const rol = require("../middlewares/rol");
const seguimientoService = require("../services/seguimientoService");
const { generarMembrete, generarPlantillaIncidencia } = require("../services/pdfTemplate");
const { excluirRolesPorNombre, excluirRolesPorUserId, joinRoles } = require("../services/rolesFiltro");

// Plantilla individual de incidencia
router.get("/incidencias/:id/plantilla", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.*,
              i.type AS tipo,
              i.description AS descripcion,
              i.status AS estado,
              i.rejection_reason AS motivo_rechazo,
              i.created_at AS fecha,
              CONCAT(e.first_name, ' ', e.first_surname) AS empleado_nombre,
              COALESCE(dd.document_number, '') AS cedula,
              ar.name AS area
       FROM incidents i
       LEFT JOIN users e ON i.user_id = e.id
       LEFT JOIN document_details dd ON dd.user_id = e.id
       LEFT JOIN areas ar ON e.area_id = ar.id${joinRoles('i.user_id')}
       WHERE i.id = ?${excluirRolesPorNombre('r')}`,
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

function minDesde(h) {
  if (!h) return 0;
  const [hora, min] = h.split(":").map(Number);
  return hora * 60 + min;
}

function calcTardanza(e1, e2) {
  let t = 0;
  if (e1) { const m = minDesde(e1); if (m > 425) t += m - 425; }
  if (e2) { const m = minDesde(e2); if (m > 845) t += m - 845; }
  return t;
}

function determinarEstado(e1, e2, justificado) {
  if (justificado) return "justificado";
  if (!e1 && !e2) return "ausente";
  return calcTardanza(e1, e2) > 0 ? "tardanza" : "puntual";
}

async function fetchAsistencia(fecha, fecha_desde, fecha_hasta, area, piso, estado, empleado_id, area_id) {
  let query = `
    SELECT a.id, COALESCE(dd.document_number, '') AS cedula,
      CONCAT(e.first_name, ' ', e.first_surname) AS colaborador,
      ar.name AS area, fl.name AS piso, DATE(a.date) AS fecha,
      TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
      TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
      TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
      TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
      a.worked_hours AS horas_trabajadas, a.extra_hours AS horas_extra,
      a.late_minutes AS minutos_tardanza, a.mark_type AS tipo_marcacion,
      a.status AS estado, a.observation AS observacion
    FROM attendances a
    JOIN users e ON a.user_id = e.id
    LEFT JOIN document_details dd ON dd.user_id = e.id
    LEFT JOIN areas ar ON e.area_id = ar.id
    LEFT JOIN floors fl ON ar.floor_id = fl.id
    WHERE 1=1${excluirRolesPorUserId('a.user_id')}
  `;
  const params = [];
  if (fecha) { query += " AND a.date = ?::date"; params.push(fecha); }
  else if (fecha_desde && fecha_hasta) { query += " AND a.date >= ?::date AND a.date <= ?::date"; params.push(fecha_desde, fecha_hasta); }
  else if (fecha_desde) { query += " AND a.date >= ?::date"; params.push(fecha_desde); }
  else if (fecha_hasta) { query += " AND a.date <= ?::date"; params.push(fecha_hasta); }
  if (area_id) { query += " AND e.area_id = ?"; params.push(area_id); }
  else if (area) { query += " AND ar.name LIKE ?"; params.push(`%${area}%`); }
  if (piso) { query += " AND fl.name ILIKE ?"; params.push(`%${piso}%`); }
  if (estado) { query += " AND a.status = ?"; params.push(estado); }
  if (empleado_id) { query += " AND a.user_id = ?"; params.push(empleado_id); }
  query += " ORDER BY ar.name, e.first_name";
  const [rows] = await pool.query(query, params);
  return rows.map((r) => ({
    ...r,
    empleado: r.colaborador,
    minutos_tardanza: r.minutos_tardanza ?? calcTardanza(r.entrada1, r.entrada2),
    estado: r.estado || determinarEstado(r.entrada1, r.entrada2, false),
  }));
}

const PDF_BODY_X = 65;
const PDF_BODY_Y = 130;

function drawTable(doc, rows, startY) {
  let y = startY;
  const pageW = 595.28;
  const contentW = pageW - PDF_BODY_X * 2 - 10;
  const maxY = 720;
  const hasTardanza = rows.some(r => (r.minutos_tardanza || 0) > 0);
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

  rows.forEach((r, idx) => {
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
    const { fecha, fecha_desde, fecha_hasta, area, piso, estado, empleado_id, area_id } = req.query;
    const rows = await fetchAsistencia(fecha, fecha_desde, fecha_hasta, area, piso, estado, empleado_id, area_id);
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
  } catch (err) {
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
        CONCAT(e.first_name, ' ', e.first_surname) AS empleado,
        COALESCE(dd.document_number, '') AS cedula, ar.name AS area,
        i.type AS tipo, i.description AS descripcion, i.evidence AS evidencia_url,
        TO_CHAR(i.created_at, 'DD/MM/YYYY') AS fecha,
        i.status AS estado, i.rejection_reason AS motivo_rechazo
      FROM incidents i
      JOIN users e ON i.user_id = e.id
      LEFT JOIN document_details dd ON dd.user_id = e.id
      JOIN areas ar ON e.area_id = ar.id
      WHERE 1=1${excluirRolesPorUserId('i.user_id')}
    `;
    const params = [];
    if (estado) { query += " AND i.status = ?"; params.push(estado); }
    if (tipo) { query += " AND i.type = ?"; params.push(tipo); }
    query += " ORDER BY i.created_at DESC";
    const [rows] = await pool.query(query, params);

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
        rows.forEach((r, idx) => {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al generar PDF", error: err.message });
  }
});

// GET /api/pdf/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const [indicadores] = await pool.query(`
      SELECT
        COUNT(DISTINCT CASE WHEN a.status IN ('on_time','late') THEN a.user_id END) AS presentes_hoy,
        COUNT(DISTINCT CASE WHEN a.status = 'absent' THEN a.user_id END) AS ausentes_hoy,
        COUNT(DISTINCT CASE WHEN a.status = 'late' THEN a.user_id END) AS tardanzas_hoy,
        CASE WHEN COUNT(*) > 0 THEN ROUND(SUM(CASE WHEN a.status = 'on_time' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) ELSE 100 END AS puntualidad
      FROM attendances a
      WHERE a.date = CURRENT_DATE${excluirRolesPorUserId('a.user_id')}
    `);
    const [extras] = await pool.query(`
      SELECT COALESCE(SUM(a.extra_hours), 0) AS horas_extras_hoy
      FROM attendances a
      WHERE a.date = CURRENT_DATE${excluirRolesPorUserId('a.user_id')}
    `);
    const [permisos] = await pool.query(`
      SELECT COUNT(*) AS permisos_hoy FROM incidents
      WHERE LOWER(status) IN ('approved', 'aprobado', 'aprobada')
        AND DATE(created_at) = CURRENT_DATE${excluirRolesPorUserId('user_id')}
    `);
    let asistenciaHoy = [];
    try {
      [asistenciaHoy] = await pool.query(`
        SELECT CONCAT(e.first_name, ' ', e.first_surname) AS empleado,
          TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada,
          TO_CHAR(COALESCE(a.departure_timestamp, a.morning_departure_timestamp), 'HH24:MI') AS salida,
          a.status AS estado
        FROM attendances a
        JOIN users e ON a.user_id = e.id
        WHERE a.date = CURRENT_DATE${excluirRolesPorUserId('a.user_id')}
        ORDER BY a.entry_timestamp LIMIT 10
      `);
    } catch { asistenciaHoy = []; }
    const ind = { ...(indicadores[0] || {}), ...(extras[0] || {}), ...(permisos[0] || {}) };

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
        { label: "Horas extra", value: String(ind.horas_extras_hoy ?? "—") },
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
        asistenciaHoy.forEach((r, idx) => {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al generar PDF", error: err.message });
  }
});

// GET /api/pdf/tardanzas
router.get("/tardanzas", async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, area_id, empleado_id } = req.query;
    let q = `SELECT COALESCE(dd.document_number, '') AS cedula, CONCAT(e.first_name,' ',e.first_surname) AS colaborador, ar.name AS area,
      DATE(a.date) AS fecha, TO_CHAR(a.entry_timestamp,'HH24:MI') AS entrada, a.late_minutes AS minutos_tardanza, a.observation AS observacion
      FROM attendances a
      JOIN users e ON a.user_id=e.id
      LEFT JOIN document_details dd ON dd.user_id = e.id
      JOIN areas ar ON e.area_id=ar.id
      WHERE a.status='late'${excluirRolesPorUserId('a.user_id')}`;
    const p = [];
    if (fecha_desde) { q += " AND a.date>=?::date"; p.push(fecha_desde); }
    if (fecha_hasta) { q += " AND a.date<=?::date"; p.push(fecha_hasta); }
    if (area_id) { q += " AND e.area_id=?"; p.push(area_id); }
    if (empleado_id) { q += " AND a.user_id=?"; p.push(empleado_id); }
    q += " ORDER BY a.date DESC LIMIT 50";
    const [rows] = await pool.query(q, p);
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
      rows.slice(0,30).forEach((r,i)=>{
        if(y>680)return; if(i%2===0)doc.rect(PDF_BODY_X,y,contentW,rh).fill("#F9FAFB");
        let hx=PDF_BODY_X+3; const c=[r.colaborador||"",r.area||"",r.fecha?new Date(r.fecha).toLocaleDateString("es-CO"):"—",r.entrada||"—",r.minutos_tardanza?`${r.minutos_tardanza} min`:"—",(r.observacion||"").substring(0,30)];
        c.forEach(v=>{doc.fillColor("#111827").text(v,hx+3,y+5,{width:cw-3}); hx+=cw;}); y+=rh;
      });
      if(rows.length>30)doc.fillColor("#6B7280").fontSize(7).text(`... y ${rows.length-30} más`,PDF_BODY_X,y+5);
    });
  } catch(e) { console.error(e); res.status(500).json({mensaje:"Error PDF",error:e.message}); }
});

// GET /api/pdf/ausencias
router.get("/ausencias", async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, area_id, empleado_id } = req.query;
    let q = `SELECT COALESCE(dd.document_number, '') AS cedula, CONCAT(e.first_name,' ',e.first_surname) AS colaborador, ar.name AS area,
      DATE(a.date) AS fecha, a.status AS estado, a.observation AS observacion
      FROM attendances a
      JOIN users e ON a.user_id=e.id
      LEFT JOIN document_details dd ON dd.user_id = e.id
      JOIN areas ar ON e.area_id=ar.id
      WHERE a.status IN('absent','justified')
        AND NOT EXISTS (
          SELECT 1 FROM news n
          WHERE n.user_id = a.user_id AND a.date BETWEEN n.date_from AND n.date_to
        )${excluirRolesPorUserId('a.user_id')}`;
    const p = [];
    if (fecha_desde) { q += " AND a.date>=?::date"; p.push(fecha_desde); }
    if (fecha_hasta) { q += " AND a.date<=?::date"; p.push(fecha_hasta); }
    if (area_id) { q += " AND e.area_id=?"; p.push(area_id); }
    if (empleado_id) { q += " AND a.user_id=?"; p.push(empleado_id); }
    q += " ORDER BY a.date DESC LIMIT 50";
    const [rows] = await pool.query(q, p);
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
      rows.slice(0,30).forEach((r,i)=>{
        if(y>680)return; if(i%2===0)doc.rect(PDF_BODY_X,y,contentW,rh).fill("#F9FAFB");
        let hx=PDF_BODY_X+3; const c=[r.colaborador||"",r.area||"",r.fecha?new Date(r.fecha).toLocaleDateString("es-CO"):"—",r.estado||"",(r.observacion||"").substring(0,40)];
        c.forEach(v=>{doc.fillColor("#111827").text(v,hx+3,y+5,{width:cw-3}); hx+=cw;}); y+=rh;
      });
      if(rows.length>30)doc.fillColor("#6B7280").fontSize(7).text(`... y ${rows.length-30} más`,PDF_BODY_X,y+5);
    });
  } catch(e) { console.error(e); res.status(500).json({mensaje:"Error PDF",error:e.message}); }
});

// GET /api/pdf/empleados
router.get("/empleados", async (req, res) => {
  try {
    const { area_id, cargo_id } = req.query;
    let q = `SELECT COALESCE(dd.document_number, '') AS cedula, e.first_name AS nombre, e.first_surname AS apellido,
      COALESCE(e.phone, '') AS telefono, e.email AS correo, ar.name AS area, ca.name AS cargo, 1 AS activo
      FROM users e
      LEFT JOIN document_details dd ON dd.user_id = e.id
      LEFT JOIN areas ar ON e.area_id=ar.id
      LEFT JOIN positions ca ON e.position_id=ca.id
      WHERE 1=1${excluirRolesPorUserId('e.id')}`;
    const p = [];
    if (area_id) { q += " AND e.area_id=?"; p.push(area_id); }
    if (cargo_id) { q += " AND e.position_id=?"; p.push(cargo_id); }
    q += " ORDER BY e.first_surname";
    const [rows] = await pool.query(q, p);
    res.setHeader("Content-Type","application/pdf");
    res.setHeader("Content-Disposition","inline; filename=empleados.pdf");
    const meta = { codigo: "GA-F-001", version: "01", emision: "01/01/2024", vigencia: "01/01/2026" };
    generarMembrete(res, meta, (doc) => {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#1B5E20").text("REPORTE DE EMPLEADOS",{align:"center"});
      doc.moveDown(1);
      if (!rows.length) return doc.fontSize(10).fillColor("#6B7280").text("Sin registros.",{align:"center"});
      doc.font("Helvetica").fontSize(7).fillColor("#6B7280").text(`Total: ${rows.length}`,PDF_BODY_X,doc.y,{align:"right",width:465}).moveDown(0.3);
      const pw=595.28, contentW=pw-PDF_BODY_X*2-10, cw=[Math.round(contentW*0.20),Math.round(contentW*0.11),Math.round(contentW*0.13),Math.round(contentW*0.15),Math.round(contentW*0.14),Math.round(contentW*0.17),Math.round(contentW*0.10)], rh=18, hh=20; let y=doc.y;
      doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFF");
      doc.roundedRect(PDF_BODY_X,y,contentW,hh,3).fill("#1B5E20");
      const headers=["Nombre","Cédula","Teléfono","Área","Cargo","Contacto","Estado"];
      let hx=PDF_BODY_X+3;
      headers.forEach((h,i)=>{doc.fillColor("#FFF").text(h,hx+3,y+6,{width:cw[i]-3}); hx+=cw[i];});
      y+=hh; doc.fillColor("#111827").font("Helvetica").fontSize(6.5);
      rows.forEach((r,i)=>{
        if(y+rh>700){doc.addPage(); y=PDF_BODY_Y;}
        if(i%2===0)doc.rect(PDF_BODY_X,y,contentW,rh).fill("#F9FAFB");
        hx=PDF_BODY_X+3;
        const c=[`${r.nombre||""} ${r.apellido||""}`,r.cedula||"",r.telefono||"—",r.area||"—",r.cargo||"—",r.correo||"",r.activo?"Activo":"Inactivo"];
        c.forEach((v,i)=>{doc.fillColor("#111827").text(v,hx+3,y+5,{width:cw[i]-3}); hx+=cw[i];});
        y+=rh;
      });
    });
  } catch(e) { console.error(e); res.status(500).json({mensaje:"Error PDF",error:e.message}); }
});

// GET /api/pdf/marcaciones
router.get("/marcaciones", async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, empleado_id, area_id } = req.query;
    let q = `SELECT COALESCE(dd.document_number, '') AS cedula, CONCAT(e.first_name,' ',e.first_surname) AS colaborador, ar.name AS area,
      DATE(a.date) AS fecha,
      TO_CHAR(a.entry_timestamp,'HH24:MI') AS entrada,
      TO_CHAR(COALESCE(a.departure_timestamp, a.morning_departure_timestamp),'HH24:MI') AS salida,
      a.mark_type AS tipo_marcacion, a.status AS estado
      FROM attendances a
      JOIN users e ON a.user_id=e.id
      LEFT JOIN document_details dd ON dd.user_id = e.id
      JOIN areas ar ON e.area_id=ar.id
      WHERE 1=1${excluirRolesPorUserId('a.user_id')}`;
    const p = [];
    if (fecha_desde) { q += " AND a.date>=?::date"; p.push(fecha_desde); }
    if (fecha_hasta) { q += " AND a.date<=?::date"; p.push(fecha_hasta); }
    if (empleado_id) { q += " AND a.user_id=?"; p.push(empleado_id); }
    if (area_id) { q += " AND e.area_id=?"; p.push(area_id); }
    q += " ORDER BY a.date DESC LIMIT 50";
    const [rows] = await pool.query(q, p);
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
      rows.slice(0,30).forEach((r,i)=>{
        if(y>680)return; if(i%2===0)doc.rect(PDF_BODY_X,y,contentW,rh).fill("#F9FAFB");
        let hx=PDF_BODY_X+3; const c=[r.colaborador||"",r.area||"",r.fecha?new Date(r.fecha).toLocaleDateString("es-CO"):"—",r.entrada||"—",r.salida||"—",r.tipo_marcacion||"—"];
        c.forEach(v=>{doc.fillColor("#111827").text(v,hx+3,y+5,{width:cw-3}); hx+=cw;}); y+=rh;
      });
      if(rows.length>30)doc.fillColor("#6B7280").fontSize(7).text(`... y ${rows.length-30} más`,PDF_BODY_X,y+5);
    });
  } catch(e) { console.error(e); res.status(500).json({mensaje:"Error PDF",error:e.message}); }
});

// GET /api/pdf/por-areas
router.get("/por-areas", async (req, res) => {
  try {
    const { area_id, empleado_id, usuario_id, mes, anio, estado } = req.query;
    const targetId = usuario_id || empleado_id;
    let q = `SELECT u.id, CONCAT(u.first_name, ' ', u.first_surname) AS empleado, dd.document_number AS cedula, ar.name AS area,
        (COUNT(DISTINCT a.date) FILTER (WHERE a.status IN ('on_time','late')))::int AS dias_laborados,
        (COUNT(*) FILTER (WHERE a.status = 'on_time'))::int AS puntuales,
        (COUNT(*) FILTER (WHERE a.status = 'late'))::int AS tardanzas,
        (COUNT(*) FILTER (WHERE a.status = 'absent'))::int AS ausencias,
        COALESCE(SUM(a.worked_hours), 0)::float AS horas_trabajadas
      FROM users u
      LEFT JOIN areas ar ON u.area_id=ar.id
      LEFT JOIN document_details dd ON dd.user_id=u.id
      LEFT JOIN attendances a ON a.user_id=u.id${joinRoles('u.id')}`;
    const p = [];
    // mes/anio van en el ON del LEFT JOIN para que los empleados sin marcas sigan apareciendo (ceros)
    const joinConds = [];
    if (mes) { joinConds.push(`EXTRACT(MONTH FROM a.date)=?`); p.push(mes); }
    if (anio) { joinConds.push(`EXTRACT(YEAR FROM a.date)=?`); p.push(anio); }
    if (joinConds.length) { q += ` AND ${joinConds.join(" AND ")}`; }
    q += ` WHERE u.active = true${excluirRolesPorNombre('r')}`;
    if (area_id) { q += ` AND u.area_id=?`; p.push(area_id); }
    if (targetId) { q += ` AND u.id=?`; p.push(targetId); }
    q += ` GROUP BY u.id, u.first_name, u.first_surname, dd.document_number, ar.name`;
    const ESTADO_HAVING = {
      on_time: "COUNT(*) FILTER (WHERE a.status = 'late') = 0 AND COUNT(*) FILTER (WHERE a.status = 'on_time') > 0",
      late: "COUNT(*) FILTER (WHERE a.status = 'late') > 0",
      absent: "COUNT(*) FILTER (WHERE a.status = 'absent') > 0",
      justified: "COUNT(*) FILTER (WHERE a.status = 'justified') > 0",
    };
    if (estado && ESTADO_HAVING[String(estado)]) { q += ` HAVING ${ESTADO_HAVING[String(estado)]}`; }
    q += " ORDER BY u.first_surname, u.first_name";
    const [rows] = await pool.query(q, p);
    res.setHeader("Content-Type","application/pdf");
    res.setHeader("Content-Disposition","inline; filename=por-areas.pdf");
    const meta = { codigo: "GA-F-001", version: "01", emision: "01/01/2024", vigencia: "01/01/2026" };
    generarMembrete(res, meta, (doc) => {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#1B5E20").text("REPORTE POR \u00c1REAS",{align:"center"});
      doc.moveDown(1);
      if (!rows.length) return doc.fontSize(10).fillColor("#6B7280").text("Sin registros.",{align:"center"});
      doc.font("Helvetica").fontSize(7).fillColor("#6B7280").text(`Total: ${rows.length}`,PDF_BODY_X,doc.y,{align:"right",width:465}).moveDown(0.3);
      const pw=595.28, contentW=pw-PDF_BODY_X*2-10;
      const cw=[Math.round(contentW*0.18),Math.round(contentW*0.11),Math.round(contentW*0.12),Math.round(contentW*0.14),Math.round(contentW*0.12),Math.round(contentW*0.11),Math.round(contentW*0.11),Math.round(contentW*0.11)];
      let rh=18, hh=20; let y=doc.y;
      doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFF");
      doc.roundedRect(PDF_BODY_X,y,contentW,hh,3).fill("#1B5E20");
      const headers=["Empleado","C\u00e9dula","\u00c1rea","D\u00edas laborados","Puntuales","Tardanzas","Ausencias","Horas"];
      let hx=PDF_BODY_X+3;
      headers.forEach((h,i)=>{doc.fillColor("#FFF").text(h,hx+3,y+6,{width:cw[i]-3}); hx+=cw[i];});
      y+=hh; doc.fillColor("#111827").font("Helvetica").fontSize(6.5);
      rows.forEach((r,i)=>{
        if(y+rh>700){doc.addPage(); y=PDF_BODY_Y;}
        if(i%2===0)doc.rect(PDF_BODY_X,y,contentW,rh).fill("#F9FAFB");
        hx=PDF_BODY_X+3;
        const c=[r.empleado||"",r.cedula||"",r.area||"",r.dias_laborados||0,r.puntuales||0,r.tardanzas||0,r.ausencias||0,r.horas_trabajadas?Number(r.horas_trabajadas).toFixed(2):"0"];
        c.forEach((v,i)=>{doc.fillColor("#111827").text(`${v}`,hx+3,y+5,{width:cw[i]-3}); hx+=cw[i];});
        y+=rh;
      });
    });
  } catch(e) { console.error(e); res.status(500).json({mensaje:"Error PDF",error:e.message}); }
});

// GET /api/pdf/por-empleado?usuario_id=&empleado_id=&mes=&anio=
router.get("/por-empleado", async (req, res) => {
  try {
    const { empleado_id, usuario_id, mes, anio } = req.query;
    const targetId = usuario_id || empleado_id;
    if (!targetId) return res.status(400).json({ mensaje: "usuario_id es requerido" });

    const mesConsulta  = mes  || new Date().getMonth() + 1;
    const anioConsulta = anio || new Date().getFullYear();

    const [empleadoRows] = await pool.query(`
      SELECT u.id, dd.document_number AS cedula, u.first_name AS nombre, u.first_surname AS apellido,
        ar.name AS area, ca.name AS cargo,
        TO_CHAR(u.hire_date, 'YYYY-MM-DD') AS fecha_ingreso
      FROM users u LEFT JOIN areas ar ON u.area_id = ar.id LEFT JOIN positions ca ON u.position_id = ca.id
      LEFT JOIN document_details dd ON dd.user_id = u.id
      WHERE u.id = ?${excluirRolesPorUserId('u.id')}
    `, [targetId]);
    const empleado = empleadoRows[0];
    if (!empleado) return res.status(404).json({ mensaje: "Empleado no encontrado" });

    const diasDelMes = new Date(Number(anioConsulta), Number(mesConsulta), 0).getDate();
    let diasHabiles = 0;
    for (let d = 1; d <= diasDelMes; d++) {
      const dia = new Date(Number(anioConsulta), Number(mesConsulta) - 1, d);
      if (dia.getDay() !== 0 && dia.getDay() !== 6) diasHabiles++;
    }

    const [festivosRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM holidays
       WHERE active = TRUE AND EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?
       AND EXTRACT(DOW FROM date) != 0 AND EXTRACT(DOW FROM date) != 6`,
      [mesConsulta, anioConsulta]
    );
    const totalFestivos = Number(festivosRows[0]?.total || 0);
    const diasEsperados = diasHabiles - totalFestivos;

    const [asisRows] = await pool.query(`
      SELECT
        COUNT(*) AS total_registros,
        SUM((status = 'on_time')::int) AS puntuales,
        SUM((status = 'late')::int) AS tardanzas,
        SUM((status = 'absent')::int) AS ausentes,
        SUM((status = 'justified')::int) AS justificados,
        COALESCE(SUM(worked_hours), 0) AS horas_trabajadas,
        COALESCE(SUM(late_minutes), 0) AS total_minutos_tardanza
      FROM attendances
      WHERE user_id = ? AND EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?${excluirRolesPorUserId('user_id')}
    `, [targetId, mesConsulta, anioConsulta]);
    const resumen = asisRows[0] || { total_registros: 0, puntuales: 0, tardanzas: 0, ausentes: 0, justificados: 0, horas_trabajadas: 0, total_minutos_tardanza: 0 };

    const [permisos] = await pool.query(`
      SELECT COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN mark_type IN ('full_day', 'commission') THEN
          (date_to - date_from + 1) - (
            SELECT COUNT(*) FROM generate_series(date_from::date, date_to::date, '1 day') AS d
            WHERE EXTRACT(DOW FROM d) IN (0, 6)
          )
        ELSE 1 END), 0) AS dias_permiso
      FROM news
      WHERE user_id = ? AND EXTRACT(MONTH FROM date_from) = ? AND EXTRACT(YEAR FROM date_from) = ?${excluirRolesPorUserId('user_id')}
    `, [targetId, mesConsulta, anioConsulta]);

    const [incidenciasRows] = await pool.query(`
      SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'pending') AS pendientes
      FROM incidents
      WHERE user_id = ? AND EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?${excluirRolesPorUserId('user_id')}
    `, [targetId, mesConsulta, anioConsulta]);
    const incidencias = incidenciasRows[0] || { total: 0, pendientes: 0 };

    const [detalle] = await pool.query(`
      SELECT a.date AS fecha, a.status AS estado,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        a.worked_hours AS horas_trabajadas, a.late_minutes AS minutos_tardanza, a.observation AS observacion
      FROM attendances a
      WHERE a.user_id = ? AND EXTRACT(MONTH FROM a.date) = ? AND EXTRACT(YEAR FROM a.date) = ?${excluirRolesPorUserId('a.user_id')}
      ORDER BY a.date DESC
    `, [targetId, mesConsulta, anioConsulta]);

    const [festivosDetalle] = await pool.query(
      `SELECT date AS fecha, name AS nombre FROM holidays WHERE active = TRUE
       AND EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?`,
      [mesConsulta, anioConsulta]
    );
    const festivosMapDetalle = Object.fromEntries(festivosDetalle.map((f) => {
      const d = new Date(f.fecha);
      return [`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`, f.nombre];
    }));
    const detalleConFestivos = detalle.map((d) => {
      const fechaStr = d.fecha instanceof Date
        ? `${d.fecha.getFullYear()}-${String(d.fecha.getMonth()+1).padStart(2,'0')}-${String(d.fecha.getDate()).padStart(2,'0')}`
        : d.fecha.substring(0, 10);
      return { ...d, esFestivo: !!festivosMapDetalle[fechaStr], festivo: festivosMapDetalle[fechaStr] || null };
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=reporte-por-empleado.pdf");
    const meta = { codigo: "GA-F-001", version: "01", emision: "01/01/2024", vigencia: "01/01/2026" };
    const NOMBRES_MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const ETIQUETA_ESTADO = { on_time: "Puntual", late: "Tardanza", absent: "Ausente", justified: "Justificado" };

    generarMembrete(res, meta, (doc) => {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#1B5E20").text("REPORTE POR EMPLEADO", { align: "center" });
      doc.moveDown(0.6);

      doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#111827").text(`Empleado: ${empleado.nombre || ""} ${empleado.apellido || ""}`);
      doc.font("Helvetica").fontSize(8).fillColor("#4B5563");
      doc.text(`C\u00e9dula: ${empleado.cedula || "\u2014"}   \u00c1rea: ${empleado.area || "\u2014"}   Cargo: ${empleado.cargo || "\u2014"}   Fecha de ingreso: ${empleado.fecha_ingreso || "\u2014"}`);
      doc.moveDown(0.4);
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#1B5E20").text(`Per\u00edodo: ${NOMBRES_MESES[Number(mesConsulta) - 1]} ${anioConsulta}`, { align: "center" });
      doc.moveDown(0.4);

      const [punt, tard, aus, jus] = [Number(resumen.puntuales), Number(resumen.tardanzas), Number(resumen.ausentes), Number(resumen.justificados)];
      const pAsistencia = Math.round((punt + tard + jus) / Math.max(diasEsperados, 1) * 100);
      const metas = [
        { label: "D\u00edas h\u00e1biles", value: `${diasHabiles}` },
        { label: "Festivos", value: `${totalFestivos}` },
        { label: "Asistencia %", value: `${pAsistencia}%` },
        { label: "Puntuales", value: `${punt}` },
        { label: "Tardanzas", value: `${tard}` },
        { label: "Ausentes", value: `${aus}` },
        { label: "Horas trabajadas", value: `${Number(resumen.horas_trabajadas)} h` },
        { label: "Permisos", value: `${Number(permisos[0]?.total || 0)}` },
        { label: "Incidencias", value: `${Number(incidencias.total || 0)}` },
      ];
      const pw = 595.28, contentW = pw - PDF_BODY_X * 2 - 10;
      const colW = contentW / 3, gridH = 30;
      let y = doc.y;
      metas.forEach((m, i) => {
        const col = i % 3, rowIdx = Math.floor(i / 3);
        const cx = PDF_BODY_X + col * colW;
        const cy = y + rowIdx * gridH;
        doc.rect(cx, cy, colW - 4, gridH - 4).fill(i % 2 === 0 ? "#F9FAFB" : "#FFFFFF");
        doc.font("Helvetica").fontSize(6.5).fillColor("#6B7280").text(m.label, cx + 6, cy + 5, { width: colW - 16 });
        doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text(m.value, cx + 6, cy + 14, { width: colW - 16 });
      });
      y += 3 * gridH;
      doc.y = y;
      doc.moveDown(0.6);

      if (!detalleConFestivos.length) {
        doc.font("Helvetica").fontSize(10).fillColor("#6B7280").text("Sin registros de asistencia en el per\u00edodo.", { align: "center" });
        return;
      }
      doc.moveDown(0.2);
      const cw = [Math.round(contentW*0.14), Math.round(contentW*0.115), Math.round(contentW*0.115), Math.round(contentW*0.115), Math.round(contentW*0.115), Math.round(contentW*0.09), Math.round(contentW*0.16), Math.round(contentW*0.105)];
      const headers = ["Fecha","Ent. Ma\u00f1ana","Sal. Ma\u00f1ana","Ent. Tarde","Sal. Tarde","Horas","Estado","Festivo"];
      let rh = 18, hh = 20;
      function drawHeaderDetalle() {
        doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFFFFF");
        doc.roundedRect(PDF_BODY_X, y, contentW, hh, 3).fill("#1B5E20");
        let hx = PDF_BODY_X + 3;
        headers.forEach((h, i) => { doc.fillColor("#FFFFFF").text(h, hx + 3, y + 6, { width: cw[i] - 3 }); hx += cw[i]; });
        y += hh;
      }
      drawHeaderDetalle();
      doc.fillColor("#111827").font("Helvetica").fontSize(6.5);
      detalleConFestivos.forEach((r, i) => {
        if (y + rh > 700) { doc.addPage(); y = PDF_BODY_Y; drawHeaderDetalle(); doc.fillColor("#111827").font("Helvetica").fontSize(6.5); }
        if (i % 2 === 0) doc.rect(PDF_BODY_X, y, contentW, rh).fill("#F9FAFB");
        let hx = PDF_BODY_X + 3;
        const fechaStr = r.fecha instanceof Date
          ? `${String(r.fecha.getDate()).padStart(2, '0')}/${String(r.fecha.getMonth() + 1).padStart(2, '0')}/${r.fecha.getFullYear()}`
          : (() => { const s = String(r.fecha).substring(0, 10).split("-"); return `${s[2]}/${s[1]}/${s[0]}`; })();
        const cells = [
          fechaStr,
          r.entrada1 || "\u2014",
          r.salida1 || "\u2014",
          r.entrada2 || "\u2014",
          r.salida2 || "\u2014",
          r.horas_trabajadas != null ? `${r.horas_trabajadas} h` : "\u2014",
          ETIQUETA_ESTADO[r.estado] || r.estado || "\u2014",
          r.esFestivo ? "S\u00ed" : "No",
        ];
        cells.forEach((v, j) => { doc.fillColor("#111827").text(String(v), hx + 3, y + 5, { width: cw[j] - 3 }); hx += cw[j]; });
        y += rh;
      });
    });
  } catch(e) { console.error(e); res.status(500).json({ mensaje: "Error PDF", error: e.message }); }
});

const ETIQUETA_SITUACION = {
  absence: "Ausencia de día completo",
  missing_morning: "Falta de marcación — Mañana",
  missing_afternoon: "Falta de marcación — Tarde",
  unregistered_exit: "Salida no registrada",
  open_day: "Jornada abierta",
};

function drawTableSeguimiento(doc, rows, startY) {
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

  rows.forEach((r, idx) => {
    if (y + rowH > maxY) {
      doc.addPage();
      y = doc.y;
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

// GET /api/pdf/seguimiento — reporte PDF del seguimiento de asistencia.
// PROTEGIDO: auth + rol("admin","talento_humano"). NO existe exportación sin protección.
router.get("/seguimiento", auth, rol("admin", "talento_humano"), async (req, res) => {
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
      pageSize: seguimientoService.PAGE_SIZE_MAX,
    };

    if (
      filtros.situacion &&
      !Object.values(seguimientoService.SITUACION).includes(filtros.situacion)
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al generar PDF", error: err.message });
  }
});

module.exports = router;
