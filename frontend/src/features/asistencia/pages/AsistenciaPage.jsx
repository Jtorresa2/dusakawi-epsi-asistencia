import { useState, useEffect } from "react";
import {
  Box, Paper, Typography,
} from "@mui/material";
import { exportarExcel } from "../../../shared/utils/exportarExcel";
import DataTable from "../../../shared/components/DataTable";
import Loading from "../../../shared/components/Loading";
import EmptyState from "../../../shared/components/EmptyState";
import PDFPreviewModal from "../../../shared/components/PDFPreviewModal";
import { asistenciaColumns } from "../components/columns";
import { obtenerRegistros } from "../asistencia.api";
import { obtenerAreas } from "../../areas/area.api";
import { COLORES } from "../../../shared/constants/colores.js";

import FiltrosAsistencia from "../components/FiltrosAsistencia";
import ResumenCards from "../components/ResumenCards";
import DetalleAsistenciaModal from "../components/DetalleAsistenciaModal";

const AREAS_FALLBACK = [
  { nombre: "SIAU", piso: 1 }, { nombre: "PQR", piso: 1 }, { nombre: "Call Center", piso: 1 }, { nombre: "Aseguramiento", piso: 1 }, { nombre: "Autorización", piso: 1 }, { nombre: "Comunicación", piso: 1 }, { nombre: "Calidad", piso: 1 }, { nombre: "Jurídica", piso: 1 },
  { nombre: "Psicología", piso: 2 }, { nombre: "Recepción", piso: 2 }, { nombre: "Transporte", piso: 2 }, { nombre: "MIPRES", piso: 2 }, { nombre: "Portabilidad", piso: 2 }, { nombre: "Dirección de Riesgos", piso: 2 }, { nombre: "Gerencia", piso: 2 },
  { nombre: "Referencia", piso: 3 }, { nombre: "Auditoría de Cuentas Médicas", piso: 3 }, { nombre: "Radicación", piso: 3 }, { nombre: "Archivo", piso: 3 }, { nombre: "SARLAFT", piso: 3 }, { nombre: "Mediana y Alta Complejidad", piso: 3 }, { nombre: "Contratación", piso: 3 },
  { nombre: "Contabilidad", piso: 4 }, { nombre: "Presupuesto", piso: 4 }, { nombre: "Cartera", piso: 4 }, { nombre: "Recobro", piso: 4 }, { nombre: "Dirección Administrativa", piso: 4 }, { nombre: "PYM", piso: 4 }, { nombre: "Control Interno", piso: 4 },
  { nombre: "Estadística", piso: 5 }, { nombre: "Sistemas", piso: 5 }, { nombre: "Tesorería", piso: 5 }, { nombre: "Alto Costo", piso: 5 }, { nombre: "Baja Complejidad", piso: 5 }, { nombre: "Talento Humano", piso: 5 }, { nombre: "Intercultural", piso: 5 },
];

export default function AsistenciaPage() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState("dia");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [fechaDesde, setFechaDesde] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d.toISOString().split("T")[0];
  });
  const [fechaHasta, setFechaHasta] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 5); return d.toISOString().split("T")[0];
  });
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [filtroArea, setFiltroArea] = useState("Todas las áreas");
  const [filtroPiso, setFiltroPiso] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [areas, setAreas] = useState([]);
  const pisosDisponibles = [...new Set(areas.map((a) => a.piso).filter(Boolean))].sort((a, b) => a - b);
  const areaPisoMap = Object.fromEntries(areas.map((a) => [a.nombre, a.piso]));
  const getPiso = (areaNombre) => areaPisoMap[areaNombre];
  const [detalleRow, setDetalleRow] = useState(null);
  const [exportAnchor, setExportAnchor] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [activoCard, setActivoCard] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await obtenerAreas();
        const lista = Array.isArray(data) ? data : data.areas || [];
        setAreas(lista.map((a) => {
          if (typeof a === "string") return { nombre: a, piso: null };
          return { nombre: a.nombre || a.name, piso: a.piso ?? null };
        }));
      } catch {
        setAreas(AREAS_FALLBACK);
      }
    })();
  }, []);

  function getDateParams() {
    if (vista === "dia") return { fecha };
    if (vista === "semana") return { fecha_desde: fechaDesde, fecha_hasta: fechaHasta };
    if (vista === "mes") {
      const desde = `${anio}-${String(mes).padStart(2, "0")}-01`;
      const hasta = new Date(anio, mes, 0).toISOString().split("T")[0];
      return { fecha_desde: desde, fecha_hasta: hasta };
    }
    if (vista === "rango") return { fecha_desde: fechaDesde, fecha_hasta: fechaHasta };
    return { fecha };
  }

  async function cargarRegistros() {
    try {
      setLoading(true);
      const data = await obtenerRegistros({ ...getDateParams(), area: filtroArea !== "Todas las áreas" ? filtroArea : "", piso: filtroPiso, estado: filtroEstado });
      const rows = (data.registros || []).map((r) => ({
        ...r,
        empleado: r.empleado || r.colaborador || "",
      }));
      setRegistros(rows);
    } catch {
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargarRegistros(); }, [vista, fecha, fechaDesde, fechaHasta, mes, anio, filtroArea, filtroPiso, filtroEstado]);

  function limpiar() {
    setVista("dia");
    setFecha(new Date().toISOString().split("T")[0]);
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); setFechaDesde(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() - d.getDay() + 5); setFechaHasta(d.toISOString().split("T")[0]);
    setMes(new Date().getMonth() + 1);
    setAnio(new Date().getFullYear());
    setFiltroArea("Todas las áreas");
    setFiltroPiso("");
    setFiltroEstado("");
    setActivoCard("");
    cargarRegistros();
  }

  function exportarExcel() {
    setExportAnchor(null);
    const data = filtrados.map((r, i) => ({
      "#": i + 1,
      Empleado: r.colaborador || r.empleado || "",
      Documento: r.cedula || "",
      Área: r.area || "",
      Piso: r.piso || "",
      Fecha: r.fecha || "",
      "Entrada AM": r.entrada1 || "",
      "Salida AM": r.salida1 || "",
      "Entrada PM": r.entrada2 || "",
      "Salida PM": r.salida2 || "",
      "Horas Trabajadas": r.horas_trabajadas ? `${r.horas_trabajadas}h` : "",
      "Minutos Tardanza": r.minutos_tardanza || 0,
      Marcación: r.tipo_marcacion || "",
      Estado: r.estado || "",
    }));

    const label = vista === "dia" ? fecha : vista === "semana" ? `sem${fechaDesde}` : vista === "mes" ? `${anio}_${mes}` : `${fechaDesde}_${fechaHasta}`;
    exportarExcel(data, `Asistencia_${label}`);
  }

  function exportarPDF() {
    setExportAnchor(null);
    const params = new URLSearchParams();
    if (vista === "dia" && fecha) params.set("fecha", fecha);
    else if (fechaDesde && fechaHasta) { params.set("fecha_desde", fechaDesde); params.set("fecha_hasta", fechaHasta); }
    if (filtroArea !== "Todas las áreas") params.set("area", filtroArea);
    if (filtroPiso) params.set("piso", filtroPiso);
    if (filtroEstado) params.set("estado", filtroEstado);
    const qs = params.toString();
    window.open(`/api/pdf/asistencia${qs ? `?${qs}` : ""}`, "_blank");
  }

  function vistaPreviaPDF() {
    setExportAnchor(null);
    const params = new URLSearchParams();
    if (vista === "dia" && fecha) params.set("fecha", fecha);
    else if (fechaDesde && fechaHasta) { params.set("fecha_desde", fechaDesde); params.set("fecha_hasta", fechaHasta); }
    if (filtroArea !== "Todas las áreas") params.set("area", filtroArea);
    if (filtroPiso) params.set("piso", filtroPiso);
    if (filtroEstado) params.set("estado", filtroEstado);
    const qs = params.toString();
    setPdfPreviewUrl(`/api/pdf/asistencia${qs ? `?${qs}&preview=1` : "?preview=1"}`);
  }

  let filtrados = [...registros];

  if (filtroArea !== "Todas las áreas") {
    filtrados = filtrados.filter((r) => r.area === filtroArea);
  }
  if (filtroPiso !== "") {
    const areasEnPiso = new Set(areas.filter((a) => a.piso === Number(filtroPiso)).map((a) => a.nombre));
    filtrados = filtrados.filter((r) => areasEnPiso.has(r.area));
  }

  const baseCards = [...filtrados];

  if (filtroEstado !== "") {
    filtrados = filtrados.filter((r) => r.estado === filtroEstado);
  }

  function handleCardClick(estadoKey) {
    if (activoCard === estadoKey) {
      setActivoCard("");
      setFiltroEstado("");
    } else {
      setActivoCard(estadoKey);
      setFiltroEstado(estadoKey);
    }
  }

  if (loading) return <Loading />;

  return (
    <Box sx={{ p: 3, bgcolor: COLORES.grisAzulado, minHeight: "100vh" }}>
      {/* 1. ENCABEZADO */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 13, color: COLORES.textoMuted }}>
          Inicio / Gestión del personal / Asistencia
        </Typography>
      </Box>

      {/* 2. TARJETAS RESUMEN */}
      <ResumenCards
        filtrados={baseCards}
        filtroEstado={filtroEstado}
        activoCard={activoCard}
        onCardClick={handleCardClick}
      />

      {/* 3. BARRA DE FILTROS */}
      <FiltrosAsistencia
        vista={vista} setVista={setVista}
        fecha={fecha} setFecha={setFecha}
        fechaDesde={fechaDesde} setFechaDesde={setFechaDesde}
        fechaHasta={fechaHasta} setFechaHasta={setFechaHasta}
        mes={mes} setMes={setMes}
        anio={anio} setAnio={setAnio}
        filtroArea={filtroArea} setFiltroArea={setFiltroArea}
        filtroPiso={filtroPiso} setFiltroPiso={setFiltroPiso}
        filtroEstado={filtroEstado} setFiltroEstado={setFiltroEstado}
        areas={areas}
        pisosDisponibles={pisosDisponibles}
        limpiar={limpiar}
        exportAnchor={exportAnchor} setExportAnchor={setExportAnchor}
        exportarExcel={exportarExcel}
        vistaPreviaPDF={vistaPreviaPDF}
        exportarPDF={exportarPDF}
      />

      {/* 4. TABLA */}
      <Paper elevation={0} sx={{ borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}`, overflow: "hidden" }}>
        {filtrados.length === 0 ? (
          <EmptyState mensaje="No hay registros para los filtros seleccionados" />
        ) : (
          <DataTable
            rows={filtrados}
            columns={asistenciaColumns({
              getPiso, onDetalle: (row) => setDetalleRow(row),
            })}
            loading={loading}
          />
        )}
      </Paper>

      {/* 5. MODAL DETALLE ASISTENCIA */}
      <DetalleAsistenciaModal
        open={Boolean(detalleRow)}
        onClose={() => setDetalleRow(null)}
        row={detalleRow}
      />

      {/* 6. MODAL VISTA PREVIA PDF */}
      <PDFPreviewModal
        open={Boolean(pdfPreviewUrl)}
        onClose={() => setPdfPreviewUrl(null)}
        url={pdfPreviewUrl}
        titulo="Vista previa - Asistencia"
      />
    </Box>
  );
}
