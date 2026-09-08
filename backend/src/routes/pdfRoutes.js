const { Router } = require("express");
const router = Router();
const pool = require("../config/db");
const { generarMembrete, generarPlantillaIncidencia } = require("../services/pdfTemplate");
const calculoHorario = require("../services/calculoHorarioService");
const auth = require("../middlewares/authMiddleware");
const rol = require("../middlewares/rol");
const seguimientoService = require("../services/seguimientoService");

// Plantilla individual de incidencia
router.get("/incidencias/:id/plantilla", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, u.nombre AS empleado_nombre, u.cedula, ar.nombre AS area
       FROM incidencias i
       LEFT JOIN usuarios u ON i.usuario_id = u.id
       LEFT JOIN areas ar ON u.area_id = ar.id
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

function determinarEstado(e1, e2, justificado, minutosTardanza, modalidad) {
  if (justificado) return "justificado";
  if (modalidad === "flexible" || modalidad === "por_horas") return "puntual";
  if (!e1 && !e2) return "ausente";
  return (minutosTardanza || 0) > 0 ? "tardanza" : "puntual";
}

async function fetchAsistencia(fecha, fecha_desde, fecha_hasta, area, piso, estado, empleado_id, area_id) {
  let query = `
    SELECT a.id, u.cedula, u.horario_id, h.modalidad,
      CONCAT(u.nombre, ' ', u.apellido) AS colaborador,
      ar.nombre AS area, ar.piso, a.fecha,
      TO_CHAR(a.fecha_hora_entrada, 'HH24:MI') AS entrada1,
      TO_CHAR(a.fecha_hora_salida_manana, 'HH24:MI') AS salida1,
      TO_CHAR(a.fecha_hora_entrada_tarde, 'HH24:MI') AS entrada2,
      TO_CHAR(a.fecha_hora_salida, 'HH24:MI') AS salida2,
      a.horas_trabajadas,
      a.minutos_tardanza, a.tipo_marcacion,
      a.estado, a.observacion
    FROM asistencia a
    JOIN usuarios u ON a.usuario_id = u.id
    JOIN areas ar ON u.area_id = ar.id
    LEFT JOIN horarios h ON u.horario_id = h.id
    WHERE 1=1
  `;
  const params = [];
  if (fecha) { query += " AND a.fecha = $1"; params.push(fecha); }
  else if (fecha_desde && fecha_hasta) { query += ` AND a.fecha >= $${params.length + 1} AND a.fecha <= $${params.length + 2}`; params.push(fecha_desde, fecha_hasta); }
  else if (fecha_desde) { query += ` AND a.fecha >= $${params.length + 1}`; params.push(fecha_desde); }
  else if (fecha_hasta) { query += ` AND a.fecha <= $${params.length + 1}`; params.push(fecha_hasta); }
  if (area_id) { query += ` AND u.area_id = $${params.length + 1}`; params.push(area_id); }
  else if (area) { query += ` AND ar.nombre LIKE $${params.length + 1}`; params.push(`%${area}%`); }
  if (piso) { query += ` AND ar.piso = $${params.length + 1}`; params.push(piso); }
  if (estado) { query += ` AND a.estado = $${params.length + 1}`; params.push(estado); }
  if (empleado_id) { query += ` AND a.usuario_id = $${params.length + 1}`; params.push(empleado_id); }
  query += " ORDER BY ar.nombre, u.nombre";
  const { rows } = await pool.query(query, params);

  const pendientes = rows.filter((r) => r.minutos_tardanza == null);
  if (pendientes.length > 0) {
    const horarioIds = [...new Set(pendientes.map((r) => r.horario_id).filter(Boolean))];
    if (horarioIds.length > 0) {
      const { rows: horarios } = await pool.query(
        `SELECT h.id AS horario_id, h.modalidad, h.tipo_jornada,
                h.tolerancia_minutos, h.tolerancia_salida_minutos,
                hd.dia_semana, hd.hora_entrada_manana, hd.hora_salida_manana,
                hd.hora_entrada_tarde, hd.hora_salida_tarde
         FROM horarios h
         LEFT JOIN horario_detalle hd ON h.id = hd.horario_id
         WHERE h.id = ANY($1)`,
        [horarioIds]
      );
      const porHorario = new Map();
      horarios.forEach((h) => {
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
      pendientes.forEach((r) => {
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
      pendientes.forEach((r) => { r.minutos_tardanza = 0; });
    }
  }

  return rows.map(({ horario_id, modalidad, ...r }) => ({
    ...r,
    empleado: r.colaborador,
    minutos_tardanza: r.minutos_tardanza ?? 0,
    estado:
      r.estado === "justificado" || r.estado === "ausente"
        ? r.estado
        : determinarEstado(r.entrada1, r.entrada2, false, r.minutos_tardanza ?? 0, modalidad),
  }));
}

const PDF_BODY_X = 65;

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
    ? ["Empleado", "├ürea", "Ma├▒ana", "Tarde", "Tardanza", "Estado"]
    : ["Empleado", "├ürea", "Ma├▒ana", "Tarde", "Estado"];

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
          r.entrada1 && r.salida1 ? `${r.entrada1}ÔåÆ${r.salida1}` : "ÔÇö",
          r.entrada2 && r.salida2 ? `${r.entrada2}ÔåÆ${r.salida2}` : "ÔÇö",
          tardanza || "ÔÇö",
          r.estado || "ÔÇö",
        ]
      : [
          r.empleado || "",
          r.area || "",
          r.entrada1 && r.salida1 ? `${r.entrada1}ÔåÆ${r.salida1}` : "ÔÇö",
          r.entrada2 && r.salida2 ? `${r.entrada2}ÔåÆ${r.salida2}` : "ÔÇö",
          r.estado || "ÔÇö",
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
    doc.text("Plantilla institucional lista para contenido din├ímico.", { align: "justify", lineGap: 6 });
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
      if (area) doc.text(`├ürea: ${area}`, { align: "center" });
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
        CONCAT(u.nombre, ' ', u.apellido) AS empleado,
        u.cedula, ar.nombre AS area,
        i.tipo, i.descripcion, i.evidencia_url,
        TO_CHAR(i.created_at, 'DD/MM/YYYY') AS fecha,
        i.estado, i.motivo_rechazo
      FROM incidencias i
      JOIN usuarios u ON i.usuario_id = u.id
      JOIN areas ar ON u.area_id = ar.id
      WHERE 1=1
    `;
    const params = [];
    if (estado) { query += " AND i.estado = $1"; params.push(estado); }
    if (tipo) { query += ` AND i.tipo = $${params.length + 1}`; params.push(tipo); }
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
        const headers = ["Empleado", "├ürea", "Tipo", "Descripci├│n", "Fecha", "Estado"];
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
    const { rows: indicadores } = await pool.query("SELECT * FROM vista_indicadores");
    let asistenciaHoy = [];
    try {
      const { rows: rowsAsistenciaHoy } = await pool.query(`
        SELECT CONCAT(u.nombre, ' ', u.apellido) AS empleado,
          TO_CHAR(a.fecha_hora_entrada, 'HH24:MI') AS entrada,
          TO_CHAR(a.fecha_hora_salida, 'HH24:MI') AS salida,
          a.estado
        FROM asistencia a
        JOIN usuarios u ON a.usuario_id = u.id
        WHERE a.fecha = CURRENT_DATE
        ORDER BY a.fecha_hora_entrada LIMIT 10
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
        { label: "Puntualidad", value: `${ind.puntualidad ?? "ÔÇö"}%` },
        { label: "Presentes hoy", value: String(ind.presentes_hoy ?? "ÔÇö") },
        { label: "Ausentes hoy", value: String(ind.ausentes_hoy ?? "ÔÇö") },
        { label: "Tardanzas", value: String(ind.tardanzas_hoy ?? "ÔÇö") },
        { label: "Permisos", value: String(ind.permisos_hoy ?? "ÔÇö") },
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
            r.empleado || "", r.entrada || "ÔÇö", r.salida || "ÔÇö", r.estado || "ÔÇö",
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
    const { fecha_desde, fecha_hasta, area_id, empleado_id, usuario_id } = req.query;
    const targetId = usuario_id || empleado_id; // backward compat
    let q = `SELECT u.cedula, CONCAT(u.nombre,' ',u.apellido) AS colaborador, ar.nombre AS area,
      a.fecha, TO_CHAR(a.fecha_hora_entrada,'HH24:MI') AS entrada, a.minutos_tardanza, a.observacion
      FROM asistencia a JOIN usuarios u ON a.usuario_id=u.id JOIN areas ar ON u.area_id=ar.id WHERE a.estado='tardanza'`;
    const p = [];
    if (fecha_desde) { q += ` AND a.fecha>=$${p.length + 1}`; p.push(fecha_desde); }
    if (fecha_hasta) { q += ` AND a.fecha<=$${p.length + 1}`; p.push(fecha_hasta); }
    if (area_id) { q += ` AND u.area_id=$${p.length + 1}`; p.push(area_id); }
    if (targetId) { q += ` AND a.usuario_id=$${p.length + 1}`; p.push(targetId); }
    q += " ORDER BY a.fecha DESC LIMIT 50";
    const { rows } = await pool.query(q, p);
    res.setHeader("Content-Type","application/pdf");
    res.setHeader("Content-Disposition","inline; filename=tardanzas.pdf");
    const meta = { codigo: "GA-F-001", version: "01", emision: "01/01/2024", vigencia: "01/01/2026" };
    generarMembrete(res, meta, (doc) => {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#1B5E20").text("REPORTE DE TARDANZAS",{align:"center"});
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(8).fillColor("#6B7280").text(`Per├¡odo: ${fecha_desde||"ÔÇö"} a ${fecha_hasta||"ÔÇö"}`,{align:"center"});
      doc.moveDown(1);
      if (!rows.length) return doc.fontSize(10).fillColor("#6B7280").text("Sin registros.",{align:"center"});
      doc.font("Helvetica").fontSize(7).fillColor("#6B7280").text(`Total: ${rows.length}`,PDF_BODY_X,doc.y,{align:"right",width:465}).moveDown(0.3);
      const pw=595.28, contentW=pw-PDF_BODY_X*2-10, cw=contentW/6, rh=18, hh=20; let y=doc.y;
      doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFF");
      doc.roundedRect(PDF_BODY_X,y,contentW,hh,3).fill("#92400E");
      ["Empleado","├ürea","Fecha","Entrada","Tardanza","Obs."].forEach((h,i)=>{doc.fillColor("#FFF").text(h,PDF_BODY_X+3+i*cw+3,y+6,{width:cw-3});});
      y+=hh; doc.fillColor("#111827").font("Helvetica").fontSize(6.5);
      rows.slice(0,30).forEach((r,i)=>{
        if(y>680)return; if(i%2===0)doc.rect(PDF_BODY_X,y,contentW,rh).fill("#F9FAFB");
        let hx=PDF_BODY_X+3; const c=[r.colaborador||"",r.area||"",r.fecha?new Date(r.fecha).toLocaleDateString("es-CO"):"ÔÇö",r.entrada||"ÔÇö",r.minutos_tardanza?`${r.minutos_tardanza} min`:"ÔÇö",(r.observacion||"").substring(0,30)];
        c.forEach(v=>{doc.fillColor("#111827").text(v,hx+3,y+5,{width:cw-3}); hx+=cw;}); y+=rh;
      });
      if(rows.length>30)doc.fillColor("#6B7280").fontSize(7).text(`... y ${rows.length-30} m├ís`,PDF_BODY_X,y+5);
    });
  } catch(e) { console.error(e); res.status(500).json({mensaje:"Error PDF",error:e.message}); }
});

// GET /api/pdf/ausencias
router.get("/ausencias", async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, area_id, empleado_id, usuario_id } = req.query;
    const targetId = usuario_id || empleado_id; // backward compat
    let q = `SELECT u.cedula, CONCAT(u.nombre,' ',u.apellido) AS colaborador, ar.nombre AS area,
      a.fecha, a.estado, a.observacion FROM asistencia a JOIN usuarios u ON a.usuario_id=u.id
      JOIN areas ar ON u.area_id=ar.id
      WHERE a.estado IN('ausente','justificado')
        AND NOT EXISTS (
          SELECT 1 FROM novedades p
          WHERE p.usuario_id = a.usuario_id AND a.fecha BETWEEN p.fecha_desde AND p.fecha_hasta
        )`;
    const p = [];
    if (fecha_desde) { q += ` AND a.fecha>=$${p.length + 1}`; p.push(fecha_desde); }
    if (fecha_hasta) { q += ` AND a.fecha<=$${p.length + 1}`; p.push(fecha_hasta); }
    if (area_id) { q += ` AND u.area_id=$${p.length + 1}`; p.push(area_id); }
    if (targetId) { q += ` AND a.usuario_id=$${p.length + 1}`; p.push(targetId); }
    q += " ORDER BY a.fecha DESC LIMIT 50";
    const { rows } = await pool.query(q, p);
    res.setHeader("Content-Type","application/pdf");
    res.setHeader("Content-Disposition","inline; filename=ausencias.pdf");
    const meta = { codigo: "GA-F-001", version: "01", emision: "01/01/2024", vigencia: "01/01/2026" };
    generarMembrete(res, meta, (doc) => {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#1B5E20").text("REPORTE DE AUSENCIAS",{align:"center"});
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(8).fillColor("#6B7280").text(`Per├¡odo: ${fecha_desde||"ÔÇö"} a ${fecha_hasta||"ÔÇö"}`,{align:"center"});
      doc.moveDown(1);
      if (!rows.length) return doc.fontSize(10).fillColor("#6B7280").text("Sin registros.",{align:"center"});
      doc.font("Helvetica").fontSize(7).fillColor("#6B7280").text(`Total: ${rows.length}`,PDF_BODY_X,doc.y,{align:"right",width:465}).moveDown(0.3);
      const pw=595.28, contentW=pw-PDF_BODY_X*2-10, cw=contentW/5, rh=18, hh=20; let y=doc.y;
      doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFF");
      doc.roundedRect(PDF_BODY_X,y,contentW,hh,3).fill("#DC2626");
      ["Empleado","├ürea","Fecha","Estado","Observaci├│n"].forEach((h,i)=>{doc.fillColor("#FFF").text(h,PDF_BODY_X+3+i*cw+3,y+6,{width:cw-3});});
      y+=hh; doc.fillColor("#111827").font("Helvetica").fontSize(6.5);
      rows.slice(0,30).forEach((r,i)=>{
        if(y>680)return; if(i%2===0)doc.rect(PDF_BODY_X,y,contentW,rh).fill("#F9FAFB");
        let hx=PDF_BODY_X+3; const c=[r.colaborador||"",r.area||"",r.fecha?new Date(r.fecha).toLocaleDateString("es-CO"):"ÔÇö",r.estado||"",(r.observacion||"").substring(0,40)];
        c.forEach(v=>{doc.fillColor("#111827").text(v,hx+3,y+5,{width:cw-3}); hx+=cw;}); y+=rh;
      });
      if(rows.length>30)doc.fillColor("#6B7280").fontSize(7).text(`... y ${rows.length-30} m├ís`,PDF_BODY_X,y+5);
    });
  } catch(e) { console.error(e); res.status(500).json({mensaje:"Error PDF",error:e.message}); }
});

// GET /api/pdf/empleados
router.get("/empleados", async (req, res) => {
  try {
    const { area_id, cargo_id } = req.query;
    let q = `SELECT u.cedula, u.nombre, u.apellido, u.telefono, u.correo, ar.nombre AS area, ca.nombre AS cargo, u.activo
      FROM usuarios u LEFT JOIN areas ar ON u.area_id=ar.id LEFT JOIN cargos ca ON u.cargo_id=ca.id WHERE 1=1`;
    const p = [];
    if (area_id) { q += ` AND u.area_id=$${p.length + 1}`; p.push(area_id); }
    if (cargo_id) { q += ` AND u.cargo_id=$${p.length + 1}`; p.push(cargo_id); }
    q += " ORDER BY u.apellido";
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
      const headers=["Nombre","C├®dula","Tel├®fono","├ürea","Cargo","Contacto","Estado"];
      let hx=PDF_BODY_X+3;
      headers.forEach((h,i)=>{doc.fillColor("#FFF").text(h,hx+3,y+6,{width:cw[i]-3}); hx+=cw[i];});
      y+=hh; doc.fillColor("#111827").font("Helvetica").fontSize(6.5);
      rows.forEach((r,i)=>{
        if(y+rh>700){doc.addPage(); y=PDF_BODY_Y;}
        if(i%2===0)doc.rect(PDF_BODY_X,y,contentW,rh).fill("#F9FAFB");
        hx=PDF_BODY_X+3;
        const c=[`${r.nombre||""} ${r.apellido||""}`,r.cedula||"",r.telefono||"ÔÇö",r.area||"ÔÇö",r.cargo||"ÔÇö",r.correo||"",r.activo?"Activo":"Inactivo"];
        c.forEach((v,i)=>{doc.fillColor("#111827").text(v,hx+3,y+5,{width:cw[i]-3}); hx+=cw[i];});
        y+=rh;
      });
    });
  } catch(e) { console.error(e); res.status(500).json({mensaje:"Error PDF",error:e.message}); }
});

// GET /api/pdf/marcaciones
router.get("/marcaciones", async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, empleado_id, usuario_id, area_id } = req.query;
    const targetId = usuario_id || empleado_id; // backward compat
    let q = `SELECT u.cedula, CONCAT(u.nombre,' ',u.apellido) AS colaborador, ar.nombre AS area,
      a.fecha,       TO_CHAR(a.fecha_hora_entrada,'HH24:MI') AS entrada,
      TO_CHAR(a.fecha_hora_salida,'HH24:MI') AS salida, a.tipo_marcacion, a.estado
      FROM asistencia a JOIN usuarios u ON a.usuario_id=u.id JOIN areas ar ON u.area_id=ar.id WHERE 1=1`;
    const p = [];
    if (fecha_desde) { q += ` AND a.fecha>=$${p.length + 1}`; p.push(fecha_desde); }
    if (fecha_hasta) { q += ` AND a.fecha<=$${p.length + 1}`; p.push(fecha_hasta); }
    if (targetId) { q += ` AND a.usuario_id=$${p.length + 1}`; p.push(targetId); }
    if (area_id) { q += ` AND u.area_id=$${p.length + 1}`; p.push(area_id); }
    q += " ORDER BY a.fecha DESC LIMIT 50";
    const { rows } = await pool.query(q, p);
    res.setHeader("Content-Type","application/pdf");
    res.setHeader("Content-Disposition","inline; filename=marcaciones.pdf");
    const meta = { codigo: "GA-F-001", version: "01", emision: "01/01/2024", vigencia: "01/01/2026" };
    generarMembrete(res, meta, (doc) => {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#1B5E20").text("REPORTE DE MARCACIONES",{align:"center"});
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(8).fillColor("#6B7280").text(`Per├¡odo: ${fecha_desde||"ÔÇö"} a ${fecha_hasta||"ÔÇö"}`,{align:"center"});
      doc.moveDown(1);
      if (!rows.length) return doc.fontSize(10).fillColor("#6B7280").text("Sin registros.",{align:"center"});
      doc.font("Helvetica").fontSize(7).fillColor("#6B7280").text(`Total: ${rows.length}`,PDF_BODY_X,doc.y,{align:"right",width:465}).moveDown(0.3);
      const pw=595.28, contentW=pw-PDF_BODY_X*2-10, cw=contentW/6, rh=18, hh=20; let y=doc.y;
      doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFF");
      doc.roundedRect(PDF_BODY_X,y,contentW,hh,3).fill("#1565C0");
      ["Empleado","├ürea","Fecha","Entrada","Salida","Tipo"].forEach((h,i)=>{doc.fillColor("#FFF").text(h,PDF_BODY_X+3+i*cw+3,y+6,{width:cw-3});});
      y+=hh; doc.fillColor("#111827").font("Helvetica").fontSize(6.5);
      rows.slice(0,30).forEach((r,i)=>{
        if(y>680)return; if(i%2===0)doc.rect(PDF_BODY_X,y,contentW,rh).fill("#F9FAFB");
        let hx=PDF_BODY_X+3; const c=[r.colaborador||"",r.area||"",r.fecha?new Date(r.fecha).toLocaleDateString("es-CO"):"ÔÇö",r.entrada||"ÔÇö",r.salida||"ÔÇö",r.tipo_marcacion||"ÔÇö"];
        c.forEach(v=>{doc.fillColor("#111827").text(v,hx+3,y+5,{width:cw-3}); hx+=cw;}); y+=rh;
      });
      if(rows.length>30)doc.fillColor("#6B7280").fontSize(7).text(`... y ${rows.length-30} m├ís`,PDF_BODY_X,y+5);
    });
  } catch(e) { console.error(e); res.status(500).json({mensaje:"Error PDF",error:e.message}); }
});

// ETIQUETA_SITUACION: slug de situación → etiqueta legible para el PDF.
const ETIQUETA_SITUACION = {
  ausencia: "Ausencia de día completo",
  falta_manana: "Falta de marcación — Mañana",
  falta_tarde: "Falta de marcación — Tarde",
  salida_no_registrada: "Salida no registrada",
  jornada_abierta: "Jornada abierta",
};

// GET /api/pdf/seguimiento — reporte PDF del seguimiento de asistencia (REQ-13).
// PROTEGIDO: auth + rol("admin","talento_humano"). NO existe endpoint de
// exportación sin protección. Reutiliza seguimientoService.clasificar (cap 500,
// sin paginar para el PDF) + generarMembrete. Los PDFs heredados sin auth NO se
// corrigen en este cambio (fuera de alcance).
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
      pageSize: seguimientoService.PAGE_SIZE_MAX, // cap 500 (REQ-15)
    };

    if (
      filtros.situacion &&
      !Object.values(seguimientoService.SITUACION).includes(filtros.situacion)
    ) {
      return res.status(400).json({
        mensaje:
          "situacion inválida. Valores: ausencia, falta_manana, falta_tarde, salida_no_registrada, jornada_abierta",
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

module.exports = router;
