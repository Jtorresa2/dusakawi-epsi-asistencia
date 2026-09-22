import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

const COLORES = {
  verde: "1B5E20",
  grisBorde: "BDBDBD",
};

const BORDES = {
  top: { style: "thin", color: { rgb: COLORES.grisBorde } },
  bottom: { style: "thin", color: { rgb: COLORES.grisBorde } },
  left: { style: "thin", color: { rgb: COLORES.grisBorde } },
  right: { style: "thin", color: { rgb: COLORES.grisBorde } },
};

function calcularAnchos(worksheet) {
  const ref = worksheet["!ref"];
  if (!ref) return [];
  const rango = XLSX.utils.decode_range(ref);
  const anchos = new Array(rango.e.c + 1).fill(0);
  for (let c = rango.s.c; c <= rango.e.c; c++) {
    for (let r = rango.s.r; r <= rango.e.r; r++) {
      const celda = worksheet[XLSX.utils.encode_cell({ r, c })];
      if (!celda || celda.v == null) continue;
      const largo = String(celda.v).length;
      if (largo > anchos[c]) anchos[c] = largo;
    }
    anchos[c] = Math.min(Math.max(anchos[c], 8), 40);
  }
  return anchos.map((w) => ({ wch: w }));
}

function aplicarEstilosGenericos(worksheet) {
  const ref = worksheet["!ref"];
  if (!ref) return worksheet;
  const rango = XLSX.utils.decode_range(ref);
  for (let r = rango.s.r; r <= rango.e.r; r++) {
    for (let c = rango.s.c; c <= rango.e.c; c++) {
      const celda = worksheet[XLSX.utils.encode_cell({ r, c })];
      if (!celda) continue;
      celda.s = { ...(celda.s || {}), border: BORDES };
      if (r === rango.s.r) {
        celda.s.fill = { patternType: "solid", fgColor: { rgb: COLORES.verde } };
        celda.s.font = { bold: true, color: { rgb: "FFFFFF" } };
        celda.s.alignment = { ...(celda.s.alignment || {}), vertical: "center" };
      }
    }
  }
  worksheet["!cols"] = calcularAnchos(worksheet);
  return worksheet;
}

export function exportarWorkbook(worksheet, nombreArchivo = "reporte") {
  if (!worksheet) return;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const archivo = new Blob(
    [excelBuffer],
    {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }
  );

  saveAs(archivo, `${nombreArchivo}.xlsx`);
}

export function exportarExcel(datos, nombreArchivo = "reporte") {
  if (!datos || datos.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(datos);

  exportarWorkbook(aplicarEstilosGenericos(worksheet), nombreArchivo);
}