import type { Request, Response } from 'express';
import { createRequire } from 'node:module';
import type { PdfTemplateService } from '@modules/pdf/infrastructure/services/pdf-template.service';
import type { GetTestPdfHandler } from '@modules/pdf/application/use-cases/get-test-pdf/get-test-pdf.handler';
import type { GetAsistenciaPdfHandler } from '@modules/pdf/application/use-cases/get-asistencia-pdf/get-asistencia-pdf.handler';
import type { GetIncidenciasPdfHandler } from '@modules/pdf/application/use-cases/get-incidencias-pdf/get-incidencias-pdf.handler';
import type { GetDashboardPdfHandler } from '@modules/pdf/application/use-cases/get-dashboard-pdf/get-dashboard-pdf.handler';
import type { GetTardanzasPdfHandler } from '@modules/pdf/application/use-cases/get-tardanzas-pdf/get-tardanzas-pdf.handler';
import type { GetAusenciasPdfHandler } from '@modules/pdf/application/use-cases/get-ausencias-pdf/get-ausencias-pdf.handler';
import type { GetEmpleadosPdfHandler } from '@modules/pdf/application/use-cases/get-empleados-pdf/get-empleados-pdf.handler';
import type { GetMarcacionesPdfHandler } from '@modules/pdf/application/use-cases/get-marcaciones-pdf/get-marcaciones-pdf.handler';
import type { GetPorAreasPdfHandler } from '@modules/pdf/application/use-cases/get-por-areas-pdf/get-por-areas-pdf.handler';
import type { GetPorEmpleadoPdfHandler } from '@modules/pdf/application/use-cases/get-por-empleado-pdf/get-por-empleado-pdf.handler';
import type { GetSeguimientoPdfHandler } from '@modules/pdf/application/use-cases/get-seguimiento-pdf/get-seguimiento-pdf.handler';
import type { GetIncidenciaTemplateHandler } from '@modules/pdf/application/use-cases/get-incidencia-template/get-incidencia-template.handler';
import type {
  PdfMeta,
  AsistenciaRow,
  SeguimientoFiltros,
} from '@modules/pdf/domain/entities/pdf';

const require = createRequire(import.meta.url);
const seguimientoService = require('../../../../services/seguimientoService.js') as {
  hoyISO: () => string;
  fmtDate: (d: Date) => string;
  PAGE_SIZE_MAX: number;
  SITUACION: Record<string, string>;
};

const META: PdfMeta = { codigo: 'GA-F-001', version: '01', emision: '01/01/2024', vigencia: '01/01/2026' };

const PDF_BODY_X = 65;
const PDF_BODY_Y = 130;

const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

// ─── Tabla de asistencia (legado pdfRoutes.js drawTable) ───────────────
function drawTable(doc: PDFKit.PDFDocument, rows: AsistenciaRow[], startY: number) {
  let y = startY;
  const pageW = 595.28;
  const contentW = pageW - PDF_BODY_X * 2 - 10;
  const maxY = 720;
  const hasTardanza = rows.some((r) => (r.minutos_tardanza || 0) > 0);
  const colCount = hasTardanza ? 6 : 5;
  const colW = contentW / colCount;
  const rowH = 18;
  const headerH = 20;
  const headers = hasTardanza
    ? ['Empleado', 'Área', 'Mañana', 'Tarde', 'Tardanza', 'Estado']
    : ['Empleado', 'Área', 'Mañana', 'Tarde', 'Estado'];

  const drawHeader = () => {
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#FFFFFF');
    doc.roundedRect(PDF_BODY_X, y, contentW, headerH, 3).fill('#1B5E20');
    let hx = PDF_BODY_X + 3;
    headers.forEach((h) => {
      doc.fillColor('#FFFFFF').text(h, hx + 3, y + 6, { width: colW - 3 });
      hx += colW;
    });
    y += headerH;
  };

  drawHeader();
  doc.fillColor('#111827').font('Helvetica').fontSize(6.5);

  rows.forEach((r, idx) => {
    if (y + rowH > maxY) {
      doc.addPage();
      y = doc.y;
      drawHeader();
      doc.fillColor('#111827').font('Helvetica').fontSize(6.5);
    }
    if (idx % 2 === 0) doc.rect(PDF_BODY_X, y, contentW, rowH).fill('#F9FAFB');
    let hx = PDF_BODY_X + 3;
    const tardanza = r.minutos_tardanza > 0 ? `${r.minutos_tardanza} min` : null;
    const cells = hasTardanza
      ? [
          r.empleado || '',
          r.area || '',
          r.entrada1 && r.salida1 ? `${r.entrada1}→${r.salida1}` : '—',
          r.entrada2 && r.salida2 ? `${r.entrada2}→${r.salida2}` : '—',
          tardanza || '—',
          r.estado || '—',
        ]
      : [
          r.empleado || '',
          r.area || '',
          r.entrada1 && r.salida1 ? `${r.entrada1}→${r.salida1}` : '—',
          r.entrada2 && r.salida2 ? `${r.entrada2}→${r.salida2}` : '—',
          r.estado || '—',
        ];
    cells.forEach((val) => {
      doc.fillColor('#111827').text(val, hx + 3, y + 5, { width: colW - 3 });
      hx += colW;
    });
    y += rowH;
  });
}

// ─── Tabla de seguimiento (legado pdfRoutes.js drawTableSeguimiento) ───
const ETIQUETA_SITUACION: Record<string, string> = {
  absence: 'Ausencia de día completo',
  missing_morning: 'Falta de marcación — Mañana',
  missing_afternoon: 'Falta de marcación — Tarde',
  unregistered_exit: 'Salida no registrada',
  open_day: 'Jornada abierta',
};

function drawTableSeguimiento(
  doc: PDFKit.PDFDocument,
  rows: Array<{ empleado?: string; area?: string; fecha?: string; situacion?: string; tramo?: string }>,
  startY: number,
) {
  const pageW = 595.28;
  const contentW = pageW - PDF_BODY_X * 2 - 10;
  const colW = contentW / 5;
  const headerH = 20;
  const rowH = 18;
  const maxY = 700;
  let y = startY;
  const headers = ['Empleado', 'Área', 'Fecha', 'Situación', 'Tramo'];

  const drawHeader = () => {
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#FFFFFF');
    doc.roundedRect(PDF_BODY_X, y, contentW, headerH, 3).fill('#1B5E20');
    let hx = PDF_BODY_X + 3;
    headers.forEach((h) => {
      doc.fillColor('#FFFFFF').text(h, hx + 3, y + 6, { width: colW - 3 });
      hx += colW;
    });
    y += headerH;
  };

  drawHeader();
  doc.fillColor('#111827').font('Helvetica').fontSize(6.5);

  rows.forEach((r, idx) => {
    if (y + rowH > maxY) {
      doc.addPage();
      y = doc.y;
      drawHeader();
      doc.fillColor('#111827').font('Helvetica').fontSize(6.5);
    }
    if (idx % 2 === 0) doc.rect(PDF_BODY_X, y, contentW, rowH).fill('#F9FAFB');
    let hx = PDF_BODY_X + 3;
    const cells = [
      r.empleado || '',
      r.area || '',
      r.fecha || '',
      ETIQUETA_SITUACION[r.situacion || ''] || r.situacion || '',
      r.tramo || '',
    ];
    cells.forEach((val) => {
      doc.fillColor('#111827').text(val, hx + 3, y + 5, { width: colW - 3 });
      hx += colW;
    });
    y += rowH;
  });
}

// ─── Plantilla individual de incidencia ────────────────────────────────
const getIncidenciaTemplate = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const handler = req.container.resolve<GetIncidenciaTemplateHandler>('getIncidenciaTemplateHandler');
    const row = await handler.handle(id);
    if (!row) return res.status(404).json({ mensaje: 'Incidencia no encontrada' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=plantilla_incidencia_${id}.pdf`);
    const template = req.container.resolve<PdfTemplateService>('pdfTemplateService');
    template.generarMembrete(res, META, (doc) => {
      template.generarPlantillaIncidencia(doc, row);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al generar la plantilla PDF' });
  }
};

// ─── GET /api/pdf/test ────────────────────────────────────────────────
const getTest = (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename=membrete_dusakawi.pdf');
  const template = req.container.resolve<PdfTemplateService>('pdfTemplateService');
  template.generarMembrete(res, META, (doc) => {
    doc.font('Helvetica').fontSize(11).fillColor('#4B5563');
    doc.text('Plantilla institucional lista para contenido dinámico.', { align: 'justify', lineGap: 6 });
  });
};

// ─── GET /api/pdf/asistencia ──────────────────────────────────────────
const getAsistencia = async (req: Request, res: Response) => {
  try {
    const fecha = str(req.query.fecha);
    const fecha_desde = str(req.query.fecha_desde);
    const fecha_hasta = str(req.query.fecha_hasta);
    const area = str(req.query.area);
    const piso = str(req.query.piso);
    const estado = str(req.query.estado);
    const empleado_id = str(req.query.empleado_id);
    const area_id = str(req.query.area_id);
    const handler = req.container.resolve<GetAsistenciaPdfHandler>('getAsistenciaPdfHandler');
    const rows = await handler.handle({ fecha, fecha_desde, fecha_hasta, area, piso, estado, empleado_id, area_id });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=asistencia_dusakawi.pdf');
    const template = req.container.resolve<PdfTemplateService>('pdfTemplateService');
    template.generarMembrete(res, META, (doc) => {
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1B5E20');
      doc.text('REPORTE DE ASISTENCIA', { align: 'center' });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(8).fillColor('#6B7280');
      doc.text(`Fecha: ${fecha || `${fecha_desde || ''} - ${fecha_hasta || ''}`}`, { align: 'center' });
      if (area) doc.text(`Área: ${area}`, { align: 'center' });
      doc.moveDown(1);
      if (rows.length === 0) {
        doc.fontSize(10).fillColor('#6B7280');
        doc.text('No hay registros para los filtros seleccionados.', { align: 'center' });
      } else {
        doc.font('Helvetica').fontSize(7).fillColor('#6B7280');
        doc.text(`Total: ${rows.length} registros`, PDF_BODY_X, doc.y, { align: 'right', width: 465 });
        doc.moveDown(0.3);
        drawTable(doc, rows, doc.y);
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al generar PDF', error: (err as Error).message });
  }
};

// ─── GET /api/pdf/incidencias ─────────────────────────────────────────
const getIncidencias = async (req: Request, res: Response) => {
  try {
    const estado = str(req.query.estado);
    const tipo = str(req.query.tipo);
    const handler = req.container.resolve<GetIncidenciasPdfHandler>('getIncidenciasPdfHandler');
    const rows = await handler.handle({ estado, tipo });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=incidencias_dusakawi.pdf');
    const template = req.container.resolve<PdfTemplateService>('pdfTemplateService');
    template.generarMembrete(res, META, (doc) => {
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1B5E20');
      doc.text('REPORTE DE INCIDENCIAS', { align: 'center' });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(8).fillColor('#6B7280');
      if (estado) doc.text(`Estado: ${estado}`, { align: 'center' });
      if (tipo) doc.text(`Tipo: ${tipo}`, { align: 'center' });
      doc.moveDown(1);
      if (rows.length === 0) {
        doc.fontSize(10).fillColor('#6B7280');
        doc.text('No hay registros para los filtros seleccionados.', { align: 'center' });
      } else {
        doc.font('Helvetica').fontSize(7).fillColor('#6B7280');
        doc.text(`Total: ${rows.length} registros`, PDF_BODY_X, doc.y, { align: 'right', width: 465 });
        doc.moveDown(0.3);
        const pageW = 595.28, contentW = pageW - PDF_BODY_X * 2 - 10;
        const colW = [Math.round(contentW * 0.20), Math.round(contentW * 0.13), Math.round(contentW * 0.14), Math.round(contentW * 0.30), Math.round(contentW * 0.11), Math.round(contentW * 0.12)];
        const headerH = 20; const rowH = 18;
        let y = doc.y;
        const headers = ['Empleado', 'Área', 'Tipo', 'Descripción', 'Fecha', 'Estado'];
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#FFFFFF');
        doc.roundedRect(PDF_BODY_X, y, contentW, headerH, 3).fill('#1B5E20');
        let hx = PDF_BODY_X + 3;
        headers.forEach((h, i) => { doc.fillColor('#FFFFFF').text(h, hx + 3, y + 6, { width: colW[i] - 3 }); hx += colW[i]; });
        y += headerH;
        doc.fillColor('#111827').font('Helvetica').fontSize(6.5);
        rows.forEach((r, idx) => {
          const descLines = doc.heightOfString(r.descripcion || '', { width: colW[3] - 6 });
          const lineCount = Math.max(1, Math.ceil(descLines / (6.5 * 1.2)));
          const rh = Math.max(rowH, lineCount * 10 + 6);
          if (y + rh > 700) { doc.addPage(); y = PDF_BODY_Y; }
          if (idx % 2 === 0) doc.rect(PDF_BODY_X, y, contentW, rh).fill('#F9FAFB');
          hx = PDF_BODY_X + 3;
          const cells = [
            r.empleado || '', r.area || '', r.tipo || '',
            r.descripcion || '', r.fecha || '', r.estado || '',
          ];
          cells.forEach((val, i) => { doc.fillColor('#111827').text(val, hx + 3, y + 3, { width: colW[i] - 6 }); hx += colW[i]; });
          y += rh;
        });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al generar PDF', error: (err as Error).message });
  }
};

// ─── GET /api/pdf/dashboard ───────────────────────────────────────────
const getDashboard = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetDashboardPdfHandler>('getDashboardPdfHandler');
    const { indicadores: ind, asistenciaHoy } = await handler.handle();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=dashboard_dusakawi.pdf');
    const template = req.container.resolve<PdfTemplateService>('pdfTemplateService');
    template.generarMembrete(res, META, (doc) => {
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1B5E20');
      doc.text('RESUMEN GENERAL - DASHBOARD', { align: 'center' });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(8).fillColor('#6B7280');
      doc.text(`Generado: ${new Date().toLocaleDateString('es-VE')}`, { align: 'center' });
      doc.moveDown(1.5);
      const kpis = [
        { label: 'Puntualidad', value: `${ind.puntualidad ?? '—'}%` },
        { label: 'Presentes hoy', value: String(ind.presentes_hoy ?? '—') },
        { label: 'Ausentes hoy', value: String(ind.ausentes_hoy ?? '—') },
        { label: 'Tardanzas', value: String(ind.tardanzas_hoy ?? '—') },
        { label: 'Horas extra', value: String(ind.horas_extras_hoy ?? '—') },
        { label: 'Permisos', value: String(ind.permisos_hoy ?? '—') },
      ];
      const pageW = 595.28, contentW = pageW - PDF_BODY_X * 2 - 10;
      const kpiW = (contentW - 10) / 3;
      kpis.forEach((k, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const x = PDF_BODY_X + col * (kpiW + 5), y = doc.y + row * 45;
        doc.roundedRect(x, y, kpiW, 38, 6).fill('#F9FAFB');
        doc.fillColor('#6B7280').font('Helvetica').fontSize(7).text(k.label, x + 10, y + 6);
        doc.fillColor('#111827').font('Helvetica-Bold').fontSize(14).text(k.value, x + 10, y + 18);
      });
      doc.y += 95;
      if (asistenciaHoy.length > 0) {
        doc.moveDown(1);
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#1B5E20');
        doc.text('MOVIMIENTOS DE HOY', { align: 'left' });
        doc.moveDown(0.5);
        const colW = contentW / 4, rowH = 16, headerH = 18;
        let y = doc.y;
        const headers = ['Empleado', 'Entrada', 'Salida', 'Estado'];
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#FFFFFF');
        doc.roundedRect(PDF_BODY_X, y, contentW, headerH, 3).fill('#1B5E20');
        let hx = PDF_BODY_X + 3;
        headers.forEach((h) => { doc.fillColor('#FFFFFF').text(h, hx + 3, y + 5, { width: colW - 3 }); hx += colW; });
        y += headerH;
        doc.fillColor('#111827').font('Helvetica').fontSize(6.5);
        asistenciaHoy.forEach((r, idx) => {
          if (y > 680) return;
          if (idx % 2 === 0) doc.rect(PDF_BODY_X, y, contentW, rowH).fill('#F9FAFB');
          hx = PDF_BODY_X + 3;
          const cells = [
            r.empleado || '', r.entrada || '—', r.salida || '—', r.estado || '—',
          ];
          cells.forEach((val) => { doc.fillColor('#111827').text(String(val).substring(0, 25), hx + 3, y + 4, { width: colW - 3 }); hx += colW; });
          y += rowH;
        });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al generar PDF', error: (err as Error).message });
  }
};

// ─── GET /api/pdf/tardanzas ───────────────────────────────────────────
const getTardanzas = async (req: Request, res: Response) => {
  try {
    const fecha_desde = str(req.query.fecha_desde);
    const fecha_hasta = str(req.query.fecha_hasta);
    const area_id = str(req.query.area_id);
    const empleado_id = str(req.query.empleado_id);
    const handler = req.container.resolve<GetTardanzasPdfHandler>('getTardanzasPdfHandler');
    const rows = await handler.handle({ fecha_desde, fecha_hasta, area_id, empleado_id });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=tardanzas.pdf');
    const template = req.container.resolve<PdfTemplateService>('pdfTemplateService');
    template.generarMembrete(res, META, (doc) => {
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1B5E20').text('REPORTE DE TARDANZAS', { align: 'center' });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(8).fillColor('#6B7280').text(`Período: ${fecha_desde || '—'} a ${fecha_hasta || '—'}`, { align: 'center' });
      doc.moveDown(1);
      if (!rows.length) return doc.fontSize(10).fillColor('#6B7280').text('Sin registros.', { align: 'center' });
      doc.font('Helvetica').fontSize(7).fillColor('#6B7280').text(`Total: ${rows.length}`, PDF_BODY_X, doc.y, { align: 'right', width: 465 }).moveDown(0.3);
      const pw = 595.28, contentW = pw - PDF_BODY_X * 2 - 10, cw = contentW / 6, rh = 18, hh = 20; let y = doc.y;
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#FFF');
      doc.roundedRect(PDF_BODY_X, y, contentW, hh, 3).fill('#92400E');
      ['Empleado', 'Área', 'Fecha', 'Entrada', 'Tardanza', 'Obs.'].forEach((h, i) => { doc.fillColor('#FFF').text(h, PDF_BODY_X + 3 + i * cw + 3, y + 6, { width: cw - 3 }); });
      y += hh; doc.fillColor('#111827').font('Helvetica').fontSize(6.5);
      rows.slice(0, 30).forEach((r, i) => {
        if (y > 680) return; if (i % 2 === 0) doc.rect(PDF_BODY_X, y, contentW, rh).fill('#F9FAFB');
        let hx = PDF_BODY_X + 3; const c = [r.colaborador || '', r.area || '', r.fecha ? new Date(r.fecha).toLocaleDateString('es-CO') : '—', r.entrada || '—', r.minutos_tardanza ? `${r.minutos_tardanza} min` : '—', (r.observacion || '').substring(0, 30)];
        c.forEach((v) => { doc.fillColor('#111827').text(v, hx + 3, y + 5, { width: cw - 3 }); hx += cw; }); y += rh;
      });
      if (rows.length > 30) doc.fillColor('#6B7280').fontSize(7).text(`... y ${rows.length - 30} más`, PDF_BODY_X, y + 5);
    });
  } catch (e) { console.error(e); res.status(500).json({ mensaje: 'Error PDF', error: (e as Error).message }); }
};

// ─── GET /api/pdf/ausencias ───────────────────────────────────────────
const getAusencias = async (req: Request, res: Response) => {
  try {
    const fecha_desde = str(req.query.fecha_desde);
    const fecha_hasta = str(req.query.fecha_hasta);
    const area_id = str(req.query.area_id);
    const empleado_id = str(req.query.empleado_id);
    const handler = req.container.resolve<GetAusenciasPdfHandler>('getAusenciasPdfHandler');
    const rows = await handler.handle({ fecha_desde, fecha_hasta, area_id, empleado_id });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=ausencias.pdf');
    const template = req.container.resolve<PdfTemplateService>('pdfTemplateService');
    template.generarMembrete(res, META, (doc) => {
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1B5E20').text('REPORTE DE AUSENCIAS', { align: 'center' });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(8).fillColor('#6B7280').text(`Período: ${fecha_desde || '—'} a ${fecha_hasta || '—'}`, { align: 'center' });
      doc.moveDown(1);
      if (!rows.length) return doc.fontSize(10).fillColor('#6B7280').text('Sin registros.', { align: 'center' });
      doc.font('Helvetica').fontSize(7).fillColor('#6B7280').text(`Total: ${rows.length}`, PDF_BODY_X, doc.y, { align: 'right', width: 465 }).moveDown(0.3);
      const pw = 595.28, contentW = pw - PDF_BODY_X * 2 - 10, cw = contentW / 5, rh = 18, hh = 20; let y = doc.y;
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#FFF');
      doc.roundedRect(PDF_BODY_X, y, contentW, hh, 3).fill('#DC2626');
      ['Empleado', 'Área', 'Fecha', 'Estado', 'Observación'].forEach((h, i) => { doc.fillColor('#FFF').text(h, PDF_BODY_X + 3 + i * cw + 3, y + 6, { width: cw - 3 }); });
      y += hh; doc.fillColor('#111827').font('Helvetica').fontSize(6.5);
      rows.slice(0, 30).forEach((r, i) => {
        if (y > 680) return; if (i % 2 === 0) doc.rect(PDF_BODY_X, y, contentW, rh).fill('#F9FAFB');
        let hx = PDF_BODY_X + 3; const c = [r.colaborador || '', r.area || '', r.fecha ? new Date(r.fecha).toLocaleDateString('es-CO') : '—', r.estado || '', (r.observacion || '').substring(0, 40)];
        c.forEach((v) => { doc.fillColor('#111827').text(v, hx + 3, y + 5, { width: cw - 3 }); hx += cw; }); y += rh;
      });
      if (rows.length > 30) doc.fillColor('#6B7280').fontSize(7).text(`... y ${rows.length - 30} más`, PDF_BODY_X, y + 5);
    });
  } catch (e) { console.error(e); res.status(500).json({ mensaje: 'Error PDF', error: (e as Error).message }); }
};

// ─── GET /api/pdf/empleados ───────────────────────────────────────────
const getEmpleados = async (req: Request, res: Response) => {
  try {
    const area_id = str(req.query.area_id);
    const cargo_id = str(req.query.cargo_id);
    const handler = req.container.resolve<GetEmpleadosPdfHandler>('getEmpleadosPdfHandler');
    const rows = await handler.handle({ area_id, cargo_id });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=empleados.pdf');
    const template = req.container.resolve<PdfTemplateService>('pdfTemplateService');
    template.generarMembrete(res, META, (doc) => {
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1B5E20').text('REPORTE DE EMPLEADOS', { align: 'center' });
      doc.moveDown(1);
      if (!rows.length) return doc.fontSize(10).fillColor('#6B7280').text('Sin registros.', { align: 'center' });
      doc.font('Helvetica').fontSize(7).fillColor('#6B7280').text(`Total: ${rows.length}`, PDF_BODY_X, doc.y, { align: 'right', width: 465 }).moveDown(0.3);
      const pw = 595.28, contentW = pw - PDF_BODY_X * 2 - 10, cw = [Math.round(contentW * 0.20), Math.round(contentW * 0.11), Math.round(contentW * 0.13), Math.round(contentW * 0.15), Math.round(contentW * 0.14), Math.round(contentW * 0.17), Math.round(contentW * 0.10)], rh = 18, hh = 20; let y = doc.y;
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#FFF');
      doc.roundedRect(PDF_BODY_X, y, contentW, hh, 3).fill('#1B5E20');
      const headers = ['Nombre', 'Cédula', 'Teléfono', 'Área', 'Cargo', 'Contacto', 'Estado'];
      let hx = PDF_BODY_X + 3;
      headers.forEach((h, i) => { doc.fillColor('#FFF').text(h, hx + 3, y + 6, { width: cw[i] - 3 }); hx += cw[i]; });
      y += hh; doc.fillColor('#111827').font('Helvetica').fontSize(6.5);
      rows.forEach((r, i) => {
        if (y + rh > 700) { doc.addPage(); y = PDF_BODY_Y; }
        if (i % 2 === 0) doc.rect(PDF_BODY_X, y, contentW, rh).fill('#F9FAFB');
        hx = PDF_BODY_X + 3;
        const c = [`${r.nombre || ''} ${r.apellido || ''}`, r.cedula || '', r.telefono || '—', r.area || '—', r.cargo || '—', r.correo || '', r.activo ? 'Activo' : 'Inactivo'];
        c.forEach((v, i) => { doc.fillColor('#111827').text(v, hx + 3, y + 5, { width: cw[i] - 3 }); hx += cw[i]; });
        y += rh;
      });
    });
  } catch (e) { console.error(e); res.status(500).json({ mensaje: 'Error PDF', error: (e as Error).message }); }
};

// ─── GET /api/pdf/marcaciones ─────────────────────────────────────────
const getMarcaciones = async (req: Request, res: Response) => {
  try {
    const fecha_desde = str(req.query.fecha_desde);
    const fecha_hasta = str(req.query.fecha_hasta);
    const empleado_id = str(req.query.empleado_id);
    const area_id = str(req.query.area_id);
    const handler = req.container.resolve<GetMarcacionesPdfHandler>('getMarcacionesPdfHandler');
    const rows = await handler.handle({ fecha_desde, fecha_hasta, empleado_id, area_id });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=marcaciones.pdf');
    const template = req.container.resolve<PdfTemplateService>('pdfTemplateService');
    template.generarMembrete(res, META, (doc) => {
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1B5E20').text('REPORTE DE MARCACIONES', { align: 'center' });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(8).fillColor('#6B7280').text(`Período: ${fecha_desde || '—'} a ${fecha_hasta || '—'}`, { align: 'center' });
      doc.moveDown(1);
      if (!rows.length) return doc.fontSize(10).fillColor('#6B7280').text('Sin registros.', { align: 'center' });
      doc.font('Helvetica').fontSize(7).fillColor('#6B7280').text(`Total: ${rows.length}`, PDF_BODY_X, doc.y, { align: 'right', width: 465 }).moveDown(0.3);
      const pw = 595.28, contentW = pw - PDF_BODY_X * 2 - 10, cw = contentW / 6, rh = 18, hh = 20; let y = doc.y;
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#FFF');
      doc.roundedRect(PDF_BODY_X, y, contentW, hh, 3).fill('#1565C0');
      ['Empleado', 'Área', 'Fecha', 'Entrada', 'Salida', 'Tipo'].forEach((h, i) => { doc.fillColor('#FFF').text(h, PDF_BODY_X + 3 + i * cw + 3, y + 6, { width: cw - 3 }); });
      y += hh; doc.fillColor('#111827').font('Helvetica').fontSize(6.5);
      rows.slice(0, 30).forEach((r, i) => {
        if (y > 680) return; if (i % 2 === 0) doc.rect(PDF_BODY_X, y, contentW, rh).fill('#F9FAFB');
        let hx = PDF_BODY_X + 3; const c = [r.colaborador || '', r.area || '', r.fecha ? new Date(r.fecha).toLocaleDateString('es-CO') : '—', r.entrada || '—', r.salida || '—', r.tipo_marcacion || '—'];
        c.forEach((v) => { doc.fillColor('#111827').text(v, hx + 3, y + 5, { width: cw - 3 }); hx += cw; }); y += rh;
      });
      if (rows.length > 30) doc.fillColor('#6B7280').fontSize(7).text(`... y ${rows.length - 30} más`, PDF_BODY_X, y + 5);
    });
  } catch (e) { console.error(e); res.status(500).json({ mensaje: 'Error PDF', error: (e as Error).message }); }
};

// ─── GET /api/pdf/por-areas ───────────────────────────────────────────
const getPorAreas = async (req: Request, res: Response) => {
  try {
    const area_id = str(req.query.area_id);
    const empleado_id = str(req.query.empleado_id);
    const usuario_id = str(req.query.usuario_id);
    const mes = str(req.query.mes);
    const anio = str(req.query.anio);
    const estado = str(req.query.estado);
    const handler = req.container.resolve<GetPorAreasPdfHandler>('getPorAreasPdfHandler');
    const rows = await handler.handle({ area_id, empleado_id, usuario_id, mes, anio, estado });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=por-areas.pdf');
    const template = req.container.resolve<PdfTemplateService>('pdfTemplateService');
    template.generarMembrete(res, META, (doc) => {
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1B5E20').text('REPORTE POR ÁREAS', { align: 'center' });
      doc.moveDown(1);
      if (!rows.length) return doc.fontSize(10).fillColor('#6B7280').text('Sin registros.', { align: 'center' });
      doc.font('Helvetica').fontSize(7).fillColor('#6B7280').text(`Total: ${rows.length}`, PDF_BODY_X, doc.y, { align: 'right', width: 465 }).moveDown(0.3);
      const pw = 595.28, contentW = pw - PDF_BODY_X * 2 - 10;
      const cw = [Math.round(contentW * 0.18), Math.round(contentW * 0.11), Math.round(contentW * 0.12), Math.round(contentW * 0.14), Math.round(contentW * 0.12), Math.round(contentW * 0.11), Math.round(contentW * 0.11), Math.round(contentW * 0.11)];
      const rh = 18, hh = 20; let y = doc.y;
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#FFF');
      doc.roundedRect(PDF_BODY_X, y, contentW, hh, 3).fill('#1B5E20');
      const headers = ['Empleado', 'Cédula', 'Área', 'Días laborados', 'Puntuales', 'Tardanzas', 'Ausencias', 'Horas'];
      let hx = PDF_BODY_X + 3;
      headers.forEach((h, i) => { doc.fillColor('#FFF').text(h, hx + 3, y + 6, { width: cw[i] - 3 }); hx += cw[i]; });
      y += hh; doc.fillColor('#111827').font('Helvetica').fontSize(6.5);
      rows.forEach((r, i) => {
        if (y + rh > 700) { doc.addPage(); y = PDF_BODY_Y; }
        if (i % 2 === 0) doc.rect(PDF_BODY_X, y, contentW, rh).fill('#F9FAFB');
        hx = PDF_BODY_X + 3;
        const c: Array<string | number> = [r.empleado || '', r.cedula || '', r.area || '', r.dias_laborados || 0, r.puntuales || 0, r.tardanzas || 0, r.ausencias || 0, r.horas_trabajadas ? Number(r.horas_trabajadas).toFixed(2) : '0'];
        c.forEach((v, i) => { doc.fillColor('#111827').text(`${v}`, hx + 3, y + 5, { width: cw[i] - 3 }); hx += cw[i]; });
        y += rh;
      });
    });
  } catch (e) { console.error(e); res.status(500).json({ mensaje: 'Error PDF', error: (e as Error).message }); }
};

// ─── GET /api/pdf/por-empleado ────────────────────────────────────────
const getPorEmpleado = async (req: Request, res: Response) => {
  try {
    const empleado_id = str(req.query.empleado_id);
    const usuario_id = str(req.query.usuario_id);
    const mes = str(req.query.mes);
    const anio = str(req.query.anio);
    const targetId = usuario_id || empleado_id;
    if (!targetId) return res.status(400).json({ mensaje: 'usuario_id es requerido' });

    const mesConsulta = mes || String(new Date().getMonth() + 1);
    const anioConsulta = anio || String(new Date().getFullYear());

    const handler = req.container.resolve<GetPorEmpleadoPdfHandler>('getPorEmpleadoPdfHandler');
    const data = await handler.handle({ empleado_id, usuario_id, mes, anio });
    if (!data) return res.status(404).json({ mensaje: 'Empleado no encontrado' });

    const { empleado, resumen, permisos, incidencias, detalle: detalleConFestivos, diasHabiles, totalFestivos, diasEsperados } = data;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=reporte-por-empleado.pdf');
    const NOMBRES_MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const ETIQUETA_ESTADO: Record<string, string> = { on_time: 'Puntual', late: 'Tardanza', absent: 'Ausente', justified: 'Justificado' };
    const template = req.container.resolve<PdfTemplateService>('pdfTemplateService');

    template.generarMembrete(res, META, (doc) => {
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1B5E20').text('REPORTE POR EMPLEADO', { align: 'center' });
      doc.moveDown(0.6);

      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#111827').text(`Empleado: ${empleado.nombre || ''} ${empleado.apellido || ''}`);
      doc.font('Helvetica').fontSize(8).fillColor('#4B5563');
      doc.text(`Cédula: ${empleado.cedula || '—'}   Área: ${empleado.area || '—'}   Cargo: ${empleado.cargo || '—'}   Fecha de ingreso: ${empleado.fecha_ingreso || '—'}`);
      doc.moveDown(0.4);
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#1B5E20').text(`Período: ${NOMBRES_MESES[Number(mesConsulta) - 1]} ${anioConsulta}`, { align: 'center' });
      doc.moveDown(0.4);

      const [punt, tard, aus, jus] = [Number(resumen.puntuales), Number(resumen.tardanzas), Number(resumen.ausentes), Number(resumen.justificados)];
      const pAsistencia = Math.round((punt + tard + jus) / Math.max(diasEsperados, 1) * 100);
      const metas = [
        { label: 'Días hábiles', value: `${diasHabiles}` },
        { label: 'Festivos', value: `${totalFestivos}` },
        { label: 'Asistencia %', value: `${pAsistencia}%` },
        { label: 'Puntuales', value: `${punt}` },
        { label: 'Tardanzas', value: `${tard}` },
        { label: 'Ausentes', value: `${aus}` },
        { label: 'Horas trabajadas', value: `${Number(resumen.horas_trabajadas)} h` },
        { label: 'Permisos', value: `${Number(permisos.total || 0)}` },
        { label: 'Incidencias', value: `${Number(incidencias.total || 0)}` },
      ];
      const pw = 595.28, contentW = pw - PDF_BODY_X * 2 - 10;
      const colW = contentW / 3, gridH = 30;
      let y = doc.y;
      metas.forEach((m, i) => {
        const col = i % 3, rowIdx = Math.floor(i / 3);
        const cx = PDF_BODY_X + col * colW;
        const cy = y + rowIdx * gridH;
        doc.rect(cx, cy, colW - 4, gridH - 4).fill(i % 2 === 0 ? '#F9FAFB' : '#FFFFFF');
        doc.font('Helvetica').fontSize(6.5).fillColor('#6B7280').text(m.label, cx + 6, cy + 5, { width: colW - 16 });
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text(m.value, cx + 6, cy + 14, { width: colW - 16 });
      });
      y += 3 * gridH;
      doc.y = y;
      doc.moveDown(0.6);

      if (!detalleConFestivos.length) {
        doc.font('Helvetica').fontSize(10).fillColor('#6B7280').text('Sin registros de asistencia en el período.', { align: 'center' });
        return;
      }
      doc.moveDown(0.2);
      const cw = [Math.round(contentW * 0.14), Math.round(contentW * 0.115), Math.round(contentW * 0.115), Math.round(contentW * 0.115), Math.round(contentW * 0.115), Math.round(contentW * 0.09), Math.round(contentW * 0.16), Math.round(contentW * 0.105)];
      const headers = ['Fecha', 'Ent. Mañana', 'Sal. Mañana', 'Ent. Tarde', 'Sal. Tarde', 'Horas', 'Estado', 'Festivo'];
      const rh = 18, hh = 20;
      const drawHeaderDetalle = () => {
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#FFFFFF');
        doc.roundedRect(PDF_BODY_X, y, contentW, hh, 3).fill('#1B5E20');
        let hx = PDF_BODY_X + 3;
        headers.forEach((h, i) => { doc.fillColor('#FFFFFF').text(h, hx + 3, y + 6, { width: cw[i] - 3 }); hx += cw[i]; });
        y += hh;
      };
      drawHeaderDetalle();
      doc.fillColor('#111827').font('Helvetica').fontSize(6.5);
      detalleConFestivos.forEach((r, i) => {
        if (y + rh > 700) { doc.addPage(); y = PDF_BODY_Y; drawHeaderDetalle(); doc.fillColor('#111827').font('Helvetica').fontSize(6.5); }
        if (i % 2 === 0) doc.rect(PDF_BODY_X, y, contentW, rh).fill('#F9FAFB');
        let hx = PDF_BODY_X + 3;
        const fechaStr = r.fecha instanceof Date
          ? `${String(r.fecha.getDate()).padStart(2, '0')}/${String(r.fecha.getMonth() + 1).padStart(2, '0')}/${r.fecha.getFullYear()}`
          : (() => { const s = String(r.fecha).substring(0, 10).split('-'); return `${s[2]}/${s[1]}/${s[0]}`; })();
        const cells = [
          fechaStr,
          r.entrada1 || '—',
          r.salida1 || '—',
          r.entrada2 || '—',
          r.salida2 || '—',
          r.horas_trabajadas != null ? `${r.horas_trabajadas} h` : '—',
          ETIQUETA_ESTADO[r.estado] || r.estado || '—',
          r.esFestivo ? 'Sí' : 'No',
        ];
        cells.forEach((v, j) => { doc.fillColor('#111827').text(String(v), hx + 3, y + 5, { width: cw[j] - 3 }); hx += cw[j]; });
        y += rh;
      });
    });
  } catch (e) { console.error(e); res.status(500).json({ mensaje: 'Error PDF', error: (e as Error).message }); }
};

// ─── GET /api/pdf/seguimiento ─────────────────────────────────────────
const getSeguimiento = async (req: Request, res: Response) => {
  try {
    const hoy = seguimientoService.hoyISO();
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const ayerISO = seguimientoService.fmtDate(ayer);

    const filtros: SeguimientoFiltros = {
      fecha_desde: str(req.query.fecha_desde) || ayerISO,
      fecha_hasta: str(req.query.fecha_hasta) || hoy,
      area: str(req.query.area),
      piso: str(req.query.piso),
      busqueda: str(req.query.busqueda),
      situacion: str(req.query.situacion),
      page: 1,
      pageSize: seguimientoService.PAGE_SIZE_MAX,
    };

    if (
      filtros.situacion &&
      !Object.values(seguimientoService.SITUACION).includes(filtros.situacion)
    ) {
      return res.status(400).json({
        mensaje:
          'situacion inválida. Valores: absence, missing_morning, missing_afternoon, unregistered_exit, open_day',
      });
    }

    const handler = req.container.resolve<GetSeguimientoPdfHandler>('getSeguimientoPdfHandler');
    const { rows } = await handler.handle(filtros);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=seguimiento_asistencia.pdf');
    const template = req.container.resolve<PdfTemplateService>('pdfTemplateService');
    template.generarMembrete(res, META, (doc) => {
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1B5E20');
      doc.text('REPORTE DE SEGUIMIENTO DE ASISTENCIA', { align: 'center' });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(8).fillColor('#6B7280');
      doc.text(`Período: ${filtros.fecha_desde} a ${filtros.fecha_hasta}`, { align: 'center' });
      if (filtros.area) doc.text(`Área: ${filtros.area}`, { align: 'center' });
      doc.moveDown(1);
      if (rows.length === 0) {
        doc.fontSize(10).fillColor('#6B7280');
        doc.text('No hay registros para los filtros seleccionados.', { align: 'center' });
        return;
      }
      doc.font('Helvetica').fontSize(7).fillColor('#6B7280');
      doc.text(`Total: ${rows.length} registros`, PDF_BODY_X, doc.y, { align: 'right', width: 465 });
      doc.moveDown(0.3);
      drawTableSeguimiento(doc, rows, doc.y);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al generar PDF', error: (err as Error).message });
  }
};

export default {
  getIncidenciaTemplate,
  getTest,
  getAsistencia,
  getIncidencias,
  getDashboard,
  getTardanzas,
  getAusencias,
  getEmpleados,
  getMarcaciones,
  getPorAreas,
  getPorEmpleado,
  getSeguimiento,
};
