import { useState, useEffect } from "react";
import { Box, Paper, Typography, Button, Chip } from "@mui/material";
import { Clock3, CheckCircle, XCircle, AlertTriangle, Clock, FileText, User, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import FilterBar from "../../components/dashboard/FilterBar";
import StatCard from "../../components/dashboard/StatCard";
import DonutChart from "../../components/dashboard/DonutChart";
import OnTimeBarChart from "../../components/dashboard/OnTimeBarChart";
import OvertimeBarChart from "../../components/dashboard/OvertimeBarChart";
import SourceMarkingCard from "../../components/dashboard/SourceMarkingCard";
import TodayActivity from "../../components/dashboard/TodayActivity";
import { obtenerIndicadores } from "../../api/dashboard.api";
import DashboardSkeleton from "../../components/dashboard/DashboardSkeleton";

const MOCK = {
  puntualidad: 96,
  presentes: 138,
  ausentes: 12,
  tardanzas: 8,
  horasExtras: 6,
  permisos: 5,
};

const EMP_MOCK = {
  entrada_hoy: "07:56 AM",
  salida_hoy: null,
  estado_hoy: "Puntual",
  horas_trabajadas: "7h 45min",
  area: "SIAU",
  cargo: "Analista de sistemas",
  marcaciones: [
    { tipo: "Entrada", fecha: "01/07/2026", hora: "07:56 AM" },
    { tipo: "Salida", fecha: "01/07/2026", hora: "05:08 PM" },
    { tipo: "Entrada", fecha: "30/06/2026", hora: "07:58 AM" },
    { tipo: "Salida", fecha: "30/06/2026", hora: "05:02 PM" },
    { tipo: "Entrada", fecha: "29/06/2026", hora: "07:55 AM" },
  ],
};

function EmployeeDashboard({ usuario }) {
  const navigate = useNavigate();
  const [data] = useState(EMP_MOCK);

  const estadoColor =
    data.estado_hoy === "Puntual" ? "#16A34A" :
    data.estado_hoy === "Tardanza" ? "#D97706" : "#DC2626";
  const estadoBg =
    data.estado_hoy === "Puntual" ? "#D1FAE5" :
    data.estado_hoy === "Tardanza" ? "#FEF3C7" : "#FEE2E2";

  const quickActions = [
    {
      label: "Mi asistencia",
      icon: <ClipboardList size={32} />,
      path: "/mi-asistencia",
      color: "#1565C0",
      desc: "Consulta tu historial de entradas y salidas.",
      btn: "Ver asistencia",
    },
    {
      label: "Reportar incidencia",
      icon: <Clock3 size={32} />,
      path: "/reportar-incidencia",
      color: "#DC2626",
      desc: "Reporta novedades relacionadas con tus marcaciones.",
      btn: "Reportar",
    },
    {
      label: "Mi perfil",
      icon: <User size={32} />,
      path: "/perfil",
      color: "#7C3AED",
      desc: "Consulta tu información personal y laboral.",
      btn: "Ver perfil",
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Encabezado */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: "20px", border: "1px solid #ECECEC", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>
            Hola, {usuario.nombre?.split(" ")[0] || "Usuario"} 👋
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#6B7280", mt: 0.5 }}>
            Bienvenido nuevamente. Aquí puedes consultar tu asistencia y reportar novedades.
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography sx={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500 }}>
            {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#6B7280", mt: 0.3 }}>{data.cargo}</Typography>
          <Typography sx={{ fontSize: 13, color: "#6B7280" }}>{data.area}</Typography>
        </Box>
      </Paper>

      {/* 4 cards resumen */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2.5, mb: 3 }}>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "18px", border: "1px solid #ECECEC" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", color: "#2E7D32" }}>
              <Clock size={18} />
            </Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" }}>Hora de entrada</Typography>
          </Box>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>{data.entrada_hoy}</Typography>
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "18px", border: "1px solid #ECECEC" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#E3F2FD", display: "flex", alignItems: "center", justifyContent: "center", color: "#1565C0" }}>
              <Clock3 size={18} />
            </Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" }}>Hora de salida</Typography>
          </Box>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: data.salida_hoy ? "#111827" : "#9CA3AF" }}>{data.salida_hoy || "Pendiente"}</Typography>
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "18px", border: "1px solid #ECECEC" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: estadoBg, display: "flex", alignItems: "center", justifyContent: "center", color: estadoColor }}>
              <CheckCircle size={18} />
            </Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" }}>Estado</Typography>
          </Box>
          <Chip label={data.estado_hoy} size="small" sx={{ borderRadius: "8px", fontSize: 14, fontWeight: 700, bgcolor: estadoBg, color: estadoColor }} />
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "18px", border: "1px solid #ECECEC" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#FFF3E0", display: "flex", alignItems: "center", justifyContent: "center", color: "#E65100" }}>
              <Clock3 size={18} />
            </Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" }}>Horas trabajadas</Typography>
          </Box>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>{data.horas_trabajadas}</Typography>
        </Paper>
      </Box>

      {/* 3 accesos rápidos — tarjetas grandes */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2.5, mb: 3 }}>
        {quickActions.map((a) => (
          <Paper key={a.label} elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: "1px solid #ECECEC", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: "14px", bgcolor: `${a.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: a.color }}>{a.icon}</Box>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{a.label}</Typography>
            </Box>
            <Typography sx={{ fontSize: 13, color: "#6B7280", mb: 2, flex: 1 }}>{a.desc}</Typography>
            <Button variant="outlined" onClick={() => navigate(a.path)}
              sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, fontWeight: 600, color: a.color, borderColor: a.color, alignSelf: "flex-start", "&:hover": { bgcolor: `${a.color}10` } }}>
              {a.btn}
            </Button>
          </Paper>
        ))}
      </Box>

      {/* Últimas marcaciones */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: "1px solid #ECECEC" }}>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827", mb: 2 }}>Últimas marcaciones</Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {(data.marcaciones || []).slice(0, 5).map((m, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: m.tipo === "Entrada" ? "#D1FAE5" : "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", color: m.tipo === "Entrada" ? "#16A34A" : "#DC2626", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                {m.tipo === "Entrada" ? "✓" : "✓"}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{m.tipo}</Typography>
                <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>{m.fecha} - {m.hora}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}

function AdminDashboard({ usuario }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(MOCK);

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
      <FilterBar onExport={() => {}} />

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