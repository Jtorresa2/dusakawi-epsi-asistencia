import { useState, useEffect } from "react";
import { Box, Paper, Typography, Button, Avatar, Chip, Grid } from "@mui/material";
import { Clock3, CheckCircle, XCircle, AlertTriangle, Clock, FileText, User, Send, ClipboardList, MapPin, LogIn, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import DashboardHeader from "../components/DashboardHeader";
import FilterBar from "../components/FilterBar";
import StatCard from "../components/StatCard";
import DonutChart from "../components/DonutChart";
import OnTimeBarChart from "../components/OnTimeBarChart";
import OvertimeBarChart from "../components/OvertimeBarChart";
import SourceMarkingCard from "../components/SourceMarkingCard";
import TodayActivity from "../components/TodayActivity";
import PDFPreviewModal from "../../../shared/components/PDFPreviewModal";
import { obtenerIndicadores } from "../dashboard.api";
import { obtenerHorarios } from "../../horarios/horario.api";
import DashboardSkeleton from "../components/DashboardSkeleton";

const MOCK = {
  puntualidad: 96,
  presentes: 138,
  ausentes: 12,
  tardanzas: 8,
  horasExtras: 6,
  permisos: 5,
};

const EMP_MOCK = {
  puntualidad: 98,
  horas_hoy: 8,
  tardanzas_mes: 2,
  estado_hoy: "Puntual",
  entrada_hoy: "07:00",
  area: "SIAU",
  cargo: "Analista",
  marcaciones: [
    { hora: "07:02", tipo: "Entrada", origen: "Huella" },
    { hora: "12:05", tipo: "Salida", origen: "Huella" },
    { hora: "13:55", tipo: "Entrada", origen: "Huella" },
    { hora: "17:00", tipo: "Salida", origen: "Huella" },
    { hora: "07:05", tipo: "Entrada", origen: "Huella" },
  ],
};

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function EmployeeDashboard({ usuario }) {
  const navigate = useNavigate();
  const [data] = useState(EMP_MOCK);
  const [horarioHoy, setHorarioHoy] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const horarios = await obtenerHorarios();
        const hoy = DIAS[new Date().getDay()];
        for (const h of horarios) {
          const d = (h.detalles || []).find((x) => x.dia_semana === hoy);
          if (d) {
            setHorarioHoy({
              entrada1: (d.hora_entrada_manana || "").slice(0, 5),
              salida1: (d.hora_salida_manana || "").slice(0, 5),
              entrada2: (d.hora_entrada_tarde || "").slice(0, 5),
              salida2: (d.hora_salida_tarde || "").slice(0, 5),
            });
            return;
          }
        }
        setHorarioHoy(null);
      } catch {
        setHorarioHoy(null);
      }
    })();
  }, []);

  const myCards = [
    { title: "Mi puntualidad", value: `${data.puntualidad}%`, icon: <Clock3 />, color: "#2E7D32" },
    { title: "Horas hoy", value: `${data.horas_hoy}h`, icon: <Clock />, color: "#1565C0" },
    { title: "Estado hoy", value: data.estado_hoy, icon: <CheckCircle />, color: "#16A34A" },
    { title: "Tardanzas del mes", value: String(data.tardanzas_mes), icon: <AlertTriangle />, color: "#D97706" },
  ];

  const quickActions = [
    { label: "Reportar incidencia", icon: <AlertTriangle size={28} />, path: "/reportar-incidencia", color: "#DC2626" },
    { label: "Mi perfil", icon: <User size={28} />, path: "/perfil", color: "#1565C0" },
    { label: "Mis solicitudes", icon: <ClipboardList size={28} />, path: "/mis-solicitudes", color: "#7C3AED" },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <DashboardHeader usuario={usuario} />

      {/* 4 stat cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2.5, mb: 3 }}>
        {myCards.map((card, i) => (
          <StatCard key={i} title={card.title} value={card.value} subtitle="" icon={card.icon} color={card.color} />
        ))}
      </Box>

      {/* Bottom row: horario + quick actions + timeline */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1.5fr" }, gap: 2.5, mb: 3 }}>
        {/* Horario hoy */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: "1px solid #ECECEC" }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#6B7280", mb: 2 }}>Mi horario hoy</Typography>
          {horarioHoy ? (
            <Box sx={{ display: "flex", gap: 2 }}>
              <Box sx={{ flex: 1, textAlign: "center", p: 1.5, bgcolor: "#F0FDF4", borderRadius: "12px" }}>
                <Typography sx={{ fontSize: 11, color: "#9CA3AF", mb: 0.5 }}>Mañana</Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{horarioHoy.entrada1} → {horarioHoy.salida1}</Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: "center", p: 1.5, bgcolor: "#EFF6FF", borderRadius: "12px" }}>
                <Typography sx={{ fontSize: 11, color: "#9CA3AF", mb: 0.5 }}>Tarde</Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{horarioHoy.entrada2} → {horarioHoy.salida2}</Typography>
              </Box>
            </Box>
          ) : (
            <Typography sx={{ fontSize: 14, color: "#9CA3AF", textAlign: "center", py: 2 }}>Descanso 🎉</Typography>
          )}
        </Paper>

        {/* Acciones rápidas */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: "1px solid #ECECEC" }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#6B7280", mb: 1.5 }}>Acciones rápidas</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {quickActions.map((a) => (
              <Paper
                key={a.label}
                elevation={0}
                onClick={() => navigate(a.path)}
                sx={{ p: 1.5, borderRadius: "14px", border: "1px solid #ECECEC", display: "flex", alignItems: "center", gap: 2, cursor: "pointer", transition: "all 0.2s", "&:hover": { borderColor: a.color, bgcolor: "#F9FAFB" } }}
              >
                <Box sx={{ width: 42, height: 42, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: `${a.color}15`, color: a.color }}>{a.icon}</Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{a.label}</Typography>
              </Paper>
            ))}
          </Box>
        </Paper>

        {/* Timeline últimas marcaciones */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: "1px solid #ECECEC" }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#6B7280", mb: 2 }}>Últimas marcaciones</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {(data.marcaciones || []).slice(0, 5).map((m, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: m.tipo === "Entrada" ? "#2E7D32" : "#DC2626" }} />
                  {i < 4 && <Box sx={{ width: 1, height: 24, bgcolor: "#E5E7EB" }} />}
                </Box>
                <Box sx={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{m.tipo}</Typography>
                    <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>{m.origen}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{m.hora}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

function AdminDashboard({ usuario }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(MOCK);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await obtenerIndicadores();
        setData({
          puntualidad: res.indicadores?.puntualidad ?? MOCK.puntualidad,
          presentes: res.indicadores?.presentes_hoy ?? MOCK.presentes,
          ausentes: res.indicadores?.ausentes_hoy ?? MOCK.ausentes,
          tardanzas: res.indicadores?.tardanzas_hoy ?? MOCK.tardanzas,
          horasExtras: res.indicadores?.horas_extras_hoy ?? MOCK.horasExtras,
          permisos: res.indicadores?.permisos_hoy ?? MOCK.permisos,
        });
      } catch {
        setData(MOCK);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <DashboardSkeleton />;

  function exportarInforme(formato) {
    if (formato === "excel") {
      const rows = [
        { Métrica: "Puntualidad", Valor: `${data.puntualidad}%` },
        { Métrica: "Presentes hoy", Valor: data.presentes },
        { Métrica: "Ausentes hoy", Valor: data.ausentes },
        { Métrica: "Tardanzas", Valor: data.tardanzas },
        { Métrica: "Horas extra hoy", Valor: data.horasExtras },
        { Métrica: "Permisos hoy", Valor: data.permisos },
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Dashboard");
      XLSX.writeFile(wb, `Dashboard_${new Date().toISOString().split("T")[0]}.xlsx`);
    } else if (formato === "preview") {
      setPdfPreviewUrl("/api/pdf/dashboard?preview=1");
    } else {
      const params = new URLSearchParams();
      window.open(`/api/pdf/dashboard?${params}`, "_blank");
    }
  }

  const hoyStats = {
    presentes: data.presentes,
    ausentes: data.ausentes,
    tardanzas: data.tardanzas,
    permisos: data.permisos,
  };

  const KPI_CARDS = [
    { title: "Puntualidad", value: `${data.puntualidad}%`, icon: <Clock3 />, color: "#2E7D32" },
    { title: "Presentes hoy", value: String(data.presentes), icon: <CheckCircle />, color: "#1565C0" },
    { title: "Ausentes hoy", value: String(data.ausentes), icon: <XCircle />, color: "#DC2626" },
    { title: "Tardanzas", value: String(data.tardanzas), icon: <AlertTriangle />, color: "#D97706" },
    { title: "Horas extra hoy", value: String(data.horasExtras), icon: <Clock />, color: "#7C3AED" },
    { title: "Permisos hoy", value: String(data.permisos), icon: <FileText />, color: "#0891B2" },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <DashboardHeader usuario={usuario} />
      <FilterBar onExport={exportarInforme} />

      <Box sx={{ display: "flex", gap: 2.5, mb: 2.5 }}>
        {KPI_CARDS.map((card, i) => (
          <Box key={i} sx={{ flex: 1, minWidth: 0 }}>
            <StatCard title={card.title} value={card.value} subtitle="Hoy" icon={card.icon} color={card.color} />
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "flex", gap: 2.5, mb: 2.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}><DonutChart data={hoyStats} /></Box>
        <Box sx={{ flex: 1, minWidth: 0 }}><OnTimeBarChart data={data} /></Box>
        <Box sx={{ flex: 1, minWidth: 0 }}><OvertimeBarChart data={data} /></Box>
        <Box sx={{ flex: 1, minWidth: 0 }}><SourceMarkingCard /></Box>
      </Box>

      <TodayActivity />
      <PDFPreviewModal
        open={Boolean(pdfPreviewUrl)}
        onClose={() => setPdfPreviewUrl(null)}
        url={pdfPreviewUrl}
        titulo="Vista previa - Dashboard"
      />
    </Box>
  );
}

export default function DashboardPage() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  if (usuario.rol === "empleado") {
    return <EmployeeDashboard usuario={usuario} />;
  }

  return <AdminDashboard usuario={usuario} />;
}
