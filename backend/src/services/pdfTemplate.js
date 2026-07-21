const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const LOGO_PATH = path.join(__dirname, "../../assets/logo.png");

// ─── PÁGINA ──────────────────────────────────────
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

// ─── HEADER ──────────────────────────────────────
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

// ─── GREEK ───────────────────────────────────────
const GREEK_LEFT_X = 0;
const GREEK_RIGHT_X = PAGE_W - 60;

// ─── TOP SHAPES ──────────────────────────────────
const TOP_TRIANGLE_X  = -15;
const TOP_TRIANGLE_Y  = 10;
const TOP_TRIANGLE_SIZE = 90;
const TOP_DIAMOND_X   = -2;
const TOP_DIAMOND_Y   = 75;
const TOP_DIAMOND_SIZE = 40;

// ─── BOTTOM SHAPES ───────────────────────────────
const BOTTOM_DIAMOND_X   = PAGE_W - 38;
const BOTTOM_DIAMOND_Y   = PAGE_H - 110;
const BOTTOM_DIAMOND_SIZE = 40;
const BOTTOM_TRIANGLE_X  = PAGE_W - 58;
const BOTTOM_TRIANGLE_Y  = PAGE_H - 80;
const BOTTOM_TRIANGLE_SIZE = 58;

// ─── FOOTER ──────────────────────────────────────
const FOOTER = {
  lineY: PAGE_H - FOOTER_HEIGHT,
  vigilado: { x: 65, y: PAGE_H - FOOTER_HEIGHT + 6, w: 45, h: 28 },
  sloganY: PAGE_H - FOOTER_HEIGHT + 8,
  contactY: PAGE_H - FOOTER_HEIGHT + 22,
  contactGap: 8,
  socialY: PAGE_H - FOOTER_HEIGHT + 60,
};

// ─── COLORS ──────────────────────────────────────
const COLORS = {
  verde:            "#1B5E20",
  rojoInstitucional: "#D94B4B",
  amarillo:         "#F5C518",
  gris:             "#D1D5DB",
  grisTexto:        "#6B7280",
  grisOscuro:       "#4B5563",
  negro:            "#111827",
};

// ─── Helpers ─────────────────────────────────────
function _triangulo(doc, x, y, size, color, abajo) {
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

function _rombo(doc, x, y, size, color) {
  doc.save();
  const pts = [
    [x + size / 2, y],
    [x + size, y + size / 2],
    [x + size / 2, y + size],
    [x, y + size / 2],
  ];
  doc.fillColor(color);
  doc.polygon(...pts).fill();
  doc.lineWidth(2).strokeColor("#FFFFFF");
  doc.polygon(...pts).stroke();
  doc.restore();
}

// ─── drawGreek ────────────────────────────────────
function drawGreek(doc, x) {
  const isLeft = x === GREEK_LEFT_X;
  const file = isLeft
    ? path.join(__dirname, "../../assets/greca_derecha.png")
    : path.join(__dirname, "../../assets/greca_izquierda.png");

  if (fs.existsSync(file)) {
    doc.image(file, x, 0, { height: PAGE_H });
  }
}



// ─── drawHeader ───────────────────────────────────
function drawHeader(doc, metadata) {
  // Metadata
  doc.font("Helvetica").fontSize(7).fillColor(COLORS.grisTexto);
  const lines = [
    `Código: ${metadata?.codigo ?? "_______________"}`,
    `Versión: ${metadata?.version ?? "_______________"}`,
    `Emisión: ${metadata?.emision ?? "___/___/______"}`,
    `Vigencia: ${metadata?.vigencia ?? "___/___/______"}`,
  ];
  let my = HEADER.metadataY;
  for (const linea of lines) {
    doc.text(linea, HEADER.metadataX, my, { align: "right", width: HEADER.metadataWidth });
    my += HEADER.metadataLineGap;
  }

  // Separador
  doc.moveTo(BODY_X, HEADER.separatorLineY)
     .lineTo(PAGE_W - BODY_X, HEADER.separatorLineY)
     .lineWidth(0.5)
     .strokeColor(COLORS.gris)
     .stroke();
}

// ─── drawFooter ───────────────────────────────────
function drawFooter(doc) {
  doc.moveTo(BODY_X, FOOTER.lineY)
     .lineTo(PAGE_W - BODY_X, FOOTER.lineY)
     .lineWidth(0.5)
     .strokeColor(COLORS.gris)
     .stroke();

  // Frase
  doc.font("Helvetica-Oblique").fontSize(9).fillColor(COLORS.verde);
  doc.text('"Trabajamos por la salud de los pueblos indígenas"', 0, FOOTER.sloganY, {
    align: "center", width: PAGE_W,
  });

  // Contacto
  doc.font("Helvetica").fontSize(7).fillColor(COLORS.grisOscuro);
  const cg = FOOTER.contactGap;
  doc.text("Calle 8 #17-17 B. Pontevedra",      0, FOOTER.contactY,            { align: "center", width: PAGE_W });
  doc.text("Valledupar, Cesar",                  0, FOOTER.contactY + cg,       { align: "center", width: PAGE_W });
  doc.text("(605) 5700377  |  (605) 5714966",   0, FOOTER.contactY + cg * 2 + 2, { align: "center", width: PAGE_W });
  doc.text("gerencia@dusakawiepsi.com",         0, FOOTER.contactY + cg * 3 + 4, { align: "center", width: PAGE_W });
  doc.text("www.dusakawiepsi.com",              0, FOOTER.contactY + cg * 4 + 6, { align: "center", width: PAGE_W });

  // Redes
  doc.fontSize(6.5);
  doc.text("Facebook  |  Instagram  |  YouTube  |  LinkedIn  |  X (@DusakawiEPSI)", 0, FOOTER.socialY, { align: "center", width: PAGE_W });
}

// ─── drawPageNumber ───────────────────────────────
function drawPageNumber(doc, page, total) {
  doc.font("Helvetica").fontSize(7).fillColor(COLORS.grisTexto);
  doc.text(`Página ${page} de ${total}`, HEADER.metadataX, HEADER.pageNumY, {
    align: "right", width: HEADER.metadataWidth,
  });
}

// ─── drawContent ──────────────────────────────────
function drawContent(doc) {
  doc.x = BODY_X;
  doc.y = BODY_Y;
}

// ─── generarMembrete ──────────────────────────────
function generarMembrete(res, metadata, callback) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    info: { Title: "Dusakawi EPSI - Documento Oficial" },
    bufferPages: true,
  });

  doc.pipe(res);

  doc.on("pageAdded", () => {
    doc.x = BODY_X;
    doc.y = BODY_Y;
  });

  // Primera página: posicionar cursor
  doc.x = BODY_X;
  doc.y = BODY_Y;

  // 1. GENERAR TODO EL CONTENIDO (puede disparar pageAdded para páginas 2+)
  if (callback) callback(doc);

  // 2. RECORRER TODAS LAS PÁGINAS Y DIBUJAR MEMBRETE COMPLETO
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

function generarPlantillaIncidencia(doc, incidencia) {
  const PAGE_W = 595.28;
  const BODY_X = 65;
  const FIRMA_HEIGHT = 170;
  const MAX_Y = PAGE_H - FOOTER_HEIGHT - FIRMA_HEIGHT;

  doc.font("Helvetica-Bold").fontSize(12).fillColor("#1B5E20");
  doc.text("FORMATO DE APROBACIÓN DE INCIDENCIA", { align: "center", width: PAGE_W - BODY_X * 2 });
  doc.moveDown(0.5);

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827");
  doc.text(`ASUNTO: ${incidencia.tipo?.toUpperCase() || "—"}`);
  doc.moveDown(0.3);

  doc.font("Helvetica").fontSize(9).fillColor("#374151");
  const fields = [
    `Empleado:  ${incidencia.empleado_nombre || incidencia.empleado || "—"}`,
    `Cédula:    ${incidencia.cedula || "—"}`,
    `Área:      ${incidencia.area || "—"}`,
    `Fecha:     ${incidencia.fecha ? new Date(incidencia.fecha).toLocaleDateString("es-CO") : "—"}`,
  ];
  for (const f of fields) {
    doc.text(f, BODY_X + 10, doc.y);
    doc.moveDown(0.1);
  }
  doc.moveDown(0.3);

  doc.font("Helvetica-Bold").fontSize(9).fillColor("#111827");
  doc.text("Descripción:");
  doc.moveDown(0.1);
  doc.font("Helvetica").fontSize(9).fillColor("#374151");
  doc.text(incidencia.descripcion || "Sin descripción", {
    width: PAGE_W - BODY_X * 2 - 20, align: "justify"
  });
  doc.moveDown(0.3);

  if (incidencia.evidencia_url) {
    const evPath = path.join(__dirname, "../../", incidencia.evidencia_url.replace(/^\//, ""));
    if (fs.existsSync(evPath) && /\.(jpg|jpeg|png|webp|gif)$/i.test(evPath)) {
      try {
        const img = doc.openImage(evPath);
        const maxW = PAGE_W - BODY_X * 2 - 20;
        const disponible = Math.max(0, MAX_Y - doc.y - 20);
        const proporcion = img.width / img.height;
        let imgW = maxW;
        let imgH = maxW / proporcion;
        if (imgH > disponible) {
          imgH = disponible;
          imgW = disponible * proporcion;
        }
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#111827");
        doc.text("Evidencia:");
        doc.moveDown(0.2);
        doc.image(evPath, BODY_X + 10, doc.y, { fit: [imgW, imgH], align: "center" });
        doc.y += imgH + 6;
      } catch {}
    }
  }

  const firmaY = Math.max(doc.y + 10, MAX_Y);
  doc.y = firmaY;
  const cajetinX = BODY_X + 30;
  const cajetinW = PAGE_W - cajetinX * 2;

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#1B5E20");
  doc.text("FIRMA DE APROBACIÓN", { align: "center", width: cajetinW });
  doc.moveDown(1.5);

  doc.moveTo(cajetinX + 30, doc.y).lineTo(cajetinX + cajetinW - 30, doc.y).lineWidth(1).strokeColor("#111827").stroke();
  doc.moveDown(0.5);

  doc.font("Helvetica-Bold").fontSize(9).fillColor("#111827");
  doc.text("ARMANDO ENRIQUE SARMIENTO SUAREZ", { align: "center", width: cajetinW });
  doc.moveDown(0.1);
  doc.font("Helvetica").fontSize(8).fillColor("#6B7280");
  doc.text("COORDINADOR TALENTO HUMANO", { align: "center", width: cajetinW });
  doc.text("DUSAKAWI EPSI", { align: "center", width: cajetinW });
}

module.exports = { generarMembrete, generarPlantillaIncidencia };

