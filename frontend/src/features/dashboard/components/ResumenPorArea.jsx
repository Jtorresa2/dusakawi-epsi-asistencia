import { Paper, Typography, Box } from "@mui/material";
import { BarChart3, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IconBox from "../../../shared/components/IconBox";

function BarraProgreso({ valor, color = "#2E7D32" }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: "#F3F4F6", overflow: "hidden" }}>
        <Box sx={{ width: `${Math.min(valor, 100)}%`, height: "100%", borderRadius: 3, bgcolor: color, transition: "width 0.6s ease" }} />
      </Box>
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: valor >= 90 ? "#2E7D32" : valor >= 75 ? "#D97706" : "#DC2626", minWidth: 32, textAlign: "right" }}>
        {valor}%
      </Typography>
    </Box>
  );
}

export default function ResumenPorArea({ data = [] }) {
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 4,
        border: "1px solid #ECECEC",
        px: 2,
        py: 1.5,
        boxShadow: "0 4px 20px rgba(0,0,0,.04)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Encabezado */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <IconBox icon={<BarChart3 />} color="#1565C0" size={32} iconSize={16} />
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#111827", flex: 1 }}>
          Asistencia por área
        </Typography>
        <Box onClick={() => navigate("/reportes")}
          sx={{ display: "flex", alignItems: "center", gap: 0.3, color: "#1565C0", cursor: "pointer", fontSize: 11, fontWeight: 600, "&:hover": { color: "#0D47A1" } }}>
          Ver reporte <ArrowRight size={12} />
        </Box>
      </Box>

      {/* Tabla */}
      <Box sx={{ flex: 1, overflowY: "auto", mx: -2, px: 2 }}>
        {/* Header de la tabla */}
        <Box sx={{ display: "flex", alignItems: "center", px: 1, py: 0.6, borderBottom: "1px solid #F3F4F6", mb: 0.5 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", width: "30%", minWidth: 80 }}>Área</Typography>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", width: "16%", minWidth: 50, textAlign: "center" }}>Pres.</Typography>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", width: "16%", minWidth: 50, textAlign: "center" }}>Aus.</Typography>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", width: "16%", minWidth: 50, textAlign: "center" }}>Tard.</Typography>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", width: "22%", minWidth: 70, textAlign: "right" }}>% Asist.</Typography>
        </Box>

        {data.length === 0 ? (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>Sin datos hoy</Typography>
          </Box>
        ) : (
          data.map((item, i) => (
            <Box key={item.id || i}
              sx={{ display: "flex", alignItems: "center", px: 1, py: 0.7, borderBottom: i < data.length - 1 ? "1px solid #F9FAFB" : "none" }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#111827", width: "30%", minWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.area}
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#2E7D32", width: "16%", minWidth: 50, textAlign: "center" }}>
                {item.presentes}
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#DC2626", width: "16%", minWidth: 50, textAlign: "center" }}>
                {item.ausentes}
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#D97706", width: "16%", minWidth: 50, textAlign: "center" }}>
                {item.tardanzas}
              </Typography>
              <Box sx={{ width: "22%", minWidth: 70 }}>
                <BarraProgreso valor={item.porcentaje_asistencia} />
              </Box>
            </Box>
          ))
        )}
      </Box>
    </Paper>
  );
}
