import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { Clock3, CheckCircle, XCircle, AlertTriangle, User } from "lucide-react";
import DashboardHeader from "../components/DashboardHeader";
import StatCard from "../components/StatCard";
import DonutChart from "../components/DonutChart";
import OnTimeBarChart from "../components/OnTimeBarChart";
import TodayActivity from "../components/TodayActivity";
import ResumenPorArea from "../components/ResumenPorArea";

import { obtenerIndicadores, obtenerResumenPorArea, obtenerActividadHoy } from "../dashboard.api";
import DashboardSkeleton from "../components/DashboardSkeleton";
import { COLORES } from "../../../shared/constants/colores.js";

const MOCK = {
  puntualidad: 0,
  presentes: 0,
  ausentes: 0,
  tardanzas: 0,
  total_registrados: 0,
};

export default function DashboardPage() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(MOCK);
  const [semanal, setSemanal] = useState([]);
  const [resumenAreas, setResumenAreas] = useState([]);
  const [actividadesHoy, setActividadesHoy] = useState([]);
  const [filtro, setFiltro] = useState("Hoy");

  const fetchDashboard = async (periodo) => {
    try {
      setLoading(true);
      const [res, resumen, asistenciaHoy] = await Promise.all([
        obtenerIndicadores(periodo),
        obtenerResumenPorArea(),
        obtenerActividadHoy().catch(() => ({ registros: [] })),
      ]);
      setData({
        puntualidad: res.indicadores?.puntualidad ?? 0,
        presentes: res.indicadores?.presentes_hoy ?? 0,
        ausentes: res.indicadores?.ausentes_hoy ?? 0,
        tardanzas: res.indicadores?.tardanzas_hoy ?? 0,
        total_registrados: res.indicadores?.total_registrados ?? 0,
      });
      setSemanal(Array.isArray(res?.semanal) ? res.semanal : []);
      setResumenAreas(Array.isArray(resumen) ? resumen : []);
      setActividadesHoy(Array.isArray(asistenciaHoy?.registros) ? asistenciaHoy.registros : (Array.isArray(asistenciaHoy) ? asistenciaHoy : []));
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
  };

  const KPI_CARDS = [
    { title: "Puntualidad", value: `${data.puntualidad}%`, subtitle: "Tasa global", icon: <Clock3 />, color: COLORES.primario },
    { title: "Presentes", value: String(data.presentes), subtitle: "En sede", icon: <CheckCircle />, color: COLORES.primarioOscuro },
    { title: "Ausentes", value: String(data.ausentes), subtitle: "Sin registro", icon: <XCircle />, color: COLORES.danger },
    { title: "Tardanzas", value: String(data.tardanzas), subtitle: "A destiempo", icon: <AlertTriangle />, color: COLORES.warningOscuro },
    { title: "Registrados", value: String(data.total_registrados), subtitle: "Total activo", icon: <User />, color: COLORES.verdeTexto },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, overflowX: "hidden" }}>
      {/* Header moderno con saludo, fechas y filtros de periodo*/}
      <DashboardHeader usuario={usuario} filtroActivo={filtro} onFiltroChange={setFiltro} />

      {/* 1. FILA DE 5 KPIS SIMÉTRICOS (SIN ESPACIOS VACÍOS) */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", lg: "repeat(5, 1fr)" }, gap: 2, mb: 2.5 }}>
        {KPI_CARDS.map((card, i) => (
          <Box key={i} sx={{ minWidth: 0 }}>
            <StatCard title={card.title} value={card.value} subtitle={card.subtitle} icon={card.icon} color={card.color} />
          </Box>
        ))}
      </Box>

      {/* 2. FILA CENTRAL DE GRÁFICOS BALANCEADOS (50/50 ) */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "5fr 7fr" }, gap: 2.5, mb: 2.5 }}>
        <Box sx={{ minWidth: 0 }}><DonutChart data={hoyStats} /></Box>
        <Box sx={{ minWidth: 0 }}><OnTimeBarChart data={semanal} /></Box>
      </Box>

      {/* 3. FILA INFERIOR DE ACTIVIDAD Y ÁREAS */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5 }}>
        <Box sx={{ height: 320 }}><TodayActivity data={actividadesHoy} /></Box>
        <Box sx={{ height: 320 }}><ResumenPorArea data={resumenAreas} /></Box>
      </Box>
    </Box>
  );
}
