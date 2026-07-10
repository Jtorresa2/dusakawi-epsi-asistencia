import { useState, useEffect } from "react";
import { Box, Paper, Typography, Chip, Avatar, TextField } from "@mui/material";
import { Calendar, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/PageContainer";
import DataTable from "../../components/common/DataTable";

const ESTADO_COLORS = {
  Puntual: { bg: "#D1FAE5", color: "#065F46" },
  Tardanza: { bg: "#FEF3C7", color: "#92400E" },
  Ausente: { bg: "#FEE2E2", color: "#991B1B" },
  Justificado: { bg: "#DBEAFE", color: "#1E40AF" },
};

export default function MiAsistenciaPage() {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const initials = (usuario.nombre || "E").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
  const API = "http://localhost:5000/api";

  useEffect(() => {
    (async () => {
      setCargando(true);
      try {
        const res = await fetch(`${API}/asistencia/mi-asistencia?mes=${mes}&anio=${anio}`, { headers });
        const data = await res.json();
        setRegistros(data.registros || []);
      } catch {} finally { setCargando(false); }
    })();
  }, [mes, anio]);

  const total = registros.length;
  const presentes = registros.filter((r) => r.estado === "Puntual" || r.estado === "Tardanza").length;
  const tardanzas = registros.filter((r) => r.estado === "Tardanza").length;
  const ausentes = registros.filter((r) => r.estado === "Ausente").length;

  const columns = [
    {
      field: "fecha",
      headerName: "Fecha",
      flex: 1,
      minWidth: 140,
      renderCell: (params) => {
        const d = new Date(params.value + "T00:00:00");
        return d.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" });
      },
    },
    { field: "entrada", headerName: "Entrada", flex: 1, minWidth: 100,
      renderCell: (params) => <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#2E7D32" }}>{params.value || "—"}</Typography>
    },
    { field: "salida", headerName: "Salida", flex: 1, minWidth: 100,
      renderCell: (params) => <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{params.value || "—"}</Typography>
    },
    { field: "horas", headerName: "Horas", flex: 1, minWidth: 90,
      renderCell: (params) => params.value ? `${params.value}h` : "—",
    },
    {
      field: "estado",
      headerName: "Estado",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        const ec = ESTADO_COLORS[params.value] || { bg: "#F3F4F6", color: "#374151" };
        return <Chip label={params.value} size="small" sx={{ borderRadius: "8px", fontSize: 12, fontWeight: 600, bgcolor: ec.bg, color: ec.color }} />;
      },
    },
  ];

  const KPI = [
    { label: "Total registros", value: total, icon: <Calendar size={22} />, color: "#1B5E20", bg: "#E8F5E9" },
    { label: "Presente", value: presentes, icon: <CheckCircle size={22} />, color: "#065F46", bg: "#D1FAE5" },
    { label: "Tardanzas", value: tardanzas, icon: <AlertTriangle size={22} />, color: "#92400E", bg: "#FEF3C7" },
    { label: "Ausente", value: ausentes, icon: <XCircle size={22} />, color: "#991B1B", bg: "#FEE2E2" },
  ];

  return (
    <PageContainer>
      <PageHeader titulo="Mi asistencia" subtitulo="Consulta tus registros de asistencia" />

      {/* Employee card */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: "1px solid #ECECEC", display: "flex", alignItems: "center", gap: 2.5 }}>
        <Avatar sx={{ width: 56, height: 56, bgcolor: "#E8F5E9", color: "#1B5E20", fontSize: 20, fontWeight: 700 }}>
          {initials}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{usuario.nombre || "Empleado"}</Typography>
          <Typography sx={{ fontSize: 13, color: "#6B7280", mt: 0.2 }}>SIAU · Analista de sistemas</Typography>
        </Box>
        <Chip label="Activo" size="small" sx={{ borderRadius: "8px", fontSize: 12, fontWeight: 600, bgcolor: "#D1FAE5", color: "#065F46" }} />
      </Paper>

      {/* KPI cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2.5 }}>
        {KPI.map((k, i) => (
          <Paper key={i} elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: "1px solid #ECECEC", display: "flex", alignItems: "center", gap: 2.5 }}>
            <Box sx={{ width: 52, height: 52, borderRadius: "14px", bgcolor: k.bg, display: "flex", alignItems: "center", justifyContent: "center", color: k.color }}>
              {k.icon}
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" }}>{k.label}</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Filter bar */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: "1px solid #ECECEC", display: "flex", gap: 2, alignItems: "center" }}>
        <TextField size="small" label="Mes" select value={mes} onChange={(e) => setMes(Number(e.target.value))}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 }, minWidth: 140 }}>
          {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </TextField>
        <TextField size="small" label="Año" select value={anio} onChange={(e) => setAnio(Number(e.target.value))}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 }, minWidth: 110 }}>
          {[2024, 2025, 2026].map((a) => <option key={a} value={a}>{a}</option>)}
        </TextField>
      </Paper>

      {/* Data table */}
      <Paper elevation={0} sx={{ borderRadius: "20px", border: "1px solid #ECECEC", overflow: "hidden" }}>
        <DataTable
          rows={registros.map((r, i) => ({ id: i, ...r }))}
          columns={columns}
          loading={cargando}
          pageSize={10}
        />
      </Paper>
    </PageContainer>
  );
}
