import { Box, Paper, Typography } from "@mui/material";
import { Users, UserCheck, UserX, FileText, Clock } from "lucide-react";
import { COLORES } from "../../../shared/constants/colores.js";

export default function ResumenCards({ filtrados, filtroEstado, activoCard, onCardClick }) {
  const resumen = {
    total: filtrados.length,
    puntuales: filtrados.filter((r) => r.estado === "puntual").length,
    tardanzas: filtrados.filter((r) => r.estado === "tardanza").length,
    ausentes: filtrados.filter((r) => r.estado === "ausente").length,
    justificados: filtrados.filter((r) => r.estado === "justificado").length,
  };

  const cards = [
    { icon: <Users size={20} />, value: resumen.total, label: "Total registros", estadoKey: "", color: COLORES.primarioOscuro, bg: COLORES.primarioClaro },
    { icon: <UserCheck size={20} />, value: resumen.puntuales, label: "Puntuales", estadoKey: "puntual", color: COLORES.verdeTexto, bg: COLORES.successClaro },
    { icon: <Clock size={20} />, value: resumen.tardanzas, label: "Tardanzas", estadoKey: "tardanza", color: COLORES.warningOscuro, bg: COLORES.warningFondo },
    { icon: <UserX size={20} />, value: resumen.ausentes, label: "Ausentes", estadoKey: "ausente", color: COLORES.danger, bg: COLORES.dangerFondo2 },
    { icon: <FileText size={20} />, value: resumen.justificados, label: "Justificados", estadoKey: "justificado", color: COLORES.primarioOscuro, bg: COLORES.primarioClaro },
  ];

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" }, gap: 2, mb: 3.5 }}>
      {cards.map((card, i) => (
        <Paper key={i} elevation={0} onClick={() => onCardClick(card.estadoKey)}
          sx={{ p: 2, borderRadius: "16px", border: `1px solid ${COLORES.grisContorno}`, display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", transition: "all .25s ease", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 15px rgba(0,0,0,.06)" } }}>
          <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>
            {card.icon}
          </Box>
          <Box>
            <Typography sx={{ fontSize: 10, fontWeight: 600, color: COLORES.textoSuave, textTransform: "uppercase", letterSpacing: "0.03em" }}>{card.label}</Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: card.color, lineHeight: 1.2 }}>{card.value}</Typography>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
