import { useState, useEffect } from "react";
import { Box, Paper, Typography, Button, TextField } from "@mui/material";
import { Clock3, RotateCcw } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/PageContainer";

const DEFAULT = {
  L_J: { entrada1: "07:00", salida1: "12:00", entrada2: "14:00", salida2: "18:00" },
  V: { entrada1: "07:00", salida1: "12:00", entrada2: "14:00", salida2: "17:00" },
};

const STORAGE_KEY = "horarios_dusakawi";

export default function HorariosPage() {
  const [lJ, setLJ] = useState({ ...DEFAULT.L_J });
  const [v, setV] = useState({ ...DEFAULT.V });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const lj = parsed.find((x) => x.nombre !== "Viernes");
        const vv = parsed.find((x) => x.nombre === "Viernes");
        if (lj) setLJ({ entrada1: lj.entrada1, salida1: lj.salida1, entrada2: lj.entrada2, salida2: lj.salida2 });
        if (vv) setV({ entrada1: vv.entrada1, salida1: vv.salida1, entrada2: vv.entrada2, salida2: vv.salida2 });
      }
    } catch {}
  }, []);

  const guardar = () => {
    const data = [
      { nombre: "Lunes-Jueves", ...lJ },
      { nombre: "Viernes", ...v },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    alert("Horarios guardados correctamente");
  };

  const restaurar = () => {
    localStorage.removeItem(STORAGE_KEY);
    setLJ({ ...DEFAULT.L_J });
    setV({ ...DEFAULT.V });
  };

  const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 }, "& input": { textAlign: "center" } };

  return (
    <PageContainer>
      <PageHeader titulo="Horarios" subtitulo="Configuración de horarios laborales" />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", border: "1px solid #ECECEC" }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827", mb: 2 }}>Lunes a Jueves</Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            {["entrada1", "salida1", "entrada2", "salida2"].map((field) => (
              <Box key={field} sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", mb: 0.5, textAlign: "center" }}>
                  {field === "entrada1" ? "Entrada 1" : field === "salida1" ? "Salida 1" : field === "entrada2" ? "Entrada 2" : "Salida 2"}
                </Typography>
                <TextField size="small" type="time" value={lJ[field]} onChange={e => setLJ({ ...lJ, [field]: e.target.value })} sx={inputSx} />
              </Box>
            ))}
          </Box>
        </Paper>
        <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", border: "1px solid #ECECEC" }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827", mb: 2 }}>Viernes</Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            {["entrada1", "salida1", "entrada2", "salida2"].map((field) => (
              <Box key={field} sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", mb: 0.5, textAlign: "center" }}>
                  {field === "entrada1" ? "Entrada 1" : field === "salida1" ? "Salida 1" : field === "entrada2" ? "Entrada 2" : "Salida 2"}
                </Typography>
                <TextField size="small" type="time" value={v[field]} onChange={e => setV({ ...v, [field]: e.target.value })} sx={inputSx} />
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
        <Button variant="outlined" startIcon={<RotateCcw size={16} />} onClick={restaurar}
          sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, color: "#DC2626", borderColor: "#FECACA", "&:hover": { borderColor: "#DC2626" } }}>
          Restaurar
        </Button>
        <Button variant="contained" startIcon={<Clock3 size={16} />} onClick={guardar}
          sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, fontWeight: 600, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}>
          Guardar horarios
        </Button>
      </Box>
    </PageContainer>
  );
}