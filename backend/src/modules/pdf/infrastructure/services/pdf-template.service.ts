import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import type { PdfMeta } from '@modules/pdf/domain/entities/pdf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGO_PATH = path.join(__dirname, '../../../../../assets/logo.png');

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_LEFT = 40;
const MARGIN_RIGHT = 40;
const HEADER_HEIGHT = 110;
const FOOTER_HEIGHT = 90;
const CONTENT_TOP = HEADER_HEIGHT + 20;
const CONTENT_BOTTOM = PAGE_H - FOOTER_HEIGHT;
const BODY_X = MARGIN_LEFT + 25;
const BODY_Y = CONTENT_TOP;

const HEADER = {
  logo: { x: 65, y: -4, width: 90 },
  text1: { x: 145, y: 24 },
  text2: { x: 145, y: 31 },
  text3: { x: 145, y: 42 },
  text4: { x: 145, y: 58 },
  textWidth: 220,
  metadataX: 470,
  metadataY: 24,
  metadataLineGap: 10,
  metadataWidth: 100,
  pageNumY: 66,
  separatorLineY: 98,
};

const GREEK_LEFT_X = 0;
const GREEK_RIGHT_X = PAGE_W - 60;

const TOP_TRIANGLE_X = -15;
const TOP_TRIANGLE_Y = 10;
const TOP_TRIANGLE_SIZE = 90;
const TOP_DIAMOND_X = -2;
const TOP_DIAMOND_Y = 75;
const TOP_DIAMOND_SIZE = 40;

const BOTTOM_DIAMOND_X = PAGE_W - 38;
const BOTTOM_DIAMOND_Y = PAGE_H - 110;
const BOTTOM_DIAMOND_SIZE = 40;
const BOTTOM_TRIANGLE_X = PAGE_W - 58;
const BOTTOM_TRIANGLE_Y = PAGE_H - 80;
const BOTTOM_TRIANGLE_SIZE = 58;

const FOOTER = {
  lineY: PAGE_H - FOOTER_HEIGHT,
  vigilado: { x: 65, y: PAGE_H - FOOTER_HEIGHT + 6, w: 45, h: 28 },
  sloganY: PAGE_H - FOOTER_HEIGHT + 8,
  contactY: PAGE_H - FOOTER_HEIGHT + 22,
  contactGap: 8,
  socialY: PAGE_H - FOOTER_HEIGHT + 60,
};

const COLORS = {
  verde: '#1B5E20',
  rojoInstitucional: '#D94B4B',
  amarillo: '#F5C518',
  gris: '#D1D5DB',
  grisTexto: '#6B7280',
  grisOscuro: '#4B5563',
  negro: '#111827',
};

function triangulo(doc: PDFKit.PDFDocument, x: number, y: number, size: number, color: string, abajo: boolean) {
  doc.save();
  doc.fillColor(color);
  const h = (size * Math.sqrt(3)) / 2;
  if (abajo) {
    doc.polygon([x, y], [x + size, y], [x + size / 2, y + h]).fill();
  } else {
    doc.polygon([x, y + h], [x + size, y + h], [x + size / 2, y]).fill();
  }
  doc.restore();
}

function rombo(doc: PDFKit.PDFDocument, x: number, y: number, size: number, color: string) {
  doc.save();
  const pts = [
    [x + size / 2, y],
    [x + size, y + size / 2],
    [x + size / 2, y + size],
    [x, y + size / 2],
  ];
  doc.fillColor(color);
  doc.polygon(...pts).fill();
  doc.lineWidth(2).strokeColor('#FFFFFF');
  doc.polygon(...pts).stroke();
  doc.restore();
}

function drawGreek(doc: PDFKit.PDFDocument, x: number) {
  const isLeft = x === GREEK_LEFT_X;
  const file = isLeft
    ? path.join(__dirname, '../../../../../assets/greca_derecha.png')
    : path.join(__dirname, '../../../../../assets/greca_izquierda.png');

  if (fs.existsSync(file)) {
    doc.image(file, x, 0, { height: PAGE_H });
  }
}

function drawHeader(doc: PDFKit.PDFDocument, metadata: PdfMeta) {
  doc.font('Helvetica').fontSize(7).fillColor(COLORS.grisTexto);
  const lines = [
    `Código: ${metadata?.codigo ?? '_______________'}`,
    `Versión: ${metadata?.version ?? '_______________'}`,
    `Emisión: ${metadata?.emision ?? '___/___/______'}`,
    `Vigencia: ${metadata?.vigencia ?? '___/___/______'}`,
  ];
  let my = HEADER.metadataY;
  for (const linea of lines) {
    doc.text(linea, HEADER.metadataX, my, { align: 'right', width: HEADER.metadataWidth });
    my += HEADER.metadataLineGap;
  }

  doc.moveTo(BODY_X, HEADER.separatorLineY)
     .lineTo(PAGE_W - BODY_X, HEADER.separatorLineY)
     .lineWidth(0.5)
     .strokeColor(COLORS.gris)
     .stroke();
}

function drawFooter(doc: PDFKit.PDFDocument) {
  doc.moveTo(BODY_X, FOOTER.lineY)
     .lineTo(PAGE_W - BODY_X, FOOTER.lineY)
     .lineWidth(0.5)
     .strokeColor(COLORS.gris)
     .stroke();

  doc.font('Helvetica-Oblique').fontSize(9).fillColor(COLORS.verde);
  doc.text('"Trabajamos por la salud de los pueblos indígenas"', 0, FOOTER.sloganY, {
    align: 'center', width: PAGE_W,
  });

  doc.font('Helvetica').fontSize(7).fillColor(COLORS.grisOscuro);
  const cg = FOOTER.contactGap;
  doc.text('Calle 8 #17-17 B. Pontevedra',      0, FOOTER.contactY,            { align: 'center', width: PAGE_W });
  doc.text('Valledupar, Cesar',                  0, FOOTER.contactY + cg,       { align: 'center', width: PAGE_W });
  doc.text('(605) 5700377  |  (605) 5714966',   0, FOOTER.contactY + cg * 2 + 2, { align: 'center', width: PAGE_W });
  doc.text('gerencia@dusakawiepsi.com',         0, FOOTER.contactY + cg * 3 + 4, { align: 'center', width: PAGE_W });
  doc.text('www.dusakawiepsi.com',              0, FOOTER.contactY + cg * 4 + 6, { align: 'center', width: PAGE_W });

  doc.fontSize(6.5);
  doc.text('Facebook  |  Instagram  |  YouTube  |  LinkedIn  |  X (@DusakawiEPSI)', 0, FOOTER.socialY, { align: 'center', width: PAGE_W });
}

function drawPageNumber(doc: PDFKit.PDFDocument, page: number, total: number) {
  doc.font('Helvetica').fontSize(7).fillColor(COLORS.grisTexto);
  doc.text(`Página ${page} de ${total}`, HEADER.metadataX, HEADER.pageNumY, {
    align: 'right', width: HEADER.metadataWidth,
  });
}

function drawContent(doc: PDFKit.PDFDocument) {
  doc.x = BODY_X;
  doc.y = BODY_Y;
}

export class PdfTemplateService {
  generarMembrete(res: any, metadata: PdfMeta, callback: (doc: PDFKit.PDFDocument) => void) {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: { Title: 'Dusakawi EPSI - Documento Oficial' },
      bufferPages: true,
    });

    doc.pipe(res);

    doc.on('pageAdded', () => {
      doc.x = BODY_X;
      doc.y = BODY_Y;
    });

    doc.x = BODY_X;
    doc.y = BODY_Y;

    if (callback) callback(doc);

    const range = doc.bufferedPageRange();
    const total = range.count;

    for (let i = 0; i < total; i++) {
      doc.switchToPage(i);

      drawGreek(doc, GREEK_LEFT_X);
      drawGreek(doc, GREEK_RIGHT_X);
      drawHeader(doc, metadata);
      drawFooter(doc);
      drawPageNumber(doc, i + 1, total);
    }

    doc.end();
  }
}