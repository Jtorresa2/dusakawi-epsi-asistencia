import { useState, useEffect } from "react";
import { Box, Paper, Typography, Button, Breadcrumbs, Link, TextField, MenuItem, InputLabel } from "@mui/material";
import { ArrowLeft, ChevronRight, Search, RotateCcw, FileSpreadsheet, FileText } from "lucide-react";
import { obtenerPersonal } from "../../personal/personal.api";
import { obtenerAreas } from "../../areas/area.api";
import { obtenerCargos } from "../../cargos/cargo.api";
import DataTable from "../../../shared/components/DataTable";
import { COLORES } from "../../../shared/constants/colores.js";

const ETIQUETAS = {
  porEmpleado: "Reporte por Empleado", asistencia: "Reporte de Asistencia", incidencias: "Reporte de Incidencias", tardanzas: "Reporte de Tardanzas",
  ausencias: "Reporte de Ausencias", empleados: "Reporte de Empleados", marcaciones: "Reporte de Marcaciones",
};
const ICONOS = { porEmpleado: "👤", asistencia: "📊", incidencias: "📄", tardanzas: "⏰", ausencias: "🚫", empleados: "👥", marcaciones: "📍" };

const API_MAP = {
  porEmpleado: "obtenerReportePorEmpleado", asistencia: "obtenerReporteAsistencia", incidencias: "obtenerReporteIncidencias", tardanzas: "obtenerReporteTardanzas",
  ausencias: "obtenerReporteAusencias", empleados: "obtenerReporteEmpleados", marcaciones: "obtenerReporteMarcaciones",
};

const TIPOS_INC = [
  {value:"falla_biometrica",label:"Falla biométrica"},
  {value:"tardanza_justificada",label:"Tardanza justificada"},
  {value:"otro",label:"Otro"},
];
const EST_ASIS = ["puntual","tardanza","ausente","justificado"];
const EST_INC = ["pendiente","aprobado","rechazado"];
const EST_EMP = [{value:"1",label:"Activo"},{value:"0",label:"Inactivo"}];

const MESES = [
  {v:1,l:"Enero"},{v:2,l:"Febrero"},{v:3,l:"Marzo"},{v:4,l:"Abril"},{v:5,l:"Mayo"},{v:6,l:"Junio"},
  {v:7,l:"Julio"},{v:8,l:"Agosto"},{v:9,l:"Septiembre"},{v:10,l:"Octubre"},{v:11,l:"Noviembre"},{v:12,l:"Diciembre"},
];

const FILTROS = {
  porEmpleado: ["usuario_id","mes"],
  asistencia: ["fecha_desde","area_id","estado"],
  incidencias: ["fecha_desde","usuario_id","area_id","estado_incidencia","tipo_incidencia"],
  tardanzas: ["fecha_desde","usuario_id","area_id"],
  ausencias: ["fecha_desde","usuario_id","area_id"],
  empleados: ["area_id","cargo_id","estado_empleado"],
  marcaciones: ["fecha_desde","usuario_id","area_id"],
};

const SX = { "& .MuiOutlinedInput-root": { borderRadius: "10px", background: COLORES.fondoBlanco, "& fieldset": { borderColor: COLORES.borde }, "&:hover fieldset": { borderColor: COLORES.primario }, "&.Mui-focused fieldset": { borderColor: COLORES.primarioOscuro } }, "& .MuiInputLabel-root": { fontSize: 13, color: COLORES.textoTerciario }, "& .MuiInputBase-input": { fontSize: 13 } };

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
    {field:"descripcion",headerName:"Descripción",width:250,renderCell:p=>{const v=p.value||"";return <span title={v} style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block",width:"100%"}}>{v||"—"}</span>;}},
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
            <Box key={c} sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Box>
                <InputLabel sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Desde</InputLabel>
                <TextField type="date" size="small" value={f.fecha_desde||""} onChange={e => set("fecha_desde",e.target.value)} sx={{width:160,...SX}} />
              </Box>
              <Box>
                <InputLabel sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Hasta</InputLabel>
                <TextField type="date" size="small" value={f.fecha_hasta||""} onChange={e => set("fecha_hasta",e.target.value)} sx={{width:160,...SX}} />
              </Box>
            </Box>
          );
          if (c === "usuario_id") return (
            <Box key={c}>
              <InputLabel sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Empleado</InputLabel>
              <TextField select size="small" value={f.usuario_id||""} onChange={e => set("usuario_id",e.target.value)} sx={{minWidth:180,...SX}}>
                <MenuItem value="">{tipoReporte==="porEmpleado"?"Seleccione...":"Todos"}</MenuItem>
                {(empleados||[]).map(e => <MenuItem key={e.id} value={e.id}>{e.nombre} {e.apellido}</MenuItem>)}
              </TextField>
            </Box>
          );
          if (c === "mes") return (
            <Box key={c} sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Box>
                <InputLabel sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Mes</InputLabel>
                <TextField select size="small" value={f.mes??""} onChange={e=>set("mes",e.target.value?Number(e.target.value):"")} sx={{minWidth:150,...SX}}>
                  <MenuItem value="">Todos</MenuItem>
                  {MESES.map(m => <MenuItem key={m.v} value={m.v}>{m.l}</MenuItem>)}
                </TextField>
              </Box>
              <Box>
                <InputLabel sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Año</InputLabel>
                <TextField select size="small" value={f.anio??""} onChange={e=>set("anio",e.target.value?Number(e.target.value):"")} sx={{width:110,...SX}}>
                  <MenuItem value="">Todos</MenuItem>
                  {Array.from({length:10},(_,i)=>new Date().getFullYear()-i).map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                </TextField>
              </Box>
            </Box>
          );
          if (c === "area_id") return (
            <Box key={c}>
              <InputLabel sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Área</InputLabel>
              <TextField select size="small" value={f.area_id||""} onChange={e => set("area_id",e.target.value)} sx={{minWidth:150,...SX}}>
                <MenuItem value="">Todas</MenuItem>
                {areas.map(a => <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>)}
              </TextField>
            </Box>
          );
          if (c === "cargo_id") return (
            <Box key={c}>
              <InputLabel sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Cargo</InputLabel>
              <TextField select size="small" value={f.cargo_id||""} onChange={e => set("cargo_id",e.target.value)} sx={{minWidth:150,...SX}}>
                <MenuItem value="">Todos</MenuItem>
                {cargos.map(ca => <MenuItem key={ca.id} value={ca.id}>{ca.nombre}</MenuItem>)}
              </TextField>
            </Box>
          );
          if (c === "estado") return (
            <Box key={c}>
              <InputLabel sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Estado</InputLabel>
              <TextField select size="small" value={f.estado||""} onChange={e => set("estado",e.target.value)} sx={{minWidth:130,...SX}}>
                <MenuItem value="">Todos</MenuItem>
                {EST_ASIS.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
              </TextField>
            </Box>
          );
          if (c === "estado_incidencia") return (
            <Box key={c}>
              <InputLabel sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Estado</InputLabel>
              <TextField select size="small" value={f.estado_incidencia||""} onChange={e => set("estado_incidencia",e.target.value)} sx={{minWidth:130,...SX}}>
                <MenuItem value="">Todos</MenuItem>
                {EST_INC.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
              </TextField>
            </Box>
          );
          if (c === "estado_empleado") return (
            <Box key={c}>
              <InputLabel sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Estado</InputLabel>
              <TextField select size="small" value={f.estado_empleado||""} onChange={e => set("estado_empleado",e.target.value)} sx={{minWidth:130,...SX}}>
                <MenuItem value="">Todos</MenuItem>
                {EST_EMP.map(e => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
              </TextField>
            </Box>
          );
          if (c === "tipo_incidencia") return (
            <Box key={c}>
              <InputLabel sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoTerciario, mb: 0.5 }}>Tipo</InputLabel>
              <TextField select size="small" value={f.tipo_incidencia||""} onChange={e => set("tipo_incidencia",e.target.value)} sx={{minWidth:200,...SX}}>
                <MenuItem value="">Todos</MenuItem>
                {TIPOS_INC.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Box>
          );
          return null;
        })}
      </Box>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button variant="contained" startIcon={<Search size={16}/>} onClick={() => onGenerar(f)} sx={{borderRadius:"10px",textTransform:"none",fontSize:12,fontWeight:600,px:2.5,background:COLORES.primarioOscuro,"&:hover":{background:COLORES.primario}}}>Generar</Button>
        <Button variant="outlined" startIcon={<FileText size={16}/>} onClick={tipoReporte==="porEmpleado"?undefined:onExportarPDF} disabled={tipoReporte==="porEmpleado"} sx={{borderRadius:"10px",textTransform:"none",fontSize:12,borderColor:COLORES.borde,color:COLORES.textoSecundario,"&:hover":{borderColor:COLORES.primarioOscuro,color:COLORES.primarioOscuro},"&.Mui-disabled":{color:COLORES.borde2,borderColor:COLORES.borde}}}>PDF</Button>
        <Button variant="outlined" startIcon={<FileSpreadsheet size={16}/>} onClick={onExportarExcel} sx={{borderRadius:"10px",textTransform:"none",fontSize:12,borderColor:COLORES.borde,color:COLORES.textoSecundario,"&:hover":{borderColor:COLORES.primarioOscuro,color:COLORES.primarioOscuro}}}>Excel</Button>
        <Button variant="text" startIcon={<RotateCcw size={16}/>} onClick={()=>{setF({}); if(onLimpiar)onLimpiar();}} sx={{borderRadius:"10px",textTransform:"none",fontSize:12,color:COLORES.textoTerciario,"&:hover":{color:COLORES.danger}}}>Limpiar</Button>
      </Box>
    </Box>
  );
}

function ResultadosTable({ tipoReporte, registros, total }) {
  if (!registros?.length) return (
    <Box sx={{textAlign:"center",py:4,color:COLORES.textoSuave}}>
      <Typography sx={{fontSize:14}}>No hay registros para los filtros seleccionados.</Typography>
    </Box>
  );
  return (
    <Box>
      <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",mb:1}}>
        <Typography sx={{fontSize:14,fontWeight:600,color:COLORES.textoSecundario}}>Resultados</Typography>
        <Typography sx={{fontSize:12,color:COLORES.textoSuave}}>{total||registros.length} {tipoReporte==="empleados"?"empleados":"registros"}</Typography>
      </Box>
      <DataTable rows={registros} columns={COLS[tipoReporte]||[]} entityLabel={tipoReporte==="empleados"?"empleados":"registros"} getRowId={r=>r.id||r.cedula||Math.random()} pageSize={10} />
    </Box>
  );
}

function ResultadosPorEmpleado({ data }) {
  if (!data?.empleado) return (
    <Box sx={{textAlign:"center",py:4,color:COLORES.textoSuave}}>
      <Typography sx={{fontSize:14}}>Seleccione un empleado y genere el reporte.</Typography>
    </Box>
  );
  const { empleado, periodo, resumen, permisos, incidencias, detalle } = data;
  const metricas = resumen ? [
    { label: "Días hábiles", value: periodo?.diasHabiles||0, color: COLORES.verdeTexto },
    { label: "Festivos", value: periodo?.festivos||0, color: COLORES.warningOscuro },
    { label: "Asistencia", value: `${resumen.porcentaje_asistencia||0}%`, color: COLORES.verdeTexto },
    { label: "Puntuales", value: resumen.puntuales||0, color: COLORES.verdeTexto },
    { label: "Tardanzas", value: resumen.tardanzas||0, color: COLORES.danger },
    { label: "Ausentes", value: resumen.ausentes||0, color: COLORES.textoTerciario },
    { label: "Horas total", value: resumen.horas_trabajadas ? `${resumen.horas_trabajadas}h` : "0h", color: COLORES.primario },
    { label: "Novedades", value: permisos?.total||0, color: COLORES.verdeTexto },
    { label: "Incidencias", value: incidencias?.total||0, color: COLORES.danger },
  ] : [];

  return (
    <Box>
      {/* Encabezado empleado */}
      <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"center", mb:3, flexWrap:"wrap", gap:2 }}>
        <Box>
          <Typography sx={{ fontSize:18, fontWeight:700, color:COLORES.textoPrimario }}>{empleado.nombre} {empleado.apellido}</Typography>
          <Typography sx={{ fontSize:13, color:COLORES.textoTerciario }}>
            {empleado.cedula && <>C.C. {empleado.cedula} · </>}
            {empleado.area}{empleado.cargo ? ` · ${empleado.cargo}` : ""}
          </Typography>
        </Box>
        <Box sx={{ textAlign:"right" }}>
          <Typography sx={{ fontSize:14, fontWeight:600, color:COLORES.textoSecundario }}>
            {MESES.find(m=>m.v===periodo?.mes)?.l || "—"} {periodo?.anio || ""}
          </Typography>
          <Typography sx={{ fontSize:12, color:COLORES.textoSuave }}>
            {periodo?.diasEsperados || 0} días laborales
          </Typography>
        </Box>
      </Box>

      {/* Tarjetas de métricas */}
      <Box sx={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(120px, 1fr))", gap:1.5, mb:3 }}>
        {metricas.map((m,i) => (
          <Paper key={i} elevation={0} sx={{ p:1.5, borderRadius:"12px", border:`1px solid ${COLORES.grisContorno}`, textAlign:"center" }}>
            <Typography sx={{ fontSize:20, fontWeight:700, color:m.color }}>{m.value}</Typography>
            <Typography sx={{ fontSize:11, color:COLORES.textoSuave, mt:0.5 }}>{m.label}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Novedades - solo resumen numérico por ahora */}
      {permisos?.total > 0 && (
        <Box sx={{ mb:2, p:2, background:COLORES.successClaro, borderRadius:"12px", border:`1px solid ${COLORES.successFondo}` }}>
          <Typography sx={{ fontSize:13, fontWeight:600, color:COLORES.primarioOscuro }}>
            Novedades: {permisos.total} ({permisos.dias} días hábiles)
          </Typography>
        </Box>
      )}

      {/* Incidencias - solo resumen numérico por ahora */}
      {incidencias?.total > 0 && (
        <Box sx={{ mb:2, p:2, background:COLORES.dangerFondo2, borderRadius:"12px", border:`1px solid ${COLORES.dangerBorde}` }}>
          <Typography sx={{ fontSize:13, fontWeight:600, color:COLORES.dangerOscuro }}>
            Incidencias: {incidencias.total} ({incidencias.pendientes} pendientes)
          </Typography>
        </Box>
      )}

      {/* Detalle diario */}
      {detalle?.length > 0 && (
        <Box>
          <Typography sx={{ fontSize:14, fontWeight:600, color:COLORES.textoSecundario, mb:1 }}>Detalle diario ({detalle.length} días)</Typography>
          <DataTable rows={detalle} columns={[
            {field:"fecha",headerName:"Fecha",width:100,valueFormatter:v=>new Date(v).toLocaleDateString("es-CO")},
            {field:"entrada1",headerName:"Ent. Mañana",width:95,valueFormatter:v=>v||"—"},
            {field:"salida1",headerName:"Sal. Mañana",width:95,valueFormatter:v=>v||"—"},
            {field:"entrada2",headerName:"Ent. Tarde",width:90,valueFormatter:v=>v||"—"},
            {field:"salida2",headerName:"Sal. Tarde",width:90,valueFormatter:v=>v||"—"},
            {field:"horas_trabajadas",headerName:"Horas",width:70,valueFormatter:v=>v?`${v}h`:"—"},
            {field:"estado",headerName:"Estado",width:90},
            {field:"esFestivo",headerName:"Festivo",width:70,valueFormatter:v=>v?"Sí":"—"},
          ]} entityLabel="días" getRowId={r=>r.fecha||Math.random()} pageSize={10} />
        </Box>
      )}
    </Box>
  );
}

export default function ReporteView({ tipoReporte, apiFns, onVolver, onExportarPDF, onExportarExcel, filtrosIniciales }) {
  const [registros, setRegistros] = useState(null);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [filtros, setFiltros] = useState({});
  const [empleados, setEmpleados] = useState([]);

  useEffect(() => { obtenerPersonal().then(r => setEmpleados(r.empleados||r||[])).catch(()=>{}); }, []);

  useEffect(() => {
    if (filtrosIniciales && Object.keys(filtrosIniciales).length > 0) {
      generar(filtrosIniciales);
    }
  }, [filtrosIniciales]);

  const isPorEmpleado = tipoReporte === "porEmpleado";

  const generar = async (f) => {
    try {
      setCargando(true); setErrorMsg(null); setFiltros(f);
      const fn = apiFns[API_MAP[tipoReporte]];
      if (!fn) return;
      const p = {};
      if (f.fecha_desde) p.fecha_desde = f.fecha_desde;
      if (f.fecha_hasta) p.fecha_hasta = f.fecha_hasta;
      if (f.usuario_id || f.empleado_id) p.usuario_id = f.usuario_id || f.empleado_id;
      if (f.area_id) p.area_id = f.area_id;
      if (f.cargo_id) p.cargo_id = f.cargo_id;
      if (f.estado) p.estado = f.estado;
      if (f.estado_incidencia) p.estado = f.estado_incidencia;
      if (f.estado_empleado !== "" && f.estado_empleado !== undefined) p.activo = f.estado_empleado;
      if (f.tipo_incidencia) p.tipo = f.tipo_incidencia;
      if (f.mes) p.mes = f.mes;
      if (f.anio) p.anio = f.anio;
      const r = await fn(p);
      if (isPorEmpleado) {
        setRegistros(r); // store full response for custom rendering
        setTotal(r.detalle?.length||0);
      } else {
        setRegistros(r.registros||[]); setTotal(r.total||r.registros?.length||0);
      }
    } catch (e) { setRegistros([]); setTotal(0); setErrorMsg(e.message); } finally { setCargando(false); }
  };

  const limpiar = () => { setRegistros(null); setTotal(0); setFiltros({}); setErrorMsg(null); };

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}`, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Button onClick={onVolver} sx={{ minWidth: 0, p: 0.5, borderRadius: "8px", color: COLORES.textoTerciario }}><ArrowLeft size={18} /></Button>
          <Breadcrumbs separator={<ChevronRight size={14} />} sx={{ fontSize: 12, color: COLORES.textoSuave }}>
            <Link underline="hover" color="inherit" sx={{ cursor: "pointer" }} onClick={onVolver}>Inicio</Link>
            <Link underline="hover" color="inherit" sx={{ cursor: "pointer" }} onClick={onVolver}>Operación</Link>
            <Link underline="hover" color="inherit" sx={{ cursor: "pointer" }} onClick={onVolver}>Reportes</Link>
            <Typography sx={{ fontSize: 12, color: COLORES.textoPrimario, fontWeight: 600 }}>{ETIQUETAS[tipoReporte]}</Typography>
          </Breadcrumbs>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", background: COLORES.successClaro, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{ICONOS[tipoReporte]}</Box>
          <Typography sx={{ fontSize: 17, fontWeight: 700, color: COLORES.textoPrimario }}>{ETIQUETAS[tipoReporte]}</Typography>
        </Box>
        <FiltrosReporte tipoReporte={tipoReporte} empleados={empleados} onGenerar={generar} onExportarPDF={() => onExportarPDF?.(tipoReporte, filtros)} onExportarExcel={() => onExportarExcel?.(tipoReporte, registros)} onLimpiar={limpiar} />
      </Paper>
      {cargando ? (
        <Box sx={{ textAlign: "center", py: 4, color: COLORES.textoSuave }}>Generando reporte...</Box>
      ) : errorMsg ? (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${COLORES.dangerBorde}`, background:COLORES.dangerFondo2 }}>
          <Typography sx={{ fontSize:13, color:COLORES.dangerOscuro }}>Error: {errorMsg}</Typography>
        </Paper>
      ) : registros !== null ? (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}` }}>
          {isPorEmpleado ? (
            <ResultadosPorEmpleado data={registros} />
          ) : (
            <ResultadosTable tipoReporte={tipoReporte} registros={registros} total={total} />
          )}
        </Paper>
      ) : null}
    </Box>
  );
}
