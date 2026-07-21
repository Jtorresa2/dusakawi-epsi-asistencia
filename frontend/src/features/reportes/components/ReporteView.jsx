import { useState, useEffect } from "react";
import { Box, Paper, Typography, Button, Breadcrumbs, Link, TextField, MenuItem } from "@mui/material";
import { ArrowLeft, ChevronRight, Search, RotateCcw, Printer, FileSpreadsheet, FileText } from "lucide-react";
import { obtenerEmpleados } from "../../empleados/empleado.api";
import { obtenerAreas } from "../../areas/area.api";
import { obtenerCargos } from "../../cargos/cargo.api";
import DataTable from "../../../shared/components/DataTable";

const ETIQUETAS = {
  asistencia: "Reporte de Asistencia", incidencias: "Reporte de Incidencias", tardanzas: "Reporte de Tardanzas",
  ausencias: "Reporte de Ausencias", empleados: "Reporte de Empleados", marcaciones: "Reporte de Marcaciones",
};
const ICONOS = { asistencia: "📊", incidencias: "📄", tardanzas: "⏰", ausencias: "🚫", empleados: "👥", marcaciones: "📍" };

const API_MAP = {
  asistencia: "obtenerReporteAsistencia", incidencias: "obtenerReporteIncidencias", tardanzas: "obtenerReporteTardanzas",
  ausencias: "obtenerReporteAusencias", empleados: "obtenerReporteEmpleados", marcaciones: "obtenerReporteMarcaciones",
};

const TIPOS_INC = ["Accidente de trabajo","Enfermedad general","Permiso personal","Calamidad doméstica","Cita médica","Otro"];
const EST_ASIS = ["puntual","tardanza","ausente","justificado"];
const EST_INC = ["pendiente","aprobado","rechazado"];
const EST_EMP = [{value:"1",label:"Activo"},{value:"0",label:"Inactivo"}];

const FILTROS = {
  asistencia: ["fecha_desde","fecha_hasta","empleado_id","area_id","estado"],
  incidencias: ["fecha_desde","fecha_hasta","empleado_id","area_id","estado_incidencia","tipo_incidencia"],
  tardanzas: ["fecha_desde","fecha_hasta","empleado_id","area_id"],
  ausencias: ["fecha_desde","fecha_hasta","empleado_id","area_id"],
  empleados: ["area_id","cargo_id","estado_empleado"],
  marcaciones: ["fecha_desde","fecha_hasta","empleado_id","area_id"],
};

const SX = { "& .MuiOutlinedInput-root": { borderRadius: "10px", background: "#fff", "& fieldset": { borderColor: "#E5E7EB" }, "&:hover fieldset": { borderColor: "#2E7D32" }, "&.Mui-focused fieldset": { borderColor: "#1B5E20" } }, "& .MuiInputLabel-root": { fontSize: 13, color: "#6B7280" }, "& .MuiInputBase-input": { fontSize: 13 } };

const fm = (v) => v || "—";

const COLS = {
  asistencia: [
    {field:"empleado",headerName:"Empleado",width:160},{field:"cedula",headerName:"Cédula",width:90},{field:"area",headerName:"Área",width:110},
    {field:"fecha",headerName:"Fecha",width:100,valueFormatter:v=>v?new Date(v).toLocaleDateString("es-CO"):"—"},
    {field:"entrada1",headerName:"Ent. Mañana",width:95,valueFormatter:fm},
    {field:"salida1",headerName:"Sal. Mañana",width:95,valueFormatter:fm},
    {field:"entrada2",headerName:"Ent. Tarde",width:90,valueFormatter:fm},
    {field:"salida2",headerName:"Sal. Tarde",width:90,valueFormatter:fm},
    {field:"horas_trabajadas",headerName:"Horas",width:70,valueFormatter:v=>v?`${v}h`:"—"},{field:"estado",headerName:"Estado",width:100},
  ],
  incidencias: [
    {field:"empleado",headerName:"Empleado",width:180},{field:"cedula",headerName:"Cédula",width:100},{field:"area",headerName:"Área",width:120},
    {field:"tipo",headerName:"Tipo",width:150},{field:"fecha",headerName:"Fecha",width:110},{field:"estado",headerName:"Estado",width:110},
    {field:"descripcion",headerName:"Descripción",width:250},
  ],
  tardanzas: [
    {field:"empleado",headerName:"Empleado",width:160},{field:"cedula",headerName:"Cédula",width:90},{field:"area",headerName:"Área",width:110},
    {field:"fecha",headerName:"Fecha",width:100,valueFormatter:v=>v?new Date(v).toLocaleDateString("es-CO"):"—"},
    {field:"entrada1",headerName:"Ent. Mañana",width:95,valueFormatter:fm},
    {field:"entrada2",headerName:"Ent. Tarde",width:95,valueFormatter:fm},
    {field:"minutos_tardanza",headerName:"Tardanza",width:90,valueFormatter:v=>v?`${v} min`:"—"},
  ],
  ausencias: [
    {field:"empleado",headerName:"Empleado",width:180},{field:"cedula",headerName:"Cédula",width:100},{field:"area",headerName:"Área",width:120},
    {field:"fecha",headerName:"Fecha",width:110,valueFormatter:v=>v?new Date(v).toLocaleDateString("es-CO"):"—"},
    {field:"estado",headerName:"Estado",width:110},{field:"observacion",headerName:"Observación",width:250},
  ],
  empleados: [
    {field:"nombre",headerName:"Nombre",width:130},{field:"apellido",headerName:"Apellido",width:130},{field:"cedula",headerName:"Cédula",width:100},
    {field:"area",headerName:"Área",width:130},{field:"cargo",headerName:"Cargo",width:130},{field:"correo",headerName:"Correo",width:200},
    {field:"telefono",headerName:"Teléfono",width:120},{field:"activo",headerName:"Estado",width:100,valueFormatter:v=>v?"Activo":"Inactivo"},
  ],
  marcaciones: [
    {field:"empleado",headerName:"Empleado",width:160},{field:"cedula",headerName:"Cédula",width:90},{field:"area",headerName:"Área",width:110},
    {field:"fecha",headerName:"Fecha",width:100,valueFormatter:v=>v?new Date(v).toLocaleDateString("es-CO"):"—"},
    {field:"entrada1",headerName:"Ent. Mañana",width:95,valueFormatter:fm},
    {field:"salida1",headerName:"Sal. Mañana",width:95,valueFormatter:fm},
    {field:"entrada2",headerName:"Ent. Tarde",width:90,valueFormatter:fm},
    {field:"salida2",headerName:"Sal. Tarde",width:90,valueFormatter:fm},
    {field:"tipo_marcacion",headerName:"Tipo",width:100},{field:"estado",headerName:"Estado",width:90},
  ],
};

function FiltrosReporte({ tipoReporte, empleados, onGenerar, onExportarPDF, onExportarExcel, onLimpiar }) {
  const [f, setF] = useState({});
  const [areas, setAreas] = useState([]);
  const [cargos, setCargos] = useState([]);

  useEffect(() => { obtenerAreas().then(r => setAreas(r||[])).catch(()=>{}); obtenerCargos().then(r => setCargos(r||[])).catch(()=>{}); }, []);

  const set = (k, v) => setF(p => ({...p, [k]: v}));

  const cols = FILTROS[tipoReporte] || [];

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
        {cols.map(c => {
          if (c === "fecha_desde") return (
            <Box key={c} sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <TextField label="Desde" type="date" size="small" value={f.fecha_desde||""} onChange={e => set("fecha_desde",e.target.value)} InputLabelProps={{shrink:true}} sx={{width:150,...SX}} />
              <TextField label="Hasta" type="date" size="small" value={f.fecha_hasta||""} onChange={e => set("fecha_hasta",e.target.value)} InputLabelProps={{shrink:true}} sx={{width:150,...SX}} />
            </Box>
          );
          if (c === "empleado_id") return (
            <TextField key={c} select label="Empleado" size="small" value={f.empleado_id||""} onChange={e => set("empleado_id",e.target.value)} sx={{minWidth:180,...SX}}>
              <MenuItem value="">Todos</MenuItem>
              {(empleados||[]).map(e => <MenuItem key={e.id} value={e.id}>{e.nombre} {e.apellido}</MenuItem>)}
            </TextField>
          );
          if (c === "area_id") return (
            <TextField key={c} select label="Área" size="small" value={f.area_id||""} onChange={e => set("area_id",e.target.value)} sx={{minWidth:150,...SX}}>
              <MenuItem value="">Todas</MenuItem>
              {areas.map(a => <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>)}
            </TextField>
          );
          if (c === "cargo_id") return (
            <TextField key={c} select label="Cargo" size="small" value={f.cargo_id||""} onChange={e => set("cargo_id",e.target.value)} sx={{minWidth:150,...SX}}>
              <MenuItem value="">Todos</MenuItem>
              {cargos.map(ca => <MenuItem key={ca.id} value={ca.id}>{ca.nombre}</MenuItem>)}
            </TextField>
          );
          if (c === "estado") return (
            <TextField key={c} select label="Estado" size="small" value={f.estado||""} onChange={e => set("estado",e.target.value)} sx={{minWidth:130,...SX}}>
              <MenuItem value="">Todos</MenuItem>
              {EST_ASIS.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
            </TextField>
          );
          if (c === "estado_incidencia") return (
            <TextField key={c} select label="Estado" size="small" value={f.estado_incidencia||""} onChange={e => set("estado_incidencia",e.target.value)} sx={{minWidth:130,...SX}}>
              <MenuItem value="">Todos</MenuItem>
              {EST_INC.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
            </TextField>
          );
          if (c === "estado_empleado") return (
            <TextField key={c} select label="Estado" size="small" value={f.estado_empleado||""} onChange={e => set("estado_empleado",e.target.value)} sx={{minWidth:130,...SX}}>
              <MenuItem value="">Todos</MenuItem>
              {EST_EMP.map(e => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
            </TextField>
          );
          if (c === "tipo_incidencia") return (
            <TextField key={c} select label="Tipo" size="small" value={f.tipo_incidencia||""} onChange={e => set("tipo_incidencia",e.target.value)} sx={{minWidth:170,...SX}}>
              <MenuItem value="">Todos</MenuItem>
              {TIPOS_INC.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          );
          return null;
        })}
      </Box>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button variant="contained" startIcon={<Search size={16}/>} onClick={() => onGenerar(f)} sx={{borderRadius:"10px",textTransform:"none",fontSize:12,fontWeight:600,px:2.5,background:"#1B5E20","&:hover":{background:"#2E7D32"}}}>Generar</Button>
        <Button variant="outlined" startIcon={<FileText size={16}/>} onClick={onExportarPDF} sx={{borderRadius:"10px",textTransform:"none",fontSize:12,borderColor:"#E5E7EB",color:"#374151","&:hover":{borderColor:"#1B5E20",color:"#1B5E20"}}}>PDF</Button>
        <Button variant="outlined" startIcon={<FileSpreadsheet size={16}/>} onClick={onExportarExcel} sx={{borderRadius:"10px",textTransform:"none",fontSize:12,borderColor:"#E5E7EB",color:"#374151","&:hover":{borderColor:"#1B5E20",color:"#1B5E20"}}}>Excel</Button>
        <Button variant="outlined" startIcon={<Printer size={16}/>} onClick={()=>window.print()} sx={{borderRadius:"10px",textTransform:"none",fontSize:12,borderColor:"#E5E7EB",color:"#374151","&:hover":{borderColor:"#1B5E20",color:"#1B5E20"}}}>Imprimir</Button>
        <Button variant="text" startIcon={<RotateCcw size={16}/>} onClick={()=>{setF({}); if(onLimpiar)onLimpiar();}} sx={{borderRadius:"10px",textTransform:"none",fontSize:12,color:"#6B7280","&:hover":{color:"#DC2626"}}}>Limpiar</Button>
      </Box>
    </Box>
  );
}

function ResultadosTable({ tipoReporte, registros, total }) {
  if (!registros?.length) return (
    <Box sx={{textAlign:"center",py:4,color:"#9CA3AF"}}>
      <Typography sx={{fontSize:14}}>No hay registros para los filtros seleccionados.</Typography>
    </Box>
  );
  return (
    <Box>
      <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",mb:1}}>
        <Typography sx={{fontSize:14,fontWeight:600,color:"#374151"}}>Resultados</Typography>
        <Typography sx={{fontSize:12,color:"#9CA3AF"}}>{total||registros.length} {tipoReporte==="empleados"?"empleados":"registros"}</Typography>
      </Box>
      <DataTable rows={registros} columns={COLS[tipoReporte]||[]} entityLabel={tipoReporte==="empleados"?"empleados":"registros"} getRowId={r=>r.id||r.cedula||Math.random()} pageSize={10} />
    </Box>
  );
}

export default function ReporteView({ tipoReporte, apiFns, onVolver, onExportarPDF, onExportarExcel }) {
  const [registros, setRegistros] = useState(null);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [filtros, setFiltros] = useState({});
  const [empleados, setEmpleados] = useState([]);

  useEffect(() => { obtenerEmpleados().then(r => setEmpleados(r.empleados||r||[])).catch(()=>{}); }, []);

  const generar = async (f) => {
    try {
      setCargando(true); setFiltros(f);
      const fn = apiFns[API_MAP[tipoReporte]];
      if (!fn) return;
      const p = {};
      if (f.fecha_desde) p.fecha_desde = f.fecha_desde;
      if (f.fecha_hasta) p.fecha_hasta = f.fecha_hasta;
      if (f.empleado_id) p.empleado_id = f.empleado_id;
      if (f.area_id) p.area_id = f.area_id;
      if (f.cargo_id) p.cargo_id = f.cargo_id;
      if (f.estado) p.estado = f.estado;
      if (f.estado_incidencia) p.estado = f.estado_incidencia;
      if (f.estado_empleado !== "" && f.estado_empleado !== undefined) p.activo = f.estado_empleado;
      if (f.tipo_incidencia) p.tipo = f.tipo_incidencia;
      const r = await fn(p);
      setRegistros(r.registros||[]); setTotal(r.total||r.registros?.length||0);
    } catch { setRegistros([]); setTotal(0); } finally { setCargando(false); }
  };

  const limpiar = () => { setRegistros(null); setTotal(0); setFiltros({}); };

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #ECECEC", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Button onClick={onVolver} sx={{ minWidth: 0, p: 0.5, borderRadius: "8px", color: "#6B7280" }}><ArrowLeft size={18} /></Button>
          <Breadcrumbs separator={<ChevronRight size={14} />} sx={{ fontSize: 12, color: "#9CA3AF" }}>
            <Link underline="hover" color="inherit" sx={{ cursor: "pointer" }} onClick={onVolver}>Inicio</Link>
            <Link underline="hover" color="inherit" sx={{ cursor: "pointer" }} onClick={onVolver}>Operación</Link>
            <Link underline="hover" color="inherit" sx={{ cursor: "pointer" }} onClick={onVolver}>Reportes</Link>
            <Typography sx={{ fontSize: 12, color: "#111827", fontWeight: 600 }}>{ETIQUETAS[tipoReporte]}</Typography>
          </Breadcrumbs>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{ICONOS[tipoReporte]}</Box>
          <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>{ETIQUETAS[tipoReporte]}</Typography>
        </Box>
        <FiltrosReporte tipoReporte={tipoReporte} empleados={empleados} onGenerar={generar} onExportarPDF={() => onExportarPDF?.(tipoReporte, filtros)} onExportarExcel={() => onExportarExcel?.(tipoReporte, registros)} onLimpiar={limpiar} />
      </Paper>
      {cargando ? (
        <Box sx={{ textAlign: "center", py: 4, color: "#9CA3AF" }}>Generando reporte...</Box>
      ) : registros !== null ? (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #ECECEC" }}>
          <ResultadosTable tipoReporte={tipoReporte} registros={registros} total={total} />
        </Paper>
      ) : null}
    </Box>
  );
}
