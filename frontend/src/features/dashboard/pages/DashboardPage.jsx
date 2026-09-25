import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { Clock3, CheckCircle, XCircle, AlertTriangle, FileText, User } from "lucide-react";
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

export default function DashboardPage() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
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
