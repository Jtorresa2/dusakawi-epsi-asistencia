import {
  Box, Button, Paper, TextField, Typography, Select, MenuItem, Menu, InputAdornment,
} from "@mui/material";
import { Filter, X, Download, CalendarDays, FileText } from "lucide-react";
import { COLORES } from "../../../shared/constants/colores.js";

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "on_time", label: "Puntual" },
  { value: "late", label: "Tardanza" },
  { value: "absent", label: "Ausente" },
  { value: "justified", label: "Justificado" },
];

export default function FiltrosAsistencia({
  vista, setVista,
  fecha, setFecha,
  fechaDesde, setFechaDesde,
  fechaHasta, setFechaHasta,
  mes, setMes,
  anio, setAnio,
  filtroArea, setFiltroArea,
  filtroPiso, setFiltroPiso,
  filtroEstado, setFiltroEstado,
  areas,
  pisosDisponibles,
  limpiar,
  exportAnchor, setExportAnchor,
  exportarExcel,
  vistaPreviaPDF,
  exportarPDF,
}) {
  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: "14px", border: `1px solid ${COLORES.borde}`, mb: 2.5 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1.5 }}>
        <Filter size={16} color={COLORES.primarioOscuro} />
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: COLORES.textoPrimario }}></Typography>
      </Box>

      {/* Row 1 — Select filters with CSS Grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 1.5, mb: 1.5 }}>
        <Box>
          <Typography sx={{ fontSize: 11, fontWeight: 500, color: COLORES.textoTerciario, mb: 0.4 }}>Vista</Typography>
          <Select value={vista} onChange={(e) => setVista(e.target.value)} size="small" fullWidth
            sx={{ borderRadius: "8px", fontSize: 13, height: 40, bgcolor: COLORES.fondoGris, "& fieldset": { borderColor: COLORES.borde } }}>
            <MenuItem value="dia">Día</MenuItem>
            <MenuItem value="semana">Semana</MenuItem>
            <MenuItem value="mes">Mes</MenuItem>
            <MenuItem value="rango">Rango</MenuItem>
          </Select>
        </Box>
        {vista === "mes" && (
          <>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 500, color: COLORES.textoTerciario, mb: 0.4 }}>Mes</Typography>
              <Select value={mes} onChange={(e) => setMes(Number(e.target.value))} size="small" fullWidth
                sx={{ borderRadius: "8px", fontSize: 13, height: 40, bgcolor: COLORES.fondoGris, "& fieldset": { borderColor: COLORES.borde } }}>
                {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((m, i) => (
                  <MenuItem key={i} value={i + 1}>{m}</MenuItem>
                ))}
              </Select>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 500, color: COLORES.textoTerciario, mb: 0.4 }}>Año</Typography>
              <Select value={anio} onChange={(e) => setAnio(Number(e.target.value))} size="small" fullWidth
                sx={{ borderRadius: "8px", fontSize: 13, height: 40, bgcolor: COLORES.fondoGris, "& fieldset": { borderColor: COLORES.borde } }}>
                {[2024, 2025, 2026].map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </Select>
            </Box>
          </>
        )}
        <Box>
          <Typography sx={{ fontSize: 11, fontWeight: 500, color: COLORES.textoTerciario, mb: 0.4 }}>Área</Typography>
          <Select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} size="small" fullWidth
            sx={{ borderRadius: "8px", fontSize: 13, height: 40, bgcolor: COLORES.fondoGris, "& fieldset": { borderColor: COLORES.borde } }}>
            {[{ nombre: "Todas las áreas" }, ...areas].map((a) => <MenuItem key={a.nombre} value={a.nombre}>{a.nombre}</MenuItem>)}
          </Select>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 11, fontWeight: 500, color: COLORES.textoTerciario, mb: 0.4 }}>Piso</Typography>
          <Select value={filtroPiso} onChange={(e) => setFiltroPiso(e.target.value)} size="small" fullWidth
            sx={{ borderRadius: "8px", fontSize: 13, height: 40, bgcolor: COLORES.fondoGris, "& fieldset": { borderColor: COLORES.borde } }}>
            <MenuItem value="">Todos</MenuItem>
            {pisosDisponibles.map((p) => <MenuItem key={p} value={p}>Piso {p}</MenuItem>)}
          </Select>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 11, fontWeight: 500, color: COLORES.textoTerciario, mb: 0.4 }}>Estado</Typography>
          <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} size="small" fullWidth
            sx={{ borderRadius: "8px", fontSize: 13, height: 40, bgcolor: COLORES.fondoGris, "& fieldset": { borderColor: COLORES.borde } }}>
            {ESTADOS.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
          </Select>
        </Box>
      </Box>

      {/* Row 2 — Date range + action buttons */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" }, gap: 1.5, alignItems: "end" }}>
        {vista === "dia" && (
          <TextField label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
            slotProps={{
              inputLabel: { shrink: true, sx: { fontSize: 12, color: COLORES.textoTerciario, fontWeight: 500 } },
              input: { startAdornment: <InputAdornment position="start"><CalendarDays size={14} color={COLORES.textoSuave} /></InputAdornment>, sx: { borderRadius: "8px", fontSize: 13, height: 40, bgcolor: COLORES.fondoGris } },
            }} />
        )}
        {(vista === "semana" || vista === "rango") && (
          <TextField label="Fecha desde" type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}
            slotProps={{
              inputLabel: { shrink: true, sx: { fontSize: 12, color: COLORES.textoTerciario, fontWeight: 500 } },
              input: { startAdornment: <InputAdornment position="start"><CalendarDays size={14} color={COLORES.textoSuave} /></InputAdornment>, sx: { borderRadius: "8px", fontSize: 13, height: 40, bgcolor: COLORES.fondoGris } },
            }} />
        )}
        {(vista === "semana" || vista === "rango") && (
          <TextField label="Fecha hasta" type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}
            slotProps={{
              inputLabel: { shrink: true, sx: { fontSize: 12, color: COLORES.textoTerciario, fontWeight: 500 } },
              input: { startAdornment: <InputAdornment position="start"><CalendarDays size={14} color={COLORES.textoSuave} /></InputAdornment>, sx: { borderRadius: "8px", fontSize: 13, height: 40, bgcolor: COLORES.fondoGris } },
            }} />
        )}
        {vista === "mes" && <Box />}
        {vista === "mes" && <Box />}
        <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", justifySelf: { xs: "start", md: "end" }, alignSelf: "end" }}>
          <Button variant="outlined" onClick={limpiar} startIcon={<X size={14} />}
                           sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, fontSize: 12, height: 40, px: 2, color: COLORES.textoTerciario, borderColor: COLORES.borde, bgcolor: COLORES.fondoBlanco, "&:hover": { borderColor: COLORES.danger, color: COLORES.danger }, whiteSpace: "nowrap" }}>
            Limpiar
          </Button>
          <Button variant="outlined" startIcon={<Download size={14} />} onClick={(e) => setExportAnchor(e.currentTarget)}
                           sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, fontSize: 12, height: 40, px: 2, color: COLORES.textoTerciario, borderColor: COLORES.borde, bgcolor: COLORES.fondoBlanco, "&:hover": { borderColor: COLORES.primarioOscuro, color: COLORES.primarioOscuro }, whiteSpace: "nowrap" }}>
            Exportar
          </Button>
          <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}
            transformOrigin={{ horizontal: "right", vertical: "top" }} anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            slotProps={{ paper: { sx: { borderRadius: "12px", mt: 0.5, minWidth: 150, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } } }}>
            <MenuItem onClick={exportarExcel} sx={{ borderRadius: "8px", mx: 0.5, fontSize: 13, gap: 1 }}>
              <FileText size={16} /> Exportar Excel
            </MenuItem>
            <MenuItem onClick={vistaPreviaPDF} sx={{ borderRadius: "8px", mx: 0.5, fontSize: 13, gap: 1 }}>
              <FileText size={16} /> Vista previa PDF
            </MenuItem>
            <MenuItem onClick={exportarPDF} sx={{ borderRadius: "8px", mx: 0.5, fontSize: 13, gap: 1 }}>
              <Download size={16} /> Exportar PDF
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </Paper>
  );
}
