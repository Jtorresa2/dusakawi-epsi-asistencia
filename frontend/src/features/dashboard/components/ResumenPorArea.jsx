import { Paper, Typography, Box } from "@mui/material";
import { BarChart3, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IconBox from "../../../shared/components/IconBox";
import { COLORES } from "../../../shared/constants/colores.js";

function BarraProgreso({ valor, color = COLORES.primario }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: COLORES.fondoGris2, overflow: "hidden" }}>
        <Box sx={{ width: `${Math.min(valor, 100)}%`, height: "100%", borderRadius: 3, bgcolor: color, transition: "width 0.6s ease" }} />
      </Box>
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: valor >= 90 ? COLORES.primario : valor >= 75 ? COLORES.warningOscuro : COLORES.danger, minWidth: 32, textAlign: "right" }}>
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
        border: `1px solid ${COLORES.grisContorno}`,
        px: 2,
        py: 1.5,
        boxShadow: "0 4px 20px rgba(0,0,0,.04)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Encabezado */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <IconBox icon={<BarChart3 />} color={COLORES.primarioOscuro} size={32} iconSize={16} />
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORES.textoPrimario, flex: 1 }}>
          Asistencia por área
        </Typography>
        <Box onClick={() => navigate("/reportes")}
          sx={{ display: "flex", alignItems: "center", gap: 0.3, color: COLORES.primarioOscuro, cursor: "pointer", fontSize: 11, fontWeight: 600, "&:hover": { color: COLORES.primarioOscuro } }}>
          Ver reporte <ArrowRight size={12} />
        </Box>
      </Box>

      {/* Tabla */}
      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "auto", mx: -2, px: 2 }}>
        {/* Header de la tabla */}
        <Box sx={{ display: "flex", alignItems: "center", px: 1, py: 0.6, borderBottom: `1px solid ${COLORES.fondoGris2}`, mb: 0.5 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORES.textoSuave, textTransform: "uppercase", width: "30%", minWidth: 80 }}>Área</Typography>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORES.textoSuave, textTransform: "uppercase", width: "16%", minWidth: 50, textAlign: "center" }}>Pres.</Typography>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORES.textoSuave, textTransform: "uppercase", width: "16%", minWidth: 50, textAlign: "center" }}>Aus.</Typography>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORES.textoSuave, textTransform: "uppercase", width: "16%", minWidth: 50, textAlign: "center" }}>Tard.</Typography>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORES.textoSuave, textTransform: "uppercase", width: "22%", minWidth: 70, textAlign: "right" }}>% Asist.</Typography>
        </Box>

        {data.length === 0 ? (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <Typography sx={{ fontSize: 12, color: COLORES.textoSuave }}>Sin datos hoy</Typography>
          </Box>
        ) : (
          data.map((item, i) => (
            <Box key={item.id || i}
              sx={{ display: "flex", alignItems: "center", px: 1, py: 0.7, borderBottom: i < data.length - 1 ? `1px solid ${COLORES.fondoGris}` : "none" }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.textoPrimario, width: "30%", minWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.area}
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.primario, width: "16%", minWidth: 50, textAlign: "center" }}>
                {item.presentes}
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.danger, width: "16%", minWidth: 50, textAlign: "center" }}>
                {item.ausentes}
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORES.warningOscuro, width: "16%", minWidth: 50, textAlign: "center" }}>
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
