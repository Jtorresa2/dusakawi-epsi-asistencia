import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function exportarExcel(datos, nombreArchivo = "reporte") {
  if (!datos || datos.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(datos);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Datos"
  );

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

  saveAs(
    archivo,
    `${nombreArchivo}.xlsx`
  );
}