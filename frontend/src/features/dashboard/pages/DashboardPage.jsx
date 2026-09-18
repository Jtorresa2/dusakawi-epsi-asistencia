import { useState, useEffect } from "react";
import { Box, Paper, Typography, Button, Avatar, Chip, Grid } from "@mui/material";
import { Clock3, CheckCircle, XCircle, AlertTriangle, Clock, FileText, User, Send, ClipboardList, MapPin, LogIn, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import FilterBar from "../components/FilterBar";
import StatCard from "../components/StatCard";
import DonutChart from "../components/DonutChart";
import OnTimeBarChart from "../components/OnTimeBarChart";
import SourceMarkingCard from "../components/SourceMarkingCard";
import PendientesCard from "../components/PendientesCard";
import TodayActivity from "../components/TodayActivity";
import ResumenPorArea from "../components/ResumenPorArea";

import { obtenerIndicadores, obtenerResumenPorArea, obtenerStatsIncidencias } from "../dashboard.api";
import { obtenerMiHorario } from "../../horarios/horario.api";
import DashboardSkeleton from "../components/DashboardSkeleton";
import { COLORES } from "../../../shared/constants/colores.js";

const MOCK = {
  puntualidad: 96,
  presentes: 138,
  ausentes: 12,
  tardanzas: 8,
  permisos: 5,
  total_registrados: 45,
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
  const [miHorario, setMiHorario] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setMiHorario(await obtenerMiHorario());
      } catch {
        setMiHorario({ asignado: false });
      }
    })();
  }, []);

  const hoy = DIAS[new Date().getDay()];
  const detalleHoy = miHorario?.asignado
    ? (miHorario.horario.detalles || []).find((x) => x.dia_semana === hoy)
    : null;
  const horarioNombre = miHorario?.asignado ? miHorario.horario.nombre : "";
  const esFlexible = miHorario?.asignado &&
    (miHorario.horario.modalidad === "flexible" || miHorario.horario.tipo_jornada === "by_hours");

  const myCards = [
    { title: "Mi puntualidad", value: `${data.puntualidad}%`, icon: <Clock3 />, color: COLORES.primario },
    { title: "Horas hoy", value: `${data.horas_hoy}h`, icon: <Clock />, color: COLORES.primarioOscuro },
    { title: "Estado hoy", value: data.estado_hoy, icon: <CheckCircle />, color: COLORES.verdeTexto },
    { title: "Tardanzas del mes", value: String(data.tardanzas_mes), icon: <AlertTriangle />, color: COLORES.warningOscuro },
  ];

  const quickActions = [
    { label: "Reportar incidencia", icon: <AlertTriangle size={28} />, path: "/reportar-incidencia", color: COLORES.danger },
    { label: "Mi perfil", icon: <User size={28} />, path: "/perfil", color: COLORES.primarioOscuro },
    { label: "Mis solicitudes", icon: <ClipboardList size={28} />, path: "/mis-solicitudes", color: COLORES.primario },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <DashboardHeader usuario={usuario} />

      {/* 4 stat cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2.5, mb: 3 }}>
        {myCards.map((card, i) => (
          <StatCard key={i} title={card.title} value={card.value} subtitle="" icon={card.icon} color={card.color} onClick={() => navigate(card.path)} />
        ))}
      </Box>

      {/* Bottom row: horario + quick actions + timeline */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1.5fr" }, gap: 2.5, mb: 3 }}>
        {/* Horario hoy */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}` }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORES.textoTerciario, mb: 2 }}>Mi horario hoy</Typography>
          {miHorario === null ? (
            <Typography sx={{ fontSize: 13, color: COLORES.textoSuave, textAlign: "center", py: 2 }}>Cargando...</Typography>
          ) : detalleHoy ? (
            <>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORES.primarioOscuro, mb: 1.5 }}>Horario hoy: {horarioNombre}</Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ flex: 1, textAlign: "center", p: 1.5, bgcolor: COLORES.successClaro, borderRadius: "12px" }}>
                  <Typography sx={{ fontSize: 11, color: COLORES.textoSuave, mb: 0.5 }}>Mañana</Typography>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: COLORES.textoPrimario }}>{(detalleHoy.hora_entrada_manana || "").slice(0, 5)} → {(detalleHoy.hora_salida_manana || "").slice(0, 5)}</Typography>
                </Box>
                <Box sx={{ flex: 1, textAlign: "center", p: 1.5, bgcolor: COLORES.primarioClaro, borderRadius: "12px" }}>
                  <Typography sx={{ fontSize: 11, color: COLORES.textoSuave, mb: 0.5 }}>Tarde</Typography>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: COLORES.textoPrimario }}>{(detalleHoy.hora_entrada_tarde || "").slice(0, 5)} → {(detalleHoy.hora_salida_tarde || "").slice(0, 5)}</Typography>
                </Box>
              </Box>
            </>
          ) : esFlexible ? (
            <Box sx={{ textAlign: "center", py: 1.5 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: COLORES.warningOscuro }}>Horario flexible</Typography>
              <Typography
                onClick={() => navigate("/mi-horario")}
                sx={{ fontSize: 13, color: COLORES.primarioOscuro, textDecoration: "underline", cursor: "pointer", mt: 0.5, "&:hover": { color: COLORES.primarioOscuro } }}>
                Consulta tu horario en Mi horario
              </Typography>
            </Box>
          ) : miHorario?.asignado ? (
            <Typography sx={{ fontSize: 14, color: COLORES.textoSuave, textAlign: "center", py: 2 }}>Descanso 🎉</Typography>
          ) : (
            <Typography sx={{ fontSize: 14, color: COLORES.textoSuave, textAlign: "center", py: 2 }}>Sin horario asignado</Typography>
          )}
        </Paper>

        {/* Acciones rápidas */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}` }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORES.textoTerciario, mb: 1.5 }}>Acciones rápidas</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {quickActions.map((a) => (
              <Paper
                key={a.label}
                elevation={0}
                onClick={() => navigate(a.path)}
                sx={{ p: 1.5, borderRadius: "14px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", alignItems: "center", gap: 2, cursor: "pointer", transition: "all 0.2s", "&:hover": { borderColor: a.color, bgcolor: COLORES.fondoGris } }}
              >
                <Box sx={{ width: 42, height: 42, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: `${a.color}15`, color: a.color }}>{a.icon}</Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: COLORES.textoPrimario }}>{a.label}</Typography>
              </Paper>
            ))}
          </Box>
        </Paper>

        {/* Timeline últimas marcaciones */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: `1px solid ${COLORES.grisContorno}` }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORES.textoTerciario, mb: 2 }}>Últimas marcaciones</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {(data.marcaciones || []).slice(0, 5).map((m, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: m.tipo === "Entrada" ? COLORES.primario : COLORES.danger }} />
                  {i < 4 && <Box sx={{ width: 1, height: 24, bgcolor: COLORES.borde }} />}
                </Box>
                <Box sx={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: COLORES.textoPrimario }}>{m.tipo}</Typography>
                    <Typography sx={{ fontSize: 12, color: COLORES.textoSuave }}>{m.origen}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORES.textoPrimario }}>{m.hora}</Typography>
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
  const [resumenAreas, setResumenAreas] = useState([]);
  const [statsIncidencias, setStatsIncidencias] = useState(null);
  const [filtro, setFiltro] = useState("Hoy");
  const fetchDashboard = async (periodo) => {
    try {
      setLoading(true);
      const [res, resumen, stats] = await Promise.all([
        obtenerIndicadores(periodo),
        obtenerResumenPorArea(),
        obtenerStatsIncidencias(),
      ]);
      setStatsIncidencias(stats);
      setData({
        puntualidad: res.indicadores?.puntualidad ?? MOCK.puntualidad,
        presentes: res.indicadores?.presentes_hoy ?? MOCK.presentes,
        ausentes: res.indicadores?.ausentes_hoy ?? MOCK.ausentes,
        tardanzas: res.indicadores?.tardanzas_hoy ?? MOCK.tardanzas,
        permisos: res.indicadores?.permisos_hoy ?? MOCK.permisos,
        total_registrados: res.indicadores?.total_registrados ?? MOCK.total_registrados,
      });
      setResumenAreas(Array.isArray(resumen) ? resumen : []);
    } catch {
      setData(MOCK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(filtro); }, [filtro]);

  if (loading) return <DashboardSkeleton />;

  const hoyStats = {
    presentes: data.presentes,
    ausentes: data.ausentes,
    tardanzas: data.tardanzas,
    permisos: data.permisos,
  };

  const KPI_CARDS = [
    { title: "Puntualidad", value: `${data.puntualidad}%`, icon: <Clock3 />, color: COLORES.primario },
    { title: "Presentes hoy", value: String(data.presentes), icon: <CheckCircle />, color: COLORES.primarioOscuro },
    { title: "Ausentes hoy", value: String(data.ausentes), icon: <XCircle />, color: COLORES.danger },
    { title: "Tardanzas", value: String(data.tardanzas), icon: <AlertTriangle />, color: COLORES.warningOscuro },
    { title: "Registrados", value: String(data.total_registrados), icon: <User />, color: COLORES.verdeTexto },
    { title: "Novedades hoy", value: String(data.permisos), icon: <FileText />, color: COLORES.verdeTexto },
  ];

  return (
    <Box sx={{ p: 3, overflowX: "hidden" }}>
      <DashboardHeader usuario={usuario} />
      <FilterBar activo={filtro} onChange={setFiltro} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" }, gap: 2, mb: 2.5 }}>
        {KPI_CARDS.map((card, i) => (
          <Box key={i} sx={{ minWidth: 0 }}>
            <StatCard title={card.title} value={card.value} subtitle="Hoy" icon={card.icon} color={card.color} />
          </Box>
        ))}
      </Box>

<Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2, mb: 2.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}><DonutChart data={hoyStats} /></Box>
          <Box sx={{ flex: 1, minWidth: 0 }}><OnTimeBarChart data={data} /></Box>
          <Box sx={{ flex: 1, minWidth: 0 }}><PendientesCard data={statsIncidencias} /></Box>
          <Box sx={{ flex: 1, minWidth: 0 }}><SourceMarkingCard /></Box>
        </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5 }}>
        <Box sx={{ height: 320 }}><TodayActivity /></Box>
        <Box sx={{ height: 320 }}><ResumenPorArea data={resumenAreas} /></Box>
      </Box>
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
