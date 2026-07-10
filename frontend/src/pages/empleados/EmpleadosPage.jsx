import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Button, Chip, Avatar, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField
} from "@mui/material";
import { UserPlus, Search } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/PageContainer";
import { useRol } from "../../hooks/useRol";

const ESTADO_COLORS = {
  Activo: { bg: "#D1FAE5", color: "#065F46" },
  Inactivo: { bg: "#FEE2E2", color: "#991B1B" },
};

export default function EmpleadosPage() {
  const [buscar, setBuscar] = useState("");
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { puede } = useRol();

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/api/empleados", { headers });
        const data = await res.json();
        setEmpleados(data.empleados || []);
      } catch {} finally { setCargando(false); }
    })();
  }, []);

  const filtrados = empleados.filter(e =>
    e.nombre?.toLowerCase().includes(buscar.toLowerCase()) ||
    e.cedula?.includes(buscar) ||
    e.cargo?.toLowerCase().includes(buscar.toLowerCase()) ||
    e.area?.toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <PageContainer>
      <PageHeader titulo="Empleados" subtitulo={`${empleados.length} empleados registrados`} />

      <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", border: "1px solid #ECECEC", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <TextField
          size="small" placeholder="Buscar por nombre, cédula, cargo o área..."
          value={buscar} onChange={e => setBuscar(e.target.value)}
          InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8, color: "#9CA3AF" }} /> }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13, minWidth: 320 } }}
        />
        {puede("empleados", "crear") && (
          <Button variant="contained" startIcon={<UserPlus size={16} />}
            sx={{ borderRadius: "10px", textTransform: "none", fontSize: 13, fontWeight: 600, bgcolor: "#1B5E20", "&:hover": { bgcolor: "#2E7D32" } }}>
            Nuevo empleado
          </Button>
        )}
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "16px", border: "1px solid #ECECEC" }}>
        <Table>
          <TableHead>
            <TableRow>
              {["Empleado", "Documento", "Cargo", "Área", "Estado", "Acciones"].map(h => (
                <TableCell key={h} sx={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", borderBottom: "1px solid #F3F4F6" }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {cargando ? (
              <TableRow><TableCell colSpan={6} sx={{ textAlign: "center", py: 4, color: "#9CA3AF" }}>Cargando...</TableCell></TableRow>
            ) : filtrados.length === 0 ? (
              <TableRow><TableCell colSpan={6} sx={{ textAlign: "center", py: 4, color: "#9CA3AF" }}>No se encontraron empleados</TableCell></TableRow>
            ) : filtrados.map((e) => {
              const ec = ESTADO_COLORS[e.estado] || { bg: "#F3F4F6", color: "#374151" };
              return (
                <TableRow key={e.id} sx={{ "&:last-child td": { border: 0 }, "&:hover": { bgcolor: "#F9FAFB" } }}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "#1B5E20", fontSize: 11, fontWeight: 600 }}>
                        {e.nombre?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </Avatar>
                      <Typography sx={{ fontWeight: 500, fontSize: 13 }}>{e.nombre}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: "#6B7280" }}>{e.cedula}</TableCell>
                  <TableCell sx={{ fontSize: 13, color: "#374151" }}>{e.cargo}</TableCell>
                  <TableCell sx={{ fontSize: 13, color: "#6B7280" }}>{e.area}</TableCell>
                  <TableCell>
                    <Chip label={e.estado} size="small" sx={{ borderRadius: "8px", fontSize: 11, fontWeight: 600, bgcolor: ec.bg, color: ec.color }} />
                  </TableCell>
                  <TableCell>
                    <Button size="small" sx={{ borderRadius: "8px", textTransform: "none", fontSize: 12, color: "#6B7280" }}>Ver</Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </PageContainer>
  );
}