const { Router } = require("express");
const router = Router();
const pool = require("../config/db");
const { generarMembrete, generarPlantillaIncidencia } = require("../services/pdfTemplate");

// Plantilla individual de incidencia (existente)
router.get("/incidencias/:id/plantilla", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.*, e.nombre AS empleado_nombre, e.cedula
       FROM incidencias i
       LEFT JOIN empleado e ON i.empleado_id = e.id
       WHERE i.id = ?`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ mensaje: "Incidencia no encontrada" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=plantilla_incidencia_${req.params.id}.pdf`);
    generarPlantillaIncidencia(rows[0], res);
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

async function fetchAsistencia(fecha, fecha_desde, fecha_hasta, area, piso, estado) {
  let query = `
    SELECT a.id, e.cedula,
      CONCAT(e.nombre, ' ', e.apellido) AS colaborador,
      ar.nombre AS area, ar.piso, a.fecha,
      TIME_FORMAT(a.fecha_hora_entrada, '%H:%i') AS entrada1,
      TIME_FORMAT(a.fecha_hora_salida, '%H:%i') AS salida1,
      NULL AS entrada2, NULL AS salida2,
      a.horas_trabajadas, a.horas_extra,
      a.minutos_tardanza, a.tipo_marcacion,
      a.estado, a.observacion
    FROM asistencia a
    JOIN empleado e ON a.empleado_id = e.id
    JOIN areas ar ON e.area_id = ar.id
    WHERE 1=1
  `;
  const params = [];
  if (fecha) { query += " AND a.fecha = ?"; params.push(fecha); }
  else if (fecha_desde && fecha_hasta) { query += " AND a.fecha >= ? AND a.fecha <= ?"; params.push(fecha_desde, fecha_hasta); }
  else { query += " AND a.fecha = CURDATE()"; }
  if (area) { query += " AND ar.nombre LIKE ?"; params.push(`%${area}%`); }
  if (piso) { query += " AND ar.piso = ?"; params.push(piso); }
  if (estado) { query += " AND a.estado = ?"; params.push(estado); }
  query += " ORDER BY ar.nombre, e.nombre";
  const [rows] = await pool.query(query, params);
  return rows.map((r) => ({
    ...r,
    empleado: r.colaborador,
    minutos_tardanza: r.minutos_tardanza ?? calcTardanza(r.entrada1, r.entrada2),
    estado: r.estado || determinarEstado(r.entrada1, r.entrada2, false),
  }));
}

function drawTable(doc, rows, startY) {
  let y = startY;
  const pageW = 595.28;
  const M = 40;
  const colW = (pageW - M * 2 - 10) / 6;
  const rowH = 18;
  const headerH = 20;
  const headers = ["Empleado", "Área", "Mañana", "Tarde", "Tardanza", "Estado"];

  doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFFFFF");
  doc.roundedRect(M + 5, y, pageW - M * 2 - 10, headerH, 3).fill("#1B5E20");
  let hx = M + 8;
  headers.forEach((h) => { doc.fillColor("#FFFFFF").text(h, hx + 3, y + 6, { width: colW - 3 }); hx += colW; });
  y += headerH;
  doc.fillColor("#111827").font("Helvetica").fontSize(6.5);

  const badgeColors = {
    puntual: { bg: "#D1FAE5", color: "#065F46" },
    tardanza: { bg: "#FEF3C7", color: "#92400E" },
    ausente: { bg: "#FEE2E2", color: "#991B1B" },
    justificado: { bg: "#DBEAFE", color: "#1E40AF" },
  };

  rows.slice(0, 30).forEach((r, idx) => {
    if (y > 680) return;
    if (idx % 2 === 0) doc.rect(M + 5, y, pageW - M * 2 - 10, rowH).fill("#F9FAFB");
    hx = M + 8;
    const cells = [
      r.empleado || "",
      r.area || "",
      r.entrada1 && r.salida1 ? `${r.entrada1}→${r.salida1}` : "—",
      r.entrada2 && r.salida2 ? `${r.entrada2}→${r.salida2}` : "—",
      r.minutos_tardanza > 0 ? `${r.minutos_tardanza} min` : "—",
      r.estado || "—",
    ];
    cells.forEach((val) => { doc.fillColor("#111827").text(val, hx + 3, y + 5, { width: colW - 3 }); hx += colW; });
    y += rowH;
  });

  if (rows.length > 30) {
    doc.fillColor("#6B7280").fontSize(7);
    doc.text(`... y ${rows.length - 30} registros más`, M + 5, y + 5);
  }
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

// GET /api/pdf/asistencia?fecha=&area=&piso=&estado=&fecha_desde=&fecha_hasta=
router.get("/asistencia", async (req, res) => {
  try {
    const { fecha, fecha_desde, fecha_hasta, area, piso, estado } = req.query;
    const rows = await fetchAsistencia(fecha, fecha_desde, fecha_hasta, area, piso, estado);
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
        doc.text(`Total: ${rows.length} registros`, { align: "right" });
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
        CONCAT(e.nombre, ' ', e.apellido) AS empleado,
        e.cedula, ar.nombre AS area,
        i.tipo, i.descripcion, i.evidencia_url,
        DATE_FORMAT(i.created_at, '%d/%m/%Y') AS fecha,
        i.estado, i.motivo_rechazo
      FROM incidencias i
      JOIN empleado e ON i.empleado_id = e.id
      JOIN areas ar ON e.area_id = ar.id
      WHERE 1=1
    `;
    const params = [];
    if (estado) { query += " AND i.estado = ?"; params.push(estado); }
    if (tipo) { query += " AND i.tipo = ?"; params.push(tipo); }
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
        doc.text(`Total: ${rows.length} registros`, { align: "right" });
        doc.moveDown(0.3);
        const pageW = 595.28, M = 40;
        const colW = (pageW - M * 2 - 10) / 6, rowH = 18, headerH = 20;
        let y = doc.y;
        const headers = ["Empleado", "Área", "Tipo", "Descripción", "Fecha", "Estado"];
        doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFFFFF");
        doc.roundedRect(M + 5, y, pageW - M * 2 - 10, headerH, 3).fill("#1B5E20");
        let hx = M + 8;
        headers.forEach((h) => { doc.fillColor("#FFFFFF").text(h, hx + 3, y + 6, { width: colW - 3 }); hx += colW; });
        y += headerH;
        doc.fillColor("#111827").font("Helvetica").fontSize(6.5);
        rows.slice(0, 30).forEach((r, idx) => {
          if (y > 680) return;
          if (idx % 2 === 0) doc.rect(M + 5, y, pageW - M * 2 - 10, rowH).fill("#F9FAFB");
          hx = M + 8;
          const cells = [
            r.empleado || "", r.area || "", r.tipo || "",
            (r.descripcion || "").substring(0, 40), r.fecha || "", r.estado || "",
          ];
          cells.forEach((val) => { doc.fillColor("#111827").text(val, hx + 3, y + 5, { width: colW - 3 }); hx += colW; });
          y += rowH;
        });
        if (rows.length > 30) { doc.fillColor("#6B7280").fontSize(7); doc.text(`... y ${rows.length - 30} registros más`, M + 5, y + 5); }
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
    const [indicadores] = await pool.query("SELECT * FROM vista_indicadores");
    let asistenciaHoy = [];
    try {
      [asistenciaHoy] = await pool.query(`
        SELECT CONCAT(e.nombre, ' ', e.apellido) AS empleado,
          TIME_FORMAT(a.fecha_hora_entrada, '%H:%i') AS entrada,
          TIME_FORMAT(a.fecha_hora_salida, '%H:%i') AS salida,
          a.estado
        FROM asistencia a
        JOIN empleado e ON a.empleado_id = e.id
        WHERE a.fecha = CURDATE()
        ORDER BY a.fecha_hora_entrada LIMIT 10
      `);
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
        { label: "Horas extra", value: String(ind.horas_extras_hoy ?? "—") },
        { label: "Permisos", value: String(ind.permisos_hoy ?? "—") },
      ];
      const pageW = 595.28, M = 40;
      const kpiW = (pageW - M * 2 - 20) / 3;
      kpis.forEach((k, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const x = M + 5 + col * (kpiW + 5), y = doc.y + row * 45;
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
        const colW = (pageW - M * 2 - 10) / 4, rowH = 16, headerH = 18;
        let y = doc.y;
        const headers = ["Empleado", "Entrada", "Salida", "Estado"];
        doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFFFFF");
        doc.roundedRect(M + 5, y, pageW - M * 2 - 10, headerH, 3).fill("#1B5E20");
        let hx = M + 8;
        headers.forEach((h) => { doc.fillColor("#FFFFFF").text(h, hx + 3, y + 5, { width: colW - 3 }); hx += colW; });
        y += headerH;
        doc.fillColor("#111827").font("Helvetica").fontSize(6.5);
        asistenciaHoy.forEach((r, idx) => {
          if (y > 680) return;
          if (idx % 2 === 0) doc.rect(M + 5, y, pageW - M * 2 - 10, rowH).fill("#F9FAFB");
          hx = M + 8;
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

module.exports = router;
